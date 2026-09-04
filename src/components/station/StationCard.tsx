import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle2, Gem, Heart, Star, Calendar, ShieldCheck, HandHeart, Radio } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import type { Station } from '../../types';

export interface StationCardProps {
  key?: React.Key;
  station: Station;
  onNavigate?: (view: string, param?: string) => void;
  layout?: 'grid' | 'compact' | 'horizontal';
  variant?: 'default' | 'featured' | 'premium' | 'popular' | 'live' | 'recently-added';
}

export function StationCard({ station, onNavigate, layout = 'grid', variant = 'default' }: StationCardProps) {
  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const savedFavs = JSON.parse(localStorage.getItem('christian_radios_favorites') || '[]');
      setIsFavorite(savedFavs.includes(station.id));
    } catch {
      setIsFavorite(false);
    }
  }, [station.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const savedFavs: string[] = JSON.parse(localStorage.getItem('christian_radios_favorites') || '[]');
      let updated: string[];
      if (savedFavs.includes(station.id)) {
        updated = savedFavs.filter((id) => id !== station.id);
        setIsFavorite(false);
      } else {
        updated = [...savedFavs, station.id];
        setIsFavorite(true);
      }
      localStorage.setItem('christian_radios_favorites', JSON.stringify(updated));
    } catch {}
  };

  const isCurrent = currentStation?.id === station.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isPremium = station.accessType === 'PREMIUM' || variant === 'premium';
  const isLive = station.streamStatus === 'ONLINE' || variant === 'live';
  const isFeatured = station.isFeatured || variant === 'featured';
  const isVerified = station.verificationStatus === 'VERIFIED';
  const hasDonation = Boolean(station.donationEnabled);
  const hasSchedule = Boolean(station.schedule && station.schedule.length > 0);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playStation(station);
    }
  };

  const handleGiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate('giving', station.id);
    }
  };

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate('station', station.slug || station.id);
    }
  };

  if (layout === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
          isCurrent
            ? 'bg-slate-900/90 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/80 shadow-md">
            <img
              src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                  img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                }
              }}
            />
            {isThisPlaying && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-0.5">
                <span className="w-1 bg-sky-400 h-3 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                <span className="w-1 bg-sky-400 h-5 rounded-full animate-bounce" style={{ animationDuration: '0.4s' }} />
                <span className="w-1 bg-indigo-400 h-2.5 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                {station.name}
              </span>
              {isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Admin Verified Broadcaster" />
              )}
              {isFeatured && (
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                  Featured
                </span>
              )}
              {isPremium && (
                <span className="text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                  Premium
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
              <span>{station.country?.flagEmoji || '🌍'} {station.city ? `${station.city}` : station.country?.name}</span>
              {hasDonation && (
                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20">
                  Giving Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasDonation && (
            <button
              onClick={handleGiveClick}
              title="Support Ministry"
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all"
            >
              <HandHeart className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handlePlayClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isThisPlaying
                ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/30 scale-105'
                : 'bg-slate-800 hover:bg-sky-500 text-white hover:text-slate-950'
            }`}
          >
            {isCurrent && isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isThisPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden relative shadow-lg hover:shadow-2xl hover:shadow-sky-500/15 hover:-translate-y-1.5 active:scale-[0.99] ${
        isCurrent
          ? 'bg-slate-900 border-sky-500/80 ring-2 ring-sky-500/30 shadow-sky-500/20'
          : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800/90 hover:border-sky-500/40'
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 p-3 flex items-center justify-center">
        {/* Subtle Ambient Blurred Backdrop */}
        <img
          src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none"
          aria-hidden="true"
        />

        {/* Primary Whole Station Logo Artwork */}
        <img
          src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
          alt={station.name}
          className="relative z-10 w-full h-full object-cover rounded-2xl border border-slate-700/80 shadow-2xl group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
              img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85 z-10 pointer-events-none" />

        {isThisPlaying && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center gap-1 z-20 pointer-events-none">
            <span className="w-1.5 bg-sky-400 h-6 rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
            <span className="w-1.5 bg-sky-400 h-10 rounded-full animate-bounce" style={{ animationDuration: '0.35s' }} />
            <span className="w-1.5 bg-indigo-400 h-5 rounded-full animate-bounce" style={{ animationDuration: '0.65s' }} />
            <span className="w-1.5 bg-sky-300 h-8 rounded-full animate-bounce" style={{ animationDuration: '0.45s' }} />
          </div>
        )}

        {/* Feature Badges Container */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20 flex-wrap max-w-[80%]">
          {isPremium && (
            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2.5 py-1 rounded-full shadow-lg border border-indigo-400/30 flex items-center gap-1">
              <Gem className="w-3 h-3 text-amber-300 fill-amber-300" /> PREMIUM
            </span>
          )}
          {isFeatured && (
            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/90 text-slate-950 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-slate-950" /> FEATURED
            </span>
          )}
          {isLive && !isFeatured && !isPremium && (
            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-slow" /> LIVE
            </span>
          )}
        </div>

        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-all duration-200 z-20 shadow-md active:scale-90"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        <button
          onClick={handlePlayClick}
          aria-label={`Play ${station.name}`}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform group-hover:scale-110 active:scale-90 z-20 ${
            isThisPlaying
              ? 'bg-sky-400 text-slate-950 shadow-sky-400/50 ring-4 ring-sky-400/30 animate-glow-pulse'
              : 'bg-gradient-to-tr from-sky-500 via-sky-600 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 shadow-slate-950/80'
          }`}
        >
          {isCurrent && isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : isThisPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-sky-300 transition-colors">
              {station.name}
            </h3>
            {isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Admin Verified Broadcaster" />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-medium">
            <span className="truncate flex items-center gap-1">
              <span>{station.country?.flagEmoji || '🌍'}</span>
              <span className="truncate">{station.city ? `${station.city}` : station.country?.name || 'Global'}</span>
            </span>

            {station.genre && (
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                {station.genre.split(',')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Admin & Owner Feature Control Badges Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
          <div className="flex items-center gap-1 flex-wrap">
            {hasDonation && (
              <button
                onClick={handleGiveClick}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                title="Radio Owner enabled direct ministry donations"
              >
                <HandHeart className="w-3 h-3 text-rose-400" />
                <span>Giving Active</span>
              </button>
            )}

            {hasSchedule && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20"
                title="Radio Owner configured active broadcast schedule"
              >
                <Calendar className="w-3 h-3 text-sky-400" />
                <span>Schedule</span>
              </span>
            )}

            {station.claimStatus === 'UNCLAIMED' && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                title="Station unclaimed by owner"
              >
                <span>Unclaimed</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
