/**
 * /api/mobile — Mobile app (Flutter) specific endpoints
 *
 * GET    /api/mobile/stations  — Lightweight paginated station list
 * POST   /api/mobile/fcm-token — Register FCM push token
 * DELETE /api/mobile/fcm-token — Remove FCM push token on logout
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';

export const mobileRouter = Router();

// ── Lightweight station list ─────────────────────────────────────────────────
mobileRouter.get('/stations', (req, res) => {
  const {
    search,
    category,
    country,
    genre,
    isFeatured,
    page = '1',
    limit = '24',
  } = req.query as Record<string, string>;

  let stations = db.stations
    .getAll()
    .filter((s) => s.status === 'ACTIVE' || s.status === 'APPROVED');

  if (search) {
    const q = search.toLowerCase();
    stations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.genre ?? '').toLowerCase().includes(q)
    );
  }
  if (category) {
    const cat = db.categories.findBySlug(category) || db.categories.findById(category);
    if (cat) stations = stations.filter((s) => s.categoryId === cat.id || s.categoryIds?.includes(cat.id));
  }
  if (country) stations = stations.filter((s) => (s.countryCode ?? '').toUpperCase() === country.toUpperCase());
  if (genre) stations = stations.filter((s) => (s.genre ?? '').toLowerCase().includes(genre.toLowerCase()));
  if (isFeatured === 'true') stations = stations.filter((s) => s.isFeatured);

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const total = stations.length;
  const paginated = stations.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    stations: paginated.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      tagline: s.tagline,
      description: s.description,
      logoUrl: s.logoUrl,
      coverUrl: s.coverUrl,
      countryCode: s.countryCode,
      language: s.language,
      genre: s.genre,
      categoryId: s.categoryId,
      denomination: s.denomination,
      websiteUrl: s.websiteUrl,
      streamUrl: s.streamUrl,
      backupStreamUrl: s.backupStreamUrl,
      streamType: s.streamType,
      isFeatured: s.isFeatured,
      streamStatus: s.streamStatus,
      playCount: s.playCount,
      favoriteCount: s.favoriteCount,
      currentListenersCount: s.currentListenersCount,
      accessType: s.accessType ?? 'FREE',
      createdAt: s.createdAt,
    })),
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
  });
});

// ── Register FCM push token ──────────────────────────────────────────────────
mobileRouter.post('/fcm-token', requireAuth, (req: AuthenticatedRequest, res) => {
  const { token, platform } = req.body as { token: string; platform?: string };
  const userId = req.user!.id;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'FCM token is required' });
    return;
  }

  db.users.update(userId, { fcmToken: token, fcmPlatform: platform ?? 'android' } as any);
  res.json({ success: true, message: 'FCM token registered' });
});

// ── Remove FCM push token on logout ─────────────────────────────────────────
mobileRouter.delete('/fcm-token', requireAuth, (req: AuthenticatedRequest, res) => {
  db.users.update(req.user!.id, { fcmToken: null, fcmPlatform: null } as any);
  res.json({ success: true });
});
