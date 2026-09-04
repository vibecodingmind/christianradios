import { Router } from 'express';
import http from 'http';
import https from 'https';
import { db } from '../db.js';
import { validateStreamUrl } from '../ssrf.js';
import { getLiveNowPlayingMetadata } from '../icyMetadata.js';
import type { StationReport, TicketPriority } from '../types.js';

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
      (s) => s.countryCode.toUpperCase() === country.toUpperCase()
    );
  }

  if (language) {
    stations = stations.filter((s) =>
      s.language.toLowerCase().includes(language.toLowerCase())
    );
  }

  if (genre) {
    stations = stations.filter((s) =>
      s.genre.toLowerCase().includes(genre.toLowerCase())
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
        category?.slug || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchBlob.includes(q);
    });
  }

  // Sorting
  if (sort === 'popular') {
    stations.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  } else if (sort === 'trending') {
    stations.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
  } else if (sort === 'newest') {
    stations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === 'name') {
    stations.sort((a, b) => a.name.localeCompare(b.name));
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 50));
  const total = stations.length;
  const totalPages = Math.ceil(total / limitNum);
  const paginated = stations.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Attach enriched category and country objects
  const enriched = paginated.map((s) => ({
    ...s,
    category: db.categories.findById(s.categoryId),
    country: db.countries.findByCode(s.countryCode),
  }));

  res.json({
    stations: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
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
  const related = db.stations
    .getAll()
    .filter(
      (s) =>
        s.id !== station.id &&
        (s.status === 'ACTIVE' || s.status === 'APPROVED') &&
        (s.categoryId === station.categoryId || s.countryCode === station.countryCode)
    )
    .slice(0, 6)
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
    }));

  res.json({
    station: {
      ...station,
      category,
      country,
    },
    healthChecks,
    related,
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

  res.json({ prayers: list, total: list.length });
});

publicRouter.post('/prayers', (req, res) => {
  const { authorName, isAnonymous, category, title, prayerPoints, stationId, countryCode } = req.body;
  if (!title || !prayerPoints) {
    res.status(400).json({ error: 'Title and prayer points are required.' });
    return;
  }

  let stationName = undefined;
  if (stationId) {
    const st = db.stations.findById(stationId);
    if (st) stationName = st.name;
  }

  const prayer = db.prayerRequests.create({
    id: `pray_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorName: isAnonymous ? 'Anonymous Listener' : (authorName || 'Faithful Believer'),
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

  res.status(201).json({ success: true, prayer });
});

publicRouter.post('/prayers/:id/pray', (req, res) => {
  const { id } = req.params;
  const count = db.prayerRequests.incrementPrayed(id);
  res.json({ success: true, count });
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

publicRouter.post('/stations/:slug/reviews', (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
  if (!st) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const { authorName, authorEmail, rating, title, testimony, countryCode, city } = req.body;
  if (!authorName || !testimony || !rating) {
    res.status(400).json({ error: 'Author name, rating, and testimony message are required.' });
    return;
  }

  const review = db.stationReviews.create({
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId: st.id,
    stationSlug: st.slug,
    stationName: st.name,
    authorName,
    authorEmail,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    title: title || 'Life-changing broadcast',
    testimony,
    countryCode: countryCode || 'TZ',
    city,
    isApproved: true,
    isFeatured: rating >= 5,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, review });
});

// 14. Daily Verse & Scripture Reflection
publicRouter.get('/verse-of-the-day', (req, res) => {
  const verse = db.dailyVerses.getToday();
  res.json({ verse });
});

// 16. Live Now Playing Song & Preacher Metadata (ICY Metadata Engine)
publicRouter.get('/stations/:slug/now-playing', async (req, res) => {
  const { slug } = req.params;
  const st = db.stations.findBySlug(slug) || db.stations.findById(slug);
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
  const totalAmount = completed.reduce((sum, d) => sum + (d.currency === 'USD' ? d.amount * 2500 : d.amount), 0);

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
    estimatedTotalTzs: totalAmount,
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
    currency = 'TZS',
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

  const donation = db.donations.create({
    id: `don_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId: st.id,
    stationName: st.name,
    ownerId: st.ownerId,
    campaignId,
    campaignTitle,
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
  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: st.ownerId,
    title: `New Donation Received! (${donation.currency} ${donation.amount.toLocaleString()})`,
    message: `${isAnonymous ? 'An anonymous supporter' : donorName} contributed ${donation.currency} ${donation.amount.toLocaleString()} to ${st.name} ${campaignTitle ? `for "${campaignTitle}"` : `for ${donation.fundType.replace('_', ' ')}`}. Net credited: ${donation.currency} ${netAmount.toLocaleString()}.`,
    type: 'PAYMENT_SUCCESS',
    read: false,
    createdAt: new Date().toISOString(),
  });

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


