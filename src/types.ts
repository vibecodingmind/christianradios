export type Role = 'SUPER_ADMIN' | 'RADIO_OWNER' | 'LISTENER';

export type SourceType =
  | 'MANUAL'
  | 'RADIOKING'
  | 'ZENO'
  | 'STREEMA'
  | 'SHOUTCAST'
  | 'ICECAST'
  | 'AZURACAST'
  | 'DIRECT_STREAM'
  | 'IMPORTED_OTHER';

export type ImportStatus =
  | 'DISCOVERING'
  | 'IMPORTED'
  | 'NEEDS_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED';

export type ClaimStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type VerificationMethod =
  | 'ADMIN_REVIEW'
  | 'DOMAIN_EMAIL'
  | 'WEBSITE_TOKEN'
  | 'EMAIL_DOMAIN'
  | 'WEBSITE_META_TAG'
  | 'DOCUMENT_UPLOAD';

export interface RadioImportPreviewResult {
  url: string;
  sourceType: SourceType;
  metadata: {
    name: string;
    tagline?: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
    websiteUrl?: string;
    countryCode?: string;
    city?: string;
    language?: string;
    genre?: string;
    streamUrl: string;
    backupStreamUrl?: string;
    streamType?: StreamType;
    bitrateKbps?: number;
    externalId?: string;
    nowPlaying?: {
      title?: string;
      artist?: string;
      album?: string;
    };
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      youtube?: string;
      whatsapp?: string;
    };
  };
  streamAnalysis: {
    isValid: boolean;
    contentType?: string;
    bitrateKbps?: number;
    streamType?: string;
    latencyMs?: number;
    error?: string;
  };
  duplicates: {
    exactMatch: any | null;
    possibleMatches: any[];
  };
}

export type StationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED';
export type StreamStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type StreamType = 'MP3' | 'AAC' | 'HLS' | 'ICECAST' | 'SHOUTCAST';
export type PlanTier = 'FREE' | 'BASIC' | 'PRO' | 'VIP' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CARD' | 'BANK_TRANSFER';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  fullName?: string;
  referralCode?: string;
  emailVerified: boolean;
  phone?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export type KYCOwnerType = 'INDIVIDUAL' | 'ORGANIZATION';

export type KYCStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type DocumentType =
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'DRIVERS_LICENSE'
  | 'BUSINESS_REGISTRATION'
  | 'TAX_CERTIFICATE'
  | 'STATION_LICENSE'
  | 'OTHER';

export type DocumentStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'INVALID'
  | 'CHANGES_REQUESTED';

export type StationApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type LicenceVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REQUIRES_REVIEW';

export interface KYCApplication {
  id: string;
  userId: string;
  verificationType: KYCOwnerType;
  fullName?: string;
  organizationName?: string;
  organizationType?: string;
  country: string;
  address?: string;
  phone: string;
  email: string;
  idType?: string;
  idNumber?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  representativeName?: string;
  representativeTitle?: string;
  representativeIdNumber?: string;
  status: KYCStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  changesRequestedReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KYCDocument {
  id: string;
  kycApplicationId: string;
  userId: string;
  documentType: DocumentType;
  fileName: string;
  fileReference: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface StationApplication {
  id: string;
  stationId: string;
  ownerId: string;
  licenceNumber?: string;
  licenceType?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  licenceDocumentRef?: string;
  licenceVerificationStatus: LicenceVerificationStatus;
  status: StationApplicationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  changesRequestedReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: Role | string;
  action: string;
  targetType?: string;
  targetId?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  organizationName: string;
  phone?: string;
  country: string;
  bio?: string;
  verified: boolean;
  verificationStatus?: VerificationStatus;
  kycApplicationId?: string;
  website?: string;
}

export interface BroadcastScheduleItem {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  programName: string;
  presenter?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  stationCount?: number;
}

export interface Country {
  code: string;
  name: string;
  flagEmoji: string;
  continent: string;
  isFeatured?: boolean;
  stationCount?: number;
}

export interface Station {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  logoUrl: string;
  coverUrl?: string;
  countryCode: string;
  region?: string;
  city: string;
  language: string;
  genre: string;
  categoryId: string;
  categoryIds?: string[];
  denomination?: string;
  website?: string;
  websiteUrl?: string;
  email?: string;
  phone?: string;
  donationEnabled?: boolean;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
    tiktok?: string;
    linkedin?: string;
  };
  streamUrl: string;
  backupStreamUrl?: string;
  streamType: StreamType;
  bitrate?: number;
  bitrateKbps?: number;
  timezone: string;
  schedule?: BroadcastScheduleItem[];
  status: StationStatus;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  streamStatus: StreamStatus;
  lastCheckedAt?: string;
  lastOnlineAt?: string;
  responseLatencyMs?: number;
  playCount?: number;
  favoriteCount?: number;
  currentListenersCount?: number;
  sourceType?: SourceType;
  sourceUrl?: string;
  externalId?: string;
  referenceTag?: string;
  importId?: string;
  claimStatus?: 'UNCLAIMED' | 'CLAIM_PENDING' | 'CLAIMED';
  lastSyncedAt?: string;

  // Premium Radios Model
  accessType?: 'FREE' | 'PREMIUM';
  monthlyPriceTzs?: number;
  annualPriceTzs?: number;
  monthlyPriceUsd?: number;
  annualPriceUsd?: number;
  premiumDescription?: string;

  planId?: string;
  plan?: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  country?: Country;
  owner?: User;
}

export interface RadioImport {
  id: string;
  ownerId: string;
  stationId?: string;
  sourceType: SourceType;
  sourceUrl: string;
  externalId?: string;
  status: ImportStatus;
  extractedData: Record<string, any>;
  streamValidation?: {
    isValid: boolean;
    streamUrl?: string;
    detectedType?: string;
    bitrate?: number;
    latencyMs?: number;
    statusCode?: number;
    contentType?: string;
    error?: string;
  };
  errorMessage?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RadioStationClaim {
  id: string;
  stationId: string;
  stationName: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  roleInStation: string;
  reason: string;
  evidence: string;
  evidenceUrls?: string[];
  verificationMethod: VerificationMethod;
  verificationToken?: string;
  status: ClaimStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RadioStationSource {
  id: string;
  stationId: string;
  sourceType: SourceType;
  sourceUrl: string;
  externalId?: string;
  providerMetadata?: Record<string, any>;
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  syncStatus?: 'SUCCESS' | 'FAILED' | 'NEVER';
  syncErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RadioStationSyncLog {
  id: string;
  stationId: string;
  sourceId?: string;
  triggeredBy: string;
  sourceType: SourceType;
  status: 'SUCCESS' | 'FAILED';
  changedFields: string[];
  details: string;
  createdAt: string;
}

export interface PremiumRadioSubscription {
  id: string;
  listenerId: string;
  stationId: string;
  ownerId: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
  billingInterval: 'MONTHLY' | 'ANNUAL';
  amountTzs: number;
  ownerShareTzs: number;
  platformShareTzs: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerRole: 'RADIO_OWNER' | 'LISTENER';
  referredUserId: string;
  referralCode: string;
  status: 'PENDING' | 'QUALIFIED' | 'EXPIRED';
  createdAt: string;
}

export interface ReferralCommission {
  id: string;
  referralId: string;
  referrerId: string;
  referredUserId: string;
  sourcePaymentId: string;
  paymentType: 'OWNER_SUBSCRIPTION' | 'PREMIUM_RADIO_SUBSCRIPTION';
  grossAmountTzs: number;
  commissionPercentage: number;
  commissionAmountTzs: number;
  status: 'PENDING' | 'SETTLED' | 'REVERSED';
  settlesAt: string;
  createdAt: string;
}

export interface FeaturedPackage {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  priceTzs: number;
  priceUsd: number;
  currency: string;
  placementPriority: 'HOMEPAGE_HERO' | 'DIRECTORY_TOP' | 'CATEGORY_FEATURED';
  isActive: boolean;
}

export interface FeaturedPurchase {
  id: string;
  stationId: string;
  ownerId: string;
  packageId: string;
  packageName: string;
  durationDays: number;
  amountTzs: number;
  currency: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED' | 'FAILED';
  paymentId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export type SubscriptionTier = PlanTier;

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyPriceTzs: number;
  annualPriceTzs: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  currency: string;
  maxStations: number;
  featuredMonthlyQuota: number;
  maxActiveFeatured: number;
  donationCampaignLimit: number;
  givingEnabled: boolean;
  withdrawalsEnabled: boolean;
  analyticsRetentionDays: number;
  advancedAnalyticsEnabled: boolean;
  multiStationAnalyticsEnabled: boolean;
  exportsEnabled: boolean;
  advancedBrandingEnabled: boolean;
  prioritySupport: boolean;
  featuredPlacementPriority: 'NONE' | 'BASIC' | 'HIGH' | 'HIGHEST';
  streamMonitoringIntervalMinutes?: number;
  customBranding?: boolean;
  analyticsAccessLevel?: 'BASIC' | 'ADVANCED' | 'FULL_ENTERPRISE';
  featuredIncluded?: boolean;
  isActive: boolean;
  isPopular?: boolean;
  featuresList?: string[];
  features?: string[];
}

export interface PlanEntitlements {
  plan: SubscriptionPlan;
  usage: {
    stationsCount: number;
    featuredMonthlyCount: number;
    activeFeaturedCount: number;
    donationCampaignsCount: number;
  };
  limits: {
    maxStations: number;
    featuredMonthlyQuota: number;
    maxActiveFeatured: number;
    donationCampaignLimit: number;
    analyticsRetentionDays: number;
  };
  capabilities: {
    canAddStation: boolean;
    canCreateFeaturedCampaign: boolean;
    canActivateFeaturedCampaign: boolean;
    canCreateDonationCampaign: boolean;
    canUseGiving: boolean;
    canWithdraw: boolean;
    canUseAdvancedAnalytics: boolean;
    canUseMultiStationAnalytics: boolean;
    canExportReports: boolean;
    canUseAdvancedBranding: boolean;
    prioritySupport: boolean;
    featuredPlacementPriority: 'NONE' | 'BASIC' | 'HIGH' | 'HIGHEST';
  };
}

export interface Subscription {
  id: string;
  ownerId: string;
  planId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE';
  billingInterval: 'MONTHLY' | 'ANNUAL';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  trackingId: string;
  ownerId: string;
  subscriptionId?: string;
  featuredCampaignId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: 'PESAPAL' | 'STRIPE' | 'MANUAL';
  providerRef?: string;
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  owner?: User;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  ownerId: string;
  paymentId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  taxAmount: number;
  billingPeriod: string;
  status: 'PAID' | 'VOID' | 'REFUNDED';
  issuedAt: string;
  planName: string;
}

export interface FeaturedCampaign {
  id: string;
  stationId: string;
  ownerId: string;
  placement: 'HOMEPAGE_HERO' | 'CATEGORY_TOP' | 'SIDEBAR_SPOTLIGHT';
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  paymentId?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  impressions: number;
  clicks: number;
  createdAt: string;
  station?: Station;
}

export interface Advertisement {
  id: string;
  title: string;
  placement: 'BANNER_TOP' | 'SIDEBAR' | 'PLAYER_CARD';
  imageUrl: string;
  targetUrl: string;
  sponsorName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface StreamHealthCheck {
  id: string;
  stationId: string;
  checkedAt: string;
  isOnline: boolean;
  statusCode: number;
  responseTimeMs: number;
  errorMessage?: string;
  contentType?: string;
}

export interface SupportTicket {
  id: string;
  ownerId: string;
  subject: string;
  category: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  responses: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface StationReport {
  id: string;
  stationId: string;
  reporterEmail: string;
  reason: string;
  details?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  station?: Station;
}

export interface Follow {
  id: string;
  userId: string;
  stationId: string;
  createdAt: string;
  station?: Station;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  stationIds: string[];
  createdAt: string;
  updatedAt: string;
  stations?: Station[];
}

export interface PrayerReport {
  id: string;
  prayerId: string;
  reporterUserId?: string;
  reporterEmail?: string;
  reason: string;
  details?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface PrayerRequest {
  id: string;
  authorName: string;
  isAnonymous: boolean;
  category: 'Healing' | 'Family' | 'Salvation' | 'Ministry' | 'Financial' | 'Peace' | 'Guidance' | 'General';
  title: string;
  prayerPoints: string;
  prayedCount: number;
  stationId?: string;
  stationName?: string;
  countryCode?: string;
  status: 'APPROVED' | 'PENDING' | 'ANSWERED';
  testimony?: string;
  createdAt: string;
}

export interface StationReview {
  id: string;
  stationId: string;
  stationSlug?: string;
  stationName?: string;
  authorName: string;
  authorEmail?: string;
  rating: number; // 1 to 5
  title: string;
  testimony: string;
  countryCode: string;
  city?: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface PodcastEpisode {
  id: string;
  stationId: string;
  stationName?: string;
  stationSlug?: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  durationSeconds: number;
  preacherName: string;
  publishedAt: string;
  category: string;
  playCount: number;
  artworkUrl?: string;
}

export type FeedPostType = 'SHOUTOUT' | 'CHECK_IN' | 'ANNOUNCEMENT';

export interface StationFeedPost {
  id: string;
  stationId: string;
  userId?: string;
  authorName: string;
  authorCity?: string;
  authorAvatar?: string;
  content: string;
  postType: FeedPostType;
  isPinned?: boolean;
  likesCount?: number;
  createdAt: string;
}

export type DonationFundType =
  | 'GENERAL'
  | 'TRANSMITTER_FUND'
  | 'GOSPEL_OUTREACH'
  | 'TITHE_OFFERING'
  | 'STUDIO_UPGRADE'
  | 'CAMPAIGN';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED';

export interface DonationCampaign {
  id: string;
  stationId: string;
  stationName?: string;
  stationSlug?: string;
  ownerId: string;
  title: string;
  description: string;
  goalAmount: number;
  currency: string;
  amountRaised: number;
  supportersCount: number;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  stationId: string;
  stationName: string;
  ownerId?: string;
  campaignId?: string;
  campaignTitle?: string;
  donorName: string;
  isAnonymous?: boolean;
  donorEmail: string;
  donorPhone?: string;
  amount: number;
  grossAmount?: number;
  platformFeePercentage?: number;
  platformFeeAmount?: number;
  netOwnerAmount?: number;
  currency: string;
  fundType: DonationFundType;
  paymentMethod: PaymentMethod;
  trackingId: string;
  status: PaymentStatus;
  message?: string;
  completedAt?: string;
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
}

export type LedgerEntryType =
  | 'DONATION_CREDIT'
  | 'DONATION_PAYOUT'
  | 'PREMIUM_SHARE_CREDIT'
  | 'REFERRAL_CREDIT'
  | 'PLATFORM_FEE_DEBIT'
  | 'WITHDRAWAL_DEBIT'
  | 'REFUND_DEBIT'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT'
  | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  ownerId: string;
  stationId?: string;
  donationId?: string;
  withdrawalId?: string;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  status?: 'SETTLED' | 'PENDING' | 'REVERSED';
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export type WithdrawalStatus =
  | 'PENDING'
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PAID'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export interface WithdrawalRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  stationId?: string;
  amount: number;
  currency: string;
  fee?: number;
  netAmount?: number;
  payoutMethod: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  payoutBankOrProvider?: string;
  accountDetails?: string;
  status: WithdrawalStatus;
  notes?: string;
  adminNotes?: string;
  processedBy?: string;
  failureReason?: string;
  requestedAt: string;
  updatedAt?: string;
  processedAt?: string;
  completedAt?: string;
}

export interface DailyVerse {
  id: string;
  date: string;
  reference: string;
  textEnglish: string;
  textSwahili: string;
  theme: string;
  reflection: string;
  audioNarrationUrl?: string;
}

export interface StreamOutageAlert {
  id: string;
  stationId: string;
  stationName: string;
  ownerId: string;
  detectedAt: string;
  resolvedAt?: string;
  status: 'ACTIVE_OUTAGE' | 'RESOLVED';
  outageDurationMinutes?: number;
  errorReason: string;
}

export interface NowPlayingInfo {
  stationId: string;
  stationName: string;
  currentTrack: string;
  artistOrMinister: string;
  programTitle: string;
  presenter: string;
  listenersCount: number;
  bitrate: number;
  streamQuality: string;
  updatedAt: string;
}

export interface PlatformSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  supportEmail: string;
  defaultCurrency: string;
  requireStationApproval: boolean;
  streamCheckIntervalMinutes: number;
  streamTimeoutSeconds: number;
  streamSsrfProtection: boolean;
  rateLimitingEnabled: boolean;
  rateLimitMaxRequestsPerMin: number;
  autoSuspendOfflineStationDays: number;
  ipBlocklist: string;
  corsStrictOrigin: string;
  enforceAdmin2fa: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  allowListenerRegistration: boolean;
  bannerNotice?: string;
  bannerNoticeActive: boolean;
  footerText?: string;

  // Giving & Support Platform Configuration
  givingEnabled?: boolean;
  donationFeePercentage?: number;
  donationFixedFee?: number;
  donationMinAmount?: number;
  donationMaxAmount?: number;
  minWithdrawalAmount?: number;
  withdrawalFeePercentage?: number;
  givingAllowedPlans?: string[];

  // AI Platform Configuration
  aiEnabled?: boolean;
  aiProvider?: string;
  aiModel?: string;
  aiRateLimitAnon?: number;
  aiRateLimitAuth?: number;
  systemPromptOverride?: string;

  // Payment Gateways (PesaPal, PayPal & Stripe)
  pesapalEnabled: boolean;
  pesapalEnv: 'sandbox' | 'live';
  pesapalConsumerKey: string;
  pesapalConsumerSecret: string;
  pesapalIpnId: string;

  paypalEnabled?: boolean;
  paypalEnv?: 'sandbox' | 'live';
  paypalClientId?: string;
  paypalClientSecret?: string;

  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;

  // Social & Auth
  googleAuthEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  facebookAuthEnabled: boolean;
  facebookAppId: string;
  appleAuthEnabled: boolean;
  appleServiceId: string;
  passwordlessMagicLinkEnabled: boolean;
}
