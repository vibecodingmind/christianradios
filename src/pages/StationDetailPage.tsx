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
  RotateCw,
  MoreHorizontal,
  Compass,
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
import { PremiumStationSubscriptionModal } from '../components/modals/PremiumStationSubscriptionModal';
import { ClaimStationModal } from '../components/station/ClaimStationModal';
import { apiFetch } from '../lib/api';
import type { Station, StationReview, NowPlayingInfo, DonationCampaign, StationFeedPost, PrayerRequest } from '../types';

interface StationDetailPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
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

export function StationDetailPage({ slug, onNavigate, onPublicAction }: StationDetailPageProps) {
  const [station, setStation] = useState<Station | null>(null);
  const [relatedStations, setRelatedStations] = useState<Station[]>([]);
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [totalDonationsCount, setTotalDonationsCount] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);

  // Engagement States
  const [isFollowing, setIsFollowing] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(128);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'feed' | 'prayers' | 'schedule' | 'reviews' | 'giving'>('about');
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);

  // Live Feed States
  const [feedPosts, setFeedPosts] = useState<StationFeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorCity, setNewAuthorCity] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'SHOUTOUT' | 'CHECK_IN' | 'ANNOUNCEMENT'>('SHOUTOUT');
  const [isPostingFeed, setIsPostingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedSuccess, setFeedSuccess] = useState<string | null>(null);

  // Prayer Requests States
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(false);
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});

  // Modals
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPremiumSubModal, setShowPremiumSubModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();
  const { user } = useAuth();

  const fetchFeedPosts = async () => {
    if (!slug) return;
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/public/stations/${encodeURIComponent(slug)}/feed`).then((r) => r.json());
      if (res.posts) {
        setFeedPosts(res.posts);
      }
    } catch (err) {
      console.error('Failed to load feed posts:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchStationPrayers = async () => {
    if (!slug) return;
    setPrayersLoading(true);
    try {
      const res = await fetch(`/api/public/stations/${encodeURIComponent(slug)}/prayers`).then((r) => r.json());
      if (res.prayers) {
        setPrayerRequests(res.prayers);
      }
    } catch (err) {
      console.error('Failed to load prayer requests:', err);
    } finally {
      setPrayersLoading(false);
    }
  };

  const handlePrayFor = async (prayerId: string) => {
    if (prayedIds[prayerId]) return;
    setPrayedIds((prev) => ({ ...prev, [prayerId]: true }));
    try {
      const res = await fetch(`/api/public/prayers/${prayerId}/pray`, { method: 'POST' }).then((r) => r.json());
      if (res.success) {
        setPrayerRequests((prev) =>
          prev.map((p) => (p.id === prayerId ? { ...p, prayedCount: res.count } : p))
        );
      }
    } catch (err) {
      console.error('Failed to record prayer:', err);
    }
  };

  const loadAllStationData = async (isInitial = false) => {
    try {
      if (isInitial || !station || (station.slug !== slug && station.id !== slug)) {
        setLoading(true);
      }
      const [stnRes, revRes, npRes, donRes, campRes, feedRes, prayRes] = await Promise.all([
        fetch(`/api/public/stations/${encodeURIComponent(slug)}`).then((r) => r.json()),
        fetch(`/api/public/stations/${encodeURIComponent(slug)}/reviews`).then((r) => r.json()).catch(() => ({ reviews: [], avgRating: 5.0 })),
        fetch(`/api/public/stations/${encodeURIComponent(slug)}/now-playing`).then((r) => r.json()).catch(() => null),
        fetch(`/api/public/stations/${encodeURIComponent(slug)}/donations`).then((r) => r.json()).catch(() => ({ donations: [], totalDonationsCount: 0 })),
        fetch(`/api/public/stations/${encodeURIComponent(slug)}/campaigns`).then((r) => r.json()).catch(() => ({ campaigns: [] })),
        fetch(`/api/public/stations/${encodeURIComponent(slug)}/feed`).then((r) => r.json()).catch(() => ({ posts: [] })),
        fetch(`/api/public/stations/${encodeURIComponent(slug)}/prayers`).then((r) => r.json()).catch(() => ({ prayers: [] })),
      ]);

      if (campRes?.campaigns) {
        setCampaigns(campRes.campaigns);
      }

      if (feedRes?.posts) {
        setFeedPosts(feedRes.posts);
      }

      if (prayRes?.prayers) {
        setPrayerRequests(prayRes.prayers);
      }

      if (stnRes.station) {
        const stn = stnRes.station;
        setStation(stn);
        setSubscriberCount(stn.subscribersCount || stn.favoriteCount || 128);

        let relList: Station[] = stnRes.related || stnRes.relatedStations || [];
        if (relList.length === 0) {
          try {
            const fallbackRes = await fetch('/api/public/stations?limit=8').then((r) => r.json());
            relList = (fallbackRes.stations || [])
              .filter((s: Station) => s.id !== stn.id)
              .slice(0, 6)
              .map((s: Station) => ({ ...s, referenceTag: 'Reference Broadcast' }));
          } catch {}
        }
        setRelatedStations(relList);
      }
      setReviews(revRes.reviews || []);
      setAvgRating(revRes.avgRating || 5.0);
      setNowPlaying(npRes);
      if (donRes.donations) {
        setRecentDonations(donRes.donations);
        setTotalDonationsCount(donRes.totalDonationsCount || donRes.donations.length);
      }
    } catch (err) {
      console.error('Failed to load station:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeedPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !newAuthorName.trim() || !newPostContent.trim()) {
      setFeedError('Please enter your name and message content.');
      return;
    }

    setIsPostingFeed(true);
    setFeedError(null);
    setFeedSuccess(null);

    try {
      const res = await apiFetch(`/api/public/stations/${station.id}/feed`, {
        method: 'POST',
        body: JSON.stringify({
          authorName: newAuthorName.trim(),
          authorCity: newAuthorCity.trim() || undefined,
          content: newPostContent.trim(),
          postType: newPostType,
        }),
      });

      if (res.ok) {
        setFeedSuccess('Your message has been posted to the station feed!');
        setNewPostContent('');
        fetchFeedPosts();
      } else {
        const data = await res.json();
        setFeedError(data.error || 'Failed to post message.');
      }
    } catch (err: any) {
      setFeedError(err.message || 'Error submitting feed message.');
    } finally {
      setIsPostingFeed(false);
    }
  };

  const handleLikeFeedPost = async (postId: string) => {
    if (!station) return;
    try {
      const res = await fetch(`/api/public/stations/${station.id}/feed/${postId}/like`, { method: 'POST' }).then((r) => r.json());
      if (res.success) {
        setFeedPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likesCount: res.likesCount } : p))
        );
      }
    } catch (err) {
      console.error('Failed to bless feed post:', err);
    }
  };

  const fetchNowPlayingData = async () => {
    if (!slug) return;
    try {
      const res = await apiFetch(`/api/public/stations/${slug}/now-playing`);
      if (res.ok) {
        const data = await res.json();
        setNowPlaying(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadAllStationData(true);
    const interval = setInterval(fetchNowPlayingData, 10000);
    return () => clearInterval(interval);
  }, [slug]);

  useEffect(() => {
    if (user && station?.id) {
      apiFetch(`/api/listener/station-status/${station.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setIsFollowing(data.isFollowing);
          }
        })
        .catch(() => {});
    }
  }, [user?.id, station?.id]);

  const handleToggleFollow = async () => {
    if (!user) {
      alert('Please sign in to subscribe to this broadcaster.');
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
        setSubscriberCount((prev) => (data.isFollowing ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (err) {
      console.error('Failed to toggle subscribe:', err);
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: station?.name || 'Christian Radio',
      text: `Listen to ${station?.name || 'Christian Radio'} live on Christian Radios platform!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User closed or cancelled native share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Radio station link copied to clipboard!');
      } catch {
        setShowShare(true);
      }
    }
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

  return (
    <div className="space-y-8 pb-28">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('directory')}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Discover
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline-block">Christian Radios</span>
          <span className="text-slate-600 hidden sm:inline-block">/</span>
          <span className="text-slate-300 font-medium">{station.country?.name}</span>
          <span className="text-slate-600">/</span>
          <span className="text-sky-400 font-bold truncate max-w-[140px] sm:max-w-none">{station.name}</span>
        </div>
      </div>

      {/* Hero Station Profile Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Banner Cover Artwork - Compact Top Spacing */}
        <div className="h-36 sm:h-48 w-full relative bg-slate-950 overflow-hidden">
          <img
            src={station.coverUrl || station.logoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80'}
            alt={station.name}
            className="w-full h-full object-cover blur-md opacity-40 scale-110"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80') {
                img.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-950/40" />
        </div>

        {/* Profile Header Info & Actions Layout */}
        <div className="px-6 sm:px-10 pb-6 -mt-16 sm:-mt-20 relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Logo & Title & Metadata */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 min-w-0 flex-1">
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-900 shadow-2xl relative">
                  <img
                    src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
                    alt={station.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                        img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                      }
                    }}
                  />
                  {/* Equalizer Audio Waves on playing logo section */}
                  {isThisPlaying && (
                    <div className="absolute inset-0 rounded-2xl bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-1 ring-4 ring-emerald-400/80 ring-offset-2 ring-offset-slate-900 pointer-events-none">
                      <span className="w-1.5 bg-emerald-400 h-6 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                      <span className="w-1.5 bg-emerald-400 h-9 rounded-full animate-bounce" style={{ animationDuration: '0.4s' }} />
                      <span className="w-1.5 bg-sky-400 h-5 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }} />
                      <span className="w-1.5 bg-emerald-400 h-8 rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full">
                    {station.genre || 'Gospel Radio'}
                  </span>

                  {station.verificationStatus === 'VERIFIED' && (
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Station
                    </span>
                  )}

                  {station.licenceVerificationStatus === 'VERIFIED' && (
                    <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm" title="Broadcasting Licence Verified by Admin">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Licence Verified
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

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {station.name}
                </h1>

                {station.tagline && (
                  <p className="text-xs sm:text-sm text-sky-300 italic font-medium">"{station.tagline}"</p>
                )}

                <p className="text-xs text-slate-300 flex items-center gap-2 pt-0.5 flex-wrap font-medium">
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

            {/* Right Side Radio Play Button */}
            <button
              onClick={() => {
                if (station.accessType === 'PREMIUM') {
                  setShowPremiumSubModal(true);
                  return;
                }
                if (isCurrent) {
                  togglePlay();
                } else {
                  playStation(station);
                }
              }}
              className={`px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer shrink-0 self-start lg:self-center ${
                isThisPlaying
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-400/30 ring-2 ring-emerald-400/40'
                  : 'bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25'
              }`}
            >
              {isCurrent && isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : isThisPlaying ? (
                <>
                  <Pause className="w-4.5 h-4.5 fill-current" />
                  <span>Pause Broadcast</span>
                </>
              ) : (
                <>
                  <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  <span>{station.accessType === 'PREMIUM' ? 'Unlock PRO Stream' : 'Listen Live'}</span>
                </>
              )}
            </button>
          </div>

          {/* STREAMLINED PROFESSIONAL ACTION TOOLBAR */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-3 shadow-xl backdrop-blur-md">
            {/* Left Side: Icon + Text Actions (No heavy button borders) */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap min-w-[280px]">
              {/* Station Claim Status / Claim Action */}
              {station.claimStatus === 'CLAIM_PENDING' ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Claim Pending Admin Review</span>
                </div>
              ) : station.claimStatus === 'CLAIMED' ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Broadcaster</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (user) {
                      setShowClaimModal(true);
                    } else if (onPublicAction) {
                      onPublicAction('CLAIM_STATION', { stationId: station.id });
                    } else {
                      onNavigate('owner');
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-full transition cursor-pointer"
                  title="Claim Ownership of this Station"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Claim Station Ownership</span>
                </button>
              )}

              {/* Report Station */}
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                title="Report Station Issue"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Report</span>
              </button>

              {/* Share Station (Native Device Share) */}
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                title="Share via device apps"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Share</span>
              </button>

              {/* Embed Player Widget */}
              <button
                onClick={() => setShowEmbed(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                title="Embed Player Widget"
              >
                <Code className="w-4 h-4 text-sky-400" />
                <span>Embed Player</span>
              </button>
            </div>

            {/* Right Side: Subscribe Button & Subscribers Text+Icon */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Subscribe Button */}
              <button
                onClick={() => {
                  if (station.accessType === 'PREMIUM') {
                    setShowPremiumSubModal(true);
                  } else {
                    handleToggleFollow();
                  }
                }}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                  station.accessType === 'PREMIUM'
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950'
                    : isFollowing
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>
                  {station.accessType === 'PREMIUM'
                    ? (isFollowing ? 'Subscribed' : `Subscribe (TZS ${(station.monthlyPriceTzs || 5000).toLocaleString()}/mo)`)
                    : isFollowing
                    ? 'Subscribed'
                    : 'Subscribe'}
                </span>
              </button>

              {/* Number of Subscribers (Just Icon + Text, No Button Border) */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 px-1 py-1">
                <Users className="w-4 h-4 text-sky-400" />
                <span>{subscriberCount} Subscribers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Studio Currently Playing Bar */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-6 sm:px-10 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 truncate min-w-0 flex-1">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-emerald-400 uppercase tracking-widest text-[11px] shrink-0">
                  CURRENTLY PLAYING
                </span>
                {nowPlaying?.streamQuality && (
                  <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                    {nowPlaying.streamQuality}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white truncate mt-0.5 flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {nowPlaying?.currentTrack || station.genre || 'Live Gospel Broadcast'}
                </span>
                {nowPlaying?.artistOrMinister && (
                  <span className="text-slate-400 text-xs font-normal truncate">
                    • {nowPlaying.artistOrMinister}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs shrink-0 self-end sm:self-auto">
            <span className="flex items-center gap-1.5 text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-white">{nowPlaying?.listenersCount || station.currentListenersCount || 42}</strong> live listeners
            </span>

            <button
              onClick={fetchNowPlayingData}
              title="Refresh Currently Playing Metadata"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {station.phone && (
              <a
                href={`https://wa.me/${station.phone.replace(/[^0-9]/g, '')}?text=Listening%20to%20${encodeURIComponent(station.name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold transition text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Station Details */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'about'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> About Station
        </button>

        <button
          onClick={() => {
            setActiveTab('feed');
            fetchFeedPosts();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'feed'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Live Feed ({feedPosts.length})
        </button>

        <button
          onClick={() => setActiveTab('giving')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'giving'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-rose-300 hover:text-white hover:bg-rose-500/10'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" /> Support & Blessings ({totalDonationsCount})
        </button>

        <button
          onClick={() => {
            setActiveTab('prayers');
            fetchStationPrayers();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'prayers'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" /> Prayer Requests ({prayerRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Broadcast Schedule
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
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
          {/* TAB 1: ABOUT STATION */}
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

                {/* Official Links & Contact Details */}
                <div className="pt-5 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {station.websiteUrl ? (
                      <a
                        href={station.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-4 py-2.5 rounded-xl transition"
                      >
                        <Globe className="w-4 h-4" /> Official Station Website
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl opacity-60">
                        <Globe className="w-4 h-4 text-slate-600" /> Official Station Website
                      </span>
                    )}

                    {/* WhatsApp Contact */}
                    {(station.socialLinks?.whatsapp || station.phone) ? (
                      <a
                        href={station.socialLinks?.whatsapp?.startsWith('http') ? station.socialLinks.whatsapp : `https://wa.me/${(station.socialLinks?.whatsapp || station.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl transition"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp Studio
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl opacity-60">
                        <MessageCircle className="w-4 h-4 text-slate-600" /> WhatsApp Studio
                      </span>
                    )}

                    {/* Email Contact */}
                    {station.email ? (
                      <a
                        href={`mailto:${station.email}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition"
                      >
                        <Mail className="w-4 h-4 text-sky-400" /> {station.email}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl opacity-60">
                        <Mail className="w-4 h-4 text-slate-600" /> Email Not Provided
                      </span>
                    )}

                    {/* Phone Contact */}
                    {station.phone && (
                      <a
                        href={`tel:${station.phone}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition"
                      >
                        <Phone className="w-4 h-4 text-emerald-400" /> {station.phone}
                      </a>
                    )}
                  </div>

                  {/* Social Media Links (JUST ICONS) */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Social Media:</span>

                    {/* Facebook */}
                    {station.socialLinks?.facebook ? (
                      <a
                        href={station.socialLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center transition hover:scale-105"
                        title="Facebook"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-600 flex items-center justify-center opacity-40 grayscale pointer-events-none cursor-not-allowed" title="Facebook not configured">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                    )}

                    {/* Instagram */}
                    {station.socialLinks?.instagram ? (
                      <a
                        href={station.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 flex items-center justify-center transition hover:scale-105"
                        title="Instagram"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-600 flex items-center justify-center opacity-40 grayscale pointer-events-none cursor-not-allowed" title="Instagram not configured">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </div>
                    )}

                    {/* TikTok */}
                    {station.socialLinks?.tiktok ? (
                      <a
                        href={station.socialLinks.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center transition hover:scale-105"
                        title="TikTok"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-2.88-2.89c.31 0 .62.05.9.15V9.4a6.33 6.33 0 105.43 6.27V9.32a8.27 8.27 0 004.83 1.55V7.42a4.85 4.85 0 01-1.06-.73z"/></svg>
                      </a>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-600 flex items-center justify-center opacity-40 grayscale pointer-events-none cursor-not-allowed" title="TikTok not configured">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-2.88-2.89c.31 0 .62.05.9.15V9.4a6.33 6.33 0 105.43 6.27V9.32a8.27 8.27 0 004.83 1.55V7.42a4.85 4.85 0 01-1.06-.73z"/></svg>
                      </div>
                    )}

                    {/* X (Twitter) */}
                    {station.socialLinks?.twitter ? (
                      <a
                        href={station.socialLinks.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center transition hover:scale-105"
                        title="X (Twitter)"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-600 flex items-center justify-center opacity-40 grayscale pointer-events-none cursor-not-allowed" title="X (Twitter) not configured">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </div>
                    )}

                    {/* LinkedIn */}
                    {station.socialLinks?.linkedin ? (
                      <a
                        href={station.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 flex items-center justify-center transition hover:scale-105"
                        title="LinkedIn"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                      </a>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-600 flex items-center justify-center opacity-40 grayscale pointer-events-none cursor-not-allowed" title="LinkedIn not configured">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Live Feed Header Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Live Listener & Station Feed
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Share text shoutouts, location check-ins, and stay updated with official announcements from {station.name}.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Engagement
                  </span>
                </div>

                {/* Post Input Form */}
                <form onSubmit={handleCreateFeedPost} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3 mt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Your Name (e.g. Brother John)"
                        value={newAuthorName}
                        onChange={(e) => setNewAuthorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Your City / Region (e.g. Mwanza)"
                        value={newAuthorCity}
                        onChange={(e) => setNewAuthorCity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                      />
                    </div>
                    <div className="w-full sm:w-40">
                      <select
                        value={newPostType}
                        onChange={(e) => setNewPostType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition cursor-pointer"
                      >
                        <option value="SHOUTOUT">📣 Shoutout</option>
                        <option value="CHECK_IN">📍 Check-in</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      maxLength={400}
                      placeholder={`Share a shoutout or greeting with ${station.name} and fellow listeners...`}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
                      required
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Clean, respectful text only</span>
                      <span>{newPostContent.length}/400</span>
                    </div>
                  </div>

                  {feedError && (
                    <p className="text-xs text-rose-400 font-semibold">{feedError}</p>
                  )}
                  {feedSuccess && (
                    <p className="text-xs text-emerald-400 font-semibold">{feedSuccess}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPostingFeed}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer shadow-md shadow-sky-500/20 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isPostingFeed ? 'Posting...' : 'Post Message'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Posts List */}
              <div className="space-y-4">
                {feedLoading ? (
                  <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl">
                    <RotateCw className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Loading live feed...</p>
                  </div>
                ) : feedPosts.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl space-y-2">
                    <MessageCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-300">No feed messages yet</h3>
                    <p className="text-xs text-slate-500">Be the first listener to post a shoutout or check-in!</p>
                  </div>
                ) : (
                  feedPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        post.isPinned
                          ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            post.postType === 'ANNOUNCEMENT'
                              ? 'bg-amber-400 text-slate-950'
                              : post.postType === 'CHECK_IN'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}>
                            {post.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">{post.authorName}</span>
                              {post.authorCity && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {post.authorCity}
                                </span>
                              )}
                              {post.isPinned && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide">
                                  📌 Station Announcement
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                post.postType === 'ANNOUNCEMENT'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : post.postType === 'CHECK_IN'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}>
                                {post.postType === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT' : post.postType === 'CHECK_IN' ? 'CHECK-IN' : 'SHOUTOUT'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Like / Bless action */}
                        <button
                          onClick={() => handleLikeFeedPost(post.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/80 text-xs font-bold transition cursor-pointer"
                          title="Bless this message"
                        >
                          <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                          <span>{post.likesCount || 0}</span>
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SUPPORT & GIVING WALL */}
          {activeTab === 'giving' && (
            <div className="space-y-6">
              {/* Ministry Giving Header Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                      <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                      Support & Ministry Blessings
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Stand with {station.name} in gospel broadcast transmitters, server bandwidth, and community prayer outreaches.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCampaign(null);
                      setShowDonation(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-lg shadow-rose-500/20 flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-slate-950" />
                    <span>Send Offering / Gift</span>
                  </button>
                </div>
              </div>

              {/* Station Active Fundraising Campaigns */}
              {campaigns.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 px-1">
                    <Target className="w-4 h-4 text-amber-400" />
                    Active Ministry Fundraising Goals
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campaigns.map((camp) => {
                      const pct = Math.min(100, Math.round(((camp.amountRaised || 0) / Math.max(1, camp.goalAmount)) * 100));
                      return (
                        <div
                          key={camp.id}
                          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-bold text-white line-clamp-1">{camp.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{camp.description}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-emerald-400 font-extrabold">{camp.currency || 'USD'} ${Number(camp.amountRaised || 0).toLocaleString()}</span>
                              <span className="text-slate-400">Goal: {camp.currency || 'USD'} ${Number(camp.goalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
                              <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>{pct}% Raised</span>
                              <span>{camp.supportersCount || 0} Supporters</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setShowDonation(true);
                            }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
                          >
                            Support This Project
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Community Supporters & Offerings List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 px-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Recent Ministry Supporters & Blessings
                </h3>

                {recentDonations.length > 0 ? (
                  <div className="space-y-4">
                    {recentDonations.map((don) => (
                      <div
                        key={don.id}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {don.fundType.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-bold text-white">{don.donorName}</span>
                          </div>

                          <span className="text-xs font-extrabold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl shrink-0">
                            {don.currency || 'USD'} ${Number(don.amount || 0).toLocaleString()}
                          </span>
                        </div>

                        {don.message && (
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line italic">
                            "{don.message}"
                          </p>
                        )}

                        <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                          <span>{new Date(don.createdAt).toLocaleDateString()}</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Ministry Partner
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl space-y-3">
                    <Heart className="w-8 h-8 text-rose-400/60 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-300">No offerings or blessings posted yet</h3>
                    <p className="text-xs text-slate-500">Be the first to bless {station.name} with a gospel offering today!</p>
                    <button
                      onClick={() => {
                        setSelectedCampaign(null);
                        setShowDonation(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 text-xs font-extrabold transition cursor-pointer"
                    >
                      Send First Offering
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRAYER REQUESTS */}
          {activeTab === 'prayers' && (
            <div className="space-y-6">
              {/* Prayer Wall Header Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                      <HeartHandshake className="w-5 h-5 text-purple-400" />
                      Station Prayer Wall & Intercession
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Stand in agreement with fellow listeners of {station.name}. Share your prayer requests and pray for one another.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPrayerModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs transition cursor-pointer shadow-lg shadow-purple-500/20 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Request Prayer</span>
                  </button>
                </div>
              </div>

              {/* Prayer Requests Cards List */}
              <div className="space-y-4">
                {prayersLoading ? (
                  <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl">
                    <RotateCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Loading prayer wall...</p>
                  </div>
                ) : prayerRequests.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl space-y-3">
                    <HeartHandshake className="w-8 h-8 text-slate-600 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-300">No prayer requests posted yet</h3>
                    <p className="text-xs text-slate-500">Be the first to share a prayer request with our prayer community!</p>
                    <button
                      onClick={() => setShowPrayerModal(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold transition hover:bg-purple-500 cursor-pointer"
                    >
                      Submit Prayer Request
                    </button>
                  </div>
                ) : (
                  prayerRequests.map((prayer) => (
                    <div
                      key={prayer.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {prayer.category || 'General'}
                            </span>
                            <span className="text-xs font-bold text-white">{prayer.authorName}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-100 mt-1.5">{prayer.title}</h3>
                        </div>

                        {/* Intercede / Pray Button */}
                        <button
                          onClick={() => handlePrayFor(prayer.id)}
                          disabled={prayedIds[prayer.id]}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            prayedIds[prayer.id]
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-default'
                              : 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30 text-purple-300'
                          }`}
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>{prayedIds[prayer.id] ? 'Amen! Prayed 🙏' : `I Prayed (${prayer.prayedCount || 1})`}</span>
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {prayer.prayerPoints}
                      </p>

                      <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                        <span>{new Date(prayer.createdAt).toLocaleDateString()}</span>
                        {prayer.status === 'ANSWERED' && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Answered Prayer Testimony
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
            <div className="space-y-6">
              {/* Testimonies Header Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                      <MessageSquareHeart className="w-5 h-5 text-amber-400" />
                      Listener Testimonies & Faith Stories
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Real stories of faith, healing, and spiritual blessing from listeners tuned into {station.name}.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Write Testimony</span>
                  </button>
                </div>
              </div>

              {/* Testimonies Cards List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl space-y-3">
                    <MessageSquareHeart className="w-8 h-8 text-slate-600 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-300">No testimonies posted yet</h3>
                    <p className="text-xs text-slate-500">Be the first to share how this station's broadcast touched your life!</p>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold transition hover:bg-amber-400 cursor-pointer"
                    >
                      Share First Testimony
                    </button>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-white">{rev.authorName}</span>
                            {rev.city && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {rev.city}, {rev.countryCode}
                              </span>
                            )}
                          </div>
                          {rev.title && <h3 className="text-sm font-bold text-slate-100 mt-2">{rev.title}</h3>}
                        </div>

                        <span className="text-[10px] text-slate-500 font-medium shrink-0">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed whitespace-pre-line">
                        “{rev.testimony}”
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Featured Radios Section (Inside Main Tab Column) */}
          {relatedStations.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Featured Radios & Recommended Stations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Handpicked Christian stations broadcasting live worship & gospel ministry
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('directory')}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Explore All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {relatedStations.slice(0, 4).map((rel) => (
                  <StationCard key={rel.id} station={rel} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Quick Actions, Intercession & Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ministry Partner & Blessing Box */}
          <div className="bg-gradient-to-br from-slate-900 via-rose-950/30 to-amber-950/30 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                Ministry Partner & Blessing
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Kingdom Impact
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sow a seed of blessing to sustain <strong className="text-slate-100">{station.name}</strong>'s live gospel broadcasting, daily prayer ministry, and spiritual reach.
            </p>

            <button
              onClick={() => setShowDonation(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition cursor-pointer group"
            >
              <Heart className="w-4 h-4 fill-slate-950 transition-transform group-hover:scale-110" />
              <span>Sow a Seed & Support Radio</span>
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
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/25 transition cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Send Prayer Request</span>
            </button>
          </div>

        </div>
      </div>

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
      {showPremiumSubModal && (
        <PremiumStationSubscriptionModal
          isOpen={showPremiumSubModal}
          station={station}
          onClose={() => setShowPremiumSubModal(false)}
          onSubscriptionSuccess={() => {
            loadAllStationData();
          }}
        />
      )}
      {showClaimModal && (
        <ClaimStationModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          stationId={station.id}
          stationName={station.name}
          stationSlug={station.slug}
          initialEmail={user?.email}
          initialName={user?.name}
          isBroadcasterUser={user?.role === 'RADIO_OWNER'}
          onSuccess={() => {
            loadAllStationData();
          }}
        />
      )}
    </div>
  );
}
