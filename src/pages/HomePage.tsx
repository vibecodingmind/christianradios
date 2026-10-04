import React, { useEffect, useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Compass,
  Layers,
  Sparkles,
  Globe,
  Heart,
  Flame,
  Volume2,
  CheckCircle2,
  Users,
  Award,
  Gem,
  Signal,
  Gift,
  ArrowRight,
  Star,
  Activity,
  Headphones,
  Music,
  HeartHandshake,
  BookOpen,
  Check,
  Zap,
  MessageSquare,
  ShieldCheck,
  Quote,
  HelpCircle,
  ChevronDown,
  Bookmark,
  Search,
  SlidersHorizontal,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { StationCard } from '../components/station/StationCard';
import { Carousel } from '../components/common/Carousel';
import { PrayerPublisherAvatar } from '../components/common/PrayerPublisherAvatar';
import { apiFetch } from '../lib/api';
import type { Category, Country, Station, SubscriptionPlan, PrayerRequest, StationReview } from '../types';

const defaultPlans: SubscriptionPlan[] = [
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

const defaultReviews: StationReview[] = [
  {
    id: 'rev_001',
    stationId: 'stn_radio_maria_tz',
    stationSlug: 'radio-maria-tanzania',
    stationName: 'Radio Maria Tanzania',
    authorName: 'Theresia M.',
    rating: 5,
    title: 'A constant source of spiritual nourishment and peace',
    testimony: 'Every morning at 5:00 AM I tune into morning prayers. Radio Maria has transformed my home atmosphere and brought immense calm during difficult seasons.',
    countryCode: 'TZ',
    city: 'Dar es Salaam',
    isApproved: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rev_002',
    stationId: 'stn_safina_fm',
    stationSlug: 'radio-safina-arusha',
    stationName: 'Radio Safina 92.6 FM',
    authorName: 'Baraka Joshua',
    rating: 5,
    title: 'Exceptional teaching sermons and pure worship!',
    testimony: 'Radio Safina provides solid sound biblical teaching. The audio stream quality on Christian Radios is crystal clear without buffering even on mobile data.',
    countryCode: 'TZ',
    city: 'Arusha',
    isApproved: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rev_003',
    stationId: 'stn_worship_fm_ke',
    stationSlug: 'worship-fm-kenya',
    stationName: 'Worship FM Nairobi',
    authorName: 'Grace Wambui',
    rating: 5,
    title: 'Blessed beyond measure by the non-stop praise',
    testimony: 'I listen while working in Nairobi. The platform layout makes it super easy to discover stations across East Africa!',
    countryCode: 'KE',
    city: 'Nairobi',
    isApproved: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rev_004',
    stationId: 'stn_upendo_fm',
    stationSlug: 'upendo-fm-tanzania',
    stationName: 'Upendo FM 107.7',
    authorName: 'David K.',
    rating: 5,
    title: 'Connecting believers across urban & rural areas',
    testimony: 'Upendo FM has been a blessing to our congregation. The online donation campaigns on this platform helped fund our station outreach equipment!',
    countryCode: 'TZ',
    city: 'Dodoma',
    isApproved: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rev_005',
    stationId: 'stn_hallelujah_fm',
    stationSlug: 'hallelujah-radio-ug',
    stationName: 'Hallelujah Radio Kampala',
    authorName: 'Sarah Namubiru',
    rating: 5,
    title: 'Incredible app experience and stream reliability',
    testimony: 'The audio player never drops signal. Being able to stream our favorite gospel station anywhere in Uganda is a huge blessing.',
    countryCode: 'UG',
    city: 'Kampala',
    isApproved: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rev_006',
    stationId: 'stn_praise_fm',
    stationSlug: 'praise-radio-rwanda',
    stationName: 'Praise Radio Kigali',
    authorName: 'Emmanuel K.',
    rating: 5,
    title: 'Unified platform for Christian broadcasting',
    testimony: 'Finally a modern discovery hub dedicated exclusively to Christian stations. Highly recommended for broadcasters and listeners alike.',
    countryCode: 'RW',
    city: 'Kigali',
    isApproved: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
];

const popularCountries = [
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', count: '45+' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', count: '38+' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', count: '24+' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', count: '16+' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', count: '65+' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', count: '52+' },
  { code: 'US', name: 'United States', flag: '🇺🇸', count: '120+' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', count: '40+' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', count: '85+' },
];

const categoryChips = [
  { id: 'worship', label: 'Praise & Worship', icon: '🎵', slug: 'praise-worship' },
  { id: 'teaching', label: 'Bible Teaching', icon: '📖', slug: 'sound-doctrine-teachings' },
  { id: 'prayer', label: 'Prayer & Deliverance', icon: '🙏', slug: 'prayer-deliverance' },
  { id: 'gospel', label: 'Gospel Classics', icon: '📻', slug: 'gospel-music' },
  { id: 'talk', label: 'Christian Talk', icon: '🗣️', slug: 'christian-talk' },
];

const TOP_MUSIC_COLLECTIONS = [
  { name: 'Praise & Worship', slug: 'praise-worship', icon: '🎵', desc: 'Non-stop adoration & praise', color: 'from-amber-500/20 via-orange-500/10 to-transparent', border: 'border-amber-500/30', accent: 'text-amber-400' },
  { name: 'Gospel Classics', slug: 'gospel-music', icon: '📻', desc: 'African & Global choirs', color: 'from-rose-500/20 via-pink-500/10 to-transparent', border: 'border-rose-500/30', accent: 'text-rose-400' },
  { name: 'Adventist (AWR)', slug: 'adventist-world-radios', icon: '🌍', desc: 'AWR multi-lingual feeds', color: 'from-sky-500/20 via-indigo-500/10 to-transparent', border: 'border-sky-500/30', accent: 'text-sky-400' },
  { name: 'Bible Teaching', slug: 'sound-doctrine-teachings', icon: '📖', desc: 'Sound sermons & gospel truth', color: 'from-emerald-500/20 via-teal-500/10 to-transparent', border: 'border-emerald-500/30', accent: 'text-emerald-400' },
  { name: 'Swahili Gospel', slug: 'swahili-gospel', icon: '🇹🇿', desc: 'Nyimbo za Injili & Ibada', color: 'from-blue-500/20 via-cyan-500/10 to-transparent', border: 'border-blue-500/30', accent: 'text-blue-400' },
  { name: 'Afro Gospel', slug: 'afro-gospel', icon: '⚡', desc: 'High-energy African praise', color: 'from-yellow-500/20 via-amber-500/10 to-transparent', border: 'border-yellow-500/30', accent: 'text-yellow-400' },
  { name: 'Hip-Hop & Youth', slug: 'christian-hip-hop', icon: '🔥', desc: 'Urban contemporary gospel', color: 'from-purple-500/20 via-fuchsia-500/10 to-transparent', border: 'border-purple-500/30', accent: 'text-purple-400' },
  { name: 'Instrumental', slug: 'prayer-deliverance', icon: '🕊️', desc: 'Peaceful prayer atmosphere', color: 'from-cyan-500/20 via-sky-500/10 to-transparent', border: 'border-cyan-500/30', accent: 'text-cyan-400' },
];


export interface HomePageProps {
  initialSearch?: string;
  initialCategory?: string;
  initialCountry?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function HomePage({
  initialSearch = '',
  initialCategory = '',
  initialCountry = '',
  onNavigate,
  onOpenAuth,
  onPublicAction,
}: HomePageProps) {
  const { user } = useAuth();
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();

  const [allStations, setAllStations] = useState<Station[]>([]);
  const [featuredStations, setFeaturedStations] = useState<Station[]>([]);
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [prayedIds, setPrayedIds] = useState<Record<string, number>>({});

  // Full Directory State on Discover
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStations, setTotalStations] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [directoryStations, setDirectoryStations] = useState<Station[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
      setPage(1);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialCountry !== undefined) {
      setSelectedCountry(initialCountry);
      setPage(1);
    }
  }, [initialCountry]);

  useEffect(() => {
    async function fetchTaxonomies() {
      try {
        const [catRes, countRes] = await Promise.all([
          apiFetch('/api/public/categories'),
          apiFetch('/api/public/countries'),
        ]);
        if (catRes.ok) setCategories((await catRes.json()).categories || []);
        if (countRes.ok) setCountries((await countRes.json()).countries || []);
      } catch (err) {
        console.error('Failed to load taxonomies:', err);
      }
    }
    fetchTaxonomies();
  }, []);

  useEffect(() => {
    async function fetchDirectoryStations() {
      setLoadingDirectory(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '24');
        if (search) params.set('search', search);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedCategory) params.set('category', selectedCategory);
        if (sortBy) params.set('sortBy', sortBy);

        const res = await apiFetch(`/api/public/stations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDirectoryStations(data.stations || []);
          const totalPg = data.pagination?.totalPages ?? data.totalPages ?? 1;
          const totalStns = data.pagination?.total ?? data.total ?? (data.stations ? data.stations.length : 0);
          setTotalPages(totalPg);
          setTotalStations(totalStns);
        }
      } catch (err) {
        console.error('Failed to load directory stations:', err);
      } finally {
        setLoadingDirectory(false);
      }
    }
    fetchDirectoryStations();
  }, [page, search, selectedCountry, selectedCategory, sortBy]);

  const resetDirectoryFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSortBy('popular');
    setPage(1);
  };

  const hasActiveDirectoryFilters = Boolean(search || selectedCountry || selectedCategory || sortBy !== 'popular');

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [stnRes, featRes, prayerRes, planRes, reviewRes] = await Promise.all([
          apiFetch('/api/public/stations?limit=32'),
          apiFetch('/api/public/featured'),
          apiFetch('/api/public/prayers'),
          apiFetch('/api/public/plans'),
          apiFetch('/api/public/reviews'),
        ]);

        let loadedStations: Station[] = [];
        if (stnRes.ok) {
          const data = await stnRes.json();
          loadedStations = data.stations || [];
          setAllStations(loadedStations);
        }

        if (featRes.ok) {
          const data = await featRes.json();
          setFeaturedStations(data.stations || []);
        } else {
          setFeaturedStations(loadedStations.filter((s) => s.isFeatured));
        }

        const sortedRecent = [...loadedStations].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentStations(sortedRecent);

        if (prayerRes.ok) {
          const data = await prayerRes.json();
          setPrayerRequests(data.prayers || []);
        }

        if (planRes.ok) {
          const data = await planRes.json();
          setPlans(data.plans && data.plans.length > 0 ? data.plans : defaultPlans);
        } else {
          setPlans(defaultPlans);
        }

        if (reviewRes.ok) {
          const data = await reviewRes.json();
          setReviews(data.reviews && data.reviews.length > 0 ? data.reviews : defaultReviews);
        } else {
          setReviews(defaultReviews);
        }
      } catch (err) {
        console.error('Failed to load homepage discovery data:', err);
        setPlans(defaultPlans);
        setReviews(defaultReviews);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const handlePray = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/public/prayers/${id}/pray`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPrayedIds((prev) => ({ ...prev, [id]: data.count }));
        setPrayerRequests((prev) =>
          prev.map((p) => (p.id === id ? { ...p, prayedCount: data.count } : p))
        );
      }
    } catch {}
  };

  // Top 3 Featured Hero Stations for large screens (Tablet/Desktop/TV showcase)
  const heroStations = (() => {
    const list = featuredStations.length > 0 ? featuredStations : allStations;
    return list.slice(0, 3);
  })();

  return (
    <div className="space-y-12 sm:space-y-14 pb-28 animate-page-fade-up">
      {/* ========================================================================= */}
      {/* 1. APP HERO: FEATURED BROADCASTS SHOWCASE (3-Cards Side-by-Side on Desktop) */}
      {/* ========================================================================= */}
      {heroStations.length > 0 && (
        <section aria-label="Featured Live Broadcasts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Featured Live Broadcasts
              </h2>
            </div>
            <button
              onClick={() => onNavigate('directory', 'sort:popular')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Explore All</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">
            {heroStations.map((stn, idx) => {
              const isCurrent = currentStation?.id === stn.id;
              const isThisPlaying = isCurrent && isPlaying;
              const flagEmoji = stn.country?.flagEmoji || '🌍';
              const countryName = stn.country?.name || stn.countryCode || 'Global';

              return (
                <div
                  key={stn.id}
                  onClick={() => onNavigate('station', stn.slug || stn.id)}
                  className={`relative rounded-3xl overflow-hidden p-5 sm:p-6 flex flex-col justify-between h-72 sm:h-80 border transition-all duration-300 group cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 ${
                    isThisPlaying
                      ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20'
                      : 'border-slate-800/90 hover:border-sky-500/40 bg-slate-900'
                  }`}
                >
                  {/* Background Artwork + Dark Gradient Overlay */}
                  <img
                    src={
                      stn.coverUrl ||
                      stn.logoUrl ||
                      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80'
                    }
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-105 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/30 pointer-events-none" />

                  {/* Top Badges Row */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Featured
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-900/80 border border-slate-700/60 text-slate-300 backdrop-blur-md">
                      <Users className="w-3 h-3 text-sky-400" />
                      <span>{stn.currentListenersCount ? `${stn.currentListenersCount.toLocaleString()} tuned in` : '1.2k listening'}</span>
                    </div>
                  </div>

                  {/* Bottom Content & Play Action */}
                  <div className="relative z-10 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold">
                        <span>{flagEmoji}</span>
                        <span>{countryName}</span>
                        {stn.genre && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">{stn.genre}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white truncate group-hover:text-sky-300 transition-colors">
                        {stn.name}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-1 font-medium">
                        {stn.tagline || stn.description || '24/7 Live Christian Radio Broadcasting'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) {
                            togglePlay();
                          } else {
                            playStation(stn);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                          isThisPlaying
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                            : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25'
                        }`}
                      >
                        {isThisPlaying ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              <span className="w-0.5 bg-slate-950 h-3 rounded-full animate-bounce" style={{ animationDuration: '0.4s' }} />
                              <span className="w-0.5 bg-slate-950 h-4 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                              <span className="w-0.5 bg-slate-950 h-2.5 rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
                            </div>
                            <span>Pause Live</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Listen Now</span>
                          </>
                        )}
                      </button>

                      {stn.frequency && (
                        <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                          {stn.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP MUSIC GENRES & COLLECTIONS (8 App Style Cards)                      */}
      {/* ========================================================================= */}
      <section aria-label="Top Music Genres" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>Top Music Genres &amp; Formats</span>
            </h2>
            <p className="text-xs text-slate-400">
              Browse uplifting worship, praise, biblical teachings, and local language stations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>All Genres</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-3.5">
          {TOP_MUSIC_COLLECTIONS.map((genre) => (
            <button
              key={genre.slug}
              onClick={() => onNavigate('category', genre.slug)}
              className={`p-3.5 rounded-2xl bg-gradient-to-b ${genre.color} bg-slate-900/90 border ${genre.border} hover:scale-102 hover:border-sky-400/50 shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between h-28`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{genre.icon}</span>
                <span className={`text-[10px] font-bold ${genre.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  →
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-sky-300 truncate transition-colors">
                  {genre.name}
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {genre.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DISCOVER LIVE CHRISTIAN RADIOS (ALL STATIONS DIRECTORY)                */}
      {/* ========================================================================= */}
      <section id="discover-stations" aria-label="Discover Christian Radios" className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Broadcast Catalog</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-sky-400" />
              <span>Discover Christian Radios</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Listen to 24/7 verified Christian radio stations from East Africa and around the globe. Filter by country, genre, or search directly.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
              <strong className="text-amber-400">{totalStations.toLocaleString()}</strong> Stations Online
            </span>
            {hasActiveDirectoryFilters && (
              <button
                onClick={resetDirectoryFilters}
                className="px-3 py-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Taxonomy Filters & Sort Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-3.5 sm:p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
          {/* Top Row: Search + Country + Category + Sort */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search stations by name, city, frequency, or tag..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-9 pr-8 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Country Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">🌍 All Countries ({countries.length || '10+'})</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flagEmoji || '🏳️'} {c.name}
                  </option>
                ))}
              </select>
              <Globe className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">🎵 All Genres ({categories.length || '15+'})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="popular">🔥 Most Popular</option>
                <option value="trending">⚡ Trending</option>
                <option value="newest">✨ Newest</option>
                <option value="name">🔤 Name (A-Z)</option>
              </select>
              <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              Filter:
            </span>
            <button
              onClick={() => {
                setSelectedCategory('');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                !selectedCategory
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-extrabold'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              All
            </button>
            {categoryChips.map((chip) => {
              const isSelected = selectedCategory === chip.slug;
              return (
                <button
                  key={chip.slug}
                  onClick={() => {
                    setSelectedCategory(isSelected ? '' : chip.slug);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-extrabold'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
          <div>
            Showing <span className="text-white font-bold">{totalStations > 0 ? (page - 1) * 24 + 1 : 0}–{Math.min(page * 24, totalStations)}</span> of <span className="text-amber-400 font-bold">{totalStations.toLocaleString()}</span> stations
          </div>
          {loadingDirectory && (
            <div className="flex items-center gap-2 text-sky-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Loading stations...</span>
            </div>
          )}
        </div>

        {/* Radio Cards Grid */}
        {loadingDirectory ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 h-60 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-800/60 rounded-2xl" />
                <div className="space-y-2 mt-3">
                  <div className="h-4 bg-slate-800/80 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : directoryStations.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4 px-4">
            <Compass className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">No stations matched your search</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                We couldn&apos;t find any stations matching &ldquo;{search}&rdquo;. Try another search term or reset your category/country filters.
              </p>
            </div>
            {hasActiveDirectoryFilters && (
              <button
                onClick={resetDirectoryFilters}
                className="px-5 py-2.5 rounded-2xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
            {directoryStations.map((stn) => (
              <StationCard
                key={stn.id}
                station={stn}
                variant="featured"
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {(totalPages > 1 || totalStations > 24) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400">
              Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (page > 1) {
                    setPage(1);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page <= 1}
                title="First Page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (page > 1) {
                    setPage((p) => p - 1);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page <= 1}
                title="Previous Page"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-600 font-bold text-xs">...</span>}
                        <button
                          onClick={() => {
                            setPage(p);
                            document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            page === p
                              ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md shadow-sky-500/20'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage((p) => p + 1);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page >= totalPages}
                title="Next Page"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>

              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage(totalPages);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page >= totalPages}
                title="Last Page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. SUPPORT / DONATION CARDS (5 CARDS IN 1 ROW - PREMIUM REDESIGN) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              <span>Ministry Giving & Stewardship</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Support Radio Ministries
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Partner with verified broadcasting ministries to keep gospel streams alive globally.
            </p>
          </div>
          <button
            onClick={() => onNavigate('giving')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <span>View All Campaigns</span> <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {allStations.slice(0, 5).map((stn, index) => {
            // Simulated realistic goal & progress metrics for visualization
            const percentages = [72, 85, 48, 91, 64];
            const percent = percentages[index % percentages.length];
            const goalAmount = (index + 1) * 500 + 1000;
            const formattedGoal = `$${goalAmount.toLocaleString()}`;
            const formattedRaised = `$${Math.round((goalAmount * percent) / 100).toLocaleString()}`;

            return (
              <div
                key={stn.id}
                onClick={() => onNavigate('station', stn.slug || stn.id)}
                className="group relative bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border border-slate-800/90 hover:border-rose-500/60 rounded-3xl p-5 shadow-xl hover:shadow-2xl hover:shadow-rose-500/15 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden backdrop-blur-xl"
              >
                {/* Glowing Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-sky-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                {/* Header: Station Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={stn.logoUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
                        alt={stn.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700/80 bg-slate-950 ring-2 ring-rose-500/20 group-hover:ring-rose-500/60 transition-all shadow-md"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                            img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                          }
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs bg-slate-900/90 p-0.5 rounded-md border border-slate-700">
                        {stn.country?.flagEmoji || '🌍'}
                      </span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full shrink-0">
                      {percent}% Funded
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                      {stn.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {stn.city ? `${stn.city}, ` : ''}{stn.country?.name || 'Global Ministry'}
                    </p>
                  </div>
                </div>

                {/* Campaign Progress Meter */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Raised</span>
                    <div className="text-right">
                      <span className="font-extrabold text-rose-400">{formattedRaised}</span>
                      <span className="text-slate-400 text-[10px]"> / {formattedGoal}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 h-full rounded-full transition-all duration-1000 group-hover:brightness-110 shadow-sm"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Bless Station Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('station', stn.slug || stn.id);
                  }}
                  className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white text-white group-hover/btn:scale-125 transition-transform" />
                  <span>Bless Station</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. LATEST RADIOS (6 CARDS PER ROW DENSITY) */}
      <Carousel
        title="Latest Radios"
        subtitle="Newly published stations on the platform."
        icon={<Sparkles className="w-5 h-5 text-sky-400" />}
        onNavigate={onNavigate}
        itemClassName="w-[70vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-14px)] lg:w-[calc(20%-14px)] xl:w-[calc(16.666%-14px)] shrink-0 snap-start"
      >
        {recentStations.map((stn) => (
          <StationCard
            key={stn.id}
            station={stn}
            variant="recently-added"
            onNavigate={onNavigate}
          />
        ))}
      </Carousel>

      {/* 8. LISTENER & BROADCASTER VALUE PROPOSITION SHOWCASE (ENTERPRISE REDESIGN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: For Radio Listeners */}
        <div className="group relative rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/80 border border-sky-500/30 hover:border-sky-500/60 space-y-8 shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 overflow-hidden backdrop-blur-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/15 transition-all" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3.5 py-1.5 rounded-full shadow-inner">
                <Headphones className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>For Radio Listeners</span>
              </span>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                100% Free Forever
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Spiritual Upliftment & Audio Discovery
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-medium">
                Stream 24/7 high-fidelity Christian broadcasts, worship, sermons, and prayer channels from every continent.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-sky-500/30 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 shadow-sm">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">24/7 Low-Latency HD Streaming</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Crisp, buffer-free live audio player optimized for both mobile data networks and desktop browsers.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Direct Ministry Giving & Stewardship</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Support verified radio station ministries directly via M-Pesa, AirtelMoney, TigoPesa, or Visa/Mastercard.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/30 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Intercessory Global Prayer Wall</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Submit personal prayer requests or join thousands of believers standing in agreement globally.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('directory')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Start Exploring Live Radios</span>
            </button>
          </div>
        </div>

        {/* Card 2: For Radio Broadcasters */}
        <div className="group relative rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/80 border border-emerald-500/30 hover:border-emerald-500/60 space-y-8 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden backdrop-blur-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full shadow-inner">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>For Radio Broadcasters</span>
              </span>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                Broadcaster Workspace
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Amplify & Manage Your Radio Ministry
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-medium">
                Professional broadcasting platform tools to list your stream, track real-time analytics, and receive ministry gifts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/30 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Radio Owner Studio Workspace</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Dedicated owner dashboard to update station metadata, stream URLs, logos, schedules, and social links.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-sky-500/30 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Real-Time Listener Analytics</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Monitor peak listening hours, geographic audience heatmaps, active user sessions, and stream health.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Embeddable 24/7 Church Web Player</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Embed your live 24/7 station player widget directly on your own church or ministry website with zero coding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10 border-t border-slate-800/80">
            <button
              onClick={() => {
                if (user?.role === 'STATION_OWNER') {
                  onNavigate('owner');
                } else if (onPublicAction) {
                  onPublicAction('ADD_RADIO');
                } else {
                  onOpenAuth('register');
                }
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Radio className="w-4 h-4" />
              <span>{user?.role === 'STATION_OWNER' ? 'Go to Broadcaster Workspace' : 'Add Your Radio Station'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 9. PRAYER REQUESTS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Community Prayer Requests
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Join brethren across the globe in prayer and intercession.
            </p>
          </div>
          <button
            onClick={() => onNavigate('prayer')}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
          >
            Submit Prayer Request <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prayerRequests.slice(0, 3).map((pr) => (
            <div
              key={pr.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase">
                    {pr.category || 'Intercession'}
                  </span>
                  <span className="text-xs text-slate-400">{pr.countryCode || 'TZ'} 🇹anzania</span>
                </div>
                <h3 className="font-bold text-base text-white">{pr.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {pr.prayerPoints || pr.title}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <PrayerPublisherAvatar
                    authorName={pr.authorName}
                    authorAvatar={pr.authorAvatar}
                    isAnonymous={pr.isAnonymous}
                    size="sm"
                  />
                  <span className="text-xs font-semibold text-slate-300 truncate">
                    {pr.authorName || 'Anonymous Believer'}
                  </span>
                </div>
                <button
                  onClick={(e) => handlePray(pr.id, e)}
                  className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0"
                >
                  <span>🙏 I Prayed</span>
                  <span className="bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded-md text-[10px]">
                    {prayedIds[pr.id] || pr.prayedCount || 1}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 11. REVIEWS / TESTIMONIALS SLIDER */}
      <Carousel
        title="Reviews from Radios & Listeners"
        subtitle="Hear what broadcasters and listeners say about Christian Radios across the globe."
        icon={<Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />}
        itemClassName="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(25%-14px)] shrink-0 snap-start"
      >
        {reviews.map((rev) => {
          const initials = rev.authorName
            ? rev.authorName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : 'CR';

          return (
            <div
              key={rev.id}
              className="h-full bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950 border border-slate-800 hover:border-amber-500/50 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 rounded-3xl p-6 relative flex flex-col justify-between space-y-5 hover:-translate-y-1.5 transition-all duration-300 group"
            >
              <Quote className="w-12 h-12 text-slate-800/40 absolute top-4 right-4 pointer-events-none group-hover:text-amber-500/10 transition-colors" />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                    <span className="text-[11px] font-bold text-amber-400 ml-1">5.0</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                  "{rev.title}"
                </h4>
                <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed italic">
                  "{rev.testimony}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-sky-500 font-extrabold text-white text-xs flex items-center justify-center shrink-0 shadow-md">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate">{rev.authorName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{rev.city || 'Tanzania'} 🇹anzania</div>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-xl truncate max-w-[100px] shrink-0">
                  {rev.stationName || 'Radio Listener'}
                </span>
              </div>
            </div>
          );
        })}
      </Carousel>
    </div>
  );
}
