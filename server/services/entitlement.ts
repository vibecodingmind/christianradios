import { db } from '../db.js';
import type { PlanEntitlements, SubscriptionPlan } from '../types.js';

export const DEFAULT_OFFICIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    tier: 'FREE',
    description: 'Basic single-station directory listing for Christian radio stations.',
    monthlyPriceTzs: 0,
    annualPriceTzs: 0,
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    currency: 'TZS',
    maxStations: 1,
    featuredMonthlyQuota: 0,
    maxActiveFeatured: 0,
    donationCampaignLimit: 0,
    givingEnabled: false,
    withdrawalsEnabled: false,
    analyticsRetentionDays: 7,
    advancedAnalyticsEnabled: false,
    multiStationAnalyticsEnabled: false,
    exportsEnabled: false,
    advancedBrandingEnabled: false,
    prioritySupport: false,
    featuredPlacementPriority: 'NONE',
    isActive: true,
    featuresList: [
      '1 Radio Station listing',
      'Normal directory placement',
      'Custom logo & cover image',
      'Location, genre & language tag',
      '24/7 Live stream player',
      'Basic stream monitoring',
      '7 days analytics history',
    ],
  },
  {
    id: 'plan_basic',
    name: 'Basic',
    tier: 'BASIC',
    description: 'Ideal for local Christian radio stations seeking growth and donations.',
    monthlyPriceTzs: 10000,
    annualPriceTzs: 100000,
    monthlyPriceUsd: 4,
    annualPriceUsd: 40,
    currency: 'TZS',
    maxStations: 3,
    featuredMonthlyQuota: 1,
    maxActiveFeatured: 1,
    donationCampaignLimit: 2,
    givingEnabled: true,
    withdrawalsEnabled: true,
    analyticsRetentionDays: 30,
    advancedAnalyticsEnabled: false,
    multiStationAnalyticsEnabled: false,
    exportsEnabled: true,
    advancedBrandingEnabled: false,
    prioritySupport: false,
    featuredPlacementPriority: 'BASIC',
    isActive: true,
    featuresList: [
      'Up to 3 Radio Stations',
      '1 Featured Campaign per month',
      '1 Active Featured placement',
      'Giving & Donation system (2 campaigns)',
      'Earnings dashboard & PesaPal withdrawals',
      '30 days analytics history',
      'Basic data export',
      'Standard verification',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    tier: 'PRO',
    description: 'Comprehensive package for growing radio networks & ministries.',
    monthlyPriceTzs: 25000,
    annualPriceTzs: 250000,
    monthlyPriceUsd: 10,
    annualPriceUsd: 100,
    currency: 'TZS',
    maxStations: 10,
    featuredMonthlyQuota: 3,
    maxActiveFeatured: 2,
    donationCampaignLimit: 10,
    givingEnabled: true,
    withdrawalsEnabled: true,
    analyticsRetentionDays: 90,
    advancedAnalyticsEnabled: true,
    multiStationAnalyticsEnabled: true,
    exportsEnabled: true,
    advancedBrandingEnabled: true,
    prioritySupport: true,
    featuredPlacementPriority: 'HIGH',
    isActive: true,
    featuresList: [
      'Up to 10 Radio Stations',
      '3 Featured Campaigns per month',
      '2 Active Featured placements',
      'Giving & Donation system (10 campaigns)',
      'Earnings & instant withdrawal requests',
      '90 days advanced analytics',
      'Multi-station analytics comparison',
      'Advanced custom branding',
      'Full CSV/Excel report exports',
      'Priority verification & support',
    ],
  },
  {
    id: 'plan_vip',
    name: 'VIP',
    tier: 'VIP',
    description: 'Ultimate enterprise broadcast suite for large Christian networks.',
    monthlyPriceTzs: 50000,
    annualPriceTzs: 500000,
    monthlyPriceUsd: 20,
    annualPriceUsd: 200,
    currency: 'TZS',
    maxStations: 25,
    featuredMonthlyQuota: 10,
    maxActiveFeatured: 5,
    donationCampaignLimit: 25,
    givingEnabled: true,
    withdrawalsEnabled: true,
    analyticsRetentionDays: 365,
    advancedAnalyticsEnabled: true,
    multiStationAnalyticsEnabled: true,
    exportsEnabled: true,
    advancedBrandingEnabled: true,
    prioritySupport: true,
    featuredPlacementPriority: 'HIGHEST',
    isActive: true,
    featuresList: [
      'Up to 25 Radio Stations',
      '10 Featured Campaigns per month',
      '5 Active Featured placements',
      'Giving & Donation system (25 campaigns)',
      'Earnings & priority payout processing',
      '12 Months full analytics history',
      'Multi-station network analytics',
      'Custom branding & white-label player',
      'Advanced automated financial reports',
      'VIP Priority support & expedited verification',
    ],
  },
];

export class PlanEntitlementService {
  /**
   * Get effective SubscriptionPlan for an owner.
   */
  static getOwnerPlan(ownerId: string): SubscriptionPlan {
    const subscriptions = db.subscriptions.getAll();
    const activeSub = subscriptions.find(
      (s) => s.ownerId === ownerId && (s.status === 'ACTIVE' || s.status === 'TRIALING')
    );

    const plans = db.plans.getAll();
    if (activeSub) {
      const foundPlan = plans.find((p) => p.id === activeSub.planId);
      if (foundPlan) return foundPlan;
    }

    // Fallback to default FREE plan in DB or default list
    const freePlan = plans.find((p) => p.tier === 'FREE') || DEFAULT_OFFICIAL_PLANS[0];
    return freePlan;
  }

  /**
   * Compute complete entitlements and current usage for an owner.
   */
  static getOwnerEntitlements(ownerId: string): PlanEntitlements {
    const plan = this.getOwnerPlan(ownerId);

    // 1. Station Count Usage
    const allStations = db.stations.getAll();
    const ownerStations = allStations.filter((s) => s.ownerId === ownerId);
    const stationsCount = ownerStations.length;

    // 2. Featured Campaigns Usage
    const allCampaigns = db.featuredCampaigns.getAll();
    const ownerStationIds = new Set(ownerStations.map((s) => s.id));
    const ownerCampaigns = allCampaigns.filter(
      (c) => c.ownerId === ownerId || ownerStationIds.has(c.stationId)
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const featuredMonthlyCount = ownerCampaigns.filter(
      (c) => c.createdAt >= startOfMonth
    ).length;

    const activeFeaturedCount = ownerCampaigns.filter(
      (c) => c.status === 'ACTIVE'
    ).length;

    // 3. Donation Campaigns Usage
    const allDonations = db.donations.getAll();
    const ownerDonations = allDonations.filter(
      (d) => d.ownerId === ownerId || ownerStationIds.has(d.stationId)
    );
    const donationCampaignsCount = ownerDonations.length;

    // 4. Compute capabilities
    const canAddStation = stationsCount < plan.maxStations;
    const canCreateFeaturedCampaign = featuredMonthlyCount < plan.featuredMonthlyQuota;
    const canActivateFeaturedCampaign = activeFeaturedCount < plan.maxActiveFeatured;
    const canCreateDonationCampaign = donationCampaignsCount < plan.donationCampaignLimit;
    const canUseGiving = Boolean(plan.givingEnabled);
    const canWithdraw = Boolean(plan.withdrawalsEnabled);
    const canUseAdvancedAnalytics = Boolean(plan.advancedAnalyticsEnabled);
    const canUseMultiStationAnalytics = Boolean(plan.multiStationAnalyticsEnabled);
    const canExportReports = Boolean(plan.exportsEnabled);
    const canUseAdvancedBranding = Boolean(plan.advancedBrandingEnabled);
    const prioritySupport = Boolean(plan.prioritySupport);
    const featuredPlacementPriority = plan.featuredPlacementPriority || 'NONE';

    return {
      plan,
      usage: {
        stationsCount,
        featuredMonthlyCount,
        activeFeaturedCount,
        donationCampaignsCount,
      },
      limits: {
        maxStations: plan.maxStations,
        featuredMonthlyQuota: plan.featuredMonthlyQuota,
        maxActiveFeatured: plan.maxActiveFeatured,
        donationCampaignLimit: plan.donationCampaignLimit,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      capabilities: {
        canAddStation,
        canCreateFeaturedCampaign,
        canActivateFeaturedCampaign,
        canCreateDonationCampaign,
        canUseGiving,
        canWithdraw,
        canUseAdvancedAnalytics,
        canUseMultiStationAnalytics,
        canExportReports,
        canUseAdvancedBranding,
        prioritySupport,
        featuredPlacementPriority,
      },
    };
  }
}
