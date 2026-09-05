import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, Star, Sparkles, ShieldCheck, Signal } from 'lucide-react';
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
  const isFeatured = station.isFeatured || variant === 'featured';

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playStation(station);
    }
  };

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate('station', station.slug || station.id);
    }
  };

  const countryDisplayName = station.country?.name || (station.countryCode ? station.countryCode.toUpperCase() : station.city || 'Global');
  const flagEmoji = station.country?.flagEmoji || '🌍';

  if (layout === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className={`group p-3.5 sm:p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-0.5 ${
          isCurrent
            ? 'bg-slate-900 border-sky-500/80 ring-1 ring-sky-500/40 shadow-sky-500/15'
            : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
        }`}
      >
        {/* Left Side: Artwork + Detailed Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Station Logo Artwork */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/80 shadow-xl group-hover:scale-105 transition-transform duration-300">
            <img
              src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-125 pointer-events-none"
            />
            <img
              src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
              alt={station.name}
              className="relative z-10 w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                  img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                }
              }}
            />

            {/* Live Playing Overlay */}
            {isThisPlaying && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center gap-0.5 z-20">
                <span className="w-1 bg-sky-400 h-4 rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
                <span className="w-1 bg-sky-400 h-6 rounded-full animate-bounce" style={{ animationDuration: '0.35s' }} />
                <span className="w-1 bg-indigo-400 h-3 rounded-full animate-bounce" style={{ animationDuration: '0.65s' }} />
              </div>
            )}

            {/* Live Badge */}
            <span className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-600/90 text-white rounded-md shadow-sm">
              LIVE
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate group-hover:text-sky-300 transition-colors">
                {station.name}
              </h3>
              {station.verificationStatus === 'VERIFIED' && (
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" title="Verified Official Broadcaster" />
              )}
              {isFeatured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Featured
                </span>
              )}
            </div>

            {/* Genre & Tagline */}
            <p className="text-xs text-slate-300 truncate font-medium">
              {station.tagline || station.description || station.genre || '24/7 Christian Broadcast'}
            </p>

            {/* Location & Metadata Badges */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-0.5">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                <span>{flagEmoji}</span>
                <span>{countryDisplayName}</span>
              </span>
              <span>•</span>
              <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md font-mono text-[10px] text-slate-300">
                {station.genre || 'Gospel'}
              </span>
              {station.language && (
                <>
                  <span>•</span>
                  <span className="text-slate-400 font-medium">{station.language}</span>
                </>
              )}
              {station.bitrateKbps && (
                <span className="hidden md:inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-mono text-[10px]">
                  <Signal className="w-2.5 h-2.5" />
                  {station.bitrateKbps} kbps
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition-all cursor-pointer shadow-inner"
            title={isFavorite ? 'Saved in Favorites' : 'Add to Favorites'}
          >
            <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={handlePlayClick}
            aria-label={`Play ${station.name}`}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
              isThisPlaying
                ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-slate-950 shadow-sky-500/25 ring-2 ring-sky-400/40 scale-105'
                : 'bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
            }`}
          >
            {isCurrent && isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isThisPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Listen Live</span>
              </>
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

        {/* Primary Station Logo Artwork */}
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

        {/* Featured Star or PRO Badge */}
        {station.accessType === 'PREMIUM' ? (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[10px] uppercase shadow-lg z-20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-slate-950" />
            <span>PRO</span>
          </div>
        ) : isFeatured ? (
          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg z-20">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        ) : null}

        {/* Favorite Heart Icon Button */}
        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-all duration-200 z-20 shadow-md active:scale-90"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Play Button as it is */}
        <button
          onClick={handlePlayClick}
          aria-label={`Play ${station.name}`}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform group-hover:scale-110 active:scale-90 z-20 ${
            isThisPlaying
              ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/50 ring-4 ring-emerald-400/30 animate-glow-pulse'
              : 'bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-slate-950/80'
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

      {/* Radio Name, Country and Subscribe Tier */}
      <div className="p-3.5 flex-1 flex flex-col justify-center space-y-1">
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-sky-300 transition-colors">
            {station.name}
          </h3>
          {station.accessType === 'PREMIUM' && (
            <span className="text-[10px] font-bold text-amber-400 shrink-0">
              ${(station.monthlyPriceUsd || 6).toLocaleString()}/mo
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium truncate">
          <div className="flex items-center gap-1.5 truncate">
            <span>{flagEmoji}</span>
            <span className="truncate">{countryDisplayName}</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            {station.accessType === 'PREMIUM' ? 'PRO Radio' : 'Free Radio'}
          </span>
        </div>
      </div>
    </div>
  );
}
