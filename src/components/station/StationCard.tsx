import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, Star } from 'lucide-react';
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
        className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
          isCurrent
            ? 'bg-slate-900/90 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
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

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                {station.name}
              </span>
              {isFeatured && (
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" title="Featured" />
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <span>{flagEmoji}</span>
              <span className="truncate">{countryDisplayName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-all"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={handlePlayClick}
            aria-label={`Play ${station.name}`}
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

        {/* Featured Star Icon Only */}
        {isFeatured && (
          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg z-20">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        )}

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

      {/* Radio Name and Country ONLY (No thin line, no extra badges) */}
      <div className="p-3.5 flex-1 flex flex-col justify-center space-y-1">
        <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-sky-300 transition-colors">
          {station.name}
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
          <span>{flagEmoji}</span>
          <span className="truncate">{countryDisplayName}</span>
        </div>
      </div>
    </div>
  );
}
