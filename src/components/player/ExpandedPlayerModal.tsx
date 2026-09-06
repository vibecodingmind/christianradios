import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
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
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { ReportModal } from '../station/ReportModal';
import { ShareModal } from '../station/ShareModal';

export function ExpandedPlayerModal() {
  const {
    currentStation,
    nowPlaying,
    isPlaying,
    isLoading,
    isBuffering,
    volume,
    isMuted,
    isExpanded,
    setIsExpanded,
    togglePlay,
    setVolume,
    toggleMute,
    retryStream,
    isUsingBackupStream,
    isIdentPlaying,
    identRemainingSeconds,
    skipIdent,
  } = useAudioPlayer();

  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'schedule'>('info');

  if (!isExpanded || !currentStation) {
    return null;
  }

  const isFavorited = isFavorite(currentStation.id);

  const handleToggleFavorite = () => {
    toggleFavorite(currentStation);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl text-slate-100 flex flex-col justify-between overflow-y-auto">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 py-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Live Christian Broadcast
          </span>
          {isUsingBackupStream && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Backup Audio Feed
            </span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Pre-Listen Audio Ident Banner in Modal */}
      {isIdentPlaying && (
        <div className="bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-slate-900 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span className="font-bold text-amber-300">Christian Radios Sonic Ident:</span>
            <span className="italic text-amber-100">"One World. One Faith. Thousands of Voices."</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono text-amber-300">
              {identRemainingSeconds}s
            </span>
          </div>
          <button
            onClick={skipIdent}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
          >
            <span>Skip to Live</span>
            <span>›</span>
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {/* Left: Big Station Artwork with Visualizer Ring */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/80 group">
            <img
              src={currentStation.logoUrl || currentStation.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
              alt={currentStation.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                  img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-semibold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                {currentStation.genre || 'Gospel & Praise'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 ${
                isFavorited
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform duration-200 ${isFavorited ? 'fill-current text-rose-500 scale-110' : ''}`} />
              {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-2xl transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="p-3 bg-slate-900 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-2xl transition-colors"
              title="Report Stream Issue"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Details & Broadcast Schedule */}
        <div className="w-full md:max-w-md flex flex-col">
          {/* Station Title & Tagline */}
          <div className="mb-4 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {currentStation.name}
            </h2>
            {currentStation.tagline && (
              <p className="text-sm text-sky-400 font-medium italic mt-1">
                &ldquo;{currentStation.tagline}&rdquo;
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {currentStation.city}, {currentStation.countryCode} •{' '}
              {currentStation.denomination || 'Christian'}
            </p>
          </div>

          {/* Real-time Now Playing / ICY Metadata Card */}
          {nowPlaying && (
            <div className="mb-4 bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/40 rounded-2xl p-3.5 flex items-center gap-3 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 animate-pulse">
                <Radio className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Live On Air
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                </div>
                <p className="text-xs font-bold text-white truncate">
                  {nowPlaying.currentTrack || 'Christian Praise & Worship Broadcast'}
                </p>
                {(nowPlaying.artistOrMinister || nowPlaying.programTitle) && (
                  <p className="text-[11px] text-slate-300 truncate">
                    {nowPlaying.artistOrMinister ? `${nowPlaying.artistOrMinister} ` : ''}
                    {nowPlaying.programTitle ? `• ${nowPlaying.programTitle}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs (Info vs Schedule) */}
          <div className="flex border-b border-slate-800 mb-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'info'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Station Info
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Program Schedule
            </button>
          </div>

          {/* Tab 1: Info */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-64 overflow-y-auto pr-1">
              <p>{currentStation.description}</p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Stream Quality
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {currentStation.bitrateKbps || 128} kbps • {currentStation.streamType}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Broadcast Status
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live & Online
                  </span>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                {currentStation.websiteUrl && (
                  <a
                    href={currentStation.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {currentStation.email && (
                  <a
                    href={`mailto:${currentStation.email}`}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Contact
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Broadcast Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currentStation.schedule && currentStation.schedule.length > 0 ? (
                currentStation.schedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-100 block">
                        {item.programName}
                      </span>
                      {item.presenter && (
                        <span className="text-[11px] text-slate-400 block">
                          Host: {item.presenter}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                        {item.startTime} - {item.endTime}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {dayNames[item.dayOfWeek]}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Broadcast timetable is updated continuously by the station manager.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Big Interactive Bottom Controller */}
      <div className="max-w-2xl mx-auto w-full px-6 py-6 border-t border-slate-800/80 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-sky-500/30 active:scale-95 transition-all"
          >
            {isLoading || isBuffering ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* Volume Bar */}
        <div className="w-full flex items-center justify-center gap-3">
          <button onClick={toggleMute} className="text-slate-400 hover:text-white">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-64 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      </div>

      {/* Modals */}
      {showReport && (
        <ReportModal
          stationId={currentStation.id}
          stationName={currentStation.name}
          onClose={() => setShowReport(false)}
        />
      )}
      {showShare && (
        <ShareModal station={currentStation} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
