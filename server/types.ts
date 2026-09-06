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

export type StationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'ARCHIVED';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

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

export type StreamStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export type StreamType = 'MP3' | 'AAC' | 'HLS' | 'ICECAST' | 'SHOUTCAST' | 'OGG' | 'FLAC' | 'OPUS';

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'VIP' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  monthlyPriceTzs: number; // in minor units / integer TZS
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

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'SUSPENDED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentProvider = 'PESAPAL' | 'PAYPAL' | 'STRIPE';

export type PaymentMethod =
  | 'PESAPAL'
  | 'PAYPAL'
  | 'STRIPE'
  | 'MPESA'
  | 'TIGO_PESA'
  | 'AIRTEL_MONEY'
  | 'CARD';

export type ReportStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  fullName?: string;
  referralCode?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface RadioOwnerProfile {
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
  taxId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Country {
  code: string; // e.g. "TZ", "KE", "UG", "US", "GB", "NG", "ZA"
  name: string;
  flagEmoji: string;
  continent: string;
  isFeatured?: boolean;
}

export interface BroadcastScheduleItem {
  dayOfWeek: number; // 0=Sunday..6=Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  programName: string;
  presenter?: string;
  description?: string;
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
  websiteUrl?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  smsNumber?: string;
  whatsappBridgeEnabled?: boolean;
  whatsappSession?: WhatsAppSession;
  smsBridgeEnabled?: boolean;
  smsKeywordPrefix?: string;
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
  streamType: 'MP3' | 'AAC' | 'HLS' | 'ICECAST' | 'SHOUTCAST';
  bitrateKbps?: number;
  timezone: string;
  schedule?: BroadcastScheduleItem[];
  status: StationStatus;
  verificationStatus: VerificationStatus;
  licenceVerificationStatus?: LicenceVerificationStatus;
  stationApplicationId?: string;
  isFeatured: boolean;
  streamStatus: StreamStatus;
  lastCheckedAt?: string;
  lastOnlineAt?: string;
  responseLatencyMs?: number;
  playCount: number;
  favoriteCount: number;
  currentListenersCount?: number;
  sourceType?: SourceType;
  sourceUrl?: string;
  externalId?: string;
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

  createdAt: string;
  updatedAt: string;
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
  triggeredBy: string; // userId or 'SYSTEM'
  sourceType: SourceType;
  status: 'SUCCESS' | 'FAILED';
  changedFields: string[];
  details: string;
  createdAt: string;
}

export interface StationReport {
  id: string;
  stationId: string;
  reporterEmail: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  stationId: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  userId: string;
  stationId: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  stationIds: string[];
  createdAt: string;
  updatedAt: string;
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

export interface ListeningSession {
  id: string;
  stationId: string;
  userId?: string;
  ipHash: string;
  startedAt: string;
  durationSeconds: number;
  countryCode?: string;
  clientType: 'WEB' | 'ANDROID' | 'IOS';
}

export interface AnalyticsEvent {
  id: string;
  stationId: string;
  eventType: 'PLAY_START' | 'PLAY_STOP' | 'VIEW' | 'FAVORITE' | 'SHARE' | 'SEARCH_CLICK';
  timestamp: string;
  countryCode?: string;
  metadata?: Record<string, unknown>;
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
  bitrateDetected?: number;
}



export interface Subscription {
  id: string;
  ownerId: string;
  planId: string;
  status: SubscriptionStatus;
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
  trackingId: string; // Provider transaction reference (e.g., PesaPal OrderTrackingId)
  ownerId: string;
  subscriptionId?: string;
  featuredCampaignId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerRef?: string;
  paymentMethod?: PaymentMethod;
  billingInterval?: 'MONTHLY' | 'ANNUAL';
  description: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  ownerId: string;
  paymentId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  taxAmount: number;
  billingPeriod: string;
  status: 'PAID' | 'OPEN' | 'VOID';
  issuedAt: string;
  planName: string;
}

export interface FeaturedCampaign {
  id: string;
  stationId: string;
  ownerId: string;
  placement: 'HOMEPAGE_HERO' | 'CATEGORY_TOP' | 'SEARCH_PROMOTION' | 'COUNTRY_FEATURED';
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  paymentId?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  placement: 'BANNER_TOP' | 'SIDEBAR' | 'SPONSORED_RESULT';
  imageUrl: string;
  targetUrl: string;
  sponsorName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'STATION_APPROVED'
    | 'STATION_REJECTED'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'SUBSCRIPTION_EXPIRING'
    | 'STREAM_OUTAGE'
    | 'STREAM_RECOVERED'
    | 'SYSTEM_ALERT'
    | 'WITHDRAWAL_UPDATE'
    | 'NEW_DONATION'
    | 'FEATURED_ACTIVATED'
    | 'SONG_REQUEST'
    | 'PRAYER_REQUEST'
    | 'PRAYER_ANSWERED'
    | 'CLAIM_UPDATE'
    | 'KYC_UPDATE'
    | 'TESTIMONY_RECEIVED'
    | 'SYSTEM';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
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

export interface SupportTicketResponse {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ownerId: string;
  subject: string;
  category: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  responses: SupportTicketResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PrayerRequest {
  id: string;
  userId?: string;
  authorName: string;
  authorAvatar?: string;
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
  prayedOnAir?: boolean;
  prayedOnAirStationName?: string;
  prayedOnAirAt?: string;
  createdAt: string;
}

export interface StationReview {
  id: string;
  userId?: string;
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
  duration: string; // e.g., "32:15"
  durationSeconds: number;
  preacherName: string;
  publishedAt: string;
  category: string;
  playCount: number;
  artworkUrl?: string;
}

export type FeedPostType = 'SHOUTOUT' | 'CHECK_IN' | 'ANNOUNCEMENT' | 'SONG_REQUEST';

export type WhatsAppAccountType = 'STANDARD' | 'BUSINESS';
export type WhatsAppSessionStatus = 'DISCONNECTED' | 'PAIRING' | 'CONNECTED';

export interface WhatsAppSession {
  status: WhatsAppSessionStatus;
  accountType?: WhatsAppAccountType;
  connectedPhone?: string;
  deviceInfo?: string;
  qrCode?: string;
  pairingToken?: string;
  pairedAt?: string;
  lastActiveAt?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  metaVerifyToken?: string;
}

export interface StationFeedPost {
  id: string;
  stationId: string;
  userId?: string;
  authorName: string;
  authorCity?: string;
  authorAvatar?: string;
  content: string;
  postType: FeedPostType;
  channel?: 'WHATSAPP' | 'SMS' | 'WEB';
  accountType?: WhatsAppAccountType;
  senderPhone?: string;
  songTitle?: string;
  artistName?: string;
  dedicationMessage?: string;
  playedOnAir?: boolean;
  readOnAir?: boolean;
  playedAt?: string;
  isPinned?: boolean;
  likesCount?: number;
  replies?: Array<{
    id: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface LiveListenerSession {
  id: string;
  stationId: string;
  stationName?: string;
  userId?: string;
  countryCode: string;
  countryName: string;
  city: string;
  lat: number;
  lng: number;
  bitrate?: number;
  lastPing: number;
}

export interface GlobalListenerPulse {
  totalActiveListeners: number;
  activeStationsCount: number;
  stationCounts: Record<string, number>;
  countryBreakdown: Array<{
    countryCode: string;
    countryName: string;
    count: number;
    lat: number;
    lng: number;
  }>;
  recentPings: Array<{
    id: string;
    stationId: string;
    stationName: string;
    countryName: string;
    city: string;
    lat: number;
    lng: number;
    time: string;
  }>;
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
  donorUserId?: string;
  userId?: string;
  donorName: string;
  isAnonymous?: boolean;
  donorEmail: string;
  donorPhone?: string;
  amount: number; // alias for grossAmount
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
  date: string; // YYYY-MM-DD
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

  // AI Platform Configuration
  aiEnabled?: boolean;
  aiProvider?: string;
  aiModel?: string;
  aiRateLimitAnon?: number;
  aiRateLimitAuth?: number;
  systemPromptOverride?: string;
  givingAllowedPlans?: string[];

  // Premium Radios & Referral Rules Configuration
  premiumRadiosEnabled?: boolean;
  minPremiumPriceTzs?: number;
  maxPremiumPriceTzs?: number;
  premiumRevenueShareOwnerPercentage?: number;
  referralCommissionOwnerPercentage?: number;
  referralCommissionListenerPercentage?: number;
  referralAttributionWindowDays?: number;

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
