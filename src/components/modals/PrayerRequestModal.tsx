import React, { useState, useEffect } from 'react';
import { HeartHandshake, X, Send, Shield, Sparkles, LogIn, UserCheck, Lock } from 'lucide-react';
import type { Station } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { PrayerPublisherAvatar } from '../common/PrayerPublisherAvatar';

interface PrayerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  station?: Station;
  onSuccess?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
  initialTitle?: string;
  initialPrayerPoints?: string;
  initialCategory?: string;
}

export function PrayerRequestModal({
  isOpen,
  onClose,
  station,
  onSuccess,
  onOpenAuth,
  initialTitle = '',
  initialPrayerPoints = '',
  initialCategory = 'Healing',
}: PrayerRequestModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState(initialTitle);
  const [prayerPoints, setPrayerPoints] = useState(initialPrayerPoints);
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [countryCode, setCountryCode] = useState('TZ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTitle) setTitle(initialTitle);
      if (initialPrayerPoints) setPrayerPoints(initialPrayerPoints);
      if (initialCategory) setCategory(initialCategory);
      if (user?.name && !authorName) setAuthorName(user.name);
    }
  }, [isOpen, initialTitle, initialPrayerPoints, initialCategory, user]);

  if (!isOpen) return null;

  const categories = ['Healing', 'Family', 'Salvation', 'Financial', 'Ministry', 'Deliverance', 'General'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/public/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          prayerPoints,
          authorName: isAnonymous ? 'Anonymous Listener' : (authorName || user?.name || 'Faithful Believer'),
          authorAvatar: isAnonymous ? undefined : user?.avatarUrl,
          isAnonymous,
          category,
          stationId: station?.id,
          countryCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit prayer request');

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. AUTH GATE FOR GUEST USERS */}
        {!user ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 mx-auto flex items-center justify-center shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Sign In to Post a Prayer Request</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                To protect our intercession altar from spam and allow pastors and believers to stand in faith with you, prayer submissions require a free listener account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <span>You can still choose to submit <strong>anonymously</strong> on the public wall.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Track your requests and share a <strong>Praise Report</strong> when God answers!</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !submitted ? (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {station ? `Prayer Request for ${station.name}` : 'Post on Community Prayer Wall'}
                </h3>
                <p className="text-xs text-slate-400">Join thousands of believers standing in faith with you</p>
              </div>
            </div>

            {/* Authenticated user indicator */}
            <div className="mb-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <PrayerPublisherAvatar
                  authorAvatar={isAnonymous ? undefined : user.avatarUrl}
                  authorName={isAnonymous ? 'Anonymous Listener' : user.name}
                  isAnonymous={isAnonymous}
                  size="sm"
                />
                <div className="truncate">
                  <span className="block text-[10px] text-purple-400 font-semibold">
                    {isAnonymous ? 'Publishing as Anonymous' : 'Publishing as Registered Member'}
                  </span>
                  <span className="text-white font-medium text-xs">
                    {isAnonymous ? 'Anonymous Listener' : user.name}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {user.email}
              </span>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Prayer Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        category === cat
                          ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prayer Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Total healing for my brother in hospital"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prayer Points & Specific Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={prayerPoints}
                  onChange={(e) => setPrayerPoints(e.target.value)}
                  placeholder="Share your prayer request with brothers and sisters in Christ. We stand on Matthew 18:19..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Name {!isAnonymous && '*'}
                  </label>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    required={!isAnonymous}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Sister Grace"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="TZ">🇹🇿 Tanzania</option>
                    <option value="KE">🇰🇪 Kenya</option>
                    <option value="UG">🇺🇬 Uganda</option>
                    <option value="RW">🇷🇼 Rwanda</option>
                    <option value="CD">🇨🇩 DR Congo</option>
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="US">🇺🇸 United States</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-slate-300 cursor-pointer select-none">
                  Keep my name anonymous (Show as "Anonymous Listener" on the public wall)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  Shared with Intercessors & Pastors
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Submit Prayer'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Prayer Request Submitted!</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              “Again, truly I tell you that if two of you on earth agree about anything they ask for, it will be done for them by my Father in heaven.” — Matthew 18:19
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Back to Prayer Wall
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
