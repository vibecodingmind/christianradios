import React, { useState } from 'react';
import { Play, Pause, Heart, Radio, Signal, Users, CheckCircle2, Gift } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { DonationModal } from '../modals/DonationModal';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface StationCardProps {
  key?: React.Key;
  station: Station;
  onNavigate?: (view: string, param?: string) => void;
  layout?: 'grid' | 'compact' | 'horizontal';
}

export function StationCard({ station, onNavigate, layout = 'grid' }: StationCardProps) {
  const { currentStation, isPlaying, isLoading, playStation, togglePlay } = useAudioPlayer();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const isCurrent = currentStation?.id === station.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playStation(station);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await apiFetch('/api/listener/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorite);
      }
    } catch {}
  };

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate('station', station.slug);
    }
  };

  if (layout === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className={`group p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
          isCurrent
            ? 'bg-slate-900/90 border-sky-500/50 shadow-lg shadow-sky-500/10'
            : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img
              src={station.logoUrl}
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {isCurrent && isPlaying && (
              <div className="absolute inset-0 bg-sky-950/60 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate group-hover:text-sky-400 transition-colors">
                {station.name}
              </span>
              {station.verificationStatus === 'VERIFIED' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {station.country?.flagEmoji} {station.city ? `${station.city} • ` : ''}
              {station.genre}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {station.streamStatus === 'ONLINE' ? (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
              Online
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full hidden sm:inline-block">
              Offline
            </span>
          )}

          <button
            onClick={handlePlayClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isThisPlaying
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'bg-slate-800 hover:bg-sky-600 text-white'
            }`}
          >
            {isCurrent && isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isThisPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group rounded-3xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative ${
        isCurrent
          ? 'bg-slate-900 border-sky-500/60 shadow-xl shadow-sky-500/10'
          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Top Banner / Artwork */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={station.coverUrl || station.logoUrl}
          alt={station.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Live Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-200">
          {station.streamStatus === 'ONLINE' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">LIVE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-slate-400">Offline</span>
            </>
          )}
        </div>

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
          </button>
        )}

        {/* Play Button Overlay */}
        <button
          onClick={handlePlayClick}
          aria-label={`Play ${station.name}`}
          className={`absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all transform group-hover:scale-105 ${
            isThisPlaying
              ? 'bg-sky-400 text-slate-950 shadow-sky-500/40'
              : 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 shadow-slate-950/60'
          }`}
        >
          {isCurrent && isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : isThisPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Small Logo Badge */}
        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
          <img src={station.logoUrl} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-bold text-base text-white truncate group-hover:text-sky-400 transition-colors">
              {station.name}
            </h3>
            {station.verificationStatus === 'VERIFIED' && (
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" title="Verified Broadcaster" />
            )}
          </div>

          {station.tagline ? (
            <p className="text-xs text-slate-400 line-clamp-1 italic mb-2">
              "{station.tagline}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 line-clamp-2 mb-2">
              {station.description}
            </p>
          )}
        </div>

        {/* Card Footer tags & Mini Donate */}
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm">{station.country?.flagEmoji || '🌍'}</span>
            <span className="truncate">{station.city || station.country?.name}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDonation(true);
              }}
              title="Bless / Donate to station"
              className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 transition"
            >
              <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
              <span>Bless</span>
            </button>

            <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md truncate max-w-[90px]">
              {station.genre}
            </span>
          </div>
        </div>
      </div>

      {showDonation && (
        <div onClick={(e) => e.stopPropagation()}>
          <DonationModal
            isOpen={showDonation}
            station={station}
            onClose={() => setShowDonation(false)}
            onDonationSuccess={(trackingId) => {
              if (onNavigate) {
                onNavigate('receipt', trackingId);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
