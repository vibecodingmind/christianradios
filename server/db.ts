import { ALL_WORLD_COUNTRIES } from './worldCountries.js';
import fs from 'fs';
import path from 'path';
import type {
  User,
  RadioOwnerProfile,
  Category,
  Country,
  Station,
  StationReport,
  Favorite,
  Follow,
  PrayerReport,
  ListeningSession,
  AnalyticsEvent,
  StreamHealthCheck,
  SubscriptionPlan,
  Subscription,
  Payment,
  Invoice,
  FeaturedCampaign,
  Advertisement,
  Notification,
  AuditLog,
  SupportTicket,
  PrayerRequest,
  StationReview,
  PodcastEpisode,
  Donation,
  DonationCampaign,
  LedgerEntry,
  WithdrawalRequest,
  DailyVerse,
  StreamOutageAlert,
  PlatformSettings,
  Playlist,
  RadioImport,
  RadioStationClaim,
  RadioStationSource,
  RadioStationSyncLog,
  PremiumRadioSubscription,
  Referral,
  ReferralCommission,
  FeaturedPackage,
  FeaturedPurchase,
  KYCApplication,
  KYCDocument,
  StationApplication,
} from './types.js';

interface DatabaseSchema {
  users: User[];
  ownerProfiles: RadioOwnerProfile[];
  kycApplications?: KYCApplication[];
  kycDocuments?: KYCDocument[];
  stationApplications?: StationApplication[];
  categories: Category[];
  countries: Country[];
  stations: Station[];
  imports: RadioImport[];
  stationClaims: RadioStationClaim[];
  stationSources: RadioStationSource[];
  syncLogs: RadioStationSyncLog[];
  reports: StationReport[];
  favorites: Favorite[];
  follows: Follow[];
  playlists: Playlist[];
  prayerReports: PrayerReport[];
  sessions: ListeningSession[];
  analyticsEvents: AnalyticsEvent[];
  healthChecks: StreamHealthCheck[];
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: Payment[];
  invoices: Invoice[];
  featuredCampaigns: FeaturedCampaign[];
  advertisements: Advertisement[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  prayerRequests: PrayerRequest[];
  stationReviews: StationReview[];
  podcastEpisodes: PodcastEpisode[];
  donations: Donation[];
  donationCampaigns: DonationCampaign[];
  ledgerEntries: LedgerEntry[];
  withdrawalRequests: WithdrawalRequest[];
  dailyVerses: DailyVerse[];
  streamOutages: StreamOutageAlert[];
  premiumSubscriptions: PremiumRadioSubscription[];
  referrals: Referral[];
  referralCommissions: ReferralCommission[];
  featuredPackages: FeaturedPackage[];
  featuredPurchases: FeaturedPurchase[];
  settings: PlatformSettings;
}

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor() {
    this.data = this.getDefaultSchema();
    this.init();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      ownerProfiles: [],
      kycApplications: [],
      kycDocuments: [],
      stationApplications: [],
      categories: [],
      countries: ALL_WORLD_COUNTRIES,
      stations: [],
      imports: [],
      stationClaims: [],
      stationSources: [],
      syncLogs: [],
      reports: [],
      favorites: [],
      follows: [],
      playlists: [],
      prayerReports: [],
      sessions: [],
      analyticsEvents: [],
      healthChecks: [],
      plans: [],
      subscriptions: [],
      payments: [],
      invoices: [],
      featuredCampaigns: [],
      advertisements: [],
      notifications: [],
      auditLogs: [],
      supportTickets: [],
      prayerRequests: [],
      stationReviews: [],
      podcastEpisodes: [],
      donations: [],
      donationCampaigns: [],
      ledgerEntries: [],
      withdrawalRequests: [],
      dailyVerses: [],
      streamOutages: [],
      premiumSubscriptions: [],
      referrals: [],
      referralCommissions: [],
      featuredPackages: [],
      featuredPurchases: [],
      settings: {
        platformName: 'Christian Radios',
        tagline: 'Listen. Discover. Connect.',
        contactEmail: 'contact@christianradios.org',
        supportEmail: 'support@christianradios.org',
        defaultCurrency: 'TZS',
        requireStationApproval: true,
        streamCheckIntervalMinutes: 5,
        streamTimeoutSeconds: 8,
        streamSsrfProtection: true,
        rateLimitingEnabled: true,
        rateLimitMaxRequestsPerMin: 120,
        autoSuspendOfflineStationDays: 7,
        ipBlocklist: '',
        corsStrictOrigin: '*',
        enforceAdmin2fa: false,
        maintenanceMode: false,
        sessionTimeoutMinutes: 1440,
        allowListenerRegistration: true,
        bannerNotice: 'Welcome to Christian Radios — The global home of online Christian radio streaming.',
        bannerNoticeActive: true,
        footerText: '© 2026 Christian Radios. Spreading the Gospel Across Every Nation.',

        // Giving Platform Settings
        givingEnabled: true,
        donationFeePercentage: 5.0,
        donationFixedFee: 0,
        donationMinAmount: 1000,
        donationMaxAmount: 10000000,
        minWithdrawalAmount: 20000,
        withdrawalFeePercentage: 1.0,
        givingAllowedPlans: ['FREE', 'BASIC', 'PRO', 'VIP'],

        // Premium Radios & Referral System Settings
        premiumRadiosEnabled: true,
        minPremiumPriceTzs: 2000,
        maxPremiumPriceTzs: 500000,
        premiumRevenueShareOwnerPercentage: 80,
        referralCommissionOwnerPercentage: 10,
        referralCommissionListenerPercentage: 10,
        referralAttributionWindowDays: 30,

        // Payment Gateways
        pesapalEnabled: true,
        pesapalEnv: 'sandbox',
        pesapalConsumerKey: 'pspk_live_8391024809',
        pesapalConsumerSecret: 'psps_sec_9918237192837',
        pesapalIpnId: 'ipn_882910384',

        stripeEnabled: true,
        stripePublishableKey: 'pk_test_51MzCRadiosPlatformDemoKey',
        stripeSecretKey: 'sk_test_51MzCRadiosPlatformSecretKey',
        stripeWebhookSecret: 'whsec_9918237192837',

        directMpesaEnabled: true,
        directMpesaTill: '5829100',
        directTigoPesaEnabled: true,
        directTigoPesaTill: '492019',
        directAirtelMoneyEnabled: true,
        directAirtelMoneyTill: '182901',
        directHaloPesaEnabled: false,
        directHaloPesaTill: '',
        bankTransferEnabled: true,
        bankTransferInstructions: 'CRDB Bank Account: 0150928371900 | Swift: CORUTZTZ | Name: Christian Radios Org',

        // Social & Auth
        googleAuthEnabled: true,
        googleClientId: '891028371900-cradiosoauth.apps.googleusercontent.com',
        googleClientSecret: 'GOCSPX-SampleGoogleClientSecret',
        facebookAuthEnabled: false,
        facebookAppId: '',
        appleAuthEnabled: false,
        appleServiceId: '',
        passwordlessMagicLinkEnabled: true,
      },
    };
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const defaults = this.getDefaultSchema();
        this.data = {
          ...defaults,
          ...parsed,
          settings: {
            ...defaults.settings,
            ...(parsed.settings || {}),
          },
        };

        this.data.countries = ALL_WORLD_COUNTRIES;

        const realJsonPath = path.resolve(process.cwd(), 'data/real_stations.json');
        if (fs.existsSync(realJsonPath)) {
          try {
            const rawReal = fs.readFileSync(realJsonPath, 'utf-8');
            const realStations = JSON.parse(rawReal);
            if (Array.isArray(realStations) && realStations.length > 0) {
              this.data.stations = realStations;
            }
          } catch (e) {
            console.error('Failed auto-loading real stations:', e);
          }
        }

        const catAwr = {
          id: 'cat_awr',
          name: 'Adventist World Radios',
          slug: 'adventist-world-radios',
          iconName: 'Globe',
          description: 'Official Adventist World Radio (AWR) multi-lingual international broadcasts and stations.',
          displayOrder: 0,
          isActive: true,
        };
        if (!Array.isArray(this.data.categories)) {
          this.data.categories = [catAwr];
        } else if (!this.data.categories.some(c => c.id === 'cat_awr')) {
          this.data.categories.unshift(catAwr);
        }
        this.save();
      }
      this.isLoaded = true;
    } catch (e) {
      console.error('Error initializing database file:', e);
      this.data = this.getDefaultSchema();
      this.isLoaded = true;
    }
  }

  private save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Atomic write using temp file
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  // --- Users ---
  public users = {
    getAll: () => this.data.users,
    findById: (id: string) => this.data.users.find((u) => u.id === id),
    findByEmail: (email: string) =>
      this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    create: (user: User) => {
      this.data.users.push(user);
      this.save();
      return user;
    },
    update: (id: string, updates: Partial<User>) => {
      const index = this.data.users.findIndex((u) => u.id === id);
      if (index === -1) return null;
      this.data.users[index] = {
        ...this.data.users[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.users[index];
    },
    delete: (id: string) => {
      const initial = this.data.users.length;
      this.data.users = this.data.users.filter((u) => u.id !== id);
      if (this.data.users.length !== initial) {
        this.save();
        return true;
      }
      return false;
    },
  };

  // --- Owner Profiles ---
  public ownerProfiles = {
    getAll: () => this.data.ownerProfiles,
    findByUserId: (userId: string) =>
      this.data.ownerProfiles.find((p) => p.userId === userId),
    create: (profile: RadioOwnerProfile) => {
      this.data.ownerProfiles.push(profile);
      this.save();
      return profile;
    },
    update: (userId: string, updates: Partial<RadioOwnerProfile>) => {
      const index = this.data.ownerProfiles.findIndex((p) => p.userId === userId);
      if (index === -1) return null;
      this.data.ownerProfiles[index] = {
        ...this.data.ownerProfiles[index],
        ...updates,
      };
      this.save();
      return this.data.ownerProfiles[index];
    },
  };

  // --- KYC Applications ---
  public kycApplications = {
    getAll: () => this.data.kycApplications || [],
    findById: (id: string) => (this.data.kycApplications || []).find((a) => a.id === id),
    findByUserId: (userId: string) => (this.data.kycApplications || []).find((a) => a.userId === userId),
    create: (app: KYCApplication) => {
      if (!this.data.kycApplications) this.data.kycApplications = [];
      this.data.kycApplications.push(app);
      this.save();
      return app;
    },
    update: (id: string, updates: Partial<KYCApplication>) => {
      if (!this.data.kycApplications) this.data.kycApplications = [];
      const index = this.data.kycApplications.findIndex((a) => a.id === id);
      if (index === -1) return null;
      this.data.kycApplications[index] = {
        ...this.data.kycApplications[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.kycApplications[index];
    },
    delete: (id: string) => {
      if (!this.data.kycApplications) return;
      this.data.kycApplications = this.data.kycApplications.filter((a) => a.id !== id);
      this.save();
    },
  };

  // --- KYC Documents ---
  public kycDocuments = {
    getAll: () => this.data.kycDocuments || [],
    findById: (id: string) => (this.data.kycDocuments || []).find((d) => d.id === id),
    findByApplicationId: (kycApplicationId: string) =>
      (this.data.kycDocuments || []).filter((d) => d.kycApplicationId === kycApplicationId),
    findByUserId: (userId: string) =>
      (this.data.kycDocuments || []).filter((d) => d.userId === userId),
    create: (doc: KYCDocument) => {
      if (!this.data.kycDocuments) this.data.kycDocuments = [];
      this.data.kycDocuments.push(doc);
      this.save();
      return doc;
    },
    update: (id: string, updates: Partial<KYCDocument>) => {
      if (!this.data.kycDocuments) this.data.kycDocuments = [];
      const index = this.data.kycDocuments.findIndex((d) => d.id === id);
      if (index === -1) return null;
      this.data.kycDocuments[index] = {
        ...this.data.kycDocuments[index],
        ...updates,
      };
      this.save();
      return this.data.kycDocuments[index];
    },
    delete: (id: string) => {
      if (!this.data.kycDocuments) return;
      this.data.kycDocuments = this.data.kycDocuments.filter((d) => d.id !== id);
      this.save();
    },
  };

  // --- Station Applications ---
  public stationApplications = {
    getAll: () => this.data.stationApplications || [],
    findById: (id: string) => (this.data.stationApplications || []).find((a) => a.id === id),
    findByStationId: (stationId: string) =>
      (this.data.stationApplications || []).find((a) => a.stationId === stationId),
    findByOwnerId: (ownerId: string) =>
      (this.data.stationApplications || []).filter((a) => a.ownerId === ownerId),
    create: (app: StationApplication) => {
      if (!this.data.stationApplications) this.data.stationApplications = [];
      this.data.stationApplications.push(app);
      this.save();
      return app;
    },
    update: (id: string, updates: Partial<StationApplication>) => {
      if (!this.data.stationApplications) this.data.stationApplications = [];
      const index = this.data.stationApplications.findIndex((a) => a.id === id);
      if (index === -1) return null;
      this.data.stationApplications[index] = {
        ...this.data.stationApplications[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.stationApplications[index];
    },
    delete: (id: string) => {
      if (!this.data.stationApplications) return;
      this.data.stationApplications = this.data.stationApplications.filter((a) => a.id !== id);
      this.save();
    },
  };

  // --- Categories ---
  public categories = {
    getAll: () =>
      [...this.data.categories].sort((a, b) => a.displayOrder - b.displayOrder),
    findById: (id: string) => this.data.categories.find((c) => c.id === id),
    findBySlug: (slug: string) => this.data.categories.find((c) => c.slug === slug),
    create: (cat: Category) => {
      this.data.categories.push(cat);
      this.save();
      return cat;
    },
    update: (id: string, updates: Partial<Category>) => {
      const index = this.data.categories.findIndex((c) => c.id === id);
      if (index === -1) return null;
      this.data.categories[index] = { ...this.data.categories[index], ...updates };
      this.save();
      return this.data.categories[index];
    },
    delete: (id: string) => {
      this.data.categories = this.data.categories.filter((c) => c.id !== id);
      this.save();
    },
  };

  // --- Countries ---
  public countries = {
    getAll: () => [...this.data.countries].sort((a, b) => a.name.localeCompare(b.name)),
    findByCode: (code?: string) =>
      code ? this.data.countries.find((c) => c.code && c.code.toUpperCase() === code.toUpperCase()) : undefined,
    create: (country: Country) => {
      this.data.countries.push(country);
      this.save();
      return country;
    },
    update: (code: string, updates: Partial<Country>) => {
      const index = this.data.countries.findIndex(
        (c) => c.code.toUpperCase() === code.toUpperCase()
      );
      if (index === -1) return null;
      this.data.countries[index] = { ...this.data.countries[index], ...updates };
      this.save();
      return this.data.countries[index];
    },
    delete: (code: string) => {
      this.data.countries = this.data.countries.filter(
        (c) => c.code.toUpperCase() !== code.toUpperCase()
      );
      this.save();
    },
  };

  // --- Stations ---
  public stations = {
    getAll: () => this.data.stations,
    findById: (id: string) => this.data.stations.find((s) => s.id === id),
    findBySlug: (slug: string) => this.data.stations.find((s) => s.slug === slug),
    findByOwnerId: (ownerId: string) =>
      this.data.stations.filter((s) => s.ownerId === ownerId),
    create: (station: Station) => {
      this.data.stations.push(station);
      this.save();
      return station;
    },
    update: (id: string, updates: Partial<Station>) => {
      const index = this.data.stations.findIndex((s) => s.id === id);
      if (index === -1) return null;
      this.data.stations[index] = {
        ...this.data.stations[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.stations[index];
    },
    incrementPlayCount: (id: string) => {
      const s = this.data.stations.find((item) => item.id === id);
      if (s) {
        s.playCount = (s.playCount || 0) + 1;
        this.save();
      }
    },
    delete: (id: string) => {
      this.data.stations = this.data.stations.filter((s) => s.id !== id);
      this.save();
    },
  };

  // --- Radio Imports ---
  public imports = {
    getAll: () => [...(this.data.imports || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findById: (id: string) => (this.data.imports || []).find((i) => i.id === id),
    findByOwnerId: (ownerId: string) =>
      (this.data.imports || []).filter((i) => i.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findByStationId: (stationId: string) =>
      (this.data.imports || []).find((i) => i.stationId === stationId),
    findBySourceUrl: (sourceUrl: string) =>
      (this.data.imports || []).find((i) => i.sourceUrl.toLowerCase() === sourceUrl.toLowerCase()),
    create: (radioImport: RadioImport) => {
      if (!this.data.imports) this.data.imports = [];
      this.data.imports.unshift(radioImport);
      this.save();
      return radioImport;
    },
    update: (id: string, updates: Partial<RadioImport>) => {
      if (!this.data.imports) this.data.imports = [];
      const index = this.data.imports.findIndex((i) => i.id === id);
      if (index === -1) return null;
      this.data.imports[index] = {
        ...this.data.imports[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.imports[index];
    },
    delete: (id: string) => {
      if (!this.data.imports) return;
      this.data.imports = this.data.imports.filter((i) => i.id !== id);
      this.save();
    },
  };

  // --- Station Claims ---
  public stationClaims = {
    getAll: () =>
      [...(this.data.stationClaims || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findById: (id: string) => (this.data.stationClaims || []).find((c) => c.id === id),
    findByStationId: (stationId: string) =>
      (this.data.stationClaims || []).filter((c) => c.stationId === stationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findByClaimantId: (claimantId: string) =>
      (this.data.stationClaims || []).filter((c) => c.claimantId === claimantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getPendingCount: () =>
      (this.data.stationClaims || []).filter((c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length,
    create: (claim: RadioStationClaim) => {
      if (!this.data.stationClaims) this.data.stationClaims = [];
      this.data.stationClaims.unshift(claim);
      this.save();
      return claim;
    },
    update: (id: string, updates: Partial<RadioStationClaim>) => {
      if (!this.data.stationClaims) this.data.stationClaims = [];
      const index = this.data.stationClaims.findIndex((c) => c.id === id);
      if (index === -1) return null;
      this.data.stationClaims[index] = {
        ...this.data.stationClaims[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.stationClaims[index];
    },
    delete: (id: string) => {
      if (!this.data.stationClaims) return;
      this.data.stationClaims = this.data.stationClaims.filter((c) => c.id !== id);
      this.save();
    },
  };

  // --- Station Sources ---
  public stationSources = {
    getAll: () => this.data.stationSources || [],
    findByStationId: (stationId: string) =>
      (this.data.stationSources || []).find((s) => s.stationId === stationId),
    create: (source: RadioStationSource) => {
      if (!this.data.stationSources) this.data.stationSources = [];
      this.data.stationSources.push(source);
      this.save();
      return source;
    },
    update: (id: string, updates: Partial<RadioStationSource>) => {
      if (!this.data.stationSources) this.data.stationSources = [];
      const index = this.data.stationSources.findIndex((s) => s.id === id);
      if (index === -1) return null;
      this.data.stationSources[index] = {
        ...this.data.stationSources[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.stationSources[index];
    },
    delete: (id: string) => {
      if (!this.data.stationSources) return;
      this.data.stationSources = this.data.stationSources.filter((s) => s.id !== id);
      this.save();
    },
  };

  // --- Station Sync Logs ---
  public syncLogs = {
    getAll: () =>
      [...(this.data.syncLogs || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findByStationId: (stationId: string) =>
      (this.data.syncLogs || []).filter((l) => l.stationId === stationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    create: (log: RadioStationSyncLog) => {
      if (!this.data.syncLogs) this.data.syncLogs = [];
      this.data.syncLogs.unshift(log);
      // Keep only last 1000 logs
      if (this.data.syncLogs.length > 1000) {
        this.data.syncLogs = this.data.syncLogs.slice(0, 1000);
      }
      this.save();
      return log;
    },
  };

  // --- Reports ---
  public reports = {
    getAll: () => this.data.reports,
    create: (report: StationReport) => {
      this.data.reports.push(report);
      this.save();
      return report;
    },
    update: (id: string, updates: Partial<StationReport>) => {
      const index = this.data.reports.findIndex((r) => r.id === id);
      if (index === -1) return null;
      this.data.reports[index] = { ...this.data.reports[index], ...updates };
      this.save();
      return this.data.reports[index];
    },
  };

  // --- Favorites ---
  public favorites = {
    findByUser: (userId: string) =>
      this.data.favorites.filter((f) => f.userId === userId),
    isFavorite: (userId: string, stationId: string) =>
      this.data.favorites.some((f) => f.userId === userId && f.stationId === stationId),
    toggle: (userId: string, stationId: string): boolean => {
      const index = this.data.favorites.findIndex(
        (f) => f.userId === userId && f.stationId === stationId
      );
      let isFav = false;
      const station = this.data.stations.find((s) => s.id === stationId);
      if (index >= 0) {
        this.data.favorites.splice(index, 1);
        if (station && station.favoriteCount > 0) {
          station.favoriteCount -= 1;
        }
        isFav = false;
      } else {
        this.data.favorites.push({
          id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          stationId,
          createdAt: new Date().toISOString(),
        });
        if (station) {
          station.favoriteCount = (station.favoriteCount || 0) + 1;
        }
        isFav = true;
      }
      this.save();
      return isFav;
    },
  };

  // --- Follows ---
  public follows = {
    getAll: () => this.data.follows || [],
    findByUser: (userId: string) => (this.data.follows || []).filter((f) => f.userId === userId),
    findByStation: (stationId: string) => (this.data.follows || []).filter((f) => f.stationId === stationId),
    isFollowing: (userId: string, stationId: string) =>
      (this.data.follows || []).some((f) => f.userId === userId && f.stationId === stationId),
    toggle: (userId: string, stationId: string) => {
      if (!this.data.follows) this.data.follows = [];
      const index = this.data.follows.findIndex(
        (f) => f.userId === userId && f.stationId === stationId
      );
      let isFollow = false;
      if (index >= 0) {
        this.data.follows.splice(index, 1);
        isFollow = false;
      } else {
        this.data.follows.push({
          id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          stationId,
          createdAt: new Date().toISOString(),
        });
        isFollow = true;
      }
      this.save();
      return isFollow;
    },
  };

  // --- Playlists ---
  public playlists = {
    getAll: () => this.data.playlists || [],
    findById: (id: string) => (this.data.playlists || []).find((p) => p.id === id),
    findByUser: (userId: string) => (this.data.playlists || []).filter((p) => p.userId === userId),
    create: (playlist: Playlist) => {
      if (!this.data.playlists) this.data.playlists = [];
      this.data.playlists.push(playlist);
      this.save();
      return playlist;
    },
    update: (id: string, updates: Partial<Playlist>) => {
      if (!this.data.playlists) this.data.playlists = [];
      const index = this.data.playlists.findIndex((p) => p.id === id);
      if (index === -1) return null;
      this.data.playlists[index] = {
        ...this.data.playlists[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.playlists[index];
    },
    delete: (id: string) => {
      if (!this.data.playlists) return;
      this.data.playlists = this.data.playlists.filter((p) => p.id !== id);
      this.save();
    },
    toggleStation: (playlistId: string, stationId: string): boolean => {
      if (!this.data.playlists) return false;
      const pl = this.data.playlists.find((p) => p.id === playlistId);
      if (!pl) return false;
      const idx = pl.stationIds.indexOf(stationId);
      let added = false;
      if (idx >= 0) {
        pl.stationIds.splice(idx, 1);
        added = false;
      } else {
        pl.stationIds.push(stationId);
        added = true;
      }
      pl.updatedAt = new Date().toISOString();
      this.save();
      return added;
    },
  };

  // --- Listening Sessions & Analytics ---
  public sessions = {
    create: (session: ListeningSession) => {
      this.data.sessions.push(session);
      // Keep recent 10,000 sessions in memory
      if (this.data.sessions.length > 10000) {
        this.data.sessions = this.data.sessions.slice(-10000);
      }
      this.save();
      return session;
    },
    getAll: () => this.data.sessions,
  };

  public analytics = {
    logEvent: (event: AnalyticsEvent) => {
      this.data.analyticsEvents.push(event);
      if (this.data.analyticsEvents.length > 25000) {
        this.data.analyticsEvents = this.data.analyticsEvents.slice(-25000);
      }
      this.save();
      return event;
    },
    getAllEvents: () => this.data.analyticsEvents,
  };

  // --- Stream Health Checks ---
  public healthChecks = {
    log: (check: StreamHealthCheck) => {
      this.data.healthChecks.push(check);
      if (this.data.healthChecks.length > 5000) {
        this.data.healthChecks = this.data.healthChecks.slice(-5000);
      }
      this.save();
      return check;
    },
    getForStation: (stationId: string, limit = 20) =>
      this.data.healthChecks
        .filter((h) => h.stationId === stationId)
        .slice(-limit),
    getAllRecent: (limit = 100) => this.data.healthChecks.slice(-limit),
  };

  // --- Subscription Plans ---
  public plans = {
    getAll: () => this.data.plans,
    findById: (id: string) => this.data.plans.find((p) => p.id === id),
    create: (plan: SubscriptionPlan) => {
      this.data.plans.push(plan);
      this.save();
      return plan;
    },
    update: (id: string, updates: Partial<SubscriptionPlan>) => {
      const index = this.data.plans.findIndex((p) => p.id === id);
      if (index === -1) return null;
      this.data.plans[index] = { ...this.data.plans[index], ...updates };
      this.save();
      return this.data.plans[index];
    },
    delete: (id: string) => {
      this.data.plans = this.data.plans.filter((p) => p.id !== id);
      this.save();
    },
  };

  // --- Subscriptions ---
  public subscriptions = {
    getAll: () => this.data.subscriptions,
    findByOwnerId: (ownerId: string) =>
      this.data.subscriptions.find((s) => s.ownerId === ownerId),
    create: (sub: Subscription) => {
      // Deactivate existing subscriptions for this owner
      this.data.subscriptions = this.data.subscriptions.map((s) =>
        s.ownerId === sub.ownerId ? { ...s, status: 'EXPIRED' as const } : s
      );
      this.data.subscriptions.push(sub);
      this.save();
      return sub;
    },
    update: (id: string, updates: Partial<Subscription>) => {
      const index = this.data.subscriptions.findIndex((s) => s.id === id);
      if (index === -1) return null;
      this.data.subscriptions[index] = {
        ...this.data.subscriptions[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.subscriptions[index];
    },
  };

  // --- Payments & Invoices ---
  public payments = {
    getAll: () => this.data.payments,
    findById: (id: string) => this.data.payments.find((p) => p.id === id),
    findByTrackingId: (trackingId: string) =>
      this.data.payments.find((p) => p.trackingId === trackingId),
    findByOwnerId: (ownerId: string) =>
      this.data.payments.filter((p) => p.ownerId === ownerId),
    create: (payment: Payment) => {
      this.data.payments.push(payment);
      this.save();
      return payment;
    },
    update: (id: string, updates: Partial<Payment>) => {
      const index = this.data.payments.findIndex((p) => p.id === id);
      if (index === -1) return null;
      this.data.payments[index] = { ...this.data.payments[index], ...updates };
      this.save();
      return this.data.payments[index];
    },
  };

  public invoices = {
    getAll: () => this.data.invoices,
    findById: (id: string) => this.data.invoices.find((i) => i.id === id),
    findByOwnerId: (ownerId: string) =>
      this.data.invoices.filter((i) => i.ownerId === ownerId),
    create: (invoice: Invoice) => {
      this.data.invoices.push(invoice);
      this.save();
      return invoice;
    },
  };

  // --- Featured Campaigns ---
  public featuredCampaigns = {
    getAll: () => this.data.featuredCampaigns,
    getActive: () => {
      const now = new Date().toISOString();
      return this.data.featuredCampaigns.filter(
        (c) => c.status === 'ACTIVE' && c.startDate <= now && c.endDate >= now
      );
    },
    findByOwnerId: (ownerId: string) =>
      this.data.featuredCampaigns.filter((c) => c.ownerId === ownerId),
    create: (campaign: FeaturedCampaign) => {
      this.data.featuredCampaigns.push(campaign);
      this.save();
      return campaign;
    },
    update: (id: string, updates: Partial<FeaturedCampaign>) => {
      const index = this.data.featuredCampaigns.findIndex((c) => c.id === id);
      if (index === -1) return null;
      this.data.featuredCampaigns[index] = {
        ...this.data.featuredCampaigns[index],
        ...updates,
      };
      this.save();
      return this.data.featuredCampaigns[index];
    },
  };

  // --- Advertisements ---
  public advertisements = {
    getAll: () => this.data.advertisements,
    getActive: (placement?: string) => {
      const now = new Date().toISOString();
      return this.data.advertisements.filter(
        (a) =>
          a.status === 'ACTIVE' &&
          a.startDate <= now &&
          a.endDate >= now &&
          (!placement || a.placement === placement)
      );
    },
    create: (ad: Advertisement) => {
      this.data.advertisements.push(ad);
      this.save();
      return ad;
    },
    update: (id: string, updates: Partial<Advertisement>) => {
      const index = this.data.advertisements.findIndex((a) => a.id === id);
      if (index === -1) return null;
      this.data.advertisements[index] = {
        ...this.data.advertisements[index],
        ...updates,
      };
      this.save();
      return this.data.advertisements[index];
    },
    delete: (id: string) => {
      this.data.advertisements = this.data.advertisements.filter((a) => a.id !== id);
      this.save();
    },
  };

  // --- Notifications ---
  public notifications = {
    getByUserId: (userId: string) =>
      this.data.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    create: (notif: Notification) => {
      this.data.notifications.push(notif);
      this.save();
      return notif;
    },
    markRead: (id: string, userId: string) => {
      const n = this.data.notifications.find((item) => item.id === id && item.userId === userId);
      if (n) {
        n.read = true;
        this.save();
      }
    },
  };

  // --- Audit Logs ---
  public auditLogs = {
    getAll: (limit = 200) =>
      [...this.data.auditLogs]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit),
    log: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      const entry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...log,
      };
      this.data.auditLogs.unshift(entry);
      if (this.data.auditLogs.length > 5000) {
        this.data.auditLogs = this.data.auditLogs.slice(0, 5000);
      }
      this.save();
      return entry;
    },
  };

  // --- Support Tickets ---
  public supportTickets = {
    getAll: () =>
      [...this.data.supportTickets].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      ),
    findByOwnerId: (ownerId: string) =>
      this.data.supportTickets
        .filter((t) => t.ownerId === ownerId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    findById: (id: string) => this.data.supportTickets.find((t) => t.id === id),
    create: (ticket: SupportTicket) => {
      this.data.supportTickets.push(ticket);
      this.save();
      return ticket;
    },
    addResponse: (
      id: string,
      response: {
        authorId: string;
        authorName: string;
        authorRole: any;
        message: string;
      },
      newStatus?: any
    ) => {
      const ticket = this.data.supportTickets.find((t) => t.id === id);
      if (!ticket) return null;
      ticket.responses.push({
        id: `res_${Date.now()}`,
        ...response,
        timestamp: new Date().toISOString(),
      });
      if (newStatus) {
        ticket.status = newStatus;
      }
      ticket.updatedAt = new Date().toISOString();
      this.save();
      return ticket;
    },
  };

  // --- Prayer Requests ---
  public prayerRequests = {
    getAll: () =>
      [...(this.data.prayerRequests || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    getApproved: () =>
      (this.data.prayerRequests || [])
        .filter((p) => p.status === 'APPROVED' || p.status === 'ANSWERED')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findById: (id: string) =>
      (this.data.prayerRequests || []).find((p) => p.id === id),
    create: (prayer: PrayerRequest) => {
      if (!this.data.prayerRequests) this.data.prayerRequests = [];
      this.data.prayerRequests.unshift(prayer);
      this.save();
      return prayer;
    },
    incrementPrayed: (id: string) => {
      const p = (this.data.prayerRequests || []).find((item) => item.id === id);
      if (p) {
        p.prayedCount = (p.prayedCount || 0) + 1;
        this.save();
        return p.prayedCount;
      }
      return 0;
    },
    update: (id: string, updates: Partial<PrayerRequest>) => {
      const index = (this.data.prayerRequests || []).findIndex((p) => p.id === id);
      if (index === -1) return null;
      this.data.prayerRequests[index] = {
        ...this.data.prayerRequests[index],
        ...updates,
      };
      this.save();
      return this.data.prayerRequests[index];
    },
    delete: (id: string) => {
      this.data.prayerRequests = (this.data.prayerRequests || []).filter(
        (p) => p.id !== id
      );
      this.save();
    },
  };

  // --- Prayer Reports ---
  public prayerReports = {
    getAll: () =>
      [...(this.data.prayerReports || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    create: (report: PrayerReport) => {
      if (!this.data.prayerReports) this.data.prayerReports = [];
      this.data.prayerReports.unshift(report);
      this.save();
      return report;
    },
    update: (id: string, updates: Partial<PrayerReport>) => {
      if (!this.data.prayerReports) this.data.prayerReports = [];
      const index = this.data.prayerReports.findIndex((r) => r.id === id);
      if (index === -1) return null;
      this.data.prayerReports[index] = {
        ...this.data.prayerReports[index],
        ...updates,
      };
      this.save();
      return this.data.prayerReports[index];
    },
    delete: (id: string) => {
      this.data.prayerReports = (this.data.prayerReports || []).filter(
        (r) => r.id !== id
      );
      this.save();
    },
  };

  // --- Station Reviews & Testimonies ---
  public stationReviews = {
    getAll: () =>
      [...(this.data.stationReviews || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    getByStationId: (stationId: string) =>
      (this.data.stationReviews || [])
        .filter((r) => r.stationId === stationId && r.isApproved)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    create: (review: StationReview) => {
      if (!this.data.stationReviews) this.data.stationReviews = [];
      this.data.stationReviews.unshift(review);
      this.save();
      return review;
    },
    update: (id: string, updates: Partial<StationReview>) => {
      const index = (this.data.stationReviews || []).findIndex((r) => r.id === id);
      if (index === -1) return null;
      this.data.stationReviews[index] = {
        ...this.data.stationReviews[index],
        ...updates,
      };
      this.save();
      return this.data.stationReviews[index];
    },
    delete: (id: string) => {
      this.data.stationReviews = (this.data.stationReviews || []).filter(
        (r) => r.id !== id
      );
      this.save();
    },
  };

  // --- Podcast Episodes (Audio on Demand) ---
  public podcastEpisodes = {
    getAll: () =>
      [...(this.data.podcastEpisodes || [])].sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt)
      ),
    getByStationId: (stationId: string) =>
      (this.data.podcastEpisodes || [])
        .filter((ep) => ep.stationId === stationId)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    findById: (id: string) =>
      (this.data.podcastEpisodes || []).find((ep) => ep.id === id),
    create: (episode: PodcastEpisode) => {
      if (!this.data.podcastEpisodes) this.data.podcastEpisodes = [];
      this.data.podcastEpisodes.unshift(episode);
      this.save();
      return episode;
    },
    incrementPlayCount: (id: string) => {
      const ep = (this.data.podcastEpisodes || []).find((item) => item.id === id);
      if (ep) {
        ep.playCount = (ep.playCount || 0) + 1;
        this.save();
      }
    },
    update: (id: string, updates: Partial<PodcastEpisode>) => {
      const index = (this.data.podcastEpisodes || []).findIndex((ep) => ep.id === id);
      if (index === -1) return null;
      this.data.podcastEpisodes[index] = {
        ...this.data.podcastEpisodes[index],
        ...updates,
      };
      this.save();
      return this.data.podcastEpisodes[index];
    },
    delete: (id: string) => {
      this.data.podcastEpisodes = (this.data.podcastEpisodes || []).filter(
        (ep) => ep.id !== id
      );
      this.save();
    },
  };

  // --- Donations ---
  public donations = {
    getAll: () =>
      [...(this.data.donations || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    getByStationId: (stationId: string) =>
      (this.data.donations || [])
        .filter((d) => d.stationId === stationId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getByOwnerId: (ownerId: string) => {
      const myStations = new Set(
        (this.data.stations || [])
          .filter((s) => s.ownerId === ownerId)
          .map((s) => s.id)
      );
      return (this.data.donations || [])
        .filter((d) => (d.ownerId && d.ownerId === ownerId) || myStations.has(d.stationId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    findById: (id: string) =>
      (this.data.donations || []).find((d) => d.id === id),
    findByTrackingId: (trackingId: string) =>
      (this.data.donations || []).find(
        (d) => d.trackingId === trackingId || d.id === trackingId
      ),
    create: (donation: Donation) => {
      if (!this.data.donations) this.data.donations = [];
      this.data.donations.unshift(donation);
      this.save();
      return donation;
    },
    update: (id: string, updates: Partial<Donation>) => {
      const index = (this.data.donations || []).findIndex((d) => d.id === id);
      if (index === -1) return null;
      this.data.donations[index] = { ...this.data.donations[index], ...updates };
      this.save();
      return this.data.donations[index];
    },
  };

  // --- Donation Campaigns ---
  public donationCampaigns = {
    getAll: () =>
      [...(this.data.donationCampaigns || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    getByStationId: (stationId: string) =>
      (this.data.donationCampaigns || [])
        .filter((c) => c.stationId === stationId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getActiveByStationId: (stationId: string) =>
      (this.data.donationCampaigns || [])
        .filter((c) => c.stationId === stationId && c.status === 'ACTIVE')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getByOwnerId: (ownerId: string) =>
      (this.data.donationCampaigns || [])
        .filter((c) => c.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findById: (id: string) =>
      (this.data.donationCampaigns || []).find((c) => c.id === id),
    create: (campaign: DonationCampaign) => {
      if (!this.data.donationCampaigns) this.data.donationCampaigns = [];
      this.data.donationCampaigns.unshift(campaign);
      this.save();
      return campaign;
    },
    update: (id: string, updates: Partial<DonationCampaign>) => {
      const index = (this.data.donationCampaigns || []).findIndex((c) => c.id === id);
      if (index === -1) return null;
      this.data.donationCampaigns[index] = {
        ...this.data.donationCampaigns[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.donationCampaigns[index];
    },
    recordDonation: (campaignId: string, amount: number) => {
      const campaign = (this.data.donationCampaigns || []).find((c) => c.id === campaignId);
      if (campaign) {
        campaign.amountRaised = (campaign.amountRaised || 0) + amount;
        campaign.supportersCount = (campaign.supportersCount || 0) + 1;
        if (campaign.amountRaised >= campaign.goalAmount && campaign.status === 'ACTIVE') {
          campaign.status = 'COMPLETED';
        }
        campaign.updatedAt = new Date().toISOString();
        this.save();
      }
    },
    delete: (id: string) => {
      this.data.donationCampaigns = (this.data.donationCampaigns || []).filter(
        (c) => c.id !== id
      );
      this.save();
    },
  };

  // --- Financial Ledger Entries ---
  public ledgerEntries = {
    getAll: () =>
      [...(this.data.ledgerEntries || [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    getByOwnerId: (ownerId: string) =>
      (this.data.ledgerEntries || [])
        .filter((l) => l.ownerId === ownerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    create: (entry: LedgerEntry) => {
      if (!this.data.ledgerEntries) this.data.ledgerEntries = [];
      this.data.ledgerEntries.unshift(entry);
      this.save();
      return entry;
    },
    getOwnerBalance: (ownerId: string) => {
      const ownerDonations = db.donations.getByOwnerId(ownerId);
      const completedDonations = ownerDonations.filter((d) => d.status === 'COMPLETED');
      
      const totalGrossDonations = completedDonations.reduce((sum, d) => sum + (d.grossAmount || d.amount), 0);
      const totalPlatformFees = completedDonations.reduce((sum, d) => {
        if (d.platformFeeAmount !== undefined) return sum + d.platformFeeAmount;
        const feeRate = (d.platformFeePercentage ?? 5.0) / 100;
        return sum + Math.round((d.grossAmount || d.amount) * feeRate);
      }, 0);
      const totalNetEarnings = totalGrossDonations - totalPlatformFees;

      const ownerWithdrawals = (this.data.withdrawalRequests || []).filter((w) => w.ownerId === ownerId);
      const completedWithdrawn = ownerWithdrawals
        .filter((w) => w.status === 'COMPLETED')
        .reduce((sum, w) => sum + w.amount, 0);

      const pendingWithdrawn = ownerWithdrawals
        .filter((w) => ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING'].includes(w.status))
        .reduce((sum, w) => sum + w.amount, 0);

      const availableBalance = Math.max(0, totalNetEarnings - completedWithdrawn - pendingWithdrawn);

      return {
        totalGrossDonations,
        totalPlatformFees,
        totalNetEarnings,
        completedWithdrawn,
        pendingWithdrawn,
        availableBalance,
        currency: 'TZS',
      };
    },
  };

  // --- Withdrawal Requests ---
  public withdrawalRequests = {
    getAll: () =>
      [...(this.data.withdrawalRequests || [])].sort((a, b) =>
        b.requestedAt.localeCompare(a.requestedAt)
      ),
    getByOwnerId: (ownerId: string) =>
      (this.data.withdrawalRequests || [])
        .filter((w) => w.ownerId === ownerId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    findById: (id: string) =>
      (this.data.withdrawalRequests || []).find((w) => w.id === id),
    create: (req: WithdrawalRequest) => {
      if (!this.data.withdrawalRequests) this.data.withdrawalRequests = [];
      this.data.withdrawalRequests.unshift(req);
      this.save();
      return req;
    },
    update: (id: string, updates: Partial<WithdrawalRequest>) => {
      const index = (this.data.withdrawalRequests || []).findIndex((w) => w.id === id);
      if (index === -1) return null;
      this.data.withdrawalRequests[index] = {
        ...this.data.withdrawalRequests[index],
        ...updates,
      };
      this.save();
      return this.data.withdrawalRequests[index];
    },
  };

  // --- Daily Verses ---
  public dailyVerses = {
    getAll: () => this.data.dailyVerses || [],
    getToday: () => {
      const today = new Date().toISOString().split('T')[0];
      const verses = this.data.dailyVerses || [];
      return verses.find((v) => v.date === today) || verses[0] || null;
    },
    create: (verse: DailyVerse) => {
      if (!this.data.dailyVerses) this.data.dailyVerses = [];
      this.data.dailyVerses.push(verse);
      this.save();
      return verse;
    },
  };

  // --- Stream Outage Alerts ---
  public streamOutages = {
    getAll: () =>
      [...(this.data.streamOutages || [])].sort((a, b) =>
        b.detectedAt.localeCompare(a.detectedAt)
      ),
    getActive: () =>
      (this.data.streamOutages || []).filter((o) => o.status === 'ACTIVE_OUTAGE'),
    getByOwnerId: (ownerId: string) =>
      (this.data.streamOutages || []).filter((o) => o.ownerId === ownerId),
    create: (outage: StreamOutageAlert) => {
      if (!this.data.streamOutages) this.data.streamOutages = [];
      this.data.streamOutages.unshift(outage);
      this.save();
      return outage;
    },
    resolve: (id: string) => {
      const o = (this.data.streamOutages || []).find((item) => item.id === id);
      if (o) {
        o.status = 'RESOLVED';
        o.resolvedAt = new Date().toISOString();
        this.save();
      }
    },
  };

  // --- Premium Radio Subscriptions ---
  public premiumSubscriptions = {
    getAll: () => this.data.premiumSubscriptions || [],
    findById: (id: string) => (this.data.premiumSubscriptions || []).find((s) => s.id === id),
    findByListenerId: (listenerId: string) =>
      (this.data.premiumSubscriptions || []).filter((s) => s.listenerId === listenerId),
    findByStationId: (stationId: string) =>
      (this.data.premiumSubscriptions || []).filter((s) => s.stationId === stationId),
    findByOwnerId: (ownerId: string) =>
      (this.data.premiumSubscriptions || []).filter((s) => s.ownerId === ownerId),
    hasActiveAccess: (listenerId: string, stationId: string) => {
      const now = new Date().toISOString();
      return (this.data.premiumSubscriptions || []).some(
        (s) =>
          s.listenerId === listenerId &&
          s.stationId === stationId &&
          s.status === 'ACTIVE' &&
          s.currentPeriodEnd > now
      );
    },
    create: (sub: PremiumRadioSubscription) => {
      if (!this.data.premiumSubscriptions) this.data.premiumSubscriptions = [];
      this.data.premiumSubscriptions.unshift(sub);
      this.save();
      return sub;
    },
    update: (id: string, updates: Partial<PremiumRadioSubscription>) => {
      const idx = (this.data.premiumSubscriptions || []).findIndex((s) => s.id === id);
      if (idx === -1) return null;
      this.data.premiumSubscriptions[idx] = {
        ...this.data.premiumSubscriptions[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
      return this.data.premiumSubscriptions[idx];
    },
  };

  // --- Referrals & Commissions ---
  public referrals = {
    getAll: () => this.data.referrals || [],
    findById: (id: string) => (this.data.referrals || []).find((r) => r.id === id),
    findByReferrerId: (referrerId: string) =>
      (this.data.referrals || []).filter((r) => r.referrerId === referrerId),
    findByReferredUserId: (referredUserId: string) =>
      (this.data.referrals || []).find((r) => r.referredUserId === referredUserId),
    create: (referral: Referral) => {
      if (!this.data.referrals) this.data.referrals = [];
      // Prevent duplicate referral for same referred user
      const existing = this.data.referrals.find((r) => r.referredUserId === referral.referredUserId);
      if (existing) return existing;

      // Anti-fraud: Block self-referral
      if (referral.referrerId === referral.referredUserId) {
        throw new Error('Self-referral is strictly prohibited by anti-fraud policy.');
      }

      this.data.referrals.unshift(referral);
      this.save();
      return referral;
    },
  };

  public referralCommissions = {
    getAll: () => this.data.referralCommissions || [],
    findById: (id: string) => (this.data.referralCommissions || []).find((c) => c.id === id),
    findByReferrerId: (referrerId: string) =>
      (this.data.referralCommissions || []).filter((c) => c.referrerId === referrerId),
    create: (commission: ReferralCommission) => {
      if (!this.data.referralCommissions) this.data.referralCommissions = [];
      // Prevent duplicate commission for same payment
      const existing = this.data.referralCommissions.find((c) => c.sourcePaymentId === commission.sourcePaymentId);
      if (existing) return existing;

      this.data.referralCommissions.unshift(commission);
      this.save();
      return commission;
    },
    update: (id: string, updates: Partial<ReferralCommission>) => {
      const idx = (this.data.referralCommissions || []).findIndex((c) => c.id === id);
      if (idx === -1) return null;
      this.data.referralCommissions[idx] = {
        ...this.data.referralCommissions[idx],
        ...updates,
      };
      this.save();
      return this.data.referralCommissions[idx];
    },
  };

  // --- Featured Packages & Purchases ---
  public featuredPackages = {
    getAll: () => this.data.featuredPackages || [],
    findById: (id: string) => (this.data.featuredPackages || []).find((p) => p.id === id),
    create: (pkg: FeaturedPackage) => {
      if (!this.data.featuredPackages) this.data.featuredPackages = [];
      this.data.featuredPackages.push(pkg);
      this.save();
      return pkg;
    },
    update: (id: string, updates: Partial<FeaturedPackage>) => {
      const idx = (this.data.featuredPackages || []).findIndex((p) => p.id === id);
      if (idx === -1) return null;
      this.data.featuredPackages[idx] = { ...this.data.featuredPackages[idx], ...updates };
      this.save();
      return this.data.featuredPackages[idx];
    },
  };

  public featuredPurchases = {
    getAll: () => this.data.featuredPurchases || [],
    findById: (id: string) => (this.data.featuredPurchases || []).find((p) => p.id === id),
    findByOwnerId: (ownerId: string) =>
      (this.data.featuredPurchases || []).filter((p) => p.ownerId === ownerId),
    findByStationId: (stationId: string) =>
      (this.data.featuredPurchases || []).filter((p) => p.stationId === stationId),
    create: (purchase: FeaturedPurchase) => {
      if (!this.data.featuredPurchases) this.data.featuredPurchases = [];
      this.data.featuredPurchases.unshift(purchase);
      this.save();
      return purchase;
    },
    update: (id: string, updates: Partial<FeaturedPurchase>) => {
      const idx = (this.data.featuredPurchases || []).findIndex((p) => p.id === id);
      if (idx === -1) return null;
      this.data.featuredPurchases[idx] = { ...this.data.featuredPurchases[idx], ...updates };
      this.save();
      return this.data.featuredPurchases[idx];
    },
  };

  // --- Financial Ledger Summary Calculator ---
  public getUserFinancialSummary(userId: string) {
    const userLedger = (this.data.ledgerEntries || []).filter((e) => e.ownerId === userId);

    const totalDonations = userLedger
      .filter((e) => e.type === 'DONATION_PAYOUT' && e.status === 'SETTLED')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalPremiumShare = (this.data.premiumSubscriptions || [])
      .filter((s) => s.ownerId === userId && (s.status === 'ACTIVE' || s.status === 'EXPIRED'))
      .reduce((sum, s) => sum + s.ownerShareTzs, 0);

    const totalCommissions = (this.data.referralCommissions || [])
      .filter((c) => c.referrerId === userId && c.status === 'SETTLED')
      .reduce((sum, c) => sum + c.commissionAmountTzs, 0);

    const grossEarnings = totalDonations + totalPremiumShare + totalCommissions;

    const totalWithdrawn = (this.data.withdrawalRequests || [])
      .filter((w) => w.ownerId === userId && (w.status === 'PAID' || w.status === 'APPROVED' || w.status === 'PROCESSING' || w.status === 'PENDING'))
      .reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = Math.max(0, grossEarnings - totalWithdrawn);

    return {
      grossEarnings,
      totalDonations,
      totalPremiumShare,
      totalCommissions,
      totalWithdrawn,
      availableBalance,
    };
  }

  // --- Settings ---
  public settings = {
    get: () => this.data.settings,
    update: (updates: Partial<PlatformSettings>) => {
      this.data.settings = { ...this.data.settings, ...updates };
      this.save();
      return this.data.settings;
    },
  };

  public seedInitialData(seedFn: (data: DatabaseSchema) => void) {
    if (
      this.data.users.length === 0 ||
      this.data.stations.length === 0 ||
      !this.data.plans ||
      this.data.plans.length === 0 ||
      !this.data.stationReviews ||
      this.data.stationReviews.length === 0 ||
      !this.data.prayerRequests ||
      this.data.prayerRequests.length === 0
    ) {
      seedFn(this.data);
      this.save();
    }
  }
}

export const db = new DatabaseEngine();
