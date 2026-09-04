import React, { useState, useEffect } from 'react';
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Radio,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
  HeartHandshake,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TOP_5_CURRENCIES, formatPrice, type SupportedCurrency } from '../data/currencies';
import type { SubscriptionPlan } from '../types';

interface PricingPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function PricingPage({ onNavigate, onOpenAuth, onPublicAction }: PricingPageProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [currency, setCurrency] = useState<SupportedCurrency>('TZS');
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Broadcaster Pricing & Packages — Christian Radios';
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/public/plans');
      if (res.ok) {
        const data = await res.json();
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        } else {
          // Fallback default plans if empty
          setPlans(defaultPlans);
        }
      } else {
        setPlans(defaultPlans);
      }
    } catch {
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const defaultPlans: SubscriptionPlan[] = [
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

  const faqs = [
    {
      q: 'How does station verification work?',
      a: 'When you submit or claim a radio station, our moderation team inspects the live audio stream endpoint (checking for SSRF security and valid audio headers) and verifies your ministry ownership. Verified stations receive a blue checkmark badge in the directory.',
    },
    {
      q: 'Can I import an existing stream from RadioKing, Zeno Media, or AzuraCast?',
      a: 'Yes! Christian Radios supports one-click URL imports. Paste your stream link or public station page URL in the Radio Owner Dashboard to auto-extract station logos, titles, and live audio streams.',
    },
    {
      q: 'How do listener donations and giving work?',
      a: 'Listeners can bless your station directly on your station page or through the Giving Hub using Pesapal (M-Pesa, Tigo Pesa, Airtel Money, Visa, MasterCard, and Bank Wire). Funds are recorded in your Owner Ledger and disbursed directly.',
    },
    {
      q: 'What payment methods do you accept for broadcaster plans?',
      a: 'We support all major East African mobile money wallets (Vodacom M-Pesa, Tigo Pesa, Airtel Money, HaloPesa) and international credit/debit cards via Pesapal 3.0.',
    },
    {
      q: 'Can I cancel or upgrade my plan at any time?',
      a: 'Absolutely. You can upgrade, downgrade, or switch between monthly and annual billing cycles anytime from your Radio Owner Dashboard. Upgrades take effect immediately with pro-rated pricing.',
    },
  ];

  return (
    <div id="pricing-page-root" className="space-y-12 pb-24">
      {/* Page Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Transparent Broadcaster Pricing
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Broadcast Your Christian Ministry to the World
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Join hundreds of verified Christian radio stations streaming 24/7. Select a plan tailored for your broadcast reach and ministry growth.
        </p>

        {/* Currency & Interval Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {/* Billing Cycle Toggle */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center shadow-lg">
            <button
              onClick={() => setBillingInterval('MONTHLY')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingInterval === 'MONTHLY'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval('ANNUAL')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingInterval === 'ANNUAL'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Billing
              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>

          {/* Currency Toggle (Top 5 International Currencies) */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex flex-wrap items-center gap-1 shadow-lg">
            {TOP_5_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currency === c.code
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{c.flag}</span> <span className="ml-1">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mr-3" />
          <span>Loading broadcaster packages...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((p) => {
            const isPopular = p.tier === 'PROFESSIONAL' || (p.tier as string) === 'PRO';
            const baseTzsPrice =
              billingInterval === 'MONTHLY'
                ? p.monthlyPriceTzs || p.monthlyPriceUsd * 2600
                : p.annualPriceTzs || p.annualPriceUsd * 2600;

            const formattedPrice = formatPrice(baseTzsPrice, currency);

            return (
              <div
                key={p.id}
                className={`relative bg-slate-900 border rounded-3xl p-7 flex flex-col justify-between space-y-6 transition-all shadow-xl hover:shadow-2xl ${
                  isPopular
                    ? 'border-sky-500 shadow-sky-500/10 scale-105 z-10 bg-slate-900/90'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular Choice
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description}</p>
                  </div>

                  <div className="py-3 border-y border-slate-800/80">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {formattedPrice}
                      </span>
                      {baseTzsPrice > 0 && (
                        <span className="text-xs text-slate-400 font-medium">
                          / {billingInterval === 'MONTHLY' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {(p.featuresList || p.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      if (onPublicAction) {
                        onPublicAction('ADD_RADIO');
                      } else if (user) {
                        onNavigate('owner');
                      } else {
                        onOpenAuth('register');
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>{baseTzsPrice === 0 ? 'Start Free Broadcast' : 'Choose Plan'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Featured Spotlight Banner Promotion */}
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4" />
            Station Promotion & Directory Spotlight
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Want Top Directory Placement & Homepage Spotlight?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Amplify your reach by featuring your radio station on the Christian Radios Homepage Hero carousel and top directory placement. Includes verified gold badge and social highlight.
          </p>
        </div>

        <button
          onClick={() => {
            if (user) {
              onNavigate('owner');
            } else {
              onOpenAuth('register');
            }
          }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 transition-all cursor-pointer"
        >
          <span>Promote Station Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-sky-400" />
            Frequently Asked Questions for Broadcasters
          </h2>
          <p className="text-xs text-slate-400">
            Everything you need to know about publishing, streaming, and managing your radio station.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 font-bold text-sm text-white flex items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 sm:p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
