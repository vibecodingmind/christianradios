import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import type { ListeningSession } from '../types.js';

export const listenerRouter = Router();

// Get Authenticated User Favorites
listenerRouter.get('/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const favorites = db.favorites.findByUser(userId);
  const favoriteStationIds = new Set(favorites.map((f) => f.stationId));

  const stations = db.stations
    .getAll()
    .filter((s) => favoriteStationIds.has(s.id))
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
    }));

  res.json({ stations });
});

// Toggle Favorite Station
listenerRouter.post('/favorites/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { stationId } = req.body;
  if (!stationId) {
    res.status(400).json({ error: 'stationId is required' });
    return;
  }

  const isFav = db.favorites.toggle(userId, stationId);
  const station = db.stations.findById(stationId);

  // Log analytics
  db.analytics.logEvent({
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId,
    eventType: 'FAVORITE',
    timestamp: new Date().toISOString(),
  });

  res.json({
    isFavorite: isFav,
    favoriteCount: station?.favoriteCount || 0,
  });
});

// Record Listening Session
listenerRouter.post('/history/session', (req, res) => {
  const { stationId, durationSeconds = 30, clientType = 'WEB', countryCode } = req.body;
  if (!stationId) {
    res.status(400).json({ error: 'stationId is required' });
    return;
  }

  const ip = req.ip || '127.0.0.1';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

  const session: ListeningSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId,
    // @ts-ignore
    userId: req.user?.id,
    ipHash,
    startedAt: new Date().toISOString(),
    durationSeconds: Math.max(1, parseInt(durationSeconds, 10) || 30),
    countryCode,
    clientType: clientType === 'ANDROID' || clientType === 'IOS' ? clientType : 'WEB',
  };

  db.sessions.create(session);
  db.stations.incrementPlayCount(stationId);

  db.analytics.logEvent({
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId,
    eventType: 'PLAY_START',
    timestamp: new Date().toISOString(),
    countryCode,
  });

  res.json({ success: true });
});

// Notifications
listenerRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const notifications = db.notifications.getByUserId(req.user!.id);
  res.json({ notifications });
});

listenerRouter.post('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  db.notifications.markRead(req.params.id, req.user!.id);
  res.json({ success: true });
});

// Following Radios
listenerRouter.get('/following', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const follows = db.follows.findByUser(userId);
  const followedStationIds = new Set(follows.map((f) => f.stationId));

  const stations = db.stations
    .getAll()
    .filter((s) => followedStationIds.has(s.id))
    .map((s) => ({
      ...s,
      category: db.categories.findById(s.categoryId),
      country: db.countries.findByCode(s.countryCode),
    }));

  res.json({ stations });
});

listenerRouter.post('/following/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { stationId } = req.body;
  if (!stationId) {
    res.status(400).json({ error: 'stationId is required' });
    return;
  }

  const isFollowing = db.follows.toggle(userId, stationId);

  if (isFollowing) {
    const station = db.stations.findById(stationId);
    const follower = db.users.findById(userId);
    if (station && station.ownerId) {
      db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: station.ownerId,
        title: 'New Channel Subscriber!',
        message: `${follower?.fullName || follower?.name || follower?.email || 'A listener'} subscribed to your channel "${station.name}".`,
        type: 'SYSTEM_ALERT',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json({ isFollowing });
});

// Status check: Is User following & favorited station
listenerRouter.get('/station-status/:stationId', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { stationId } = req.params;

  const isFavorite = db.favorites.isFavorite(userId, stationId);
  const isFollowing = db.follows.isFollowing(userId, stationId);

  res.json({ isFavorite, isFollowing });
});

// Recently Listened Radios
listenerRouter.get('/recently-listened', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const sessions = db.sessions.getAll().filter((s) => s.userId === userId);
  
  // Sort descending by startedAt and deduplicate stations
  const seen = new Set<string>();
  const recentStationIds: string[] = [];

  for (let i = sessions.length - 1; i >= 0; i--) {
    const stnId = sessions[i].stationId;
    if (!seen.has(stnId)) {
      seen.add(stnId);
      recentStationIds.push(stnId);
    }
  }

  const stations = recentStationIds
    .map((id) => db.stations.findById(id))
    .filter(Boolean)
    .map((s) => ({
      ...s!,
      category: db.categories.findById(s!.categoryId),
      country: db.countries.findByCode(s!.countryCode),
    }));

  res.json({ stations });
});

// Get Authenticated User Prayer Requests
listenerRouter.get('/prayers', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const prayers = db.prayerRequests.getByUserId(userId);
  res.json({ prayers });
});

// Get Authenticated User Donations & Giving History
listenerRouter.get('/donations', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const userEmail = user.email.toLowerCase().trim();
  const allDonations = db.donations.getAll();
  const donations = allDonations
    .filter(
      (d) =>
        d.userId === user.id ||
        d.donorUserId === user.id ||
        (d.donorEmail && d.donorEmail.toLowerCase().trim() === userEmail)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalAmountUsd = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  res.json({
    donations,
    totalDonationsCount: donations.length,
    totalAmountUsd,
  });
});

// Report Inappropriate Prayer Request
listenerRouter.post('/prayers/:id/report', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason, details } = req.body;

  if (!reason) {
    res.status(400).json({ error: 'Reason for report is required.' });
    return;
  }

  const prayer = db.prayerRequests.findById(id);
  if (!prayer) {
    res.status(404).json({ error: 'Prayer request not found.' });
    return;
  }

  const report = db.prayerReports.create({
    id: `pr_rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    prayerId: id,
    reporterUserId: req.user!.id,
    reporterEmail: req.user!.email,
    reason,
    details: details || '',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted. Our moderation team will review this prayer request.',
    report,
  });
});

// Playlists CRUD
listenerRouter.get('/playlists', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const userPlaylists = db.playlists.findByUser(userId).map((pl) => {
    const stations = pl.stationIds
      .map((id) => db.stations.findById(id))
      .filter(Boolean)
      .map((s) => ({
        ...s!,
        category: db.categories.findById(s!.categoryId),
        country: db.countries.findByCode(s!.countryCode),
      }));
    return {
      ...pl,
      stations,
    };
  });

  res.json({ playlists: userPlaylists });
});

listenerRouter.post('/playlists', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name, description, initialStationId } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Playlist name is required.' });
    return;
  }

  const newPlaylist = db.playlists.create({
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    name: name.trim(),
    description: description ? description.trim() : '',
    stationIds: initialStationId ? [initialStationId] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, playlist: newPlaylist });
});

listenerRouter.put('/playlists/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, description } = req.body;

  const existing = db.playlists.findById(id);
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Playlist not found or unauthorized.' });
    return;
  }

  const updated = db.playlists.update(id, {
    ...(name ? { name: name.trim() } : {}),
    ...(description !== undefined ? { description: description.trim() } : {}),
  });

  res.json({ success: true, playlist: updated });
});

listenerRouter.delete('/playlists/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const existing = db.playlists.findById(id);
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Playlist not found or unauthorized.' });
    return;
  }

  db.playlists.delete(id);
  res.json({ success: true, message: 'Playlist deleted.' });
});

listenerRouter.post('/playlists/:id/toggle-station', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { stationId } = req.body;

  if (!stationId) {
    res.status(400).json({ error: 'stationId is required.' });
    return;
  }

  const existing = db.playlists.findById(id);
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Playlist not found or unauthorized.' });
    return;
  }

  const added = db.playlists.toggleStation(id, stationId);
  const updated = db.playlists.findById(id);

  res.json({
    success: true,
    added,
    stationIds: updated?.stationIds || [],
  });
});

// Listener Premium Radio Subscriptions
listenerRouter.get('/premium-subscriptions', requireAuth, (req: AuthenticatedRequest, res) => {
  const listenerId = req.user!.id;
  const subs = db.premiumSubscriptions.findByListenerId(listenerId).map((s) => ({
    ...s,
    station: db.stations.findById(s.stationId),
  }));
  res.json({ subscriptions: subs });
});

// Listener Referral Dashboard
listenerRouter.get('/referrals', requireAuth, (req: AuthenticatedRequest, res) => {
  const listenerId = req.user!.id;
  const user = db.users.findById(listenerId);

  let referralCode = user?.referralCode;
  if (!referralCode) {
    referralCode = `REF_${listenerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;
    db.users.update(listenerId, { referralCode });
  }
  const referralLink = `${req.protocol}://${req.get('host')}?ref=${referralCode}`;

  const referralsList = db.referrals.findByReferrerId(listenerId);
  const commissionsList = db.referralCommissions.findByReferrerId(listenerId);
  const financial = db.getUserFinancialSummary(listenerId);

  res.json({
    referralCode,
    referralLink,
    referralsCount: referralsList.length,
    qualifiedCount: referralsList.filter((r) => r.status === 'QUALIFIED').length,
    financialSummary: financial,
    referrals: referralsList,
    commissions: commissionsList,
  });
});

// Listener Referral Withdrawal Request
listenerRouter.post('/withdrawals', requireAuth, (req: AuthenticatedRequest, res) => {
  const listenerId = req.user!.id;
  const {
    amount,
    currency = 'TZS',
    paymentMethod = 'MOBILE_MONEY',
    payoutMethod,
    payoutAccountName,
    payoutAccountNumber,
    payoutBankOrProvider,
    accountDetails,
    paymentDetails,
    notes,
  } = req.body;

  const numAmount = parseInt(amount, 10);
  const settings = db.settings.get();
  const minAmount = settings.minWithdrawalAmount || 20000;

  if (isNaN(numAmount) || numAmount < minAmount) {
    res.status(400).json({ error: `Minimum withdrawal amount is ${currency} ${minAmount.toLocaleString()}` });
    return;
  }

  const financial = db.getUserFinancialSummary(listenerId);
  if (numAmount > financial.availableBalance) {
    res.status(400).json({
      error: `Insufficient available referral balance. Your available balance is ${currency} ${financial.availableBalance.toLocaleString()}`,
    });
    return;
  }

  const finalMethod = payoutMethod || paymentMethod || 'MOBILE_MONEY';
  const finalAccountName = payoutAccountName || req.user!.fullName || req.user!.name || req.user!.email;
  const finalAccountNumber = payoutAccountNumber || accountDetails || paymentDetails || 'Primary Account';
  const finalBankOrProvider = payoutBankOrProvider || finalMethod;

  const feeRate = (settings.withdrawalFeePercentage ?? 1.0) / 100;
  const fee = Math.round(numAmount * feeRate);
  const netAmount = numAmount - fee;

  const request = db.withdrawalRequests.create({
    id: `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ownerId: listenerId,
    ownerName: finalAccountName,
    ownerEmail: req.user!.email,
    amount: numAmount,
    currency,
    fee,
    netAmount,
    status: 'PENDING',
    payoutMethod: finalMethod,
    payoutAccountName: finalAccountName,
    payoutAccountNumber: finalAccountNumber,
    payoutBankOrProvider: finalBankOrProvider,
    accountDetails: `${finalMethod}: ${finalAccountNumber} (${finalAccountName})`,
    notes,
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Notify admins
  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: 'usr_superadmin',
    title: `New Referral Payout Request (${currency} ${numAmount.toLocaleString()})`,
    message: `${req.user!.name} requested a referral payout of ${currency} ${numAmount.toLocaleString()} via ${finalMethod} (${finalAccountNumber}).`,
    type: 'SYSTEM_ALERT',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    message: 'Withdrawal request submitted successfully. Our finance team will review and disburse your funds within 24-48 business hours.',
    withdrawal: request,
  });
});


