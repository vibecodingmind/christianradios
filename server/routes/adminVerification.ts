import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { requireRole, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import type { KYCStatus, StationApplicationStatus, LicenceVerificationStatus, DocumentStatus } from '../types.js';

export const adminVerificationRouter = Router();

// Protect all admin verification routes: Must be SUPER_ADMIN
adminVerificationRouter.use(requireRole('SUPER_ADMIN'));

const DOCUMENTS_DIR = path.join(process.cwd(), 'uploads', 'documents');

// 1. Overview Metrics & Statistics
adminVerificationRouter.get('/metrics', (req: AuthenticatedRequest, res) => {
  const kycApps = db.kycApplications.getAll();
  const stationApps = db.stationApplications.getAll();
  const stations = db.stations.getAll();

  const pendingKYC = kycApps.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const approvedOwners = kycApps.filter((a) => a.status === 'APPROVED').length;
  const pendingStations = stationApps.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const approvedStations = stations.filter((s) => s.status === 'APPROVED' || s.status === 'ACTIVE').length;
  const rejectedApplications = kycApps.filter((a) => a.status === 'REJECTED').length + stationApps.filter((a) => a.status === 'REJECTED').length;
  const suspendedAccounts = kycApps.filter((a) => a.status === 'SUSPENDED').length + stations.filter((s) => s.status === 'SUSPENDED').length;

  res.json({
    pendingKYC,
    approvedOwners,
    pendingStations,
    approvedStations,
    rejectedApplications,
    suspendedAccounts,
    totalAuditLogs: db.auditLogs.getAll(5000).length,
  });
});

// 2. List KYC Applications with Filters & Pagination
adminVerificationRouter.get('/kyc-applications', (req: AuthenticatedRequest, res) => {
  const { status, type, search, page = '1', limit = '20' } = req.query as Record<string, string>;

  let apps = db.kycApplications.getAll();

  if (status) {
    apps = apps.filter((a) => a.status === status);
  }

  if (type) {
    apps = apps.filter((a) => a.verificationType === type);
  }

  if (search) {
    const q = search.toLowerCase();
    apps = apps.filter(
      (a) =>
        a.fullName?.toLowerCase().includes(q) ||
        a.organizationName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q)
    );
  }

  // Sort by most recent submission
  apps.sort((a, b) => (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt));

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const total = apps.length;
  const paginated = apps.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Attach user details and document summaries
  const enriched = paginated.map((app) => {
    const owner = db.users.findById(app.userId);
    const documents = db.kycDocuments.findByApplicationId(app.id);
    const ownerStations = db.stations.findByOwnerId(app.userId);

    return {
      ...app,
      ownerEmail: owner?.email,
      ownerName: owner?.name || owner?.fullName,
      documentsCount: documents.length,
      verifiedDocumentsCount: documents.filter((d) => d.status === 'VERIFIED').length,
      stationsCount: ownerStations.length,
      documents: documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        status: d.status,
        uploadedAt: d.uploadedAt,
      })),
    };
  });

  res.json({
    applications: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// 3. Get Single KYC Application Details
adminVerificationRouter.get('/kyc-applications/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const app = db.kycApplications.findById(id);

  if (!app) {
    res.status(404).json({ error: 'KYC Application not found.' });
    return;
  }

  const owner = db.users.findById(app.userId);
  const documents = db.kycDocuments.findByApplicationId(app.id);
  const ownerStations = db.stations.findByOwnerId(app.userId);

  res.json({
    application: app,
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
          status: owner.status,
          createdAt: owner.createdAt,
        }
      : null,
    documents,
    stations: ownerStations,
  });
});

// 4. Secure Document Viewing Endpoint (Access-Controlled)
adminVerificationRouter.get('/documents/:docId/view', (req: AuthenticatedRequest, res) => {
  const { docId } = req.params;
  const doc = db.kycDocuments.findById(docId);

  if (!doc) {
    res.status(404).send('Document record not found.');
    return;
  }

  const filePath = path.join(DOCUMENTS_DIR, doc.fileReference);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('Document file not found on secure storage.');
    return;
  }

  // Audit log document viewing
  db.auditLogs.log({
    actorId: req.user!.id,
    actorName: req.user!.name || req.user!.email,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'DOCUMENT_VIEWED',
    targetType: 'DOCUMENT',
    targetId: doc.id,
    details: { fileName: doc.fileName, documentType: doc.documentType },
  });

  res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
  fs.createReadStream(filePath).pipe(res);
});

// 5. Admin KYC Application Action (Approve, Request Changes, Reject, Suspend)
adminVerificationRouter.post('/kyc-applications/:id/action', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action, reason, adminNotes } = req.body;

  const app = db.kycApplications.findById(id);
  if (!app) {
    res.status(404).json({ error: 'KYC Application not found.' });
    return;
  }

  let newStatus: KYCStatus;

  if (action === 'APPROVE') {
    newStatus = 'APPROVED';
  } else if (action === 'REQUEST_CHANGES') {
    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'A reason must be provided when requesting changes.' });
      return;
    }
    newStatus = 'CHANGES_REQUIRED';
  } else if (action === 'REJECT') {
    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'A reason must be provided when rejecting an application.' });
      return;
    }
    newStatus = 'REJECTED';
  } else if (action === 'SUSPEND') {
    newStatus = 'SUSPENDED';
  } else {
    res.status(400).json({ error: 'Invalid verification action.' });
    return;
  }

  const updatedApp = db.kycApplications.update(app.id, {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user!.id,
    rejectionReason: action === 'REJECT' ? reason : undefined,
    changesRequestedReason: action === 'REQUEST_CHANGES' ? reason : undefined,
    adminNotes: adminNotes || undefined,
  });

  // Update Owner Profile status accordingly
  let ownerVerificationStatus = 'UNVERIFIED';
  if (newStatus === 'APPROVED') ownerVerificationStatus = 'VERIFIED';
  if (newStatus === 'REJECTED') ownerVerificationStatus = 'REJECTED';
  if (newStatus === 'CHANGES_REQUIRED') ownerVerificationStatus = 'PENDING';
  if (newStatus === 'SUSPENDED') ownerVerificationStatus = 'REJECTED';

  db.ownerProfiles.update(app.userId, {
    verificationStatus: ownerVerificationStatus as any,
    verified: newStatus === 'APPROVED',
  });

  // Audit log action
  db.auditLogs.log({
    actorId: req.user!.id,
    actorName: req.user!.name || req.user!.email,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: `KYC_${action}`,
    targetType: 'KYC_APPLICATION',
    targetId: app.id,
    details: { ownerUserId: app.userId, verificationType: app.verificationType },
    reason,
  });

  res.json({ application: updatedApp });
});

// 6. Admin Document Action (Verify, Invalid, Request Replacement)
adminVerificationRouter.post('/documents/:docId/action', (req: AuthenticatedRequest, res) => {
  const { docId } = req.params;
  const { action, reviewNotes } = req.body;

  const doc = db.kycDocuments.findById(docId);
  if (!doc) {
    res.status(404).json({ error: 'KYC Document not found.' });
    return;
  }

  let docStatus: DocumentStatus = 'PENDING';
  if (action === 'VERIFY') docStatus = 'VERIFIED';
  if (action === 'INVALID') docStatus = 'INVALID';
  if (action === 'REQUEST_REPLACEMENT') docStatus = 'CHANGES_REQUESTED';

  const updatedDoc = db.kycDocuments.update(doc.id, {
    status: docStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user!.id,
    reviewNotes: reviewNotes || undefined,
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorName: req.user!.name || req.user!.email,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: `DOCUMENT_${action}`,
    targetType: 'DOCUMENT',
    targetId: doc.id,
    reason: reviewNotes,
  });

  res.json({ document: updatedDoc });
});

// 7. List Station Applications
adminVerificationRouter.get('/station-applications', (req: AuthenticatedRequest, res) => {
  const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;

  let apps = db.stationApplications.getAll();

  if (status) {
    apps = apps.filter((a) => a.status === status);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const enriched = apps.map((app) => {
    const station = db.stations.findById(app.stationId);
    const owner = db.users.findById(app.ownerId);
    const ownerProfile = db.ownerProfiles.findByUserId(app.ownerId);

    return {
      ...app,
      stationName: station?.name,
      stationSlug: station?.slug,
      stationStreamUrl: station?.streamUrl,
      stationCountryCode: station?.countryCode,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      ownerVerificationStatus: ownerProfile?.verificationStatus || 'UNVERIFIED',
    };
  });

  if (search) {
    const q = search.toLowerCase();
    const filtered = enriched.filter(
      (a) =>
        a.stationName?.toLowerCase().includes(q) ||
        a.ownerName?.toLowerCase().includes(q) ||
        a.ownerEmail?.toLowerCase().includes(q) ||
        a.licenceNumber?.toLowerCase().includes(q)
    );
    res.json({
      applications: filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
    });
    return;
  }

  res.json({
    applications: enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: enriched.length,
      totalPages: Math.ceil(enriched.length / limitNum),
    },
  });
});

// 8. Admin Station Application Action (Approve Station, Request Changes, Reject, Suspend)
adminVerificationRouter.post('/station-applications/:id/action', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { action, reason, adminNotes } = req.body;

  const app = db.stationApplications.findById(id);
  if (!app) {
    res.status(404).json({ error: 'Station Application not found.' });
    return;
  }

  let newStatus: StationApplicationStatus;

  if (action === 'APPROVE_STATION' || action === 'APPROVE') {
    newStatus = 'APPROVED';
  } else if (action === 'REQUEST_CHANGES') {
    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'A reason must be provided when requesting changes.' });
      return;
    }
    newStatus = 'CHANGES_REQUIRED';
  } else if (action === 'REJECT') {
    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'A reason must be provided when rejecting a station application.' });
      return;
    }
    newStatus = 'REJECTED';
  } else if (action === 'SUSPEND') {
    newStatus = 'SUSPENDED';
  } else {
    res.status(400).json({ error: 'Invalid station verification action.' });
    return;
  }

  const updatedApp = db.stationApplications.update(app.id, {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user!.id,
    rejectionReason: action === 'REJECT' ? reason : undefined,
    changesRequestedReason: action === 'REQUEST_CHANGES' ? reason : undefined,
    adminNotes: adminNotes || undefined,
  });

  // Update target station status
  let stationStatus = 'DRAFT';
  if (newStatus === 'APPROVED') stationStatus = 'APPROVED';
  if (newStatus === 'REJECTED') stationStatus = 'REJECTED';
  if (newStatus === 'SUSPENDED') stationStatus = 'SUSPENDED';
  if (newStatus === 'CHANGES_REQUIRED') stationStatus = 'PENDING_REVIEW';

  db.stations.update(app.stationId, {
    status: stationStatus as any,
    verificationStatus: newStatus === 'APPROVED' ? 'VERIFIED' : 'UNVERIFIED',
  });

  // Audit log action
  db.auditLogs.log({
    actorId: req.user!.id,
    actorName: req.user!.name || req.user!.email,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: `STATION_${action}`,
    targetType: 'STATION_APPLICATION',
    targetId: app.id,
    details: { stationId: app.stationId, ownerId: app.ownerId },
    reason,
  });

  res.json({ application: updatedApp });
});

// 9. Independent Licence Verification Action
adminVerificationRouter.post('/stations/:stationId/verify-licence', (req: AuthenticatedRequest, res) => {
  const { stationId } = req.params;
  const { licenceVerificationStatus, reviewNotes } = req.body;

  if (!['VERIFIED', 'REJECTED', 'EXPIRED', 'UNVERIFIED'].includes(licenceVerificationStatus)) {
    res.status(400).json({ error: 'Invalid licence verification status.' });
    return;
  }

  const station = db.stations.findById(stationId);
  if (!station) {
    res.status(404).json({ error: 'Station not found.' });
    return;
  }

  let app = db.stationApplications.findByStationId(stationId);
  if (app) {
    db.stationApplications.update(app.id, {
      licenceVerificationStatus: licenceVerificationStatus as LicenceVerificationStatus,
      adminNotes: reviewNotes || app.adminNotes,
    });
  }

  const updatedStation = db.stations.update(stationId, {
    licenceVerificationStatus: licenceVerificationStatus as LicenceVerificationStatus,
  });

  db.auditLogs.log({
    actorId: req.user!.id,
    actorName: req.user!.name || req.user!.email,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'LICENCE_VERIFICATION_UPDATED',
    targetType: 'STATION',
    targetId: stationId,
    details: { status: licenceVerificationStatus },
    reason: reviewNotes,
  });

  res.json({ station: updatedStation });
});

// 10. Verification Audit Trail
adminVerificationRouter.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const logs = db.auditLogs.getAll(500);
  res.json({ logs });
});
