import { db } from '../db.js';
import type { PlanEntitlements, SubscriptionPlan } from '../types.js';

export const DEFAULT_OFFICIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: 'Free Starter',
    tier: 'FREE',
    description: 'Basic single-station directory listing for Christian radio stations.',
    monthlyPriceTzs: 0,
    annualPriceTzs: 0,
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    currency: 'USD',
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
    streamMonitoringIntervalMinutes: 60,
    isActive: true,
    featuresList: [
      '1 Radio Station listing',
      '24/7 Live Stream Player (up to 128kbps)',
      'Normal directory placement',
      'Basic station profile (Logo & Tagline)',
      '7 days analytics history',
      'Community support',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Pro Ministry',
    tier: 'PRO',
    description: 'Ideal for growing Christian radio stations, ministries & dioceses.',
    monthlyPriceTzs: 47500,
    annualPriceTzs: 475000,
    monthlyPriceUsd: 19,
    annualPriceUsd: 190,
    currency: 'USD',
    maxStations: 3,
    featuredMonthlyQuota: 1,
    maxActiveFeatured: 1,
    donationCampaignLimit: 3,
    givingEnabled: true,
    withdrawalsEnabled: true,
    analyticsRetentionDays: 90,
    advancedAnalyticsEnabled: true,
    multiStationAnalyticsEnabled: true,
    exportsEnabled: true,
    advancedBrandingEnabled: true,
    prioritySupport: true,
    featuredPlacementPriority: 'HIGH',
    streamMonitoringIntervalMinutes: 15,
    isPopular: true,
    isActive: true,
    featuresList: [
      'Up to 3 Radio Stations',
      'HD Audio Stream & Backup Stream URL',
      'Sow a Seed & Donation System (3 Campaigns)',
      'Listener Premium Subscriptions Gating',
      '1 Free Featured Directory Badge (3 days/mo)',
      '90 days analytics & CSV report exports',
      'Up to 3 Pinned Announcements in Live Feed',
      'Priority email support (24h turnaround)',
    ],
  },
  {
    id: 'plan_vip',
    name: 'Kingdom Network',
    tier: 'VIP',
    description: 'Ultimate enterprise broadcast suite for multi-station Christian networks.',
    monthlyPriceTzs: 122500,
    annualPriceTzs: 1225000,
    monthlyPriceUsd: 49,
    annualPriceUsd: 490,
    currency: 'USD',
    maxStations: 10,
    featuredMonthlyQuota: 3,
    maxActiveFeatured: 3,
    donationCampaignLimit: 100,
    givingEnabled: true,
    withdrawalsEnabled: true,
    analyticsRetentionDays: 365,
    advancedAnalyticsEnabled: true,
    multiStationAnalyticsEnabled: true,
    exportsEnabled: true,
    advancedBrandingEnabled: true,
    prioritySupport: true,
    featuredPlacementPriority: 'HIGHEST',
    streamMonitoringIntervalMinutes: 5,
    isActive: true,
    featuresList: [
      'Up to 10 Radio Stations',
      'Multi-Region Backup Stream Failover',
      'Unlimited Giving & Crowdfunding (0% fee)',
      'Full Multi-Station Premium Access Gating',
      '3 Free Featured Directory Badges (7 days/mo)',
      '365 days full enterprise analytics & telemetry',
      'Unlimited Pinned Announcements in Live Feed',
      '5-min stream health checks & instant alerts',
      'Dedicated Account Manager & 24/7 Priority Support',
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
