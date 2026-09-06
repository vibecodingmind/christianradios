import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import Hls from 'hls.js';
import type { Station, NowPlayingInfo } from '../types';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';
import { PremiumStationSubscriptionModal } from '../components/modals/PremiumStationSubscriptionModal';

interface AudioPlayerContextType {
  currentStation: Station | null;
  nowPlaying: NowPlayingInfo | null;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  hasError: boolean;
  errorMessage: string | null;
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSeconds: number | null;
  liveListenersCount: number;
  isExpanded: boolean;
  isUsingBackupStream: boolean;
  playStation: (station: Station) => void;
  playStream: (station: Station) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setIsExpanded: (expanded: boolean) => void;
  retryStream: () => void;
  refreshNowPlaying: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('cr_volume');
    return saved !== null ? parseFloat(saved) : 0.85;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemainingSeconds, setSleepTimerRemainingSeconds] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUsingBackupStream, setIsUsingBackupStream] = useState(false);
  const [subscribingStation, setSubscribingStation] = useState<Station | null>(null);
  const [liveListenersCount, setLiveListenersCount] = useState<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  if (!sessionIdRef.current) {
    try {
      let saved = sessionStorage.getItem('cr_live_session_id');
      if (!saved) {
        saved = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('cr_live_session_id', saved);
      }
      sessionIdRef.current = saved;
    } catch {
      sessionIdRef.current = `sess_${Date.now()}`;
    }
  }

  const { user } = useAuth();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionSecondsRef = useRef<number>(0);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time Live Listener Heartbeat Ping Engine
  useEffect(() => {
    if (!isPlaying || !currentStation) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    const sessionId = sessionIdRef.current;
    const stId = currentStation.id;

    const pingHeartbeat = async () => {
      try {
        const res = await fetch(`/api/public/stations/${stId}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            countryCode: currentStation.countryCode,
            bitrate: 128,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.liveListeners === 'number') {
            setLiveListenersCount(data.liveListeners);
          }
        }
      } catch {
        // silent heartbeat ignore
      }
    };

    pingHeartbeat();
    heartbeatIntervalRef.current = setInterval(pingHeartbeat, 25000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      try {
        fetch(`/api/public/stations/${stId}/heartbeat/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // silent
      }
    };
  }, [isPlaying, currentStation?.id]);

  // Initialize HTML5 Audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'none';
      audioRef.current = audio;

      audio.onwaiting = () => {
        setIsBuffering(true);
      };
      audio.onplaying = () => {
        setIsLoading(false);
        setIsBuffering(false);
        setIsPlaying(true);
        setHasError(false);
      };
      audio.onpause = () => {
        setIsPlaying(false);
        setIsBuffering(false);
      };
    }
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('cr_volume', volume.toString());
  }, [volume, isMuted]);

  // Record Listening Session telemetry periodically
  const sendSessionTelemetry = useCallback(() => {
    if (currentStation && sessionSecondsRef.current >= 5) {
      const duration = sessionSecondsRef.current;
      sessionSecondsRef.current = 0;
      fetch('/api/listener/history/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: currentStation.id,
          durationSeconds: duration,
          clientType: 'WEB',
          countryCode: currentStation.countryCode,
        }),
      }).catch(() => {});
    }
  }, [currentStation]);

  useEffect(() => {
    if (isPlaying && currentStation) {
      sessionTimerRef.current = setInterval(() => {
        sessionSecondsRef.current += 10;
        if (sessionSecondsRef.current >= 60) {
          sendSessionTelemetry();
        }
      }, 10000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      sendSessionTelemetry();
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isPlaying, currentStation, sendSessionTelemetry]);

  // Sleep Timer Countdown Engine
  useEffect(() => {
    if (sleepTimerRemainingSeconds === null || sleepTimerRemainingSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSleepTimerRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemainingSeconds]);

  // MediaSession API Integration for native OS controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentStation) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nowPlaying?.currentTrack || currentStation.name,
        artist: nowPlaying?.artistOrMinister || currentStation.genre || 'Christian Radio Live',
        album: nowPlaying?.programTitle || (currentStation.city ? `${currentStation.city}, ${currentStation.countryCode}` : 'Christian Radios'),
        artwork: [
          {
            src: currentStation.logoUrl || '/icon.png',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        resume();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        pause();
      });
    }
  }, [currentStation, nowPlaying]);

  // Fetch Live Now Playing ICY Metadata
  const refreshNowPlaying = useCallback(async () => {
    if (!currentStation) {
      setNowPlaying(null);
      return;
    }
    try {
      const identifier = encodeURIComponent(currentStation.slug || currentStation.id);
      const res = await fetch(`/api/public/stations/${identifier}/now-playing`);
      if (res.ok) {
        const data: NowPlayingInfo = await res.json();
        setNowPlaying(data);
      }
    } catch {
      // Non-blocking fallback
    }
  }, [currentStation]);

  useEffect(() => {
    if (currentStation) {
      refreshNowPlaying();
      const interval = setInterval(refreshNowPlaying, 15000); // refresh every 15s
      return () => clearInterval(interval);
    } else {
      setNowPlaying(null);
    }
  }, [currentStation, refreshNowPlaying]);

  // Play audio url with automatic stream proxy fallback
  const attachAndPlayStream = (streamUrl: string, isBackup = false, isProxy = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    setIsUsingBackupStream(isBackup);

    // Timeout trigger for backup / proxy stream fallback
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
    }

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('application/x-mpegURL');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(audio);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error('HLS play error:', err);
            handlePlaybackError(streamUrl, isBackup, isProxy);
          });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          handlePlaybackError(streamUrl, isBackup, isProxy);
        }
      });
    } else {
      // Standard MP3 / AAC / Icecast stream
      audio.src = streamUrl;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('[Player] Direct audio play rejected, attempting proxy gateway:', err);
          handlePlaybackError(streamUrl, isBackup, isProxy);
        });

      audio.onerror = () => {
        console.warn('[Player] Direct audio stream error, attempting proxy gateway...');
        handlePlaybackError(streamUrl, isBackup, isProxy);
      };
    }
  };

  const handlePlaybackError = (failedUrl: string, wasBackup: boolean, wasProxy: boolean) => {
    setIsLoading(false);
    setIsBuffering(false);

    if (!wasProxy && !failedUrl.includes('/api/public/stream-proxy')) {
      console.log('[Player] Direct stream failed. Retrying via stream proxy server...');
      const proxyUrl = `/api/public/stream-proxy?url=${encodeURIComponent(failedUrl)}`;
      attachAndPlayStream(proxyUrl, wasBackup, true);
    } else if (!wasBackup && currentStation?.backupStreamUrl) {
      console.log('[Player] Stream failed, attempting backup stream:', currentStation.backupStreamUrl);
      attachAndPlayStream(currentStation.backupStreamUrl, true, false);
    } else {
      setHasError(true);
      setIsPlaying(false);
      setErrorMessage('Unable to connect to live audio broadcast. The stream may be temporarily offline.');
    }
  };

  const startPlayingStation = (station: Station) => {
    setCurrentStation(station);
    setIsUsingBackupStream(false);
    attachAndPlayStream(station.streamUrl, false);
  };

  const playStation = async (station: Station) => {
    if (station.accessType === 'PREMIUM') {
      try {
        const query = user?.id ? `?listenerId=${encodeURIComponent(user.id)}` : '';
        const res = await apiFetch(`/api/public/stations/${station.id}/access${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPremium && !data.hasAccess) {
            setSubscribingStation(station);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed checking premium station access:', e);
      }
    }

    startPlayingStation(station);
  };

  const playStream = (station: Station) => {
    playStation(station);
  };

  const togglePlay = () => {
    if (!currentStation) return;
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const resume = () => {
    if (audioRef.current && currentStation) {
      if (!audioRef.current.src || audioRef.current.src === '' || hasError) {
        attachAndPlayStream(currentStation.streamUrl, isUsingBackupStream);
      } else {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
          })
          .catch(() => {
            attachAndPlayStream(currentStation.streamUrl, false);
          });
      }
    }
  };

  const setVolume = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepTimerRemainingSeconds(null);
    } else {
      setSleepTimerRemainingSeconds(minutes * 60);
    }
  };

  const retryStream = () => {
    if (currentStation) {
      attachAndPlayStream(currentStation.streamUrl, false);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
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
        isExpanded,
        isUsingBackupStream,
        playStation,
        playStream,
        togglePlay,
        pause,
        resume,
        setVolume,
        toggleMute,
        setSleepTimer,
        setIsExpanded,
        retryStream,
        refreshNowPlaying,
      }}
    >
      {children}
      {subscribingStation && (
        <PremiumStationSubscriptionModal
          isOpen={!!subscribingStation}
          onClose={() => setSubscribingStation(null)}
          station={subscribingStation}
          onSubscriptionSuccess={() => {
            const st = subscribingStation;
            setSubscribingStation(null);
            if (st) startPlayingStation(st);
          }}
        />
      )}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
