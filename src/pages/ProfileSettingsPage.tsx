import React, { useState } from 'react';
import { User as UserIcon, Mail, Shield, Key, Bell, Volume2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileSettingsPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function ProfileSettingsPage({ onNavigate }: ProfileSettingsPageProps) {
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-sm text-slate-400">Please sign in to manage your account settings.</p>
        <button
          onClick={() => onNavigate('home')}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your profile information, audio streaming preferences, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 border-2 border-sky-500/40 overflow-hidden flex items-center justify-center text-3xl font-bold text-sky-400">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white truncate">{name}</h2>
              <p className="text-xs text-slate-400 truncate">{email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information Form */}
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

            <div className="space-y-4 text-xs">
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
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-400 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Email is locked to your authenticated account credentials.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Avatar Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Audio & Streaming Preferences */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-sky-400" />
                Audio & Streaming Preferences
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Preferred Streaming Quality
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['64', '128', '192', '320'] as const).map((bitrate) => (
                    <button
                      key={bitrate}
                      type="button"
                      onClick={() => setPreferredBitrate(bitrate)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                        preferredBitrate === bitrate
                          ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {bitrate} kbps
                      <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                        {bitrate === '64' ? 'Data Saver' : bitrate === '128' ? 'Standard' : bitrate === '192' ? 'High' : 'Ultra HD'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-400" />
                Notifications
              </h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="rounded border-slate-800 text-sky-500 focus:ring-0 bg-slate-950 w-4 h-4"
                />
                <span className="text-xs text-slate-300">Receive weekly Christian radio newsletter & featured stations</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prayerNotifications}
                  onChange={(e) => setPrayerNotifications(e.target.checked)}
                  className="rounded border-slate-800 text-sky-500 focus:ring-0 bg-slate-950 w-4 h-4"
                />
                <span className="text-xs text-slate-300">Notify me when believers pray for my prayer requests</span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Save Profile Preferences
              </button>
            </div>
          </form>

          {/* Security & Password */}
          <form onSubmit={handleUpdatePassword} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              Security & Password
            </h3>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {passwordMsg.text}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-6 py-2.5 rounded-xl text-xs transition"
                >
                  Update Password
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
