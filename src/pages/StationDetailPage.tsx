import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  Share2,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  Radio,
  Calendar,
  Clock,
  Sparkles,
  Signal,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Activity,
  ArrowLeft,
  Code,
  HeartHandshake,
  Star,
  Bell,
  Check,
  MessageSquareHeart,
  Plus,
  Volume2,
  VolumeX,
  Flame,
  Users,
  MessageCircle,
  Copy,
  Gift,
  Coins,
  Headphones,
  MapPin,
  ChevronRight,
  Music,
  Target,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { StationCard } from '../components/station/StationCard';
import { ReportModal } from '../components/station/ReportModal';
import { ShareModal } from '../components/station/ShareModal';
import { DonationModal } from '../components/modals/DonationModal';
import { EmbedCodeModal } from '../components/modals/EmbedCodeModal';
import { PrayerRequestModal } from '../components/modals/PrayerRequestModal';
import { WriteReviewModal } from '../components/modals/WriteReviewModal';
import { apiFetch } from '../lib/api';
import type { Station, StationReview, NowPlayingInfo, DonationCampaign } from '../types';

interface StationDetailPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

interface RecentDonation {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  fundType: string;
  message?: string;
  createdAt: string;
}

export function StationDetailPage({ slug, onNavigate }: StationDetailPageProps) {
  const [station, setStation] = useState<Station | null>(null);
  const [relatedStations, setRelatedStations] = useState<Station[]>([]);
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [totalDonationsCount, setTotalDonationsCount] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);

  // Amen & Praise Reactions
  const [amenCount, setAmenCount] = useState<number>(142);
  const [hasAmened, setHasAmened] = useState<boolean>(false);
  const [floatingAmens, setFloatingAmens] = useState<{ id: number; x: number }[]>([]);

  // Engagement States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'schedule' | 'reviews' | 'frequencies' | 'giving'>('about');
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);

  // Modals
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();
  const { user } = useAuth();

  const loadAllStationData = async () => {
    try {
      setLoading(true);
      const [stnRes, revRes, npRes, donRes, amenRes, campRes] = await Promise.all([
        fetch(`/api/public/stations/${slug}`).then((r) => r.json()),
        fetch(`/api/public/stations/${slug}/reviews`).then((r) => r.json()).catch(() => ({ reviews: [], avgRating: 5.0 })),
        fetch(`/api/public/stations/${slug}/now-playing`).then((r) => r.json()).catch(() => null),
        fetch(`/api/public/stations/${slug}/donations`).then((r) => r.json()).catch(() => ({ donations: [], totalDonationsCount: 0 })),
        fetch(`/api/public/stations/${slug}/amen`).then((r) => r.json()).catch(() => ({ amenCount: 142 })),
        fetch(`/api/public/stations/${slug}/campaigns`).then((r) => r.json()).catch(() => ({ campaigns: [] })),
      ]);

      if (campRes?.campaigns) {
        setCampaigns(campRes.campaigns);
      }

      if (stnRes.station) {
        const stn = stnRes.station;
        setStation(stn);
        setFavoriteCount(stn.favoriteCount || 0);
        setRelatedStations(stnRes.relatedStations || []);

        if (user) {
          try {
            const statusRes = await apiFetch(`/api/listener/station-status/${stn.id}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              setIsFavorite(statusData.isFavorite);
              setIsFollowing(statusData.isFollowing);
            }
          } catch (e) {
            // Non-blocking
          }
        }
      }
      setReviews(revRes.reviews || []);
      setAvgRating(revRes.avgRating || 5.0);
      setNowPlaying(npRes);
      if (donRes.donations) {
        setRecentDonations(donRes.donations);
        setTotalDonationsCount(donRes.totalDonationsCount || donRes.donations.length);
      }
      if (amenRes && typeof amenRes.amenCount === 'number') {
        setAmenCount(amenRes.amenCount);
      }
    } catch (err) {
      console.error('Failed to load station:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStationData();
  }, [slug, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Please sign in to favorite this station.');
      return;
    }
    if (!station || engagementLoading) return;

    setEngagementLoading(true);
    try {
      const res = await apiFetch('/api/listener/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
        setFavoriteCount(data.favoriteCount);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      alert('Please sign in to follow this broadcaster.');
      return;
    }
    if (!station || engagementLoading) return;

    setEngagementLoading(true);
    try {
      const res = await apiFetch('/api/listener/following/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleAmenPraise = async () => {
    if (!station) return;
    setAmenCount((prev) => prev + 1);
    setHasAmened(true);

    // Floating heart visual animation
    const newId = Date.now();
    const randomOffset = Math.random() * 40 - 20;
    setFloatingAmens((prev) => [...prev, { id: newId, x: randomOffset }]);
    setTimeout(() => {
      setFloatingAmens((prev) => prev.filter((a) => a.id !== newId));
    }, 1800);

    try {
      await fetch(`/api/public/stations/${station.slug}/amen`, { method: 'POST' });
    } catch {}
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Connecting to high-fidelity audio stream & station studio...</p>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Station Not Found</h2>
        <p className="text-xs text-slate-400">The requested Christian radio station does not exist.</p>
        <button
          onClick={() => onNavigate('directory')}
          className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isCurrent = currentStation?.id === station.id;
  const isThisPlaying = isCurrent && isPlaying;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Simulated FM frequencies list for East African & global broadcast networks
  const stationFrequencies = [
    { city: station.city || 'Headquarters', freq: '98.7 FM', coverage: 'Primary City Transmitter' },
    { city: 'Dar es Salaam', freq: '102.3 FM', coverage: 'Coastal Metro & Islands' },
    { city: 'Arusha & Moshi', freq: '91.5 FM', coverage: 'Northern Highlands & Mt. Kilimanjaro' },
    { city: 'Mwanza & Lake Victoria', freq: '96.1 FM', coverage: 'Lake Zone & Rock City' },
    { city: 'Dodoma', freq: '89.3 FM', coverage: 'Capital Region & Central Plateau' },
    { city: 'Mbeya & Iringa', freq: '104.5 FM', coverage: 'Southern Highlands' },
    { city: 'Online Digital Global', freq: 'HD Audio 128k', coverage: 'Worldwide Web & Mobile App' },
  ];

  return (
    <div className="space-y-8 pb-28">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('directory')}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Discover
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline-block">Christian Radios</span>
          <span className="text-slate-600 hidden sm:inline-block">/</span>
          <span className="text-xs text-slate-300 font-medium">{station.country?.name}</span>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-sky-400 font-bold truncate max-w-[140px] sm:max-w-none">{station.name}</span>
        </div>
      </div>

      {/* Hero Station Profile Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Banner Cover Artwork */}
        <div className="h-52 sm:h-72 w-full relative bg-slate-950 overflow-hidden">
          <img
            src={station.coverUrl || station.logoUrl}
            alt={station.name}
            className="w-full h-full object-cover blur-md opacity-40 scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-950/40" />

          {/* Floating Audio Waveform Equalizer when Playing */}
          {isThisPlaying && (
            <div className="absolute top-4 right-6 flex items-end gap-1.5 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-sky-500/30">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mr-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Broadcast
              </span>
              <span className="w-1 bg-sky-400 h-5 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
              <span className="w-1 bg-sky-400 h-7 rounded-full animate-bounce" style={{ animationDuration: '0.4s' }} />
              <span className="w-1 bg-indigo-400 h-3 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }} />
              <span className="w-1 bg-sky-400 h-6 rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
              <span className="w-1 bg-sky-300 h-4 rounded-full animate-bounce" style={{ animationDuration: '0.7s' }} />
            </div>
          )}
        </div>

        {/* Profile Header Elements */}
        <div className="px-6 sm:px-10 pb-8 -mt-24 sm:-mt-28 relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          {/* Logo & Title & Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 w-full lg:w-auto">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-900 shadow-2xl">
                <img src={station.logoUrl} alt={station.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              {isThisPlaying && (
                <div className="absolute inset-0 rounded-3xl ring-4 ring-sky-400/60 ring-offset-2 ring-offset-slate-900 pointer-events-none animate-pulse" />
              )}
            </div>

            <div className="space-y-2 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full">
                  {station.genre}
                </span>

                {station.verificationStatus === 'VERIFIED' && (
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Station
                  </span>
                )}

                <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <Signal className="w-3.5 h-3.5 text-sky-400" /> {station.bitrateKbps || 128} kbps HD
                </span>

                {reviews.length > 0 && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {avgRating} ({reviews.length})
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {station.name}
              </h1>

              {station.tagline && (
                <p className="text-xs sm:text-sm text-sky-300 italic font-medium">"{station.tagline}"</p>
              )}

              <p className="text-xs text-slate-300 flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="text-base">{station.country?.flagEmoji || '🌍'}</span>
                <span className="font-semibold text-white">
                  {station.city}, {station.country?.name}
                </span>
                <span className="text-slate-500">•</span>
                <span>Language: <strong className="text-slate-200">{station.language}</strong></span>
                {station.denomination && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{station.denomination}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons Hub */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            {/* Primary Listen Live Button */}
            <button
              onClick={() => {
                if (isCurrent) {
                  togglePlay();
                } else {
                  playStation(station);
                }
              }}
              className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                isThisPlaying
                  ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-sky-400/30'
                  : 'bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25'
              }`}
            >
              {isCurrent && isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : isThisPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Broadcast</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span>Listen Live</span>
                </>
              )}
            </button>

            {/* Prominent DONATE / BLESS MINISTRY Button */}
            <button
              onClick={() => setShowDonation(true)}
              className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition hover:scale-105 active:scale-95"
            >
              <Heart className="w-4 h-4 fill-slate-950 text-slate-950 animate-pulse" />
              <span>DONATE & BLESS</span>
            </button>

            {/* Praise & Amen Floating Reaction Button */}
            <div className="relative">
              <button
                onClick={handleAmenPraise}
                className={`px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition border ${
                  hasAmened
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Send Praise & Amen to on-air studio"
              >
                <Flame className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span>Amen</span>
                <span className="font-mono text-[11px] text-purple-300 ml-0.5">({amenCount})</span>
              </button>

              {/* Floating Flying Hearts */}
              {floatingAmens.map((item) => (
                <div
                  key={item.id}
                  style={{ left: `calc(50% + ${item.x}px)` }}
                  className="absolute bottom-12 pointer-events-none text-purple-400 animate-ping font-bold text-sm select-none"
                >
                  🙏 Amen!
                </div>
              ))}
            </div>

            {/* Follow Station */}
            <button
              onClick={handleToggleFollow}
              disabled={engagementLoading}
              className={`px-3.5 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition border ${
                isFollowing
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-4 h-4 text-sky-400" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Follow</span>
                </>
              )}
            </button>

            {/* Favorite Station */}
            <button
              onClick={handleToggleFavorite}
              disabled={engagementLoading}
              className={`px-3.5 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition border ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
              <span>{favoriteCount}</span>
            </button>

            {/* Embed Widget */}
            <button
              onClick={() => setShowEmbed(true)}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl transition-colors"
              title="Embed Player Widget"
            >
              <Code className="w-4 h-4 text-sky-400" />
            </button>

            {/* Share */}
            <button
              onClick={() => setShowShare(true)}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl transition-colors"
              title="Share Station"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Report */}
            <button
              onClick={() => setShowReport(true)}
              className="p-3.5 bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-2xl transition-colors"
              title="Report Stream"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Studio Ticker Bar */}
        {nowPlaying && (
          <div className="bg-slate-950/90 border-t border-slate-800/80 px-6 sm:px-10 py-3.5 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 truncate">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] shrink-0">On-Air Now:</span>
              <strong className="text-white font-semibold truncate">{nowPlaying.programTitle}</strong>
              <span className="text-slate-600 shrink-0">•</span>
              <span className="text-sky-300 truncate flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                {nowPlaying.currentTrack}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-slate-400 text-xs shrink-0">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <strong>{nowPlaying.listenersCount || 42}</strong> listeners online
              </span>

              {station.phone && (
                <a
                  href={`https://wa.me/${station.phone.replace(/[^0-9]/g, '')}?text=Listening%20to%20${encodeURIComponent(station.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold transition text-[11px]"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Studio WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs for Station Details */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'about'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> About & Story
        </button>

        <button
          onClick={() => setActiveTab('giving')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'giving'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-rose-300 hover:text-white hover:bg-rose-500/10'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" /> Support & Blessings ({totalDonationsCount})
        </button>

        <button
          onClick={() => setActiveTab('frequencies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'frequencies'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Signal className="w-3.5 h-3.5" /> FM Frequencies & Cities
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'schedule'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Broadcast Schedule
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquareHeart className="w-3.5 h-3.5" /> Testimonies ({reviews.length})
        </button>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Tab Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* TAB 1: ABOUT & STORY */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Radio className="w-5 h-5 text-sky-400" />
                  About {station.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {station.description}
                </p>

                {/* Official Links & Direct Channels */}
                <div className="pt-5 border-t border-slate-800/80 flex items-center gap-3 flex-wrap">
                  {station.websiteUrl && (
                    <a
                      href={station.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-4 py-2.5 rounded-xl transition"
                    >
                      <Globe className="w-4 h-4" /> Official Station Website
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {station.phone && (
                    <a
                      href={`tel:${station.phone}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" /> Call On-Air Studio
                    </a>
                  )}

                  {station.email && (
                    <a
                      href={`mailto:${station.email}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition"
                    >
                      <Mail className="w-4 h-4 text-sky-400" /> Contact Management
                    </a>
                  )}
                </div>
              </div>

              {/* Giving Teaser Card inside About Tab */}
              <div className="bg-gradient-to-r from-amber-950/40 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                    Support the Great Commission
                  </div>
                  <h3 className="text-lg font-bold text-white">Bless {station.name}'s On-Air Ministry</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Help sustain transmission power, studio operations, and gospel outreach across East Africa.
                  </p>
                </div>

                <button
                  onClick={() => setShowDonation(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-rose-500/25 transition shrink-0 flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>Send Offering / Gift</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPORT & GIVING WALL */}
          {activeTab === 'giving' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                      <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                      Ministry Giving & Partner Support
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      100% of contributions empower gospel broadcast transmitters, server bandwidth, and community prayer outreaches.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDonation(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition"
                  >
                    <Heart className="w-4 h-4 fill-slate-950" />
                    <span>Make Contribution</span>
                  </button>
                </div>

                {/* Quick Payment Methods Supported */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">M-Pesa (Vodacom)</span>
                    <span className="text-[11px] text-slate-400">Instant Mobile Pay</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                    <span className="text-xs font-bold text-sky-400 block mb-1">Tigo Pesa (Mixx)</span>
                    <span className="text-[11px] text-slate-400">Lipa Namba Ready</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                    <span className="text-xs font-bold text-rose-400 block mb-1">Airtel Money</span>
                    <span className="text-[11px] text-slate-400">USSD & Push Pay</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                    <span className="text-xs font-bold text-amber-400 block mb-1">Visa / MasterCard</span>
                    <span className="text-[11px] text-slate-400">Global Diaspora</span>
                  </div>
                </div>

                {/* Station Active Fundraising Campaigns */}
                {campaigns.length > 0 && (
                  <div className="pt-6 border-t border-slate-800/80 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      Active Ministry Fundraising Goals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((camp) => {
                        const pct = Math.min(100, Math.round(((camp.amountRaised || 0) / Math.max(1, camp.goalAmount)) * 100));
                        return (
                          <div key={camp.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <h4 className="text-base font-bold text-white line-clamp-1">{camp.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2">{camp.description}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-emerald-400">{camp.currency || 'TZS'} {Number(camp.amountRaised || 0).toLocaleString()}</span>
                                <span className="text-slate-400">Goal: {camp.currency || 'TZS'} {Number(camp.goalAmount || 0).toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-rose-500 to-emerald-400" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{pct}% Raised</span>
                                <span>{camp.supportersCount || 0} Supporters</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedCampaign(camp);
                                setShowDonation(true);
                              }}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                            >
                              Support This Project
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Community Supporters Board */}
                <div className="pt-6 border-t border-slate-800/80 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Recent Ministry Supporters & Blessings
                  </h3>

                  {recentDonations.length > 0 ? (
                    <div className="space-y-2.5">
                      {recentDonations.map((don) => (
                        <div
                          key={don.id}
                          className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{don.donorName}</span>
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                {don.fundType.replace('_', ' ')}
                              </span>
                            </div>
                            {don.message && (
                              <p className="text-slate-300 italic text-[11px] truncate max-w-md">
                                "{don.message}"
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-amber-300 text-sm">
                              {don.currency || 'TZS'} {Number(don.amount || 0).toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {new Date(don.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-3">
                      <p className="text-xs text-slate-400">Be the first to bless {station.name} with a gospel offering today.</p>
                      <button
                        onClick={() => setShowDonation(true)}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        Send First Donation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FM FREQUENCIES & CITIES */}
          {activeTab === 'frequencies' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Signal className="w-5 h-5 text-sky-400" />
                  FM Broadcast Frequencies & Dial Coverage
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tune in to {station.name} on standard radio receivers across these coverage areas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {stationFrequencies.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <strong className="text-xs text-white truncate">{item.city}</strong>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-5 truncate">{item.coverage}</p>
                    </div>

                    <div className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-xl shrink-0">
                      {item.freq}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BROADCAST SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-sky-400" />
                    Weekly Broadcast Schedule
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Times displayed in local station time ({station.timezone || 'EAT'})</p>
                </div>
              </div>

              {station.schedule && station.schedule.length > 0 ? (
                <div className="space-y-3">
                  {station.schedule.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs hover:border-slate-700 transition"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-slate-100 text-sm truncate">{item.programName}</div>
                        {item.presenter && (
                          <div className="text-sky-300 text-xs truncate">
                            Host: {item.presenter}
                          </div>
                        )}
                        {item.description && (
                          <div className="text-slate-400 text-xs line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-1">
                          {dayNames[item.dayOfWeek]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-400 space-y-2">
                  <Clock className="w-6 h-6 text-slate-500 mx-auto" />
                  <p>24/7 Continuous Gospel Music, Live Ministry & Worship Anthems.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TESTIMONIES & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <MessageSquareHeart className="w-5 h-5 text-amber-400" />
                    Listener Testimonies & Blessings
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real stories of faith from listeners blessed by {station.name}</p>
                </div>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write Testimony</span>
                </button>
              </div>

              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {rev.title && <h4 className="text-xs font-bold text-white mb-1">{rev.title}</h4>}
                        <p className="text-xs text-slate-300 italic leading-relaxed">“{rev.testimony}”</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-200">{rev.authorName}</span>
                        {rev.city && <span>{rev.city}, {rev.countryCode}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-3">
                  <p className="text-xs text-slate-400">No testimonies posted yet. Be the first to share how this broadcast touched your heart!</p>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Share First Testimony
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 4 Cols: Quick Actions, Intercession & Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Giving Offering Box */}
          <div className="bg-gradient-to-br from-slate-900 via-rose-950/30 to-amber-950/30 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                Ministry Partner Giving
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                100% Direct
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Support {station.name}'s daily broadcast operations and spiritual transmission reach.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowDonation(true)}
                className="py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
              >
                10,000 TZS
              </button>
              <button
                onClick={() => setShowDonation(true)}
                className="py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
              >
                25,000 TZS
              </button>
              <button
                onClick={() => setShowDonation(true)}
                className="py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-300 transition"
              >
                50,000 TZS
              </button>
            </div>

            <button
              onClick={() => setShowDonation(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition"
            >
              <Heart className="w-4 h-4 fill-slate-950" />
              <span>Bless with Custom Amount</span>
            </button>
          </div>

          {/* Intercession / Prayer Request Card */}
          <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/20 rounded-3xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" />
              Station Prayer Intercession
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Need prayer for your family, health, or spiritual breakthrough? Submit a request to be lifted in prayer by {station.name}'s pastoral intercessors.
            </p>
            <button
              onClick={() => setShowPrayerModal(true)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/25 transition"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Send Prayer Request</span>
            </button>
          </div>

          {/* Contact & Studio Info */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Studio & Ministry Contact
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              {station.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`tel:${station.phone}`} className="hover:text-emerald-300 font-mono">
                    {station.phone}
                  </a>
                </div>
              )}

              {station.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <a href={`mailto:${station.email}`} className="hover:text-sky-300 truncate">
                    {station.email}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {station.city}, {station.country?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Stations Carousel */}
      {relatedStations.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">More Stations You May Like</h2>
            <button
              onClick={() => onNavigate('directory')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedStations.map((rel) => (
              <StationCard key={rel.id} station={rel} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showReport && (
        <ReportModal
          stationId={station.id}
          stationName={station.name}
          onClose={() => setShowReport(false)}
        />
      )}
      {showShare && <ShareModal station={station} onClose={() => setShowShare(false)} />}
      {showDonation && (
        <DonationModal
          isOpen={showDonation}
          station={station}
          campaign={selectedCampaign || undefined}
          onClose={() => {
            setShowDonation(false);
            setSelectedCampaign(null);
          }}
          onDonationSuccess={(trackingId) => {
            onNavigate('receipt', trackingId);
          }}
        />
      )}
      {showEmbed && (
        <EmbedCodeModal
          isOpen={showEmbed}
          station={station}
          onClose={() => setShowEmbed(false)}
        />
      )}
      {showPrayerModal && (
        <PrayerRequestModal
          isOpen={showPrayerModal}
          station={station}
          onClose={() => setShowPrayerModal(false)}
        />
      )}
      {showReviewModal && (
        <WriteReviewModal
          isOpen={showReviewModal}
          station={station}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            loadAllStationData();
          }}
        />
      )}
    </div>
  );
}
