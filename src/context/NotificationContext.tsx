import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { NotificationItem } from '../types';
import { apiFetch } from '../lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  desktopPermission: NotificationPermission;
  requestDesktopPermission: () => Promise<boolean>;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  playChime: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Synthesize a gentle, uplifting chime using Web Audio API (no audio asset required)
function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic bell chime: C6 (1046.5Hz) followed by G6 (1567.9Hz)
    const tones = [
      { freq: 1046.5, start: now, duration: 0.35, gainVal: 0.12 },
      { freq: 1567.9, start: now + 0.08, duration: 0.45, gainVal: 0.15 },
    ];

    tones.forEach(({ freq, start, duration, gainVal }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // AudioContext blocked or not supported in this environment
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cr_notif_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const previousCountRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem('cr_notif_sound', enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const requestDesktopPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setDesktopPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  };

  const showDesktopNotification = (title: string, body: string) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    ) {
      try {
        new Notification(title, {
          body,
          icon: '/brand-logo.png',
        });
      } catch {
        // Desktop notification failed
      }
    }
  };

  // Fetch full notification list
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/api/notifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = data.notifications || [];
        const unread: number = typeof data.unreadCount === 'number' ? data.unreadCount : list.filter((n) => !n.read).length;
        
        setNotifications(list);
        setUnreadCount(unread);

        // If newly arrived unread notifications during active session
        if (hasInitializedRef.current && unread > previousCountRef.current) {
          if (soundEnabled) {
            playGentleChime();
          }
          const latest = list[0];
          if (latest && !latest.read) {
            showDesktopNotification(latest.title, latest.message);
          }
        }

        previousCountRef.current = unread;
        hasInitializedRef.current = true;
      }
    } catch {
      // Handle network issue gracefully
    } finally {
      setLoading(false);
    }
  }, [user, soundEnabled]);

  // Fast lightweight unread count check
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        const newUnread: number = data.unreadCount ?? 0;
        
        if (hasInitializedRef.current && newUnread > previousCountRef.current) {
          if (soundEnabled) {
            playGentleChime();
          }
          // Also refresh full list
          fetchNotifications();
        }
        
        setUnreadCount(newUnread);
        previousCountRef.current = newUnread;
      }
    } catch {
      // Silently ignore polling network failures
    }
  }, [user, soundEnabled, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
          previousCountRef.current = data.unreadCount;
        }
      }
    } catch {
      // Refresh on failure
      fetchNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    previousCountRef.current = 0;

    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
    } catch {
      fetchNotifications();
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    const itemToDelete = notifications.find((n) => n.id === id);
    const wasUnread = itemToDelete && !itemToDelete.read;

    // Optimistic UI update
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
          previousCountRef.current = data.unreadCount;
        }
      }
    } catch {
      fetchNotifications();
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);
    previousCountRef.current = 0;

    try {
      await apiFetch('/api/notifications', { method: 'DELETE' });
    } catch {
      fetchNotifications();
    }
  };

  // Initialize on user change
  useEffect(() => {
    if (user) {
      hasInitializedRef.current = false;
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      previousCountRef.current = 0;
      hasInitializedRef.current = false;
    }
  }, [user, fetchNotifications]);

  // Periodic background polling (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    const onWindowFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        soundEnabled,
        setSoundEnabled,
        desktopPermission,
        requestDesktopPermission,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        playChime: playGentleChime,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
