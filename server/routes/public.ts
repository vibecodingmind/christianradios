import { Router } from 'express';
import http from 'http';
import https from 'https';
import { db } from '../db.js';
import { requireAuth, getSessionFromRequest, type AuthenticatedRequest } from '../auth.js';
import { validateStreamUrl } from '../ssrf.js';
import { getLiveNowPlayingMetadata } from '../icyMetadata.js';
import type { StationReport, TicketPriority } from '../types.js';
import { whatsappGateway } from '../services/whatsappGateway.js';

export const publicRouter = Router();

// 1. Get Stations Directory with Filters
publicRouter.get('/stations', (req, res) => {
  const {
    category,
    country,
    language,
    genre,
    denomination,
    streamStatus,
    accessType,
    search,
    sort = 'popular',
    page = '1',
    limit = '24',
  } = req.query as Record<string, string>;

  let stations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  if (category) {
    const cat = db.categories.findBySlug(category) || db.categories.findById(category);
    if (cat) {
      stations = stations.filter((s) => s.categoryId === cat.id || (Array.isArray(s.categoryIds) && s.categoryIds.includes(cat.id)));
    }
  }

  if (country) {
    stations = stations.filter(
      (s) => (s.countryCode || '').toUpperCase() === country.toUpperCase()
    );
  }

  if (language) {
    stations = stations.filter((s) =>
      (s.language || '').toLowerCase().includes(language.toLowerCase())
    );
  }

  if (genre) {
    stations = stations.filter((s) =>
      (s.genre || '').toLowerCase().includes(genre.toLowerCase())
    );
  }

  if (denomination) {
    stations = stations.filter(
      (s) => s.denomination?.toLowerCase() === denomination.toLowerCase()
    );
  }

  if (streamStatus) {
    stations = stations.filter(
      (s) => s.streamStatus.toUpperCase() === streamStatus.toUpperCase()
    );
  }

  if (accessType) {
    stations = stations.filter(
      (s) => (s.accessType || 'FREE').toUpperCase() === accessType.toUpperCase()
    );
  }

  if (req.query.isFeatured === 'true') {
    stations = stations.filter((s) => Boolean(s.isFeatured));
  }

  if (req.query.isVerified === 'true') {
    stations = stations.filter((s) => s.verificationStatus === 'VERIFIED');
  }

  if (req.query.donationEnabled === 'true') {
    stations = stations.filter((s) => Boolean(s.donationEnabled));
  }

  if (req.query.hasSchedule === 'true') {
    stations = stations.filter((s) => Array.isArray(s.schedule) && s.schedule.length > 0);
  }

  if (search) {
    const q = search.toLowerCase().trim();
    stations = stations.filter((s) => {
    const country = s.countryCode ? db.countries.findByCode(s.countryCode) : undefined;
    const category = s.categoryId ? db.categories.findById(s.categoryId) : undefined;
      const searchBlob = [
        s.name,
        s.city,
        s.countryCode,
        s.genre,
        s.language || '',
        s.tagline || '',
        s.denomination || '',
        s.region || '',
        s.description || '',
        country?.name || '',
        category?.name || '',
        category?.slug || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchBlob.includes(q);
    });
  }

  // Featured Radios Always on Top First + Chosen Sort Criterion
  const sortParam = (req.query.sortBy || req.query.sort || 'popular') as string;
  const activeCampaigns = db.featuredCampaigns.getActive();
  const campaignStationIds = new Set(activeCampaigns.map((c) => c.stationId));

  const activeSubs = db.subscriptions.getAll().filter((s) => s.status === 'ACTIVE' || s.status === 'TRIALING');
  const proOrVipOwnerIds = new Set(
    activeSubs
      .filter((s) => s.planId === 'plan_pro' || s.planId === 'plan_vip')
      .map((s) => s.ownerId)
  );

  const isStationFeatured = (s: any) =>
    Boolean(
      s.isFeatured ||
      s.featured ||
      campaignStationIds.has(s.id) ||
      (s.ownerId && proOrVipOwnerIds.has(s.ownerId))
    );

  stations.sort((a, b) => {
    const aFeat = isStationFeatured(a) ? 1 : 0;
    const bFeat = isStationFeatured(b) ? 1 : 0;
    if (aFeat !== bFeat) {
      return bFeat - aFeat; // Always show featured radios on top first
    }

    if (sortParam === 'popular') {
      return (b.playCount || 0) - (a.playCount || 0);
    } else if (sortParam === 'trending') {
      return (b.favoriteCount || 0) - (a.favoriteCount || 0);
    } else if (sortParam === 'newest') {
      return b.createdAt.localeCompare(a.createdAt);
    } else if (sortParam === 'name') {
      return a.name.localeCompare(b.name);
    }
    return (b.playCount || 0) - (a.playCount || 0);
  });

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 50));
  const total = stations.length;
  const totalPages = Math.ceil(total / limitNum);
  const paginated = stations.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Attach enriched category, country, and featured status objects
  const enriched = paginated.map((s) => {
    const featured = isStationFeatured(s);
    return {
      ...s,
      isFeatured: featured,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
      featuredCampaign: activeCampaigns.find((c) => c.stationId === s.id),
      isBroadcasterPartner: Boolean(s.ownerId && proOrVipOwnerIds.has(s.ownerId)),
    };
  });

  res.json({
    stations: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    total,
    totalPages,
  });
});

// 2. Get Single Station by Slug or ID
publicRouter.get('/stations/:slug', (req, res) => {
  const rawParam = req.params.slug;
  const decodedParam = decodeURIComponent(rawParam);

  const station =
    db.stations.findBySlug(rawParam) ||
    db.stations.findBySlug(decodedParam) ||
    db.stations.findById(rawParam) ||
    db.stations.getAll().find(
      (s) =>
        s.slug?.toLowerCase() === rawParam.toLowerCase() ||
        s.slug?.toLowerCase() === decodedParam.toLowerCase() ||
        s.id === rawParam
    );

  if (!station) {
    res.status(404).json({ error: 'Radio station not found.' });
    return;
  }

  // Increment view / play count telemetry safely
  db.analytics.logEvent({
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId: station.id,
    eventType: 'VIEW',
    timestamp: new Date().toISOString(),
  });

  const category = db.categories.findById(station.categoryId);
  const country = db.countries.findByCode(station.countryCode);
  const healthChecks = db.healthChecks.getForStation(station.id, 10);
  // Calculate related & reference stations using multi-attribute relevance matching
  const allActive = db.stations.getAll().filter(
    (s) => s.id !== station.id && (s.status === 'ACTIVE' || s.status === 'APPROVED')
  );

  const scored = allActive.map((s) => {
    let score = 0;
    let matchReason = 'Reference Broadcast';

    if (s.categoryId && s.categoryId === station.categoryId) {
      score += 4;
      matchReason = 'Same Category';
    }
    if (s.countryCode && s.countryCode === station.countryCode) {
      score += 3;
      matchReason = 'Same Country';
    }
    if (s.language && station.language && s.language.toLowerCase() === station.language.toLowerCase()) {
      score += 2;
      if (score < 4) matchReason = 'Same Language';
    }
    if (s.denomination && station.denomination && s.denomination.toLowerCase() === station.denomination.toLowerCase()) {
      score += 2;
    }

    return { station: s, score, matchReason };
  });

  scored.sort((a, b) => b.score - a.score || (b.station.playCount || 0) - (a.station.playCount || 0));

  const related = scored.slice(0, 8).map((item) => ({
    ...item.station,
    referenceTag: item.matchReason,
    category: db.categories.findById(item.station.categoryId),
    country: db.countries.findByCode(item.station.countryCode),
  }));

  res.json({
    station: {
      ...station,
      category,
      country,
    },
    healthChecks,
    related,
    relatedStations: related,
  });
});

// 3. Categories
publicRouter.get('/categories', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
  const categories = db.categories.getAll().filter((c) => c.isActive);
  const activeStations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  const withCounts = categories.map((c) => ({
    ...c,
    stationCount: activeStations.filter((s) => s.categoryId === c.id).length,
  }));

  res.json({ categories: withCounts });
});

publicRouter.get('/categories/:slug', (req, res) => {
  const { slug } = req.params;
  const cat = db.categories.findBySlug(slug) || db.categories.findById(slug);
  if (!cat) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  const stations = db.stations
    .getAll()
    .filter(
      (s) =>
        (s.status === 'ACTIVE' || s.status === 'APPROVED') &&
        s.categoryId === cat.id
    )
    .map((s) => ({
      ...s,
      category: cat,
      country: db.countries.findByCode(s.countryCode),
    }));

  res.json({
    category: cat,
    stations,
    total: stations.length,
  });
});

// 4. Countries
publicRouter.get('/countries', (req, res) => {
  const countries = db.countries.getAll();
  const activeStations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  const withCounts = countries.map((c) => ({
    ...c,
    stationCount: activeStations.filter((s) => s.countryCode === c.code).length,
  }));

  res.json({ countries: withCounts });
});

publicRouter.get('/countries/:code', (req, res) => {
  const { code } = req.params;
  const country = db.countries.findByCode(code);
  if (!country) {
    res.status(404).json({ error: 'Country not found.' });
    return;
  }
  const stations = db.stations
    .getAll()
    .filter(
      (s) =>
        (s.status === 'ACTIVE' || s.status === 'APPROVED') &&
        s.countryCode.toUpperCase() === code.toUpperCase()
    )
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country,
    }));

  res.json({
    country,
    stations,
    total: stations.length,
  });
});

// 5. Featured Stations
publicRouter.get('/featured', (req, res) => {
  const activeCampaigns = db.featuredCampaigns.getActive();
  const campaignStationIds = new Set(activeCampaigns.map((c) => c.stationId));

  const featuredStations = db.stations
    .getAll()
    .filter(
      (s) =>
        (s.status === 'ACTIVE' || s.status === 'APPROVED') &&
        (s.isFeatured || campaignStationIds.has(s.id))
    )
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
      featuredCampaign: activeCampaigns.find((c) => c.stationId === s.id),
    }));

  res.json({ stations: featuredStations });
});

// 5b. Premium Stations
publicRouter.get('/premium', (req, res) => {
  const premiumStations = db.stations
    .getAll()
    .filter(
      (s) =>
        (s.status === 'ACTIVE' || s.status === 'APPROVED') &&
        s.accessType === 'PREMIUM'
    )
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
    }));

  res.json({ stations: premiumStations, total: premiumStations.length });
});

// 6. Live Now Stations
publicRouter.get('/live', (req, res) => {
  const liveStations = db.stations
    .getAll()
    .filter(
      (s) =>
        (s.status === 'ACTIVE' || s.status === 'APPROVED') &&
        s.streamStatus === 'ONLINE'
    )
    .sort((a, b) => (b.currentListenersCount || 0) - (a.currentListenersCount || 0))
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
    }));

  res.json({ stations: liveStations, total: liveStations.length });
});

// 7. Global Search Endpoint
publicRouter.get('/search', (req, res) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  if (!q) {
    res.json({ stations: [], categories: [], countries: [] });
    return;
  }

  const allStations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  const matchingStations = allStations
    .filter((s) => {
      const country = db.countries.findByCode(s.countryCode);
      const category = db.categories.findById(s.categoryId);
      const searchBlob = [
        s.name,
        s.city,
        s.countryCode,
        s.genre,
        s.language || '',
        s.tagline || '',
        s.denomination || '',
        s.region || '',
        s.description || '',
        country?.name || '',
        category?.name || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchBlob.includes(q);
    })
    .slice(0, 15)
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
    }));

  const matchingCategories = db.categories
    .getAll()
    .filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));

  const matchingCountries = db.countries
    .getAll()
    .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));

  res.json({
    stations: matchingStations,
    categories: matchingCategories,
    countries: matchingCountries,
  });
});

// 7b. Public Featured Promotion Packages
publicRouter.get('/featured-packages', (req, res) => {
  const packages = (db.featuredPackages.getAll() || []).filter((p) => p.isActive);
  res.json({ packages });
});

// 7c. Station Access & Premium Status Check
publicRouter.get('/stations/:id/access', (req, res) => {
  const { id } = req.params;
  const listenerId = req.query.listenerId as string | undefined;

  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const isPremium = station.accessType === 'PREMIUM';
  let hasAccess = !isPremium;

  if (isPremium && listenerId) {
    hasAccess = db.premiumSubscriptions.hasActiveAccess(listenerId, id);
  }

  res.json({
    stationId: id,
    accessType: station.accessType || 'FREE',
    isPremium,
    hasAccess,
    monthlyPriceTzs: station.monthlyPriceTzs || 5000,
    annualPriceTzs: station.annualPriceTzs || 50000,
    premiumDescription: station.premiumDescription || 'Subscribe to listen to this Premium Christian Radio.',
  });
});

// 8. Public Platform Stats
publicRouter.get('/stats', (req, res) => {
  const allActive = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  const onlineStations = allActive.filter((s) => s.streamStatus === 'ONLINE');
  const countries = new Set(allActive.map((s) => s.countryCode));
  const totalPlays = allActive.reduce((acc, s) => acc + (s.playCount || 0), 0);
  const totalListenersEstimate = onlineStations.reduce(
    (acc, s) => acc + (s.currentListenersCount || 35),
    0
  );

  res.json({
    totalStations: allActive.length,
    onlineStations: onlineStations.length,
    countriesCount: countries.size,
    totalPlays,
    liveListenersEstimate: totalListenersEstimate,
  });
});

// 9. Active Platform Advertisements
publicRouter.get('/ads', (req, res) => {
  const placement = req.query.placement as string | undefined;
  const ads = db.advertisements.getActive(placement);
  res.json({ ads });
});

// 10. Report a Station
publicRouter.post('/report', (req, res) => {
  const { stationId, reporterEmail, reason, details } = req.body;
  if (!stationId || !reporterEmail || !reason) {
    res.status(400).json({ error: 'Station ID, email, and report reason are required.' });
    return;
  }

  const report: StationReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId,
    reporterEmail,
    reason,
    details,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  db.reports.create(report);
  res.status(201).json({ success: true, message: 'Thank you. Your report has been submitted to moderation.' });
});

// 11. SSRF Safe Stream Validation Test (for station submission forms)
publicRouter.post('/stream/validate', async (req, res) => {
  const { streamUrl } = req.body;
  if (!streamUrl) {
    res.status(400).json({ error: 'streamUrl is required.' });
    return;
  }
  const result = await validateStreamUrl(streamUrl);
  res.json(result);
});

// Helper to enrich prayer requests with author avatars
const enrichPrayersWithAvatar = (prayers: any[]) => {
  return prayers.map((p) => {
    if (p.isAnonymous) return { ...p, authorAvatar: undefined };
    if (p.authorAvatar) return p;
    if (p.userId) {
      const user = db.users.findById(p.userId);
      if (user?.avatarUrl) {
        return { ...p, authorAvatar: user.avatarUrl };
      }
    }
    return p;
  });
};

// 12. Prayer Requests Wall
publicRouter.get('/prayers', (req, res) => {
  const category = req.query.category as string | undefined;
  const search = (req.query.search as string | undefined)?.toLowerCase();
  let list = db.prayerRequests.getApproved();

  if (category && category !== 'ALL') {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.prayerPoints.toLowerCase().includes(search) ||
        p.authorName.toLowerCase().includes(search)
    );
  }

  const enriched = enrichPrayersWithAvatar(list);
  res.json({ prayers: enriched, total: enriched.length });
});

publicRouter.post('/prayers', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { authorName, authorAvatar, isAnonymous, category, title, prayerPoints, stationId, countryCode } = req.body;
  if (!title || !prayerPoints) {
    res.status(400).json({ error: 'Title and prayer points are required.' });
    return;
  }

  let stationName = undefined;
  let stOwnerId: string | undefined = undefined;
  if (stationId) {
    const st = db.stations.findById(stationId);
    if (st) {
      stationName = st.name;
      stOwnerId = st.ownerId;
    }
  }

  const prayer = db.prayerRequests.create({
    id: `pray_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    authorName: isAnonymous ? 'Anonymous Listener' : (authorName || user.name || 'Faithful Believer'),
    authorAvatar: isAnonymous ? undefined : (authorAvatar || user.avatarUrl),
    isAnonymous: !!isAnonymous,
    category: category || 'General',
    title,
    prayerPoints,
    prayedCount: 1,
    stationId,
    stationName,
    countryCode: countryCode || 'TZ',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  });

  if (stOwnerId) {
    db.notifications.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: stOwnerId,
      title: 'New Prayer Request Submitted!',
      message: `${prayer.authorName} submitted a prayer request "${title}" for ${stationName || 'your station'}.`,
      type: 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({ success: true, prayer });
});

// 12b. Mark Prayer as Answered with Praise Report / Testimony
publicRouter.post('/prayers/:id/answered', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { testimony } = req.body;
  const user = req.user!;

  const existing = db.prayerRequests.findById(id);
  if (!existing) {
    res.status(404).json({ error: 'Prayer request not found.' });
    return;
  }

  if (existing.userId && existing.userId !== user.id && user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Only the prayer author or administrator can add a praise report.' });
    return;
  }

  const updated = db.prayerRequests.update(id, {
    status: 'ANSWERED',
    testimony: testimony || 'Praise God! Our prayer has been answered.',
  });

  // Notify station owner if prayer request was tied to a station
  if (existing.stationId) {
    const st = db.stations.findById(existing.stationId);
    if (st?.ownerId) {
      db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: st.ownerId,
        title: '🎉 Praise Report on Your Station!',
        message: `${existing.authorName}'s prayer request "${existing.title}" received a praise testimony: "${testimony || 'Prayer answered!'}".`,
        type: 'PRAYER_ANSWERED',
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/owner',
        metadata: { prayerId: id, stationId: st.id },
      });
    }
  }

  res.json({ success: true, prayer: updated });
});

publicRouter.post('/prayers/:id/pray', (req, res) => {
  const { id } = req.params;
  const count = db.prayerRequests.incrementPrayed(id);
  const prayer = db.prayerRequests.findById(id);

  if (prayer?.userId) {
    const userSession = getSessionFromRequest(req);
    if (!userSession || userSession.id !== prayer.userId) {
      db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: prayer.userId,
        title: '🙏 Someone just prayed for you!',
        message: `A fellow believer joined in agreement with your prayer request: "${prayer.title}". Total prayer warriors: ${count}.`,
        type: 'PRAYER_REQUEST',
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/prayer-wall',
        metadata: { prayerId: prayer.id, count },
      });
    }
  }

  res.json({ success: true, count });
});

publicRouter.get('/stations/:slug/prayers', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  let prayers = db.prayerRequests.getByStationId(st.id);
  if (prayers.length === 0) {
    prayers = db.prayerRequests.getApproved().slice(0, 10);
  }

  res.json({ prayers: enrichPrayersWithAvatar(prayers), total: prayers.length });
});

// 13. Station Reviews & Testimonies
publicRouter.get('/plans', (req, res) => {
  const plans = db.plans.getAll().filter((p) => p.isActive !== false);
  res.json({ plans });
});

publicRouter.get('/reviews', (req, res) => {
  const reviews = db.stationReviews.getAll().filter((r) => r.isApproved);
  res.json({ reviews });
});

publicRouter.get('/stations/:slug/reviews', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const reviews = db.stationReviews.getByStationId(st.id);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 5.0;

  res.json({
    reviews,
    avgRating: Number(avgRating.toFixed(1)),
    total: reviews.length,
  });
});

publicRouter.post('/stations/:slug/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
  const { slug } = req.params;
  const user = req.user!;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const { authorName, authorEmail, rating, title, testimony, countryCode, city } = req.body;
  if (!testimony || !rating) {
    res.status(400).json({ error: 'Rating and testimony message are required.' });
    return;
  }

  const finalAuthorName = authorName || user.name || 'Faithful Listener';
  const finalAuthorEmail = authorEmail || user.email;

  const review = db.stationReviews.create({
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    stationId: st.id,
    stationSlug: st.slug,
    stationName: st.name,
    authorName: finalAuthorName,
    authorEmail: finalAuthorEmail,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    title: title || 'Life-changing broadcast',
    testimony,
    countryCode: countryCode || 'TZ',
    city,
    isApproved: true,
    isFeatured: rating >= 5,
    createdAt: new Date().toISOString(),
  });

  if (st.ownerId) {
    db.notifications.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: st.ownerId,
      title: 'New Listener Testimony Received!',
      message: `${finalAuthorName} shared a ${review.rating}-star review/testimony for ${st.name}: "${review.title}".`,
      type: 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json({ success: true, review });
});

// 14. Station Live Feed & Engagement
publicRouter.get('/stations/:slug/feed', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const posts = db.feedPosts.getByStationId(st.id);
  res.json({ posts, total: posts.length });
});

publicRouter.post('/stations/:stationId/feed', (req, res) => {
  const { stationId } = req.params;
  const st = db.stations.findBySlug(stationId) || db.stations.findById(stationId);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const { authorName, authorCity, content, postType, songTitle, artistName, dedicationMessage } = req.body;
  if (!authorName || (!content && !songTitle)) {
    res.status(400).json({ error: 'Author name and message content or song title are required.' });
    return;
  }

  const userSession = getSessionFromRequest(req);
  const userId = userSession?.id;

  const validTypes: Array<'SHOUTOUT' | 'CHECK_IN' | 'ANNOUNCEMENT' | 'SONG_REQUEST'> = [
    'SHOUTOUT',
    'CHECK_IN',
    'ANNOUNCEMENT',
    'SONG_REQUEST',
  ];
  const type = validTypes.includes(postType) ? postType : 'SHOUTOUT';

  const cleanContent = (content || (songTitle ? `🎵 Song Request: "${songTitle}" by ${artistName || 'Unknown Artist'}` : '')).trim().slice(0, 500);

  const post = db.feedPosts.create({
    id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId: st.id,
    userId,
    authorName: authorName.trim(),
    authorCity: authorCity ? authorCity.trim() : undefined,
    content: cleanContent,
    postType: type,
    songTitle: songTitle ? songTitle.trim() : undefined,
    artistName: artistName ? artistName.trim() : undefined,
    dedicationMessage: dedicationMessage ? dedicationMessage.trim() : undefined,
    playedOnAir: false,
    readOnAir: false,
    isPinned: type === 'ANNOUNCEMENT',
    likesCount: 0,
    createdAt: new Date().toISOString(),
  });

  if (st.ownerId) {
    db.notifications.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: st.ownerId,
      title: type === 'SONG_REQUEST' ? `🎵 New Song Request: ${post.songTitle || 'Special Song'}` : `📣 New Studio Shout-out on ${st.name}`,
      message: `${authorName.trim()}${authorCity ? ` from ${authorCity.trim()}` : ''} submitted: "${cleanContent}"`,
      type: type === 'SONG_REQUEST' ? 'SONG_REQUEST' : 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/owner',
      metadata: { stationId: st.id, postId: post.id },
    });
  }

  res.status(201).json({ success: true, post });
});

publicRouter.post('/stations/:stationId/feed/:postId/like', (req, res) => {
  const { postId } = req.params;
  const post = db.feedPosts.like(postId);
  if (!post) {
    res.status(404).json({ error: 'Feed post not found.' });
    return;
  }
  res.json({ success: true, likesCount: post.likesCount });
});

// 15b. WhatsApp & SMS Listener Bridge Config
publicRouter.get('/stations/:stationId/bridge', (req, res) => {
  const { stationId } = req.params;
  const st = db.stations.findBySlug(stationId) || db.stations.findById(stationId);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const phone = st.whatsappNumber || st.phone || '+255754123456';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const smsNum = st.smsNumber || phone;

  res.json({
    stationId: st.id,
    stationName: st.name,
    whatsappNumber: phone,
    cleanWhatsAppNumber: cleanPhone,
    smsNumber: smsNum,
    smsKeywordPrefix: st.smsKeywordPrefix || st.name.split(' ')[0].toUpperCase(),
    whatsappBridgeEnabled: st.whatsappBridgeEnabled !== false,
    smsBridgeEnabled: st.smsBridgeEnabled !== false,
    templates: {
      prayer: `🕊️ [PRAYER REQUEST]\nStation: ${st.name}\nFrom: \nCity: \n\nDear Radio Team, please stand with me in prayer for: `,
      song: `🎵 [SONG REQUEST]\nStation: ${st.name}\nSong: \nArtist: \nDedicated to: \nSpecial Note: `,
      shoutout: `📣 [LIVE STUDIO SHOUTOUT]\nStation: ${st.name}\nFrom: \nCity: \n\nGreetings to the studio host and fellow listeners! `,
      giving: `🤝 [GIVING & PARTNERSHIP INQUIRY]\nStation: ${st.name}\nFrom: \n\nI would like to support ${st.name}'s gospel broadcast ministry. Please share bank/mobile money details.`,
    },
  });
});

// 15c. WhatsApp / SMS Inbound Webhook Bridge Receiver
// Support Meta Cloud API Webhook Verification (Handshake)
publicRouter.get('/stations/:stationId/bridge/inbound', (req, res) => {
  const { stationId } = req.params;
  const st = db.stations.findBySlug(stationId) || db.stations.findById(stationId);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe') {
    const expectedToken = st.whatsappSession?.metaVerifyToken;
    if (!expectedToken || token === expectedToken || token === 'christianradios_meta_webhook') {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).json({ error: 'Verify token mismatch.' });
    return;
  }

  res.status(200).json({ status: 'ACTIVE', stationId: st.id, name: st.name });
});

// Inbound Receiver (Meta Cloud API, Twilio, or Direct Web Player)
publicRouter.post('/stations/:stationId/bridge/inbound', (req, res) => {
  const { stationId } = req.params;
  const st = db.stations.findBySlug(stationId) || db.stations.findById(stationId);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  let body = '';
  let from = '';
  let senderName = '';
  let channel: 'WHATSAPP' | 'SMS' | 'WEB' = 'WHATSAPP';
  let accountType: 'STANDARD' | 'BUSINESS' = 'STANDARD';

  // Format 1: Meta WhatsApp Cloud API Webhook payload
  if (req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const changeVal = req.body.entry[0].changes[0].value;
    const msg = changeVal.messages[0];
    const contact = changeVal.contacts?.[0];
    
    body = msg.text?.body || msg.caption || '[Media Message]';
    from = msg.from ? `+${msg.from}` : '';
    senderName = contact?.profile?.name || from || 'WhatsApp Listener';
    channel = 'WHATSAPP';
    accountType = 'BUSINESS';
  }
  // Format 2: Twilio WhatsApp Webhook payload
  else if (req.body?.From && req.body?.Body) {
    body = req.body.Body;
    from = String(req.body.From).replace('whatsapp:', '');
    senderName = req.body.ProfileName || from || 'WhatsApp Listener';
    channel = String(req.body.From).includes('whatsapp') ? 'WHATSAPP' : 'SMS';
  }
  // Format 3: Direct Web Bridge / JSON payload
  else {
    body = req.body.body || req.body.content || '';
    from = req.body.from || '';
    senderName = req.body.senderName || req.body.authorName || '';
    channel = req.body.channel === 'SMS' ? 'SMS' : req.body.channel === 'WEB' ? 'WEB' : 'WHATSAPP';
    accountType = req.body.accountType === 'BUSINESS' ? 'BUSINESS' : 'STANDARD';
  }

  if (!body) {
    res.status(400).json({ error: 'Message body is required.' });
    return;
  }

  try {
    const post = whatsappGateway.ingestInboundMessage(st.id, {
      from,
      senderName,
      senderCity: req.body.senderCity || req.body.city,
      body,
      messageType: req.body.messageType,
      songTitle: req.body.songTitle,
      artistName: req.body.artistName,
      accountType,
      channel,
    });

    res.status(201).json({ success: true, post, channel });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process inbound message.' });
  }
});

// 15. Daily Verse & Scripture Reflection
publicRouter.get('/verse-of-the-day', (req, res) => {
  const verse = db.dailyVerses.getToday();
  res.json({ verse });
});

// 16. Live Now Playing Song & Preacher Metadata (ICY Metadata Engine)
publicRouter.get('/stations/:slug/now-playing', async (req, res) => {
  const rawParam = req.params.slug;
  const decodedParam = decodeURIComponent(rawParam);
  const st =
    db.stations.findBySlug(rawParam) ||
    db.stations.findBySlug(decodedParam) ||
    db.stations.findById(rawParam) ||
    db.stations.getAll().find(
      (s) =>
        s.slug?.toLowerCase() === rawParam.toLowerCase() ||
        s.slug?.toLowerCase() === decodedParam.toLowerCase() ||
        s.id === rawParam
    );
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  try {
    const metadata = await getLiveNowPlayingMetadata(st);
    res.json(metadata);
  } catch {
    res.json({
      stationId: st.id,
      stationName: st.name,
      currentTrack: 'Live Gospel Praise & Worship',
      artistOrMinister: st.name,
      programTitle: 'Live Christian Broadcast',
      presenter: st.name,
      listenersCount: st.currentListenersCount || 42,
      bitrate: st.bitrateKbps || 128,
      streamQuality: 'HD Stereo (128 kbps)',
      updatedAt: new Date().toISOString(),
    });
  }
});

// Stream proxy to resolve CORS and Mixed-Content HTTP/HTTPS audio stream issues
publicRouter.get('/stream-proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send('Missing url parameter');
    return;
  }

  const ssrfCheck = await validateStreamUrl(targetUrl);
  if (!ssrfCheck.isValid) {
    res.status(400).send('Invalid or prohibited stream URL');
    return;
  }

  const streamUrl = ssrfCheck.normalizedUrl || targetUrl;
  const isHttps = streamUrl.startsWith('https:');
  const client = isHttps ? https : http;

  const reqOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Icy-MetaData': '1',
      ...(req.headers.range ? { 'Range': req.headers.range } : {}),
    },
    timeout: 8000,
  };

  const proxyReq = client.get(streamUrl, reqOptions, (proxyRes) => {
    if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      const redirectUrl = proxyRes.headers.location;
      res.redirect(`/api/public/stream-proxy?url=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    res.writeHead(proxyRes.statusCode || 200, {
      'Content-Type': proxyRes.headers['content-type'] || 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.status(502).send('Stream gateway proxy connection error');
    }
  });

  req.on('close', () => {
    proxyReq.destroy();
  });
});

// 17. Ministry Direct Donations & Station Campaigns
publicRouter.get('/giving/config', (req, res) => {
  const settings = db.settings.get();
  res.json({
    givingEnabled: settings.givingEnabled ?? true,
    donationFeePercentage: settings.donationFeePercentage ?? 5.0,
    donationMinAmount: settings.donationMinAmount ?? 1000,
    donationMaxAmount: settings.donationMaxAmount ?? 10000000,
    defaultCurrency: settings.defaultCurrency || 'TZS',
    presetAmountsTZS: [5000, 10000, 20000, 50000, 100000, 250000],
    presetAmountsUSD: [5, 10, 25, 50, 100, 250],
    supportedPaymentMethods: ['MPESA', 'TIGO_PESA', 'AIRTEL_MONEY', 'CARD', 'BANK_TRANSFER'],
  });
});

publicRouter.get('/campaigns', (req, res) => {
  const { search, stationId } = req.query as Record<string, string>;
  let campaigns = db.donationCampaigns.getAll().filter((c) => c.status === 'ACTIVE' || c.status === 'COMPLETED');

  if (stationId) {
    campaigns = campaigns.filter((c) => c.stationId === stationId);
  }

  if (search) {
    const q = search.toLowerCase();
    campaigns = campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.stationName && c.stationName.toLowerCase().includes(q))
    );
  }

  const enriched = campaigns.map((c) => ({
    ...c,
    station: db.stations.findById(c.stationId),
    progressPercentage: Math.min(100, Math.round(((c.amountRaised || 0) / Math.max(1, c.goalAmount)) * 100)),
  }));

  res.json({ campaigns: enriched, total: enriched.length });
});

publicRouter.get('/campaigns/:id', (req, res) => {
  const campaign = db.donationCampaigns.findById(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Donation campaign not found.' });
    return;
  }
  const station = db.stations.findById(campaign.stationId);
  res.json({
    campaign: {
      ...campaign,
      station,
      progressPercentage: Math.min(100, Math.round(((campaign.amountRaised || 0) / Math.max(1, campaign.goalAmount)) * 100)),
    },
  });
});

publicRouter.get('/stations/:slug/campaigns', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const campaigns = db.donationCampaigns.getByStationId(st.id).map((c) => ({
    ...c,
    progressPercentage: Math.min(100, Math.round(((c.amountRaised || 0) / Math.max(1, c.goalAmount)) * 100)),
  }));

  res.json({ campaigns, total: campaigns.length, station: st });
});

publicRouter.get('/stations/:slug/donations', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const donations = db.donations.getByStationId(st.id);
  const completed = donations.filter((d) => d.status === 'COMPLETED');
  const totalAmount = completed.reduce((sum, d) => sum + d.amount, 0);

  res.json({
    donations: completed.slice(0, 15).map((d) => ({
      id: d.id,
      donorName: d.isAnonymous ? 'Anonymous Supporter' : d.donorName,
      isAnonymous: Boolean(d.isAnonymous),
      amount: d.amount,
      currency: d.currency,
      fundType: d.fundType,
      campaignTitle: d.campaignTitle,
      message: d.message,
      createdAt: d.createdAt,
    })),
    totalDonationsCount: completed.length,
    estimatedTotalUsd: totalAmount,
  });
});

// In-memory praise / amen reactions store per station
const stationAmenCounts: Record<string, number> = {};

publicRouter.get('/stations/:slug/amen', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }
  const count = stationAmenCounts[st.id] || Math.floor((st.playCount || 100) * 1.4) + 24;
  res.json({ stationId: st.id, amenCount: count });
});

publicRouter.post('/stations/:slug/amen', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }
  const current = stationAmenCounts[st.id] || Math.floor((st.playCount || 100) * 1.4) + 24;
  stationAmenCounts[st.id] = current + 1;
  res.json({ success: true, amenCount: stationAmenCounts[st.id] });
});

publicRouter.post(['/donations', '/donations/checkout'], (req, res) => {
  const {
    stationId,
    donorName,
    isAnonymous = false,
    donorEmail,
    donorPhone,
    amount,
    currency = 'USD',
    fundType = 'GENERAL',
    campaignId,
    paymentMethod = 'MPESA',
    message,
  } = req.body;

  if (!stationId || !donorName || !donorEmail || !amount) {
    res.status(400).json({ error: 'Station, donor name, email, and donation amount are required.' });
    return;
  }

  const st = db.stations.findById(stationId);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const settings = db.settings.get();
  if (settings.givingEnabled === false) {
    res.status(403).json({ error: 'Giving is temporarily disabled on the platform.' });
    return;
  }

  const numAmount = Math.max(100, Number(amount));
  const feeRate = settings.donationFeePercentage ?? 5.0;
  const feeAmount = Math.round(numAmount * (feeRate / 100));
  const netAmount = numAmount - feeAmount;

  let campaignTitle: string | undefined;
  if (campaignId) {
    const camp = db.donationCampaigns.findById(campaignId);
    if (camp) campaignTitle = camp.title;
  }

  const trackingId = `DON_${st.countryCode || 'GL'}_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const currentUser = getSessionFromRequest(req) || (req as AuthenticatedRequest).user;
  const donorUserId = currentUser?.id;

  const donation = db.donations.create({
    id: `don_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId: st.id,
    stationName: st.name,
    ownerId: st.ownerId,
    campaignId,
    campaignTitle,
    donorUserId,
    userId: donorUserId,
    donorName: isAnonymous ? 'Anonymous Listener' : donorName,
    isAnonymous: Boolean(isAnonymous),
    donorEmail,
    donorPhone,
    amount: numAmount,
    grossAmount: numAmount,
    platformFeePercentage: feeRate,
    platformFeeAmount: feeAmount,
    netOwnerAmount: netAmount,
    currency,
    fundType: campaignId ? 'CAMPAIGN' : fundType,
    paymentMethod,
    trackingId,
    status: 'COMPLETED',
    message,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  // Update campaign progress if attached
  if (campaignId) {
    db.donationCampaigns.recordDonation(campaignId, numAmount);
  }

  // Credit ledger for radio owner
  if (st.ownerId) {
    const currentBal = db.ledgerEntries.getOwnerBalance(st.ownerId);
    db.ledgerEntries.create({
      id: `ldg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId: st.ownerId,
      stationId: st.id,
      donationId: donation.id,
      type: 'DONATION_CREDIT',
      amount: netAmount,
      currency,
      balanceAfter: currentBal.availableBalance + netAmount,
      description: `Net donation credit from ${isAnonymous ? 'Anonymous Listener' : donorName} (Gross: ${numAmount.toLocaleString()} ${currency}, Fee: ${feeAmount.toLocaleString()} ${currency})`,
      createdAt: new Date().toISOString(),
    });
  }

  // Also create a notification for station owner
  if (st.ownerId) {
    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: st.ownerId,
      title: `New Donation Received! (${donation.currency} ${donation.amount.toLocaleString()})`,
      message: `${isAnonymous ? 'An anonymous supporter' : donorName} contributed ${donation.currency} ${donation.amount.toLocaleString()} to ${st.name} ${campaignTitle ? `for "${campaignTitle}"` : `for ${donation.fundType.replace('_', ' ')}`}. Net credited: ${donation.currency} ${netAmount.toLocaleString()}.`,
      type: 'PAYMENT_SUCCESS',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Audit log
  db.auditLogs.log({
    actorId: st.ownerId,
    actorRole: 'RADIO_OWNER',
    action: 'DONATION_RECORDED',
    entityType: 'Donation',
    entityId: donation.id,
    details: `Listener donation ${donation.trackingId} recorded for ${st.name}: ${donation.currency} ${numAmount}`,
  });

  res.status(201).json({
    success: true,
    message: 'Donation recorded successfully. May God abundantly bless your generosity!',
    donation,
    trackingId: donation.trackingId,
  });
});

publicRouter.get('/donations/receipt/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const don = db.donations.findByTrackingId(trackingId);
  if (!don) {
    res.status(404).json({ error: 'Donation receipt not found.' });
    return;
  }
  const st = db.stations.findById(don.stationId);
  const campaign = don.campaignId ? db.donationCampaigns.findById(don.campaignId) : undefined;

  res.json({
    donation: don,
    station: st,
    campaign,
  });
});

// 18. Embeddable Widget Config & HTML Snippet Generator
publicRouter.get('/embed/:slug', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  res.json({
    station: {
      id: st.id,
      name: st.name,
      slug: st.slug,
      tagline: st.tagline,
      logoUrl: st.logoUrl,
      streamUrl: st.streamUrl,
      streamType: st.streamType,
      countryCode: st.countryCode,
      genre: st.genre,
    },
    embedUrl: `/embed/${st.slug}`,
    iframeCode: `<iframe src="https://christianradios.org/embed/${st.slug}" width="100%" height="180" frameborder="0" allow="autoplay; encrypted-media" style="border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);"></iframe>`,
    compactIframeCode: `<iframe src="https://christianradios.org/embed/${st.slug}?theme=compact" width="100%" height="90" frameborder="0" allow="autoplay; encrypted-media" style="border-radius:12px; overflow:hidden;"></iframe>`,
  });
});

// 19. Public Station Claim Status
publicRouter.get('/stations/:slug/claim-status', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const activeClaims = db.stationClaims
    .findByStationId(st.id)
    .filter((c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW');

  res.json({
    stationId: st.id,
    stationName: st.name,
    claimStatus: st.claimStatus || (st.ownerId === 'usr_superadmin' ? 'UNCLAIMED' : 'CLAIMED'),
    isClaimable: st.claimStatus === 'UNCLAIMED' || (!st.claimStatus && st.ownerId === 'usr_superadmin'),
    hasPendingClaim: activeClaims.length > 0,
    sourceType: st.sourceType || 'MANUAL',
    sourceUrl: st.sourceUrl,
  });
});

// 20. Public Station Claim Submission
publicRouter.post('/stations/:slug/claim', (req, res) => {
  try {
    const { slug } = req.params;
    const {
      claimantName,
      claimantEmail,
      claimantPhone,
      roleInStation,
      reason,
      evidence,
      evidenceUrls,
      verificationMethod = 'ADMIN_REVIEW',
    } = req.body;

    if (!claimantName || !claimantEmail || !roleInStation || !evidence) {
      res.status(400).json({ error: 'Name, email, organization role, and verification details are required.' });
      return;
    }

    const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
    if (!st) {
      res.status(404).json({ error: 'Station not found.' });
      return;
    }

    // Find or create user account for claimant if listener/owner
    let user = db.users.findByEmail(claimantEmail);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: claimantEmail.toLowerCase().trim(),
        passwordHash: '',
        name: claimantName.trim(),
        phone: claimantPhone?.trim(),
        role: 'RADIO_OWNER',
        emailVerified: false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.create(user);
    }

    const claimId = `clm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newClaim = {
      id: claimId,
      stationId: st.id,
      stationName: st.name,
      claimantId: user.id,
      claimantName: claimantName.trim(),
      claimantEmail: claimantEmail.toLowerCase().trim(),
      claimantPhone: claimantPhone?.trim(),
      roleInStation: roleInStation.trim(),
      reason: reason || 'Official representative of this broadcasting ministry requesting ownership management.',
      evidence: evidence.trim(),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : undefined,
      verificationMethod,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.stationClaims.create(newClaim);
    db.stations.update(st.id, { claimStatus: 'CLAIM_PENDING' });

    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: 'usr_superadmin',
      title: `Station Claim Received: ${st.name}`,
      message: `${claimantName} (${claimantEmail} - ${roleInStation}) submitted an ownership claim for "${st.name}".`,
      type: 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully! Our team will review your ministry credentials and confirm ownership.',
      claim: newClaim,
    });
  } catch {
    res.status(500).json({ error: 'Failed to process claim request.' });
  }
});

// 22. Public Contact Form Submission Endpoint
publicRouter.post('/contact', (req, res) => {
  try {
    const { name, email, subject, message, topic = 'GENERAL' } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    const ticketId = `tkt_${Date.now()}`;
    const newTicket = {
      id: ticketId,
      ownerId: 'PUBLIC_VISITOR',
      subject: subject || `Public Inquiry: ${topic || 'General'}`,
      category: topic || 'GENERAL',
      message: `${message}\n\nSender: ${name} (${email})`,
      status: 'OPEN' as const,
      priority: (topic === 'STREAM_ISSUE' ? 'HIGH' : 'MEDIUM') as TicketPriority,
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.supportTickets.create(newTicket);

    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: 'usr_superadmin',
      title: `New Support Inquiry: ${name}`,
      message: `${name} (${email}) sent a message: "${subject || topic}".`,
      type: 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received by our engineering and support team.',
      ticketId,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to submit contact message.' });
  }
});


