export type Role =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_AGENT'
  | 'RADIO_OWNER'
  | 'LISTENER';

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
export type PlanTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CARD' | 'BANK_TRANSFER';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  emailVerified: boolean;
  phone?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  organizationName: string;
  phone?: string;
  country: string;
  bio?: string;
  verified: boolean;
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
  importId?: string;
  claimStatus?: 'UNCLAIMED' | 'CLAIM_PENDING' | 'CLAIMED';
  lastSyncedAt?: string;
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

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier?: PlanTier;
  description: string;
  monthlyPriceTzs: number;
  annualPriceTzs: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  currency?: string;
  maxStations: number;
  maxBitrateKbps?: number;
  maxMonthlyBandwidthGb?: number;
  analyticsAccessLevel?: 'BASIC' | 'ADVANCED' | 'FULL_ENTERPRISE';
  analyticsTier?: 'BASIC' | 'ADVANCED' | 'ENTERPRISE';
  featuredIncluded?: boolean;
  streamMonitoringIntervalMinutes: number;
  customBranding?: boolean;
  prioritySupport?: boolean;
  customDomainSupported?: boolean;
  whiteLabelPlayer?: boolean;
  priorityDirectoryListing?: boolean;
  donationButtonEnabled?: boolean;
  podcastUploadLimitMb?: number;
  features?: string[];
  isActive: boolean;
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

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
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
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export type WithdrawalStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
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
  fee: number;
  netAmount: number;
  payoutMethod: 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'BANK_TRANSFER';
  payoutAccountName: string;
  payoutAccountNumber: string;
  payoutBankOrProvider: string;
  status: WithdrawalStatus;
  notes?: string;
  adminNotes?: string;
  processedBy?: string;
  failureReason?: string;
  requestedAt: string;
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

  // Payment Gateways
  pesapalEnabled: boolean;
  pesapalEnv: 'sandbox' | 'live';
  pesapalConsumerKey: string;
  pesapalConsumerSecret: string;
  pesapalIpnId: string;

  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;

  directMpesaEnabled: boolean;
  directMpesaTill: string;
  directTigoPesaEnabled: boolean;
  directTigoPesaTill: string;
  directAirtelMoneyEnabled: boolean;
  directAirtelMoneyTill: string;
  directHaloPesaEnabled: boolean;
  directHaloPesaTill: string;
  bankTransferEnabled: boolean;
  bankTransferInstructions: string;

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
