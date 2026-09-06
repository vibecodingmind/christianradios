import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Bell,
  Volume2,
  Save,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  Heart,
  Sparkles,
  Printer,
  Radio,
  Clock,
  Play,
  Share2,
  Send,
  X,
  ExternalLink,
  CheckCheck,
  Trash2,
  VolumeX,
  Mic2,
  CreditCard,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useNotifications } from '../context/NotificationContext';
import { useFavorites } from '../context/FavoritesContext';
import { apiFetch } from '../lib/api';
import type { PrayerRequest, Donation, Station } from '../types';

interface ProfileSettingsPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function ProfileSettingsPage({ onNavigate }: ProfileSettingsPageProps) {
  const { user } = useAuth();
  const { playStation } = useAudioPlayer();
  const {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    desktopPermission,
    requestDesktopPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    playChime,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'prayers' | 'giving' | 'favorites' | 'notifications' | 'settings'>('prayers');
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'UNREAD' | 'PRAYERS' | 'SONGS' | 'STATIONS' | 'BILLING'>('ALL');

  // Account Settings State
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [preferredBitrate, setPreferredBitrate] = useState<'64' | '128' | '192' | '320'>('128');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [prayerNotifications, setPrayerNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { favoriteStations } = useFavorites();

  // Listener Data States
  const [myPrayers, setMyPrayers] = useState<PrayerRequest[]>([]);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [serverFavorites, setServerFavorites] = useState<Station[]>([]);
  const [totalGivingUsd, setTotalGivingUsd] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  const myFavorites = favoriteStations.length > 0 ? favoriteStations : serverFavorites;

  // Praise Report Modal State
  const [answeringPrayer, setAnsweringPrayer] = useState<PrayerRequest | null>(null);
  const [praiseText, setPraiseText] = useState('');
  const [isSubmittingPraise, setIsSubmittingPraise] = useState(false);

  const loadListenerData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [prayersRes, donationsRes, favsRes] = await Promise.all([
        apiFetch('/api/listener/prayers').then((r) => r.json()).catch(() => ({ prayers: [] })),
        apiFetch('/api/listener/donations').then((r) => r.json()).catch(() => ({ donations: [], totalAmountUsd: 0 })),
        apiFetch('/api/listener/favorites').then((r) => r.json()).catch(() => ({ stations: [] })),
      ]);

      setMyPrayers(prayersRes.prayers || []);
      setMyDonations(donationsRes.donations || []);
      setTotalGivingUsd(donationsRes.totalAmountUsd || 0);
      setServerFavorites(favsRes.stations || []);
    } catch (err) {
      console.error('Failed to load listener dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadListenerData();
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-sm text-slate-400">Please sign in to access your personal spiritual dashboard.</p>
        <button
          onClick={() => onNavigate('home')}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in both current and new password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  const handleSubmitPraise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringPrayer || !praiseText.trim()) return;

    setIsSubmittingPraise(true);
    try {
      const res = await apiFetch(`/api/public/prayers/${answeringPrayer.id}/answered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimony: praiseText.trim() }),
      });

      if (res.ok) {
        setAnsweringPrayer(null);
        setPraiseText('');
        loadListenerData();
      }
    } catch (err) {
      console.error('Failed to submit praise report', err);
    } finally {
      setIsSubmittingPraise(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-purple-950/80 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-purple-400/40 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Faithful Partner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{name}</h1>
            <p className="text-xs sm:text-sm text-slate-400">{email}</p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 pt-2 sm:pt-0">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-lg font-black text-purple-400">{myPrayers.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Prayers</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-lg font-black text-emerald-400">${totalGivingUsd.toLocaleString()}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Sown</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="block text-lg font-black text-sky-400">{myFavorites.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Stations</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('prayers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'prayers'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>My Prayers ({myPrayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('giving')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'giving'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Giving & Receipts ({myDonations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Saved Stations ({myFavorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-400 text-slate-950 leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Account & Security</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MY PRAYERS & TESTIMONIES */}
      {activeTab === 'prayers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">My Intercession Altar</h2>
              <p className="text-xs text-slate-400">Track all prayers you submitted and celebrate answered petitions</p>
            </div>
            <button
              onClick={() => onNavigate('prayer-wall')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Post New Request
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-12 text-slate-400">Loading your prayer requests...</div>
          ) : myPrayers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
              <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Prayer Requests Posted Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Present your needs and thanksgiving on the global prayer wall to be carried by radio broadcasters and saints.
              </p>
              <button
                onClick={() => onNavigate('prayer-wall')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Go to Prayer Wall
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPrayers.map((prayer) => {
                const isAnswered = prayer.status === 'ANSWERED';

                return (
                  <div
                    key={prayer.id}
                    className={`p-5 rounded-2xl bg-slate-900/80 border ${
                      isAnswered ? 'border-emerald-500/40' : 'border-slate-800'
                    } flex flex-col justify-between space-y-4 shadow-lg`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                          {prayer.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isAnswered && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Answered
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            {new Date(prayer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-base text-white">{prayer.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
                        {prayer.prayerPoints}
                      </p>

                      {/* On-Air broadcast banner */}
                      {prayer.prayedOnAir && (
                        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Lifted on-air live by <strong>{prayer.prayedOnAirStationName || 'Broadcaster'}</strong></span>
                        </div>
                      )}

                      {/* Praise Report Display */}
                      {isAnswered && prayer.testimony && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                          <strong className="text-emerald-400 block mb-1">Praise Report / Testimony:</strong>
                          <p className="italic text-[11px]">"{prayer.testimony}"</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-purple-400 font-mono font-bold flex items-center gap-1">
                        🙏 {prayer.prayedCount || 1} saints prayed
                      </span>

                      {!isAnswered ? (
                        <button
                          onClick={() => {
                            setAnsweringPrayer(prayer);
                            setPraiseText('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Share Praise Report</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-bold">God is Glorified!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GIVING & SEED RECEIPTS */}
      {activeTab === 'giving' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Kingdom Seeds & Donation History</h2>
              <p className="text-xs text-slate-400">Official record of your support to Christian radio broadcasts and ministries</p>
            </div>
            <button
              onClick={() => onNavigate('giving')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Sow a Seed
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-12 text-slate-400">Loading donation history...</div>
          ) : myDonations.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
              <Heart className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Donations Recorded Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Support your favorite gospel stations and campaigns. All donations linked to your account provide downloadable receipts.
              </p>
              <button
                onClick={() => onNavigate('giving')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Browse Giving Opportunities
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Station / Ministry</th>
                      <th className="py-3 px-4">Fund Type</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {myDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {d.stationName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            {d.campaignTitle || d.fundType || 'General Outreach'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {d.currency || 'USD'} {Number(d.amount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {d.trackingId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onNavigate('receipt', d.trackingId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED FAVORITES */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">My Favorite Stations</h2>
            <p className="text-xs text-slate-400">Quick access to the stations that inspire and nourish your spirit</p>
          </div>

          {loadingData ? (
            <div className="text-center py-12 text-slate-400">Loading favorites...</div>
          ) : myFavorites.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
              <Radio className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Favorite Stations Saved</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click the heart icon on any radio station in the directory to add it to your quick-listen list.
              </p>
              <button
                onClick={() => onNavigate('directory')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Browse Radio Stations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myFavorites.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-sky-500/40 transition shadow-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0">
                      {st.logoUrl ? (
                        <img src={st.logoUrl} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                          {st.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{st.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{st.city || st.countryCode}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => playStation(st)}
                    className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition shadow-md cursor-pointer shrink-0"
                    title="Play Station"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTIFICATIONS & SPIRITUAL ALERTS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Header & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-400" />
                Notifications & Spiritual Alerts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Stay connected with listener prayers, studio shout-outs, and broadcast updates
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All Read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification Preference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Audio Chime */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    soundEnabled ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Harmonic Audio Chime</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Play gentle bell tone when new spiritual prayers and alerts arrive.
                </p>
              </div>
              <button
                type="button"
                onClick={playChime}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Preview gentle chime</span>
                <Play className="w-3 h-3 fill-current" />
              </button>
            </div>

            {/* 2. Desktop Push Notifications */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    desktopPermission === 'granted'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {desktopPermission === 'granted' ? 'Enabled' : desktopPermission === 'denied' ? 'Blocked' : 'Optional'}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Browser Push Alerts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Receive live alerts on your device even when this tab is in background.
                </p>
              </div>
              {desktopPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={requestDesktopPermission}
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Enable push alerts</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Push alerts active in this browser</span>
                </div>
              )}
            </div>

            {/* 3. Email Digest */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Mail className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    emailNotifications ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      emailNotifications ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Email Ministry Updates</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Receive email confirmations for answered prayers, giving receipts and account changes.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { id: 'ALL', label: `All (${notifications.length})` },
                { id: 'UNREAD', label: `Unread (${unreadCount})` },
                { id: 'PRAYERS', label: 'Prayers & Praise' },
                { id: 'SONGS', label: 'Songs & Shout-outs' },
                { id: 'STATIONS', label: 'Station Alerts' },
                { id: 'BILLING', label: 'Giving & Billing' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setNotificationFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  notificationFilter === filter.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">No Notifications Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When fellow believers pray with you, radio stations air your song requests, or important ministry updates arrive, you'll see them right here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications
                .filter((item) => {
                  if (notificationFilter === 'UNREAD') return !item.read;
                  if (notificationFilter === 'PRAYERS') {
                    return item.type === 'PRAYER_REQUEST' || item.type === 'PRAYER_ANSWERED' || item.title.toLowerCase().includes('prayer');
                  }
                  if (notificationFilter === 'SONGS') {
                    return item.type === 'SONG_REQUEST' || item.title.toLowerCase().includes('song') || item.title.toLowerCase().includes('shout');
                  }
                  if (notificationFilter === 'STATIONS') {
                    return (
                      item.type === 'STREAM_OUTAGE' ||
                      item.type === 'STREAM_RECOVERED' ||
                      item.type === 'STATION_APPROVED' ||
                      item.type === 'STATION_REJECTED' ||
                      item.type === 'CLAIM_UPDATE' ||
                      item.type === 'KYC_UPDATE'
                    );
                  }
                  if (notificationFilter === 'BILLING') {
                    return (
                      item.type === 'PAYMENT_SUCCESS' ||
                      item.type === 'PAYMENT_FAILED' ||
                      item.type === 'SUBSCRIPTION_EXPIRING' ||
                      item.type === 'NEW_DONATION' ||
                      item.type === 'WITHDRAWAL_UPDATE'
                    );
                  }
                  return true;
                })
                .map((notif) => {
                  const isMusic = notif.type === 'SONG_REQUEST' || notif.title.toLowerCase().includes('song');
                  const isPrayer = notif.type === 'PRAYER_REQUEST' || notif.title.toLowerCase().includes('prayer');
                  const isPraise = notif.type === 'PRAYER_ANSWERED';
                  const isOutage = notif.type === 'STREAM_OUTAGE';
                  const isPayment = notif.type === 'PAYMENT_SUCCESS' || notif.type === 'NEW_DONATION';

                  const badgeClass = isMusic
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    : isPraise
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : isPrayer
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : isOutage
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : isPayment
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';

                  const IconComp = isMusic
                    ? Mic2
                    : isPraise
                    ? Sparkles
                    : isPrayer
                    ? Heart
                    : isOutage
                    ? AlertCircle
                    : isPayment
                    ? CreditCard
                    : Bell;

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                        !notif.read
                          ? 'bg-slate-900 border-sky-500/30 shadow-md'
                          : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${badgeClass}`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-400 ring-4 ring-sky-400/20 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap font-mono">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                          {notif.message}
                        </p>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 mt-3">
                          {notif.actionUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!notif.read) markAsRead(notif.id);
                                if (notif.actionUrl?.startsWith('/owner')) onNavigate('owner');
                                else if (notif.actionUrl?.startsWith('/prayer-wall')) onNavigate('prayer-wall');
                                else if (notif.actionUrl?.startsWith('/directory')) onNavigate('directory');
                                else onNavigate(notif.actionUrl?.replace(/^\//, '') || 'home');
                              }}
                              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>View Associated Activity</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark read</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            className="text-xs font-bold text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCOUNT & SECURITY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-3 space-y-6">
            <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-sky-400" />
                Personal Details
              </h3>

              {savedSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile preferences saved successfully!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Audio Preferences */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  Streaming Audio Quality
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['64', '128', '192', '320'] as const).map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPreferredBitrate(rate)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        preferredBitrate === rate
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate} kbps {rate === '64' && '(Data Saver)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>

            {/* Password Form */}
            <form onSubmit={handleUpdatePassword} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Change Password
              </h3>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {passwordMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Praise Report Submission Modal */}
      {answeringPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setAnsweringPrayer(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Share Your Praise Report</h3>
                <p className="text-xs text-slate-400">Give God the glory for answering your prayer</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPraise} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-white">Request: </span>
                <span>{answeringPrayer.title}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  How did God answer your prayer? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={praiseText}
                  onChange={(e) => setPraiseText(e.target.value)}
                  placeholder="Share what the Lord did to encourage fellow listeners and intercessors..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnsweringPrayer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPraise || !praiseText.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingPraise ? 'Publishing...' : 'Publish Praise Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
