import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Moon,
  Share2,
  AlertTriangle,
  RotateCw,
  Radio,
  Clock,
  Sparkles,
  Signal,
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { ReportModal } from '../station/ReportModal';
import { ShareModal } from '../station/ShareModal';

export function PersistentPlayer() {
  const {
    currentStation,
    isPlaying,
    isLoading,
    isBuffering,
    volume,
    isMuted,
    hasError,
    errorMessage,
    sleepTimerMinutes,
    sleepTimerRemainingSeconds,
    isUsingBackupStream,
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

  if (!currentStation) {
    return null;
  }

  // Format sleep timer seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 text-white shadow-2xl transition-all">
        {/* Buffering or Error Notification Strip */}
        {hasError && (
          <div className="bg-rose-900/90 border-b border-rose-700/60 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate">{errorMessage || 'Stream playback error'}</span>
            </div>
            <button
              onClick={retryStream}
              className="text-xs font-semibold bg-rose-800 hover:bg-rose-700 text-white px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-colors shrink-0 ml-2"
            >
              <RotateCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {isUsingBackupStream && !hasError && (
          <div className="bg-amber-950/80 border-b border-amber-800/50 px-4 py-1 text-[11px] text-amber-300 flex items-center justify-center gap-1.5">
            <Signal className="w-3 h-3" />
            <span>Connected via Failover Backup Stream</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Left: Station Info & Cover */}
          <div className="flex items-center gap-3 min-w-0 max-w-[280px] sm:max-w-xs md:max-w-sm">
            <div
              onClick={() => setIsExpanded(true)}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 cursor-pointer group shadow-md"
            >
              <img
                src={currentStation.logoUrl}
                alt={currentStation.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  onClick={() => setIsExpanded(true)}
                  className="font-semibold text-sm sm:text-base text-slate-100 truncate cursor-pointer hover:text-sky-400 transition-colors"
                >
                  {currentStation.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              </div>
              <p className="text-xs text-slate-400 truncate">
                {currentStation.city ? `${currentStation.city} • ` : ''}
                {currentStation.genre || currentStation.language}
              </p>
            </div>
          </div>

          {/* Center: Main Play Controls & Audio Waveform */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={togglePlay}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause broadcast' : 'Play broadcast'}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 active:scale-95 transition-all disabled:opacity-75 focus:outline-none"
              >
                {isLoading || isBuffering ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="hidden sm:flex items-center gap-1 h-3 mt-0.5">
              {[40, 75, 55, 90, 60, 85, 45, 70, 95, 50, 65, 80].map((height, i) => (
                <span
                  key={i}
                  style={{
                    height: isPlaying ? `${height}%` : '20%',
                    animationDuration: isPlaying ? `${0.4 + (i % 4) * 0.2}s` : '0s',
                  }}
                  className={`w-0.5 rounded-full bg-sky-400 transition-all ${
                    isPlaying ? 'animate-pulse' : 'opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: Volume & Secondary Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sleep Timer button */}
            <button
              onClick={() => setShowSleepTimerModal(!showSleepTimerModal)}
              title="Sleep Timer"
              className={`p-2 rounded-xl text-xs transition-colors flex items-center gap-1 ${
                sleepTimerRemainingSeconds !== null
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Moon className="w-4 h-4" />
              {sleepTimerRemainingSeconds !== null && (
                <span className="font-mono text-[11px] font-semibold">
                  {formatTimer(sleepTimerRemainingSeconds)}
                </span>
              )}
            </button>

            {/* Share button */}
            <button
              onClick={() => setShowShareModal(true)}
              title="Share station"
              className="hidden sm:flex p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Report issue */}
            <button
              onClick={() => setShowReportModal(true)}
              title="Report stream issue"
              className="hidden md:flex p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            {/* Desktop Volume Slider */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Fullscreen Player Button */}
            <button
              onClick={() => setIsExpanded(true)}
              title="Expand player view"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sleep Timer Selector Modal */}
      {showSleepTimerModal && (
        <div className="fixed bottom-24 right-4 sm:right-12 z-50 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl w-64 text-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Moon className="w-4 h-4 text-amber-400" />
              Sleep Timer
            </div>
            {sleepTimerRemainingSeconds !== null && (
              <span className="text-xs font-mono text-amber-400">
                {formatTimer(sleepTimerRemainingSeconds)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[15, 30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimer(mins);
                  setShowSleepTimerModal(false);
                }}
                className={`text-xs py-2 px-3 rounded-xl font-medium transition-colors ${
                  sleepTimerMinutes === mins
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
          {sleepTimerRemainingSeconds !== null && (
            <button
              onClick={() => {
                setSleepTimer(null);
                setShowSleepTimerModal(false);
              }}
              className="w-full mt-3 text-xs text-rose-400 hover:bg-rose-500/10 py-1.5 rounded-lg transition-colors"
            >
              Turn Off Sleep Timer
            </button>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          stationId={currentStation.id}
          stationName={currentStation.name}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          station={currentStation}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
