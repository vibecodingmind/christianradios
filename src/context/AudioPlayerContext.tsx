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
  isIdentPlaying: boolean;
  identRemainingSeconds: number;
  skipIdent: () => void;
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

  // Pre-Listen Audio Ident / Sonic Branding State
  const [isIdentPlaying, setIsIdentPlaying] = useState(false);
  const [identRemainingSeconds, setIdentRemainingSeconds] = useState(0);
  const [identConfig, setIdentConfig] = useState({
    enabled: true,
    url: '/audio/christianradios_ident.wav',
    frequency: 'ONCE_PER_SESSION',
    durationSeconds: 4,
    skipAllowed: true,
    customText: "You're listening to ChristianRadios.org. One World. One Faith. Thousands of Voices.",
  });
  const identAudioRef = useRef<HTMLAudioElement | null>(null);
  const identTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStationRef = useRef<Station | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  // Fetch Public Platform Config (Audio Ident, Sonic Branding, etc.)
  useEffect(() => {
    const fetchConfig = () => {
      apiFetch('/api/public/config')
        .then((res) => res.json())
        .then((data) => {
          if (data?.audioIdent) {
            setIdentConfig((prev) => ({ ...prev, ...data.audioIdent }));
          }
        })
        .catch((err) => {
          console.warn('[Player] Using default audio ident config:', err);
        });
    };

    fetchConfig();

    const handleConfigUpdate = (e: any) => {
      if (e?.detail?.audioIdent) {
        setIdentConfig((prev) => ({ ...prev, ...e.detail.audioIdent }));
      } else {
        fetchConfig();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cr:config_updated', handleConfigUpdate);
      return () => {
        window.removeEventListener('cr:config_updated', handleConfigUpdate);
      };
    }
  }, []);

  const skipIdent = useCallback(() => {
    if (identTimerRef.current) {
      clearInterval(identTimerRef.current);
      identTimerRef.current = null;
    }
    if (identAudioRef.current) {
      try {
        identAudioRef.current.pause();
        identAudioRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    setIsIdentPlaying(false);
    setIdentRemainingSeconds(0);

    const pending = pendingStationRef.current;
    if (pending) {
      pendingStationRef.current = null;
      attachAndPlayStream(pending.streamUrl, false);
    }
  }, []);

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

    // Insecure HTTP streams on HTTPS origins trigger mixed-content blocks in modern browsers.
    // Pre-emptively route through secure proxy gateway for immediate, error-free playback:
    let targetStreamUrl = streamUrl;
    let targetIsProxy = isProxy;
    if (
      !isProxy &&
      streamUrl.startsWith('http://') &&
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:'
    ) {
      targetStreamUrl = `/api/public/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
      targetIsProxy = true;
    }

    const isHls = targetStreamUrl.includes('.m3u8') || targetStreamUrl.includes('application/x-mpegURL');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
      });
      hlsRef.current = hls;
      hls.loadSource(targetStreamUrl);
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
            handlePlaybackError(streamUrl, isBackup, targetIsProxy);
          });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          handlePlaybackError(streamUrl, isBackup, targetIsProxy);
        }
      });
    } else {
      // Standard MP3 / AAC / Icecast stream
      audio.src = targetStreamUrl;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('[Player] Direct audio play rejected, attempting proxy gateway:', err);
          handlePlaybackError(streamUrl, isBackup, targetIsProxy);
        });

      audio.onerror = () => {
        console.warn('[Player] Direct audio stream error, attempting proxy gateway...');
        handlePlaybackError(streamUrl, isBackup, targetIsProxy);
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
    setHasError(false);
    setErrorMessage(null);

    const shouldPlayIdent = () => {
      if (identConfig.enabled === false) return false;
      if (identConfig.frequency === 'EVERY_PLAY') return true;
      if (identConfig.frequency === 'HOURLY') {
        const last = localStorage.getItem('cr_ident_last_play');
        if (last && Date.now() - parseInt(last, 10) < 60 * 60 * 1000) return false;
        return true;
      }
      // Default: ONCE_PER_SESSION
      return !sessionStorage.getItem('cr_ident_session_played');
    };

    if (shouldPlayIdent()) {
      sessionStorage.setItem('cr_ident_session_played', 'true');
      localStorage.setItem('cr_ident_last_play', Date.now().toString());

      // Pause any active audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsIdentPlaying(true);
      const duration = Math.max(3, identConfig.durationSeconds || 4);
      setIdentRemainingSeconds(duration);
      pendingStationRef.current = station;

      // Determine target audio URL
      let rawIdentUrl = (identConfig.url || '').trim() || '/audio/christianradios_ident.mp3';
      let targetIdentUrl = rawIdentUrl;

      // If it is an external URL from another domain, route through proxy to bypass CORS / mixed-content / bot blocks
      if (rawIdentUrl.startsWith('http://') || rawIdentUrl.startsWith('https://')) {
        try {
          const parsed = new URL(rawIdentUrl);
          if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) {
            targetIdentUrl = `/api/public/stream-proxy?url=${encodeURIComponent(rawIdentUrl)}`;
          }
        } catch {}
      }

      // Play ident sound with robust fallback
      try {
        if (!identAudioRef.current) {
          identAudioRef.current = new Audio();
        }
        const identAudio = identAudioRef.current;
        identAudio.volume = isMuted ? 0 : volume;

        const endIdentAndPlay = () => {
          if (identTimerRef.current) {
            clearInterval(identTimerRef.current);
            identTimerRef.current = null;
          }
          if (identAudio) {
            try { identAudio.pause(); } catch {}
          }
          setIsIdentPlaying(false);
          setIdentRemainingSeconds(0);
          const pending = pendingStationRef.current;
          pendingStationRef.current = null;
          if (pending) {
            attachAndPlayStream(pending.streamUrl, false);
          }
        };

        // When audio ends naturally, transition immediately to radio broadcast!
        identAudio.onended = () => {
          endIdentAndPlay();
        };

        // Adjust duration dynamically once metadata is loaded
        identAudio.onloadedmetadata = () => {
          if (identAudio.duration && isFinite(identAudio.duration) && identAudio.duration > 1) {
            const actualDur = Math.min(15, Math.ceil(identAudio.duration));
            setIdentRemainingSeconds(actualDur);
          }
        };

        // Fallback if custom URL fails (e.g. 403 Forbidden from hotlinking, 404, or network error)
        identAudio.onerror = () => {
          console.warn('[AudioIdent] Target URL failed to load:', targetIdentUrl, 'Falling back to local audio.');
          identAudio.onerror = null;
          identAudio.src = '/audio/christianradios_ident.mp3';
          identAudio.play().catch(() => {});
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(
                identConfig.customText || "You're listening to Christian Radios. One World. One Faith. Thousands of Voices."
              );
              utterance.rate = 1.0;
              utterance.pitch = 1.0;
              utterance.volume = isMuted ? 0 : volume;
              window.speechSynthesis.speak(utterance);
            } catch {}
          }
        };

        identAudio.src = targetIdentUrl;
        identAudio.currentTime = 0;
        identAudio.play().catch((e) => {
          console.warn('[AudioIdent] Background audio play notice:', e);
        });

        // Speech synthesis overlay if using built-in chime or if custom audio is not an MP3
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && !targetIdentUrl.toLowerCase().includes('.mp3')) {
          try {
            window.speechSynthesis.cancel();
            const textToSpeak = identConfig.customText || "You're listening to Christian Radios. One World. One Faith. Thousands of Voices.";
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = isMuted ? 0 : volume;
            window.speechSynthesis.speak(utterance);
          } catch {}
        }
      } catch (err) {
        console.warn('[AudioIdent] Ident start notice:', err);
      }

      // Countdown safety timer
      if (identTimerRef.current) {
        clearInterval(identTimerRef.current);
      }
      let remaining = duration;
      identTimerRef.current = setInterval(() => {
        remaining -= 1;
        setIdentRemainingSeconds(Math.max(0, remaining));
        if (remaining <= 0) {
          if (identTimerRef.current) {
            clearInterval(identTimerRef.current);
            identTimerRef.current = null;
          }
          if (identAudioRef.current) {
            try {
              identAudioRef.current.pause();
            } catch {}
          }
          setIsIdentPlaying(false);
          const pending = pendingStationRef.current;
          pendingStationRef.current = null;
          if (pending) {
            attachAndPlayStream(pending.streamUrl, false);
          }
        }
      }, 1000);
    } else {
      setIsIdentPlaying(false);
      attachAndPlayStream(station.streamUrl, false);
    }
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
    if (identAudioRef.current) {
      try {
        identAudioRef.current.pause();
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
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
    localStorage.setItem('cr_volume', clamped.toString());
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (identAudioRef.current) {
      identAudioRef.current.volume = isMuted ? 0 : clamped;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      if (identAudioRef.current) {
        identAudioRef.current.muted = next;
      }
      return next;
    });
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
        isIdentPlaying,
        identRemainingSeconds,
        skipIdent,
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
