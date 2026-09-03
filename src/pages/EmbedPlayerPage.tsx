import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, ExternalLink, Sparkles } from 'lucide-react';
import type { Station } from '../types';

export function EmbedPlayerPage() {
  const [station, setStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<string>('Live Gospel Stream');
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const params = new URLSearchParams(window.location.search);
  const isCompact = params.get('compact') === 'true' || params.get('theme') === 'compact';
  const isLight = params.get('theme') === 'light';

  // Extract slug from pathname: e.g. /embed/radio-maria-tanzania
  const pathname = window.location.pathname;
  const slug = pathname.replace(/^\/embed\/?/, '').split('/')[0] || params.get('slug') || '';

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Station identifier missing.');
      return;
    }

    fetch(`/api/public/stations/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Station not found');
        return res.json();
      })
      .then((data) => {
        setStation(data.station);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load station');
      })
      .finally(() => setLoading(false));

    // Fetch now playing info
    fetch(`/api/public/stations/${slug}/now-playing`)
      .then((res) => res.json())
      .then((data) => {
        if (data.currentTrack) {
          setNowPlaying(`${data.currentTrack} — ${data.artistOrMinister || data.programTitle}`);
        }
      })
      .catch(() => {});
  }, [slug]);

  const togglePlay = () => {
    if (!audioRef.current || !station) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error', err);
        // Fallback through proxy
        if (audioRef.current) {
          audioRef.current.src = `/api/public/stream/proxy?url=${encodeURIComponent(station.streamUrl)}`;
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'}`}>
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 text-xs ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-950 text-slate-400'}`}>
        <span>{error || 'Unable to load radio stream.'}</span>
      </div>
    );
  }

  const bgClass = isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-800';
  const cardBgClass = isLight ? 'bg-slate-50' : 'bg-slate-900/90';

  return (
    <div className={`w-full h-full p-3 sm:p-4 select-none font-sans overflow-hidden flex flex-col justify-between border ${bgClass}`}>
      <audio
        ref={audioRef}
        src={station.streamUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          if (audioRef.current) {
            audioRef.current.src = `/api/public/stream/proxy?url=${encodeURIComponent(station.streamUrl)}`;
          }
        }}
      />

      <div className="flex items-center justify-between gap-3">
        {/* Station Logo & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
            <img
              src={station.logoUrl}
              alt={station.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                {station.name}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-400 uppercase">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {nowPlaying}
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Volume control on wider embed */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white p-1">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 accent-sky-500 cursor-pointer bg-slate-800 rounded"
            />
          </div>

          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {!isCompact && (
        <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">{station.city} • {station.genre}</span>
          </div>

          <a
            href={`/?station=${station.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 hover:underline flex items-center gap-1 font-semibold shrink-0"
          >
            <span>ChristianRadios.org</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
