import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Moon,
  Share2,
  AlertTriangle,
  RotateCw,
  Radio,
  Clock,
  Sparkles,
  Signal,
  Music,
  MessageSquare,
  Users,
  ShieldCheck,
  Wifi,
  X,
  Headphones,
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { ReportModal } from '../station/ReportModal';
import { ShareModal } from '../station/ShareModal';

export function PersistentPlayer() {
  const {
    currentStation,
    nowPlaying,
    isPlaying,
    isLoading,
    isBuffering,
    volume,
    isMuted,
    hasError,
    errorMessage,
    sleepTimerMinutes,
    sleepTimerRemainingSeconds,
    liveListenersCount,
    isUsingBackupStream,
    isIdentPlaying,
    identRemainingSeconds,
    skipIdent,
    togglePlay,
    setVolume,
    toggleMute,
    setSleepTimer,
    setIsExpanded,
    retryStream,
  } = useAudioPlayer();

  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Track listening session duration when active
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!currentStation) {
    return null;
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatSessionTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // WhatsApp Hotline URL
  const rawPhone = currentStation.whatsappNumber || currentStation.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Praise the Lord! I am tuning in live to ${currentStation.name} via Christian Radios.`
      )}`
    : null;

  // Waveform Bar Heights for Animated Audio Equalizer
  const waveHeights = [35, 75, 45, 95, 60, 100, 75, 40, 90, 55, 100, 70, 50, 85, 65, 95, 45, 80, 55, 70];

  const currentVolumePercent = isMuted ? 0 : Math.round(volume * 100);

  // Safely extract country display
  const countryDisplayName =
    typeof currentStation.country === 'object' && currentStation.country !== null
      ? (currentStation.country as any).name || (currentStation.country as any).code || ''
      : typeof currentStation.country === 'string'
      ? currentStation.country
      : currentStation.countryCode || '';

  return (
    <>
      {/* Floating Modern Audio Player Dock Widget */}
      <div className="fixed bottom-2 sm:bottom-4 inset-x-2 sm:inset-x-4 lg:inset-x-8 z-50 pointer-events-none flex justify-center">
        <div
          className={`pointer-events-auto relative w-full max-w-7xl overflow-hidden rounded-3xl bg-slate-950/92 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-800 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.95),0_0_35px_rgba(16,185,129,0.18)] ring-1 ring-white/10 transition-all duration-300 ${
            isPlaying ? 'animate-audio-glow-breathe' : ''
          }`}
        >
          {/* Ambient Audio Mesh Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-sky-500/10 pointer-events-none" />

          {/* Top Audio Ambient Line */}
          {hasError ? (
            <div className="absolute top-0 inset-x-0 h-[2px] bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
          ) : isBuffering || isLoading ? (
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          ) : isPlaying ? (
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
          ) : (
            <div className="absolute top-0 inset-x-0 h-[1px] bg-slate-800" />
          )}

          {/* Stream Error Banner */}
          {hasError && (
            <div className="bg-rose-950/90 border-b border-rose-800/60 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                <span className="truncate font-medium">{errorMessage || 'Stream connection issue. Reconnecting...'}</span>
              </div>
              <button
                onClick={retryStream}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 ml-3 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Re-sync Live</span>
              </button>
            </div>
          )}

          {/* Backup Failover Stream Banner */}
          {isUsingBackupStream && !hasError && (
            <div className="bg-amber-950/70 border-b border-amber-800/40 px-4 py-1 text-[11px] text-amber-300 flex items-center justify-center gap-1.5 relative z-10">
              <Signal className="w-3 h-3 text-amber-400" />
              <span>Transmitting via High-Availability Backup Feed</span>
            </div>
          )}

          {/* Pre-Listen Audio Ident / Sonic Logo Banner */}
          {isIdentPlaying && (
            <div className="bg-gradient-to-r from-amber-950/95 via-purple-950/90 to-slate-950 border-b border-amber-500/40 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between relative z-10 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
                <span className="font-bold text-amber-300">Station Ident:</span>
                <span className="truncate italic text-amber-100">"One World. One Faith. Thousands of Voices."</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono text-amber-300 ml-1">
                  {identRemainingSeconds}s
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skipIdent();
                }}
                className="text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 ml-3 cursor-pointer"
                title="Skip directly to live broadcast"
              >
                <span>Skip to Live</span>
                <span className="font-mono">›</span>
              </button>
            </div>
          )}

          {/* Main Floating Widget Body */}
          <div className="relative z-10 w-full px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
            
            {/* LEFT SECTION: Station Identity & Now Playing Track */}
            <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md">
              {/* Artwork with Live Equalizer Badge and Click-to-Expand */}
              <div
                onClick={() => setIsExpanded(true)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isPlaying
                    ? 'ring-2 ring-emerald-400/80 shadow-[0_0_18px_rgba(16,185,129,0.45)]'
                    : 'ring-1 ring-slate-800'
                }`}
                title="Click to expand player"
              >
                <img
                  src={
                    nowPlaying?.albumArtUrl ||
                    currentStation.logoUrl ||
                    currentStation.coverUrl ||
                    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={currentStation.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (
                      img.src !==
                      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'
                    ) {
                      img.src =
                        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                    }
                  }}
                />

                {/* Live Animated Equalizer Corner Overlay */}
                {isPlaying && (
                  <div className="absolute bottom-1 right-1 bg-slate-950/85 backdrop-blur-sm rounded-md px-1 py-0.5 flex items-end gap-0.5 border border-emerald-500/40">
                    <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-0.5 h-3.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-0.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                )}

                {/* Hover Expand Icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              </div>

              {/* Station Info & Track Metadata */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    onClick={() => setIsExpanded(true)}
                    className="font-bold text-xs sm:text-sm text-white truncate cursor-pointer hover:text-emerald-400 transition-colors tracking-tight"
                  >
                    {currentStation.name}
                  </span>

                  {/* Blinking Live Radar Beacon & On-Air Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                      isPlaying
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      {isPlaying && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isPlaying
                            ? 'bg-emerald-400 animate-audio-blink shadow-[0_0_6px_rgba(16,185,129,1)]'
                            : 'bg-slate-500'
                        }`}
                      />
                    </span>
                    <span className={isPlaying ? 'animate-audio-blink' : ''}>
                      {isPlaying ? 'ON AIR' : 'OFFLINE'}
                    </span>
                  </span>

                  {/* Listeners Count (if active) */}
                  {liveListenersCount > 0 && (
                    <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Users className="w-2.5 h-2.5 text-sky-400" />
                      <span>{liveListenersCount}</span>
                    </span>
                  )}
                </div>

                {/* Now Playing Song / Program Stream with Blinking Rhythm Music Icon */}
                <div className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
                  <Music
                    className={`w-3 h-3 text-emerald-400 shrink-0 ${
                      isPlaying ? 'animate-audio-blink' : 'opacity-60'
                    }`}
                  />
                  <p className="truncate font-medium text-[11px] sm:text-xs">
                    {nowPlaying?.currentTrack ? (
                      <>
                        <span className="text-white font-semibold">"{nowPlaying.currentTrack}"</span>
                        {nowPlaying.artistOrMinister && (
                          <span className="text-emerald-300/90 font-medium"> — {nowPlaying.artistOrMinister}</span>
                        )}
                      </>
                    ) : nowPlaying?.showName ? (
                      <span className="text-sky-300 font-medium">
                        {nowPlaying.showName}
                        {nowPlaying.presenterName ? ` with ${nowPlaying.presenterName}` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {[currentStation.city, countryDisplayName, currentStation.genre || currentStation.language || 'Christian Radio']
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* CENTER SECTION: Audio Engine & Realtime Waveform Visualizer */}
            <div className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Re-sync Stream Edge Button */}
                <button
                  type="button"
                  onClick={retryStream}
                  title="Re-sync stream to live broadcast edge"
                  className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Primary Master Play / Pause Orb with Glowing Halo */}
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  aria-label={isPlaying ? 'Pause broadcast' : 'Play broadcast'}
                  className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 disabled:opacity-75 cursor-pointer focus:outline-none ${
                    isPlaying
                      ? 'ring-4 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.55)] animate-pulse'
                      : 'shadow-slate-900 ring-2 ring-slate-700/50'
                  }`}
                >
                  {isLoading || isBuffering ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Sleep Timer Quick Toggle for Center/Mobile */}
                <button
                  type="button"
                  onClick={() => setShowSleepTimerModal(!showSleepTimerModal)}
                  title="Sleep Timer"
                  className={`sm:hidden p-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 ${
                    sleepTimerRemainingSeconds !== null
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Waveform Visualizer Bars & Session Timer */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-0.5 h-4 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800/80 shadow-inner">
                  {waveHeights.map((h, i) => (
                    <span
                      key={i}
                      style={{
                        height: isPlaying ? `${h}%` : '20%',
                        animationDuration: isPlaying ? `${0.35 + (i % 5) * 0.12}s` : '0s',
                      }}
                      className={`w-0.5 rounded-full bg-gradient-to-t from-emerald-500 via-teal-400 to-sky-300 transition-all ${
                        isPlaying ? 'animate-bounce' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>

                {/* Active Session Listening Timer with Blinking Live Pulse */}
                {isPlaying && (
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md"
                    title="Live stream listening duration"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-audio-blink" />
                    <span>{formatSessionTime(sessionSeconds)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SECTION: Listener Tools, Audio Bitrate, Volume & Fullscreen */}
            <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-1 max-w-[180px] sm:max-w-xs md:max-w-sm">
              
              {/* WhatsApp Studio Hotline Quick Action */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Message radio studio on WhatsApp"
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shadow-sm hover:scale-105"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Audio Quality / Codec Pill */}
              {(currentStation.bitrate || currentStation.codec) && (
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{currentStation.bitrate ? `${currentStation.bitrate}k` : ''} {currentStation.codec || 'AAC'}</span>
                </span>
              )}

              {/* Sleep Timer Desktop Button */}
              <button
                type="button"
                onClick={() => setShowSleepTimerModal(!showSleepTimerModal)}
                title="Set Sleep Timer"
                className={`hidden sm:flex p-2 rounded-xl text-xs transition-colors items-center gap-1.5 cursor-pointer ${
                  sleepTimerRemainingSeconds !== null
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Moon className="w-4 h-4" />
                {sleepTimerRemainingSeconds !== null && (
                  <span className="font-mono text-[10px] font-bold text-amber-300">
                    {formatTimer(sleepTimerRemainingSeconds)}
                  </span>
                )}
              </button>

              {/* Share Button (Fixed React Error #31) */}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                title="Share radio station"
                className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Stream Issue Report Button */}
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                title="Report broadcast issue"
                className="hidden lg:flex p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {/* Interactive Volume Slider */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800/80 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-18 md:w-22 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 transition-all"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${currentVolumePercent}%, #334155 ${currentVolumePercent}%, #334155 100%)`,
                    }}
                  />
                </div>
              </div>

              {/* Expand to Fullscreen Modal Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Open fullscreen player"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer shrink-0 hover:scale-105"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Modern Glassmorphic Sleep Timer Popover */}
      {showSleepTimerModal && (
        <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-8 lg:right-16 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-5 shadow-2xl w-72 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Moon className="w-4 h-4 text-amber-400" />
              <span>Broadcast Sleep Timer</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSleepTimerModal(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Automatically pause broadcast after you fall asleep in prayer:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimer(mins);
                  setShowSleepTimerModal(false);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sleepTimerMinutes === mins
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/60'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {sleepTimerRemainingSeconds !== null && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-amber-300 font-mono font-bold">
                {formatTimer(sleepTimerRemainingSeconds)} left
              </span>
              <button
                onClick={() => {
                  setSleepTimer(null);
                  setShowSleepTimerModal(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              >
                Turn Off
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stream Issue Report Modal */}
      {showReportModal && currentStation && (
        <ReportModal
          stationId={currentStation.id}
          stationName={currentStation.name}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Station Share Modal */}
      {showShareModal && currentStation && (
        <ShareModal
          station={currentStation}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
