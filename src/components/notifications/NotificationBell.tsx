import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Radio,
  Mic2,
  Heart,
  Sparkles,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import type { NotificationItem } from '../../types';

interface NotificationBellProps {
  onNavigate: (view: string, param?: string) => void;
  className?: string;
}

type FilterCategory = 'ALL' | 'STUDIO' | 'PRAYERS' | 'STATIONS' | 'BILLING';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getNotificationVisuals(type: string) {
  switch (type) {
    case 'SONG_REQUEST':
      return {
        icon: Mic2,
        badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        label: 'Song Request',
      };
    case 'PRAYER_REQUEST':
      return {
        icon: Heart,
        badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        label: 'Prayer Request',
      };
    case 'PRAYER_ANSWERED':
      return {
        icon: Sparkles,
        badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        label: 'Praise Report',
      };
    case 'STREAM_OUTAGE':
      return {
        icon: AlertTriangle,
        badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
        label: 'Stream Alert',
      };
    case 'STREAM_RECOVERED':
    case 'STATION_APPROVED':
      return {
        icon: CheckCircle2,
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        label: 'Stream Online',
      };
    case 'PAYMENT_SUCCESS':
    case 'NEW_DONATION':
    case 'WITHDRAWAL_UPDATE':
      return {
        icon: CreditCard,
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        label: 'Billing & Tithes',
      };
    case 'PAYMENT_FAILED':
    case 'SUBSCRIPTION_EXPIRING':
      return {
        icon: AlertTriangle,
        badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        label: 'Subscription',
      };
    case 'CLAIM_UPDATE':
    case 'KYC_UPDATE':
      return {
        icon: ShieldCheck,
        badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        label: 'Verification',
      };
    default:
      return {
        icon: Radio,
        badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        label: 'Broadcast System',
      };
  }
}

export function NotificationBell({ onNavigate, className = '' }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    playChime,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Categorize notifications
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'STUDIO') {
      return item.type === 'SONG_REQUEST' || item.title.toLowerCase().includes('song') || item.title.toLowerCase().includes('shout');
    }
    if (activeFilter === 'PRAYERS') {
      return item.type === 'PRAYER_REQUEST' || item.type === 'PRAYER_ANSWERED' || item.title.toLowerCase().includes('prayer');
    }
    if (activeFilter === 'STATIONS') {
      return (
        item.type === 'STREAM_OUTAGE' ||
        item.type === 'STREAM_RECOVERED' ||
        item.type === 'STATION_APPROVED' ||
        item.type === 'STATION_REJECTED' ||
        item.type === 'CLAIM_UPDATE' ||
        item.type === 'KYC_UPDATE'
      );
    }
    if (activeFilter === 'BILLING') {
      return (
        item.type === 'PAYMENT_SUCCESS' ||
        item.type === 'PAYMENT_FAILED' ||
        item.type === 'SUBSCRIPTION_EXPIRING' ||
        item.type === 'NEW_DONATION' ||
        item.type === 'WITHDRAWAL_UPDATE'
      );
    }
    return true;
  });

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }

    if (notif.actionUrl) {
      setIsOpen(false);
      if (notif.actionUrl.startsWith('/owner')) {
        onNavigate('owner');
      } else if (notif.actionUrl.startsWith('/admin')) {
        onNavigate('admin');
      } else if (notif.actionUrl.startsWith('/prayer-wall')) {
        onNavigate('prayer-wall');
      } else if (notif.actionUrl.startsWith('/directory')) {
        onNavigate('directory');
      } else if (notif.actionUrl.startsWith('/profile') || notif.actionUrl.startsWith('/settings')) {
        onNavigate('profile');
      } else {
        // Fallback standard routing
        onNavigate(notif.actionUrl.replace(/^\//, ''));
      }
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      playChime();
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* 1. Bell Trigger Button */}
      <button
        id="notification-bell-button"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-full transition-all duration-200 cursor-pointer focus:outline-none ${
          isOpen
            ? 'bg-slate-800 text-sky-400 ring-2 ring-sky-500/40'
            : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        aria-label="Platform notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] px-1 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex items-center justify-center text-[10px] font-black rounded-full h-5 min-w-[20px] px-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md border border-slate-900 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* 2. Notification Popover Panel */}
      {isOpen && (
        <div
          id="notification-popover-panel"
          className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[92vw] bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Popover Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 leading-none">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Live broadcasts, prayers & alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Chime Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border transition-colors ${
                  soundEnabled
                    ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
                title={soundEnabled ? 'Chime sound is active' : 'Chime sound is muted'}
                aria-label={soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto no-scrollbar text-xs">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'STUDIO', label: 'Songs' },
                { id: 'PRAYERS', label: 'Prayers' },
                { id: 'STATIONS', label: 'Stations' },
                { id: 'BILLING', label: 'Billing' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70 p-2 space-y-1">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">All Caught Up!</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto italic">
                    &ldquo;Be still, and know that I am God.&rdquo; — Psalm 46:10
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const visual = getNotificationVisuals(notif.type);
                const IconComponent = visual.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative p-3 rounded-2xl transition-all cursor-pointer border ${
                      !notif.read
                        ? 'bg-slate-800/80 border-sky-500/20 hover:bg-slate-800 hover:border-sky-500/40 shadow-sm'
                        : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Visual Icon Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${visual.badgeColor}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            {visual.label}
                          </span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-bold leading-snug line-clamp-1 ${
                            !notif.read ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Action hint if actionUrl exists */}
                        {notif.actionUrl && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-sky-400 font-semibold group-hover:text-sky-300 transition-colors">
                            <span>Open details</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Right Action Icons (Hover / Unread dot) */}
                      <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                        {!notif.read ? (
                          <span
                            className="w-2 h-2 rounded-full bg-sky-400 ring-4 ring-sky-400/20 shrink-0 mt-1"
                            title="Unread notification"
                          />
                        ) : (
                          <span className="w-2 h-2" />
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-all cursor-pointer"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-3 border-t border-slate-800/90 bg-slate-950/70 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('profile');
              }}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Notification Settings</span>
            </button>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
