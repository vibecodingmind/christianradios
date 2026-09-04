import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireRole, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';
import type { KYCApplication, KYCDocument, KYCOwnerType, DocumentType } from '../types.js';

export const kycRouter = Router();

// Ensure all routes require RADIO_OWNER or SUPER_ADMIN role
kycRouter.use(requireRole('RADIO_OWNER'));

const DOCUMENTS_DIR = path.join(process.cwd(), 'uploads', 'documents');

if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

// Validation schemas for KYC Submission
const KYCSubmissionSchema = z.object({
  verificationType: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  fullName: z.string().optional(),
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  country: z.string().min(2, 'Country is required'),
  address: z.string().optional(),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().optional(),
  representativeName: z.string().optional(),
  representativeTitle: z.string().optional(),
  representativeIdNumber: z.string().optional(),
});

// 1. Get Current Radio Owner's KYC Application & Uploaded Documents
kycRouter.get('/application', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const application = db.kycApplications.findByUserId(userId);
  const documents = application ? db.kycDocuments.findByApplicationId(application.id) : [];

  res.json({
    application: application || null,
    documents,
  });
});

// 2. Submit / Update KYC Application
kycRouter.post('/application', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const parseResult = KYCSubmissionSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid KYC submission data',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const data = parseResult.data;
  let existing = db.kycApplications.findByUserId(userId);

  if (existing) {
    // Return to SUBMITTED status on resubmission
    const updated = db.kycApplications.update(existing.id, {
      ...data,
      verificationType: data.verificationType as KYCOwnerType,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      changesRequestedReason: undefined,
      rejectionReason: undefined,
    });

    db.auditLogs.log({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'KYC_SUBMITTED',
      targetType: 'KYC_APPLICATION',
      targetId: existing.id,
      details: { verificationType: data.verificationType, resubmission: true },
    });

    res.json({ application: updated });
  } else {
    const newApp: KYCApplication = {
      id: `kyc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      verificationType: data.verificationType as KYCOwnerType,
      fullName: data.fullName,
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      country: data.country,
      address: data.address,
      phone: data.phone,
      email: data.email,
      idType: data.idType,
      idNumber: data.idNumber,
      registrationNumber: data.registrationNumber,
      taxId: data.taxId,
      website: data.website,
      representativeName: data.representativeName,
      representativeTitle: data.representativeTitle,
      representativeIdNumber: data.representativeIdNumber,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.kycApplications.create(newApp);

    // Update Owner Profile status to PENDING
    db.ownerProfiles.update(userId, {
      verificationStatus: 'PENDING',
      kycApplicationId: newApp.id,
      organizationName: data.organizationName || data.fullName || '',
      country: data.country,
    });

    db.auditLogs.log({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'KYC_SUBMITTED',
      targetType: 'KYC_APPLICATION',
      targetId: newApp.id,
      details: { verificationType: data.verificationType },
    });

    res.status(201).json({ application: newApp });
  }
});

// 3. Upload KYC Document (Secure File Upload Endpoint)
kycRouter.post('/upload-document', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { documentType, fileName, fileData } = req.body;

  if (!documentType || !fileData) {
    res.status(400).json({ error: 'Missing document type or file data.' });
    return;
  }

  // Ensure owner has an active KYC application (or create draft application)
  let app = db.kycApplications.findByUserId(userId);
  if (!app) {
    app = db.kycApplications.create({
      id: `kyc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      verificationType: 'INDIVIDUAL',
      country: 'TZ',
      phone: '',
      email: req.user!.email,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    let buffer: Buffer;
    let mimeType = 'application/octet-stream';
    let fileExt = '.bin';

    if (fileData.startsWith('data:')) {
      const parts = fileData.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    // Validate size <= 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File size exceeds maximum limit of 10MB.' });
      return;
    }

    // Allowed mime types
    const mimeExtMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    if (mimeExtMap[mimeType]) {
      fileExt = mimeExtMap[mimeType];
    } else if (fileName) {
      const ext = path.extname(fileName).toLowerCase();
      if (['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        fileExt = ext;
      } else {
        res.status(400).json({ error: 'Unsupported file format. Please upload PDF, JPG, PNG, or WEBP.' });
        return;
      }
    } else {
      res.status(400).json({ error: 'Unsupported file format.' });
      return;
    }

    // Generate secure non-predictable filename
    const uniqueFileRef = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${fileExt}`;
    const filePath = path.join(DOCUMENTS_DIR, uniqueFileRef);

    fs.writeFileSync(filePath, buffer);

    // Save document record in DB
    const newDoc: KYCDocument = {
      id: `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      kycApplicationId: app.id,
      userId,
      documentType: documentType as DocumentType,
      fileName: fileName || `Document_${documentType}${fileExt}`,
      fileReference: uniqueFileRef,
      fileSize: buffer.length,
      mimeType,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    };

    db.kycDocuments.create(newDoc);

    res.status(201).json({ document: newDoc });
  } catch (err) {
    console.error('Failed to upload KYC document:', err);
    res.status(500).json({ error: 'Document upload failed. Please try again.' });
  }
});
