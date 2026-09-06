import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Gift,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Calendar,
  Radio,
  Clock,
  CheckCircle2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  Globe,
  Sun,
  BookOpen,
  Smartphone,
  CreditCard,
  Building2,
} from 'lucide-react';
import { DonationModal } from '../components/modals/DonationModal';
import type { Station, DonationCampaign } from '../types';

interface GivingPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

const GLOBAL_MINISTRY_STATION: Station = {
  id: 'stn_global_gospel',
  name: 'Christian Radios Worldwide Gospel Fund',
  slug: 'global-gospel-fund',
  tagline: 'Supporting gospel radio broadcasts, remote towers & solar transmitters across Africa and the World',
  description: 'Worldwide Christian Radios Gospel Fund supporting transmitters and remote stations.',
  logoUrl: '',
  countryCode: 'TZ',
  city: 'Dar es Salaam & Worldwide',
  language: 'Swahili & English',
  genre: 'Gospel & Christian',
  categoryId: 'cat_all',
  streamUrl: '',
  streamType: 'MP3',
  timezone: 'Africa/Dar_es_Salaam',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  isFeatured: true,
  streamStatus: 'ONLINE',
  ownerId: 'superadmin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function GivingPage({ onNavigate, onOpenAuth }: GivingPageProps) {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Fast Tithe & Seed Offering Widget State
  const [activeVerseIndex, setActiveVerseIndex] = useState(0);
  const [givingPurpose, setGivingPurpose] = useState<
    'TITHE' | 'SEED_OFFERING' | 'TOWER_EXPANSION' | 'SOLAR_POWER' | 'GLOBAL_GOSPEL'
  >('TITHE');
  const [beneficiaryType, setBeneficiaryType] = useState<'GLOBAL' | 'STATION' | 'CAMPAIGN'>('GLOBAL');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [givingCurrency, setGivingCurrency] = useState<'USD' | 'TZS'>('USD');
  const [presetAmount, setPresetAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');

  const scriptures = [
    {
      verse: '2 Corinthians 9:7',
      text: 'Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.',
      theme: 'Cheerful Giving',
    },
    {
      verse: 'Malachi 3:10',
      text: 'Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, says the Lord Almighty, and see if I will not throw open the floodgates of heaven.',
      theme: 'Tithing & Storehouse',
    },
    {
      verse: 'Luke 6:38',
      text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.',
      theme: 'Kingdom Abundance',
    },
    {
      verse: 'Proverbs 3:9-10',
      text: 'Honor the Lord with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing.',
      theme: 'Firstfruits Honor',
    },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [campRes, stnRes] = await Promise.all([
          fetch('/api/public/campaigns').then((r) => r.json()).catch(() => ({ campaigns: [] })),
          fetch('/api/public/stations?limit=100').then((r) => r.json()).catch(() => ({ stations: [] })),
        ]);
        setCampaigns(campRes.campaigns || []);
        const loadedStations: Station[] = stnRes.stations || [];
        setStations(loadedStations);
        if (loadedStations.length > 0) {
          setSelectedStationId(loadedStations[0].id);
        }
        if (campRes.campaigns && campRes.campaigns.length > 0) {
          setSelectedCampaignId(campRes.campaigns[0].id);
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenDonateForStation = (station: Station, campaign?: DonationCampaign) => {
    setSelectedStation(station);
    setSelectedCampaign(campaign || null);
    setShowDonationModal(true);
  };

  const handleOpenDonateForCampaign = (campaign: DonationCampaign) => {
    const stn = stations.find((s) => s.id === campaign.stationId) || {
      ...GLOBAL_MINISTRY_STATION,
      id: campaign.stationId,
      name: campaign.stationName || 'Christian Radio Ministry',
      slug: campaign.stationSlug || 'radio',
    };
    handleOpenDonateForStation(stn, campaign);
  };

  // Launch modal from Fast Tithe Widget
  const handleLaunchFastGiving = (e: React.FormEvent) => {
    e.preventDefault();
    let targetStation: Station = GLOBAL_MINISTRY_STATION;
    let targetCampaign: DonationCampaign | undefined = undefined;

    if (beneficiaryType === 'STATION') {
      const foundStation = stations.find((s) => s.id === selectedStationId);
      if (foundStation) targetStation = foundStation;
    } else if (beneficiaryType === 'CAMPAIGN') {
      const foundCamp = campaigns.find((c) => c.id === selectedCampaignId);
      if (foundCamp) {
        targetCampaign = foundCamp;
        const foundStation = stations.find((s) => s.id === foundCamp.stationId);
        if (foundStation) targetStation = foundStation;
      }
    }

    handleOpenDonateForStation(targetStation, targetCampaign);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.stationName && c.stationName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (c.status === 'ACTIVE' || !c.status)) ||
      (statusFilter === 'COMPLETED' && c.status === 'COMPLETED');
    return matchesSearch && matchesStatus;
  });

  const totalCampaigns = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedCampaigns = filteredCampaigns.slice(
    (validPage - 1) * ITEMS_PER_PAGE,
    validPage * ITEMS_PER_PAGE
  );

  const scrollToCampaigns = () => {
    const el = document.getElementById('giving-campaigns-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 750, behavior: 'smooth' });
    }
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    scrollToCampaigns();
  };

  const totalRaisedAcrossPlatform = campaigns.reduce((sum, c) => sum + (c.amountRaised || 0), 0);
  const totalSupportersCount = campaigns.reduce((sum, c) => sum + (c.supportersCount || 0), 0);

  const usdPresetOptions = [10, 25, 50, 100, 250, 500];
  const tzsPresetOptions = [25000, 50000, 100000, 250000, 500000, 1000000];

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto">
      {/* 1. SCRIPTURE & HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-900 border border-indigo-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Kingdom Giving & Tithing Hub
            </div>
            <div className="flex items-center gap-2">
              {scriptures.map((sc, idx) => (
                <button
                  key={sc.verse}
                  onClick={() => setActiveVerseIndex(idx)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition cursor-pointer ${
                    activeVerseIndex === idx
                      ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sc.verse}
                </button>
              ))}
            </div>
          </div>

          {/* Scripture Callout */}
          <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex items-start gap-4">
            <BookOpen className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm sm:text-base italic text-amber-100/90 font-serif leading-relaxed">
                "{scriptures[activeVerseIndex].text}"
              </p>
              <div className="flex items-center gap-3 text-xs font-bold text-amber-400">
                <span>— {scriptures[activeVerseIndex].verse}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-medium">{scriptures[activeVerseIndex].theme}</span>
              </div>
            </div>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Sow Seeds of Faith to Keep the Gospel on the Airwaves
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Support Christian radio stations, evangelism broadcasts, solar power generators, and transmitter tower upgrades.
              Every dollar and shilling goes directly to keeping God’s message alive in hearts and homes.
            </p>
          </div>

          {/* Platform Giving Impact Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mobilized for Ministry
                </span>
                <div className="text-lg sm:text-xl font-black text-emerald-400">
                  TZS {Number(totalRaisedAcrossPlatform || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Ministry Goals
                </span>
                <div className="text-lg sm:text-xl font-black text-amber-300">
                  {campaigns.filter((c) => c.status === 'ACTIVE' || !c.status).length} Campaigns
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Faithful Seed Sowers
                </span>
                <div className="text-lg sm:text-xl font-black text-rose-400">
                  {totalSupportersCount > 0 ? totalSupportersCount : 920}+ Partners
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FAST TITHE & SEED OFFERING WIDGET */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Instant Giving Portal
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Fast Tithe & Kingdom Seed Offering
              </h2>
              <p className="text-xs text-slate-400">
                Give your tithe or send a ministry seed blessing directly with secure mobile money or card payments.
              </p>
            </div>

            {/* Currency Switcher */}
            <div className="inline-flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setGivingCurrency('USD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  givingCurrency === 'USD'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setGivingCurrency('TZS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  givingCurrency === 'TZS'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TZS (Shilingi)
              </button>
            </div>
          </div>

          <form onSubmit={handleLaunchFastGiving} className="space-y-6">
            {/* Step 1: Purpose / Offering Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Select Giving Purpose
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { id: 'TITHE', label: 'Tithe (10%)', icon: Building2, desc: 'Malachi 3:10 Storehouse' },
                  { id: 'SEED_OFFERING', label: 'Seed Offering', icon: Heart, desc: 'Kingdom Breakthrough' },
                  { id: 'TOWER_EXPANSION', label: 'Transmitter Tower', icon: Radio, desc: 'Signal & Coverage Expansion' },
                  { id: 'SOLAR_POWER', label: 'Solar & Studio Power', icon: Sun, desc: '24/7 Gospel Broadcasting' },
                  { id: 'GLOBAL_GOSPEL', label: 'Global Gospel Fund', icon: Globe, desc: 'Reach the Unreached' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = givingPurpose === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGivingPurpose(item.id as any)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">{item.label}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Beneficiary */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Beneficiary (Where Should Your Gift Go?)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setBeneficiaryType('GLOBAL')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    beneficiaryType === 'GLOBAL'
                      ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Christian Radios Global Fund</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Distributed among verified stations for urgent equipment & bandwidth needs.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBeneficiaryType('STATION')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    beneficiaryType === 'STATION'
                      ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Specific Radio Station</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Send directly to your local church or beloved Christian station.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBeneficiaryType('CAMPAIGN')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    beneficiaryType === 'CAMPAIGN'
                      ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Target className="w-4 h-4 text-rose-400" />
                    <span>Specific Active Campaign</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Support a targeted tower, transmitter, or crusade fundraising goal.
                  </p>
                </button>
              </div>

              {/* Sub-selectors */}
              {beneficiaryType === 'STATION' && (
                <div className="pt-2">
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city || s.countryCode}) {s.verificationStatus === 'VERIFIED' ? '✓ Verified' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {beneficiaryType === 'CAMPAIGN' && (
                <div className="pt-2">
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} — {c.stationName || 'Radio'} (Goal: {c.currency} {c.goalAmount?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Giving Amount Chips & Custom Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Choose Giving Amount ({givingCurrency})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {(givingCurrency === 'USD' ? usdPresetOptions : tzsPresetOptions).map((val) => {
                  const isSelected = presetAmount === val && !customAmount;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setPresetAmount(val);
                        setCustomAmount('');
                      }}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                          : 'bg-slate-950/80 border-slate-800 text-white hover:border-slate-700'
                      }`}
                    >
                      {givingCurrency === 'USD' ? `$${val}` : `${(val / 1000).toLocaleString()}k`}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1">
                <input
                  type="number"
                  placeholder={`Or enter custom amount in ${givingCurrency}...`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Step 4: Multi-Gateway Preview & Submit */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs">
                <span className="font-semibold text-slate-300">Accepted Gateways:</span>
                <span className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-emerald-400">
                  <Smartphone className="w-3 h-3" /> M-Pesa / Tigo / Airtel (PesaPal)
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-sky-400">
                  <Globe className="w-3 h-3" /> PayPal
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-indigo-400">
                  <CreditCard className="w-3 h-3" /> Stripe & Cards
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Heart className="w-4 h-4 fill-slate-950" />
                <span>Give Tithe / Seed Blessing Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. CAMPAIGNS SEARCH & FILTER TOOLBAR */}
      <div id="giving-campaigns-section" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl scroll-mt-24">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by station, tower project, studio..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ACTIVE' ? 'Active Projects' : st === 'COMPLETED' ? 'Completed Goals' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CAMPAIGNS GRID (4 CARDS IN A ROW) */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedCampaigns.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginatedCampaigns.map((camp) => {
              const pct = Math.min(100, Math.round(((camp.amountRaised || 0) / Math.max(1, camp.goalAmount)) * 100));
              const isCompleted = camp.status === 'COMPLETED' || pct >= 100;

              return (
                <div
                  key={camp.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between transition group"
                >
                  {/* Campaign Image or Banner */}
                  <div className="relative h-44 bg-slate-950 overflow-hidden">
                    {camp.imageUrl ? (
                      <img
                        src={camp.imageUrl}
                        alt={camp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-center">
                        <Radio className="w-12 h-12 text-rose-400/40" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-300 flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-rose-400" />
                      <span className="truncate max-w-[140px]">{camp.stationName || 'Christian Radio'}</span>
                    </div>

                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-lg">
                        Goal Reached
                      </div>
                    )}
                  </div>

                  {/* Campaign Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm text-white group-hover:text-rose-300 transition line-clamp-2">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {camp.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-white">
                          {camp.currency || 'USD'} {Number(camp.amountRaised || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400 font-semibold">
                          Goal: {camp.currency || 'USD'} {Number(camp.goalAmount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-rose-400">{pct}% Funded</span>
                        <span>{camp.supportersCount || 0} Supporters</span>
                      </div>
                    </div>

                    {/* Give Button */}
                    <button
                      onClick={() => handleOpenDonateForCampaign(camp)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Support This Campaign</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400">
                Showing{' '}
                <span className="text-white font-bold">
                  {(validPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="text-white font-bold">
                  {Math.min(validPage * ITEMS_PER_PAGE, totalCampaigns)}
                </span>{' '}
                of <span className="text-rose-400 font-bold">{totalCampaigns}</span> campaigns
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={validPage <= 1}
                  title="First Page"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage <= 1}
                  title="Previous Page"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 2)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-slate-600 text-xs font-bold">...</span>}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center ${
                              validPage === p
                                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-md shadow-rose-500/25 ring-1 ring-rose-400'
                                : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(validPage + 1)}
                  disabled={validPage >= totalPages}
                  title="Next Page"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={validPage >= totalPages}
                  title="Last Page"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No campaigns found matching your criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting search filters or browse our stations directly to contribute a general love offering.
          </p>
        </div>
      )}

      {/* 5. DIRECT STATION TITHING & GENERAL GIVING DIRECTORY */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Gift className="w-5 h-5 text-amber-400" />
              Direct Station Tithing & Ministry Support
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any Christian radio station to send a direct tithe, seed offering, or prayer partner gift.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stations.slice(0, 16).map((stn) => (
            <div
              key={stn.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 text-left transition group space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                {stn.logoUrl ? (
                  <img
                    src={stn.logoUrl}
                    alt={stn.name}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Radio className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
                    {stn.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {stn.city || stn.countryCode} {stn.verificationStatus === 'VERIFIED' ? '• Verified' : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenDonateForStation(stn)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-800 hover:border-amber-400 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Give Tithe to Station</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. GIVING MODAL */}
      {selectedStation && (
        <DonationModal
          isOpen={showDonationModal}
          onClose={() => {
            setShowDonationModal(false);
            setSelectedStation(null);
            setSelectedCampaign(null);
          }}
          station={selectedStation}
          campaign={selectedCampaign || undefined}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
}
