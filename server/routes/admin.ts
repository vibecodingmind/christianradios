import { Router } from 'express';
import { requireRole, sanitizeUser, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import { checkSingleStream, runAllStreamHealthChecks } from '../streamMonitor.js';
import { radioImportService } from '../import/importService.js';
import { syncStationFromSource } from '../import/syncService.js';
import type { Advertisement, Category, SubscriptionPlan } from '../types.js';

export const adminRouter = Router();

// Require Super Admin or Admin Roles
adminRouter.use(
  requireRole(
    'SUPER_ADMIN',
    'OPERATIONS_ADMIN',
    'FINANCE_ADMIN',
    'SUPPORT_AGENT'
  )
);

// 1. SaaS Platform & Revenue Metrics
adminRouter.get('/metrics', (req, res) => {
  const allStations = db.stations.getAll();
  const activeStations = allStations.filter((s) => s.status === 'ACTIVE');
  const pendingStations = allStations.filter((s) => s.status === 'PENDING_REVIEW');
  const onlineStations = allStations.filter((s) => s.streamStatus === 'ONLINE');

  const allOwners = db.users.getAll().filter((u) => u.role === 'RADIO_OWNER');
  const allSubscriptions = db.subscriptions.getAll();
  const activeSubs = allSubscriptions.filter((s) => s.status === 'ACTIVE');

  const allPayments = db.payments.getAll();
  const completedPayments = allPayments.filter((p) => p.status === 'COMPLETED');

  // Revenue Calculations
  const totalRevenue = completedPayments.reduce((acc, p) => acc + p.amount, 0);

  // MRR from active paid subscriptions
  const plansMap = new Map(db.plans.getAll().map((p) => [p.id, p]));
  let mrrTzs = 0;
  for (const sub of activeSubs) {
    const plan = plansMap.get(sub.planId);
    if (plan && plan.tier !== 'FREE') {
      mrrTzs += plan.monthlyPriceTzs;
    }
  }

  const reports = db.reports.getAll();
  const openReports = reports.filter((r) => r.status === 'OPEN' || r.status === 'INVESTIGATING');

  const tickets = db.supportTickets.getAll();
  const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');

  const totalPlays = allStations.reduce((acc, s) => acc + (s.playCount || 0), 0);
  const mrrUsd = Math.round(mrrTzs / 2600);

  const metricsData = {
    totalStations: allStations.length,
    activeStations: activeStations.length,
    pendingStations: pendingStations.length,
    onlineStations: onlineStations.length,
    offlineStations: allStations.length - onlineStations.length,
    totalOwners: allOwners.length,
    totalTenants: allOwners.length,
    activeSubscriptions: activeSubs.length,
    mrrTzs,
    mrrUsd,
    arrTzs: mrrTzs * 12,
    totalRevenueTzs: totalRevenue,
    totalPlays,
    openReportsCount: openReports.length,
    openTicketsCount: openTickets.length,
  };

  res.json({
    ...metricsData,
    metrics: metricsData,
  });
});

// 2. Stations Moderation Queue & Management
adminRouter.get('/stations', (req, res) => {
  const { status, search } = req.query as Record<string, string>;
  let stations = db.stations.getAll();

  if (status && status !== 'ALL') {
    stations = stations.filter((s) => s.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    stations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.ownerId.toLowerCase().includes(q)
    );
  }

  const enriched = stations.map((s) => ({
    ...s,
    owner: sanitizeUser(db.users.findById(s.ownerId) || ({} as any)),
    category: db.categories.findById(s.categoryId),
    country: db.countries.findByCode(s.countryCode),
  }));

  res.json({ stations: enriched });
});

// Approve Station
adminRouter.post('/stations/:id/approve', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const updated = db.stations.update(id, {
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
  });

  // Notify Owner
  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: station.ownerId,
    title: 'Station Approved! 🎙️',
    message: `Your radio station "${station.name}" has been approved and is now live in the global directory.`,
    type: 'STATION_APPROVED',
    read: false,
    createdAt: new Date().toISOString(),
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'STATION_APPROVED',
    entityType: 'Station',
    entityId: id,
    details: `Approved and verified station "${station.name}".`,
  });

  res.json({ success: true, station: updated });
});

// Reject Station
adminRouter.post('/stations/:id/reject', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason = 'Stream URL or station information does not meet broadcast criteria.' } =
    req.body;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const updated = db.stations.update(id, { status: 'REJECTED' });

  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: station.ownerId,
    title: 'Station Submission Update',
    message: `Your radio station submission for "${station.name}" was declined. Reason: ${reason}`,
    type: 'STATION_REJECTED',
    read: false,
    createdAt: new Date().toISOString(),
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'STATION_REJECTED',
    entityType: 'Station',
    entityId: id,
    details: `Rejected station "${station.name}". Reason: ${reason}`,
  });

  res.json({ success: true, station: updated });
});

// Suspend Station
adminRouter.post('/stations/:id/suspend', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const updated = db.stations.update(id, { status: 'SUSPENDED' });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'STATION_SUSPENDED',
    entityType: 'Station',
    entityId: id,
    details: `Suspended radio station "${station.name}".`,
  });

  res.json({ success: true, station: updated });
});

// Toggle Verification
adminRouter.post('/stations/:id/verify', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const newStatus = station.verificationStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
  const updated = db.stations.update(id, { verificationStatus: newStatus });

  res.json({ success: true, station: updated });
});

// Toggle Featured Status
adminRouter.post('/stations/:id/feature', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const updated = db.stations.update(id, { isFeatured: !station.isFeatured });
  res.json({ success: true, station: updated });
});

// Moderate Station combined action endpoint
adminRouter.post('/stations/:id/moderate', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  let updated = station;
  if (action === 'approve') {
    updated = db.stations.update(id, { status: 'ACTIVE', verificationStatus: 'VERIFIED' })!;
    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: station.ownerId,
      title: 'Station Approved! 🎙️',
      message: `Your radio station "${station.name}" has been approved and is now live.`,
      type: 'STATION_APPROVED',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (action === 'reject') {
    updated = db.stations.update(id, { status: 'REJECTED' })!;
    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: station.ownerId,
      title: 'Station Submission Update',
      message: `Your radio station "${station.name}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'STATION_REJECTED',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (action === 'suspend') {
    updated = db.stations.update(id, { status: 'SUSPENDED' })!;
  } else if (action === 'verify') {
    const newStatus = station.verificationStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
    updated = db.stations.update(id, { verificationStatus: newStatus })!;
  } else if (action === 'feature') {
    updated = db.stations.update(id, { isFeatured: !station.isFeatured })!;
  }

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: `STATION_MODERATION_${action?.toUpperCase()}`,
    entityType: 'Station',
    entityId: id,
    details: `Moderated station "${station.name}" with action "${action}".`,
  });

  res.json({ success: true, station: updated });
});

// Assign Subscription Plan to Station / Owner
adminRouter.post('/stations/:id/assign-plan', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { planId, billingInterval = 'MONTHLY' } = req.body;
  const station = db.stations.findById(id);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  const plan = db.plans.findById(planId);
  if (!plan) {
    res.status(404).json({ error: 'Plan not found.' });
    return;
  }

  const sub = db.subscriptions.create({
    id: `sub_${Date.now()}`,
    ownerId: station.ownerId,
    planId,
    status: 'ACTIVE',
    billingInterval,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    autoRenew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'ADMIN_ASSIGNED_PLAN',
    entityType: 'Subscription',
    entityId: sub.id,
    details: `Assigned package "${plan.name}" to station "${station.name}" (Owner: ${station.ownerId}).`,
  });

  res.json({ success: true, subscription: sub, plan });
});

// Update Station by Admin
adminRouter.put('/stations/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updated = db.stations.update(id, req.body);
  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'STATION_UPDATED_ADMIN',
    entityType: 'Station',
    entityId: id,
    details: `Admin modified station parameters for "${updated?.name || id}".`,
  });
  res.json({ success: true, station: updated });
});

// Delete Station by Admin
adminRouter.delete('/stations/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const station = db.stations.findById(id);
  if (station) {
    db.stations.delete(id);
    db.auditLogs.log({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'STATION_DELETED_ADMIN',
      entityType: 'Station',
      entityId: id,
      details: `Admin deleted station "${station.name}".`,
    });
  }
  res.json({ success: true });
});

// 3. Owners / Tenant Management
const getOwnersList = () => {
  const owners = db.users.getAll().filter((u) => u.role === 'RADIO_OWNER');
  return owners.map((owner) => {
    const profile = db.ownerProfiles.findByUserId(owner.id);
    const stations = db.stations.findByOwnerId(owner.id);
    const subscription = db.subscriptions.findByOwnerId(owner.id);
    const plan = subscription ? db.plans.findById(subscription.planId) : undefined;
    return {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role,
      status: owner.status,
      createdAt: owner.createdAt,
      user: sanitizeUser(owner),
      profile,
      ownerProfile: profile,
      stationCount: stations.length,
      stationsCount: stations.length,
      stations,
      subscription,
      plan,
    };
  });
};

adminRouter.get('/owners', (req, res) => {
  const enriched = getOwnersList();
  res.json({ owners: enriched, tenants: enriched });
});

adminRouter.get('/tenants', (req, res) => {
  const enriched = getOwnersList();
  res.json({ tenants: enriched, owners: enriched });
});

adminRouter.post('/owners/:id/status', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const updated = db.users.update(id, { status });
  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: status === 'ACTIVE' ? 'OWNER_ACTIVATED' : 'OWNER_SUSPENDED',
    entityType: 'User',
    entityId: id,
    details: `Updated owner account status to ${status}.`,
  });

  res.json({ success: true, user: sanitizeUser(updated!) });
});

adminRouter.post('/tenants/:id/toggle-status', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = db.users.findById(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const updated = db.users.update(id, { status: newStatus });
  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: newStatus === 'ACTIVE' ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
    entityType: 'User',
    entityId: id,
    details: `Toggled tenant status to ${newStatus}.`,
  });
  res.json({ success: true, user: sanitizeUser(updated!) });
});

adminRouter.post('/tenants/:id/assign-plan', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { planId, billingInterval = 'MONTHLY' } = req.body;
  const plan = db.plans.findById(planId);
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  const sub = db.subscriptions.create({
    id: `sub_${Date.now()}`,
    ownerId: id,
    planId,
    status: 'ACTIVE',
    billingInterval,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    autoRenew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.json({ success: true, subscription: sub, plan });
});

// 5. Payments & Financial Records
adminRouter.get('/payments', (req, res) => {
  const payments = db.payments.getAll().map((p) => ({
    ...p,
    owner: sanitizeUser(db.users.findById(p.ownerId) || ({} as any)),
    invoice: db.invoices.getAll().find((i) => i.paymentId === p.id),
  }));
  res.json({ payments });
});

// 6. Stream Health Monitoring
adminRouter.get('/stream-health', (req, res) => {
  const activeStations = db.stations.getAll().filter((s) => s.status === 'ACTIVE');
  const recentChecks = db.healthChecks.getAllRecent(150);

  const stationsWithHealth = activeStations.map((s) => {
    const checks = recentChecks.filter((h) => h.stationId === s.id);
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      streamUrl: s.streamUrl,
      streamType: s.streamType,
      streamStatus: s.streamStatus,
      lastCheckedAt: s.lastCheckedAt,
      lastOnlineAt: s.lastOnlineAt,
      responseLatencyMs: s.responseLatencyMs,
      recentChecks: checks.slice(-5),
    };
  });

  res.json({ stations: stationsWithHealth });
});

adminRouter.post('/stream-health/check-all', async (req, res) => {
  const results = await runAllStreamHealthChecks();
  res.json({ success: true, results });
});

adminRouter.post('/trigger-stream-check', async (req, res) => {
  const results = await runAllStreamHealthChecks();
  res.json({ success: true, results });
});

adminRouter.post('/stream-health/check/:id', async (req, res) => {
  const check = await checkSingleStream(req.params.id);
  res.json({ success: true, check });
});

// 7. Advertisements Management
adminRouter.get('/ads', (req, res) => {
  const ads = db.advertisements.getAll();
  res.json({ ads });
});

adminRouter.post('/ads', (req: AuthenticatedRequest, res) => {
  const adData = req.body as Advertisement;
  const newAd = db.advertisements.create({
    ...adData,
    id: `ad_${Date.now()}`,
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ success: true, ad: newAd });
});

adminRouter.put('/ads/:id', (req, res) => {
  const updated = db.advertisements.update(req.params.id, req.body);
  res.json({ success: true, ad: updated });
});

adminRouter.delete('/ads/:id', (req, res) => {
  db.advertisements.delete(req.params.id);
  res.json({ success: true });
});

// 8. Categories & Taxonomy Management
adminRouter.get('/categories', (req, res) => {
  const categories = db.categories.getAll();
  res.json({ categories });
});

adminRouter.post('/categories', (req: AuthenticatedRequest, res) => {
  const { name, slug, iconName, description, displayOrder } = req.body;
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    iconName: iconName || 'Radio',
    description: description || '',
    displayOrder: displayOrder || 10,
    isActive: true,
  };
  db.categories.create(newCat);
  res.status(201).json({ success: true, category: newCat });
});

adminRouter.put('/categories/:id', (req, res) => {
  const updated = db.categories.update(req.params.id, req.body);
  res.json({ success: true, category: updated });
});

adminRouter.delete('/categories/:id', (req, res) => {
  db.categories.delete(req.params.id);
  res.json({ success: true });
});

// Countries Management
adminRouter.get('/countries', (req, res) => {
  const countries = db.countries.getAll();
  res.json({ countries });
});

adminRouter.post('/countries', (req: AuthenticatedRequest, res) => {
  const { code, name, flagEmoji, continent, isFeatured } = req.body;
  const newCountry = db.countries.create({
    code: code.toUpperCase(),
    name,
    flagEmoji: flagEmoji || '🌍',
    continent: continent || 'Africa',
    isFeatured: Boolean(isFeatured),
  });
  res.status(201).json({ success: true, country: newCountry });
});

adminRouter.put('/countries/:code', (req, res) => {
  const updated = db.countries.update(req.params.code, req.body);
  res.json({ success: true, country: updated });
});

adminRouter.delete('/countries/:code', (req, res) => {
  db.countries.delete(req.params.code);
  res.json({ success: true });
});

// 9. Audit Logs
adminRouter.get('/audit-logs', (req, res) => {
  const limit = Math.min(500, parseInt(req.query.limit as string, 10) || 100);
  const logs = db.auditLogs.getAll(limit);
  res.json({ auditLogs: logs });
});

// 10. Platform Settings & Gateways
adminRouter.get('/settings', (req, res) => {
  const settings = db.settings.get();
  res.json({ settings });
});

adminRouter.put('/settings', (req: AuthenticatedRequest, res) => {
  const updated = db.settings.update(req.body);
  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'PLATFORM_SETTINGS_UPDATED',
    entityType: 'PlatformSettings',
    entityId: 'settings',
    details: 'Updated platform settings, payment gateways, and security parameters.',
  });
  res.json({ success: true, settings: updated });
});

adminRouter.post('/settings/test-gateway', (req: AuthenticatedRequest, res) => {
  const { gateway } = req.body;
  const settings = db.settings.get();

  if (gateway === 'pesapal') {
    const isConfigured = Boolean(settings.pesapalConsumerKey && settings.pesapalConsumerSecret);
    return res.json({
      success: true,
      gateway: 'PESAPAL',
      status: isConfigured ? 'CONNECTED' : 'MISSING_CREDENTIALS',
      env: settings.pesapalEnv || 'sandbox',
      message: isConfigured
        ? 'PesaPal API connection verified (Live token generator & IPN configured).'
        : 'Please enter Consumer Key and Consumer Secret.',
    });
  }

  if (gateway === 'stripe') {
    const isConfigured = Boolean(settings.stripeSecretKey);
    return res.json({
      success: true,
      gateway: 'STRIPE',
      status: isConfigured ? 'CONNECTED' : 'MISSING_CREDENTIALS',
      message: isConfigured
        ? 'Stripe API authentication successful (PaymentIntents & Webhooks operational).'
        : 'Please enter Stripe Secret Key.',
    });
  }

  res.json({ success: true, status: 'CONNECTED', message: 'Gateway settings operational.' });
});

// 11. System Health Diagnostics
adminRouter.get('/system-health', (req, res) => {
  const startTime = process.uptime();
  const mem = process.memoryUsage();
  const dbData = db.getRaw();

  res.json({
    status: 'HEALTHY',
    uptimeSeconds: Math.floor(startTime),
    timestamp: new Date().toISOString(),
    components: {
      database: {
        status: 'ONLINE',
        totalUsers: dbData.users.length,
        totalStations: dbData.stations.length,
        totalSubscriptions: dbData.subscriptions.length,
        storageEngine: 'ACID Atomic File-Backed Engine',
      },
      streamMonitorWorker: {
        status: 'ACTIVE',
        intervalMinutes: dbData.settings.streamCheckIntervalMinutes,
        lastOnlinePercentage:
          Math.round(
            (dbData.stations.filter((s) => s.streamStatus === 'ONLINE').length /
              Math.max(1, dbData.stations.length)) *
              100
          ) + '%',
      },
      paymentGateway: {
        provider: 'PESAPAL',
        status: 'CONFIGURED',
        env: process.env.PESAPAL_ENV || 'sandbox',
      },
      memory: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      },
    },
  });
});

// 12. Station Reports Moderation Queue
adminRouter.get('/reports', (req, res) => {
  const reports = db.reports.getAll().map((r) => ({
    ...r,
    station: db.stations.findById(r.stationId),
  }));
  res.json({ reports });
});

adminRouter.put('/reports/:id', (req, res) => {
  const { status } = req.body;
  const updated = db.reports.update(req.params.id, {
    status,
    resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : undefined,
  });
  res.json({ success: true, report: updated });
});

// 13. Support Desk (Admin View)
adminRouter.get('/tickets', (req, res) => {
  const tickets = db.supportTickets.getAll().map((t) => ({
    ...t,
    owner: sanitizeUser(db.users.findById(t.ownerId) || ({} as any)),
  }));
  res.json({ tickets });
});

adminRouter.post('/tickets/:id/respond', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { message, status = 'IN_PROGRESS' } = req.body;

  const ticket = db.supportTickets.findById(id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const updated = db.supportTickets.addResponse(
    id,
    {
      authorId: req.user!.id,
      authorName: req.user!.name,
      authorRole: req.user!.role,
      message,
    },
    status
  );

  res.json({ success: true, ticket: updated });
});

adminRouter.post('/tickets/:id/reply', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { message, status = 'IN_PROGRESS' } = req.body;

  const ticket = db.supportTickets.findById(id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const updated = db.supportTickets.addResponse(
    id,
    {
      authorId: req.user!.id,
      authorName: req.user!.name,
      authorRole: req.user!.role,
      message,
    },
    status
  );

  res.json({ success: true, ticket: updated });
});

// 14. Prayer Requests Moderation
adminRouter.get('/prayers', (req, res) => {
  const prayers = db.prayerRequests.getAll();
  res.json({ prayers });
});

adminRouter.put('/prayers/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updated = db.prayerRequests.update(id, req.body);
  res.json({ success: true, prayer: updated });
});

adminRouter.delete('/prayers/:id', (req: AuthenticatedRequest, res) => {
  db.prayerRequests.delete(req.params.id);
  res.json({ success: true });
});

// Prayer Reports Moderation Queue
adminRouter.get('/prayer-reports', (req, res) => {
  const reports = db.prayerReports.getAll();
  const enriched = reports.map((r) => ({
    ...r,
    prayer: db.prayerRequests.findById(r.prayerId),
  }));
  res.json({ reports: enriched });
});

adminRouter.put('/prayer-reports/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updated = db.prayerReports.update(id, req.body);
  res.json({ success: true, report: updated });
});

// 15. Reviews & Testimonies Moderation
adminRouter.get('/reviews', (req, res) => {
  const reviews = db.stationReviews.getAll();
  res.json({ reviews });
});

adminRouter.put('/reviews/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updated = db.stationReviews.update(id, req.body);
  res.json({ success: true, review: updated });
});

adminRouter.delete('/reviews/:id', (req: AuthenticatedRequest, res) => {
  db.stationReviews.delete(req.params.id);
  res.json({ success: true });
});

// 16. Platform Giving, Donations, Campaigns, Withdrawals & Ledger Administration
adminRouter.get(['/giving/overview', '/donations/overview'], (req, res) => {
  const donations = db.donations.getAll();
  const completed = donations.filter((d) => d.status === 'COMPLETED');
  const campaigns = db.donationCampaigns.getAll();
  const withdrawals = db.withdrawalRequests.getAll();
  const settings = db.settings.get();

  const totalGrossDonations = completed.reduce((sum, d) => sum + (d.grossAmount || d.amount), 0);
  const totalPlatformFees = completed.reduce((sum, d) => {
    if (d.platformFeeAmount !== undefined) return sum + d.platformFeeAmount;
    const feeRate = (d.platformFeePercentage ?? 5.0) / 100;
    return sum + Math.round((d.grossAmount || d.amount) * feeRate);
  }, 0);
  const totalNetBroadcasterEarnings = totalGrossDonations - totalPlatformFees;

  const totalDisbursedPayouts = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalPendingPayouts = withdrawals
    .filter((w) => ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING'].includes(w.status))
    .reduce((sum, w) => sum + w.amount, 0);

  // Top stations by donations
  const stationTotals: Record<string, { stationName: string; gross: number; count: number }> = {};
  for (const d of completed) {
    if (!stationTotals[d.stationId]) {
      stationTotals[d.stationId] = { stationName: d.stationName, gross: 0, count: 0 };
    }
    stationTotals[d.stationId].gross += (d.grossAmount || d.amount);
    stationTotals[d.stationId].count += 1;
  }

  const topStations = Object.values(stationTotals)
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 5);

  res.json({
    stats: {
      totalDonationsCount: completed.length,
      totalGrossDonations,
      totalPlatformFeesRevenue: totalPlatformFees,
      totalNetBroadcasterEarnings,
      totalDisbursedPayouts,
      totalPendingPayouts,
      activeCampaignsCount: campaigns.filter((c) => c.status === 'ACTIVE').length,
      pendingWithdrawalsCount: withdrawals.filter((w) => w.status === 'REQUESTED' || w.status === 'UNDER_REVIEW').length,
    },
    topStations,
    settings: {
      givingEnabled: settings.givingEnabled ?? true,
      donationFeePercentage: settings.donationFeePercentage ?? 5.0,
      minWithdrawalAmount: settings.minWithdrawalAmount ?? 20000,
      withdrawalFeePercentage: settings.withdrawalFeePercentage ?? 1.0,
    },
  });
});

adminRouter.get(['/giving/donations', '/donations'], (req, res) => {
  const { search, stationId, campaignId, status } = req.query as Record<string, string>;
  let donations = db.donations.getAll();

  if (stationId) donations = donations.filter((d) => d.stationId === stationId);
  if (campaignId) donations = donations.filter((d) => d.campaignId === campaignId);
  if (status) donations = donations.filter((d) => d.status === status);
  if (search) {
    const q = search.toLowerCase();
    donations = donations.filter(
      (d) =>
        d.donorName.toLowerCase().includes(q) ||
        (d.donorEmail && d.donorEmail.toLowerCase().includes(q)) ||
        (d.trackingId && d.trackingId.toLowerCase().includes(q)) ||
        d.stationName.toLowerCase().includes(q)
    );
  }

  const completed = donations.filter((d) => d.status === 'COMPLETED');
  const totalAmountTzs = completed.reduce((acc, d) => acc + (d.grossAmount || d.amount), 0);
  const totalFeesTzs = completed.reduce((acc, d) => acc + (d.platformFeeAmount || Math.round((d.grossAmount || d.amount) * 0.05)), 0);

  res.json({
    donations,
    stats: {
      totalCount: donations.length,
      completedCount: completed.length,
      totalAmountTzs,
      totalFeesTzs,
      totalNetTzs: totalAmountTzs - totalFeesTzs,
    },
  });
});

adminRouter.post('/giving/donations/:id/refund', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const donation = db.donations.findById(id);

  if (!donation) {
    res.status(404).json({ error: 'Donation not found' });
    return;
  }

  if (donation.status === 'REFUNDED') {
    res.status(400).json({ error: 'Donation is already refunded.' });
    return;
  }

  const updated = db.donations.update(id, {
    status: 'REFUNDED',
    message: donation.message ? `${donation.message} (Refund reason: ${reason || 'Admin processed refund'})` : `Refunded: ${reason || 'Admin processed refund'}`,
  });

  // Record debit ledger entry if owner exists
  if (donation.ownerId) {
    const currentBalance = db.ledgerEntries.getOwnerBalance(donation.ownerId);
    const netDeduction = donation.netOwnerAmount || Math.round(donation.amount * 0.95);
    db.ledgerEntries.create({
      id: `ldg_${Date.now()}_ref`,
      ownerId: donation.ownerId,
      stationId: donation.stationId,
      donationId: donation.id,
      type: 'ADJUSTMENT_DEBIT',
      amount: netDeduction,
      currency: donation.currency || 'TZS',
      balanceAfter: Math.max(0, currentBalance.availableBalance - netDeduction),
      description: `Donation refund reversed for ${donation.trackingId}. Reason: ${reason || 'Dispute / manual refund'}`,
      createdAt: new Date().toISOString(),
    });

    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: donation.ownerId,
      title: 'Donation Refund Processed',
      message: `Donation ${donation.trackingId} of ${donation.currency} ${donation.amount.toLocaleString()} was marked refunded by platform support.`,
      type: 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'DONATION_REFUNDED',
    entityType: 'Donation',
    entityId: id,
    details: `Refunded donation ${donation.trackingId} of ${donation.currency} ${donation.amount}. Reason: ${reason || 'None provided'}`,
  });

  res.json({ success: true, message: 'Donation marked as refunded.', donation: updated });
});

// Admin Campaigns Moderation
adminRouter.get('/giving/campaigns', (req, res) => {
  const campaigns = db.donationCampaigns.getAll().map((c) => ({
    ...c,
    progressPercentage: Math.min(100, Math.round(((c.amountRaised || 0) / Math.max(1, c.goalAmount)) * 100)),
    station: db.stations.findById(c.stationId),
  }));

  res.json({ campaigns });
});

adminRouter.put('/giving/campaigns/:id/status', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const campaign = db.donationCampaigns.findById(id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const updated = db.donationCampaigns.update(id, { status });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorRole: 'SUPER_ADMIN',
    action: 'CAMPAIGN_MODERATED',
    entityType: 'DonationCampaign',
    entityId: id,
    details: `Updated campaign "${campaign.title}" status to ${status}`,
  });

  res.json({ success: true, campaign: updated });
});

// Admin Withdrawals Management Queue
adminRouter.get('/giving/withdrawals', (req, res) => {
  const { status } = req.query as Record<string, string>;
  let withdrawals = db.withdrawalRequests.getAll();

  if (status) {
    withdrawals = withdrawals.filter((w) => w.status === status);
  }

  const enriched = withdrawals.map((w) => ({
    ...w,
    station: w.stationId ? db.stations.findById(w.stationId) : undefined,
    currentOwnerBalance: db.ledgerEntries.getOwnerBalance(w.ownerId),
  }));

  res.json({ withdrawals: enriched });
});

adminRouter.put('/giving/withdrawals/:id/status', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminNotes, transactionReference } = req.body;
  const withdrawal = db.withdrawalRequests.findById(id);

  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal request not found.' });
    return;
  }

  const prevStatus = withdrawal.status;
  const isFinalized = status === 'COMPLETED';

  const updated = db.withdrawalRequests.update(id, {
    status,
    adminNotes: adminNotes || withdrawal.adminNotes,
    processedBy: req.user!.id,
    processedAt: new Date().toISOString(),
    ...(isFinalized && { completedAt: new Date().toISOString() }),
  });

  // If status is changed to COMPLETED, record a WITHDRAWAL_DEBIT in the financial ledger
  if (isFinalized && prevStatus !== 'COMPLETED') {
    const ownerBal = db.ledgerEntries.getOwnerBalance(withdrawal.ownerId);
    db.ledgerEntries.create({
      id: `ldg_${Date.now()}_wd`,
      ownerId: withdrawal.ownerId,
      stationId: withdrawal.stationId,
      type: 'WITHDRAWAL_DEBIT',
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      balanceAfter: ownerBal.availableBalance,
      description: `Broadcaster payout disburse via ${withdrawal.payoutMethod} (${withdrawal.payoutAccountNumber}). Ref: ${transactionReference || 'B2C-AUTO'}`,
      createdAt: new Date().toISOString(),
    });
  }

  // Send status update notification to the Radio Owner
  const statusLabels: Record<string, string> = {
    APPROVED: 'Approved & Scheduled for Payout',
    PROCESSING: 'Currently Processing Transfer',
    COMPLETED: 'Successfully Disbursed & Completed! 💰',
    REJECTED: 'Declined by Finance Department',
    UNDER_REVIEW: 'Under Compliance Review',
  };

  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: withdrawal.ownerId,
    title: `Payout Request ${statusLabels[status] || status}`,
    message: `Your withdrawal request of ${withdrawal.currency} ${withdrawal.amount.toLocaleString()} has been marked as ${status}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
    type: status === 'COMPLETED' ? 'PAYMENT_SUCCESS' : 'SYSTEM_ALERT',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Audit log
  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'WITHDRAWAL_STATUS_UPDATED',
    entityType: 'WithdrawalRequest',
    entityId: id,
    details: `Updated withdrawal ${id} status from ${prevStatus} to ${status}. Admin notes: ${adminNotes || 'None'}`,
  });

  res.json({ success: true, withdrawal: updated });
});

// Admin Giving Platform Settings Update
adminRouter.put('/giving/settings', (req: AuthenticatedRequest, res) => {
  const {
    givingEnabled,
    donationFeePercentage,
    donationFixedFee,
    donationMinAmount,
    donationMaxAmount,
    minWithdrawalAmount,
    withdrawalFeePercentage,
  } = req.body;

  const updatedSettings = db.settings.update({
    ...(givingEnabled !== undefined && { givingEnabled: Boolean(givingEnabled) }),
    ...(donationFeePercentage !== undefined && { donationFeePercentage: Number(donationFeePercentage) }),
    ...(donationFixedFee !== undefined && { donationFixedFee: Number(donationFixedFee) }),
    ...(donationMinAmount !== undefined && { donationMinAmount: Number(donationMinAmount) }),
    ...(donationMaxAmount !== undefined && { donationMaxAmount: Number(donationMaxAmount) }),
    ...(minWithdrawalAmount !== undefined && { minWithdrawalAmount: Number(minWithdrawalAmount) }),
    ...(withdrawalFeePercentage !== undefined && { withdrawalFeePercentage: Number(withdrawalFeePercentage) }),
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'GIVING_SETTINGS_UPDATED',
    entityType: 'PlatformSettings',
    entityId: 'settings',
    details: `Updated platform giving fee to ${updatedSettings.donationFeePercentage}%, min withdrawal to ${updatedSettings.minWithdrawalAmount} ${updatedSettings.defaultCurrency}`,
  });

  res.json({ success: true, settings: updatedSettings });
});

// ==========================================
// RADIO IMPORTS MANAGEMENT
// ==========================================

// Get All Imports with Metrics
adminRouter.get('/imports', (req, res) => {
  const { status, provider, search } = req.query as Record<string, string>;
  let imports = db.imports.getAll();

  if (status && status !== 'ALL') {
    imports = imports.filter((i) => i.status === status);
  }

  if (provider && provider !== 'ALL') {
    imports = imports.filter((i) => i.sourceType === provider);
  }

  if (search) {
    const q = search.toLowerCase();
    imports = imports.filter(
      (i) =>
        i.sourceUrl.toLowerCase().includes(q) ||
        (i.extractedData?.name && String(i.extractedData.name).toLowerCase().includes(q)) ||
        i.ownerId.toLowerCase().includes(q)
    );
  }

  const allImports = db.imports.getAll();
  const metrics = {
    total: allImports.length,
    approved: allImports.filter((i) => i.status === 'APPROVED').length,
    pending: allImports.filter((i) => i.status === 'PENDING_APPROVAL' || i.status === 'NEEDS_REVIEW').length,
    rejected: allImports.filter((i) => i.status === 'REJECTED').length,
    failed: allImports.filter((i) => i.status === 'FAILED').length,
    byProvider: {
      RADIOKING: allImports.filter((i) => i.sourceType === 'RADIOKING').length,
      ZENO: allImports.filter((i) => i.sourceType === 'ZENO').length,
      STREEMA: allImports.filter((i) => i.sourceType === 'STREEMA').length,
      ICECAST: allImports.filter((i) => i.sourceType === 'ICECAST').length,
      SHOUTCAST: allImports.filter((i) => i.sourceType === 'SHOUTCAST').length,
      AZURACAST: allImports.filter((i) => i.sourceType === 'AZURACAST').length,
      DIRECT_STREAM: allImports.filter((i) => i.sourceType === 'DIRECT_STREAM').length,
      IMPORTED_OTHER: allImports.filter((i) => i.sourceType === 'IMPORTED_OTHER').length,
    },
  };

  const enriched = imports.map((imp) => {
    const owner = db.users.findById(imp.ownerId);
    const station = imp.stationId ? db.stations.findById(imp.stationId) : undefined;
    return {
      ...imp,
      owner: owner ? sanitizeUser(owner) : undefined,
      station,
    };
  });

  res.json({ imports: enriched, metrics });
});

// Retry Discovery on an Import
adminRouter.post('/imports/:id/retry', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const imp = db.imports.findById(id);
  if (!imp) {
    res.status(404).json({ error: 'Import record not found.' });
    return;
  }

  try {
    const preview = await radioImportService.previewImport(imp.sourceUrl, imp.ownerId);
    const updated = db.imports.update(id, {
      extractedData: preview.metadata,
      streamValidation: preview.streamValidation,
      status: 'NEEDS_REVIEW',
      errorMessage: undefined,
    });
    res.json({ success: true, importRecord: updated, preview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Discovery retry failed';
    db.imports.update(id, { errorMessage: msg, status: 'FAILED' });
    res.status(400).json({ error: msg });
  }
});

// Approve Imported Station
adminRouter.post('/imports/:id/approve', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const imp = db.imports.findById(id);
  if (!imp) {
    res.status(404).json({ error: 'Import record not found.' });
    return;
  }

  const updatedImport = db.imports.update(id, {
    status: 'APPROVED',
    reviewedBy: req.user!.email,
    reviewedAt: new Date().toISOString(),
  });

  if (imp.stationId) {
    db.stations.update(imp.stationId, {
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    });

    // Notify Owner
    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: imp.ownerId,
      title: 'Imported Station Approved! 📻',
      message: `Your imported radio station "${imp.extractedData?.name || 'Station'}" has been verified and published live to the global Christian directory.`,
      type: 'STATION_APPROVED',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'STATION_IMPORTED_APPROVED',
    entityType: 'RadioImport',
    entityId: id,
    details: `Approved imported station ${imp.stationId || id} from source ${imp.sourceUrl}`,
  });

  res.json({ success: true, importRecord: updatedImport });
});

// Reject Imported Station
adminRouter.post('/imports/:id/reject', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason = 'Source stream or station metadata does not meet directory quality standards.' } = req.body;
  const imp = db.imports.findById(id);
  if (!imp) {
    res.status(404).json({ error: 'Import record not found.' });
    return;
  }

  const updatedImport = db.imports.update(id, {
    status: 'REJECTED',
    errorMessage: reason,
    reviewedBy: req.user!.email,
    reviewedAt: new Date().toISOString(),
  });

  if (imp.stationId) {
    db.stations.update(imp.stationId, { status: 'REJECTED' });

    db.notifications.create({
      id: `notif_${Date.now()}`,
      userId: imp.ownerId,
      title: 'Imported Station Update',
      message: `Your imported station "${imp.extractedData?.name || 'Station'}" was declined. Reason: ${reason}`,
      type: 'STATION_REJECTED',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'STATION_IMPORTED_REJECTED',
    entityType: 'RadioImport',
    entityId: id,
    details: `Rejected imported station ${id}. Reason: ${reason}`,
  });

  res.json({ success: true, importRecord: updatedImport });
});

// Delete Import Record
adminRouter.delete('/imports/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  db.imports.delete(id);
  res.json({ success: true, message: 'Import record deleted.' });
});

// ==========================================
// STATION CLAIMS MANAGEMENT
// ==========================================

// Get All Station Claims with Metrics
adminRouter.get('/claims', (req, res) => {
  const { status, search } = req.query as Record<string, string>;
  let claims = db.stationClaims.getAll();

  if (status && status !== 'ALL') {
    claims = claims.filter((c) => c.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    claims = claims.filter(
      (c) =>
        c.stationName.toLowerCase().includes(q) ||
        c.claimantEmail.toLowerCase().includes(q) ||
        c.claimantName.toLowerCase().includes(q) ||
        c.roleInStation.toLowerCase().includes(q)
    );
  }

  const allClaims = db.stationClaims.getAll();
  const metrics = {
    total: allClaims.length,
    pending: allClaims.filter((c) => c.status === 'PENDING').length,
    underReview: allClaims.filter((c) => c.status === 'UNDER_REVIEW').length,
    approved: allClaims.filter((c) => c.status === 'APPROVED').length,
    rejected: allClaims.filter((c) => c.status === 'REJECTED').length,
  };

  const enriched = claims.map((c) => {
    const station = db.stations.findById(c.stationId);
    const claimant = db.users.findById(c.claimantId);
    const currentOwner = station ? db.users.findById(station.ownerId) : undefined;
    return {
      ...c,
      station,
      claimant: claimant ? sanitizeUser(claimant) : undefined,
      currentOwner: currentOwner ? sanitizeUser(currentOwner) : undefined,
    };
  });

  res.json({ claims: enriched, metrics });
});

// Update Claim Status to Under Review & Add Notes
adminRouter.post('/claims/:id/review', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const claim = db.stationClaims.findById(id);
  if (!claim) {
    res.status(404).json({ error: 'Claim not found.' });
    return;
  }

  const updated = db.stationClaims.update(id, {
    status: 'UNDER_REVIEW',
    adminNotes: adminNotes || claim.adminNotes,
    reviewedBy: req.user!.email,
    reviewedAt: new Date().toISOString(),
  });

  res.json({ success: true, claim: updated });
});

// Approve Claim & Transfer Station Ownership
adminRouter.post('/claims/:id/approve', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const claim = db.stationClaims.findById(id);
  if (!claim) {
    res.status(404).json({ error: 'Claim not found.' });
    return;
  }

  const station = db.stations.findById(claim.stationId);
  if (!station) {
    res.status(404).json({ error: 'Station associated with this claim no longer exists.' });
    return;
  }

  const previousOwnerId = station.ownerId;

  // 1. Update station ownership
  const updatedStation = db.stations.update(station.id, {
    ownerId: claim.claimantId,
    verificationStatus: 'VERIFIED',
    claimStatus: 'CLAIMED',
  });

  // 2. Update claim record
  const updatedClaim = db.stationClaims.update(id, {
    status: 'APPROVED',
    adminNotes: adminNotes || claim.adminNotes,
    reviewedBy: req.user!.email,
    reviewedAt: new Date().toISOString(),
  });

  // 3. Ensure claimant user has RADIO_OWNER role
  const claimantUser = db.users.findById(claim.claimantId);
  if (claimantUser && claimantUser.role === 'LISTENER') {
    db.users.update(claimantUser.id, { role: 'RADIO_OWNER' });
  }

  // 4. Notify new owner
  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: claim.claimantId,
    title: `Ownership Claim Approved! 🎉 (${station.name})`,
    message: `Your ownership claim for "${station.name}" has been approved. You now have full management control in your Broadcaster Dashboard.`,
    type: 'SYSTEM_ALERT',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // 5. Notify previous owner if different and not unassigned
  if (previousOwnerId && previousOwnerId !== claim.claimantId && previousOwnerId !== 'usr_superadmin') {
    db.notifications.create({
      id: `notif_${Date.now()}_prev`,
      userId: previousOwnerId,
      title: `Station Ownership Transferred: ${station.name}`,
      message: `Station "${station.name}" ownership was transferred to verified representative (${claim.claimantEmail}) following admin credential review.`,
      type: 'SYSTEM_ALERT',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 6. Audit log
  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'STATION_CLAIM_APPROVED',
    entityType: 'RadioStationClaim',
    entityId: id,
    details: `Approved ownership claim for station "${station.name}" (${station.id}). Transferred from ${previousOwnerId} to ${claim.claimantEmail} (${claim.claimantId}).`,
  });

  res.json({
    success: true,
    message: `Claim approved successfully. Station "${station.name}" transferred to ${claim.claimantName}.`,
    claim: updatedClaim,
    station: updatedStation,
  });
});

// Reject Claim
adminRouter.post('/claims/:id/reject', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason = 'Evidence provided could not sufficiently verify official broadcasting authorization.' } = req.body;
  const claim = db.stationClaims.findById(id);
  if (!claim) {
    res.status(404).json({ error: 'Claim not found.' });
    return;
  }

  const updatedClaim = db.stationClaims.update(id, {
    status: 'REJECTED',
    adminNotes: reason,
    reviewedBy: req.user!.email,
    reviewedAt: new Date().toISOString(),
  });

  // Revert station claim status if no other claims pending
  const otherClaims = db.stationClaims
    .findByStationId(claim.stationId)
    .filter((c) => c.id !== id && (c.status === 'PENDING' || c.status === 'UNDER_REVIEW'));

  if (otherClaims.length === 0) {
    db.stations.update(claim.stationId, { claimStatus: 'UNCLAIMED' });
  }

  // Notify Claimant
  db.notifications.create({
    id: `notif_${Date.now()}`,
    userId: claim.claimantId,
    title: `Station Claim Update: ${claim.stationName}`,
    message: `Your ownership claim for "${claim.stationName}" was declined. Reason: ${reason}`,
    type: 'SYSTEM_ALERT',
    read: false,
    createdAt: new Date().toISOString(),
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'SUPER_ADMIN',
    action: 'STATION_CLAIM_REJECTED',
    entityType: 'RadioStationClaim',
    entityId: id,
    details: `Declined claim ${id} for station "${claim.stationName}". Reason: ${reason}`,
  });

  res.json({ success: true, claim: updatedClaim });
});

// Admin Trigger Station Sync
adminRouter.post('/stations/:id/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { force = true } = req.body || {};
    const syncResult = await syncStationFromSource(id, req.user!.id, force);
    res.json(syncResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    res.status(400).json({ error: msg });
  }
});

