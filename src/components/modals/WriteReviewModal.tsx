import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquareHeart, Send, CheckCircle, Lock, LogIn, UserCheck, Shield } from 'lucide-react';
import type { Station } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  onSuccess?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export function WriteReviewModal({ isOpen, onClose, station, onSuccess, onOpenAuth }: WriteReviewModalProps) {
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorEmail, setAuthorEmail] = useState(user?.email || '');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState(station.countryCode || 'TZ');
  const [title, setTitle] = useState('');
  const [testimony, setTestimony] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      if (user.name && !authorName) setAuthorName(user.name);
      if (user.email && !authorEmail) setAuthorEmail(user.email);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiFetch(`/api/public/stations/${station.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          authorName: authorName || user?.name || 'Faithful Listener',
          authorEmail: authorEmail || user?.email,
          city,
          countryCode,
          title: title || 'Life-changing Broadcast',
          testimony,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit testimony');

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
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Sign In to Share Your Testimony</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                To maintain authentic and verified testimonies for <strong>{station.name}</strong> and prevent spam, please sign in with your free listener account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Verified testimonies encourage station broadcasters and ministry leaders.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <MessageSquareHeart className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Your story helps build the faith of listeners around the world.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer"
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <MessageSquareHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Share Your Testimony</h3>
                <p className="text-xs text-slate-400">How has {station.name} impacted your spiritual walk?</p>
              </div>
            </div>

            {/* Authenticated user banner */}
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                Posting as <strong>{user.name}</strong> ({user.email})
              </span>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div className="text-center py-2 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 mb-2">Rate Your Listening Experience</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Testimony Headline</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Always brings peace into our home"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Testimony Message *</label>
                <textarea
                  rows={4}
                  required
                  value={testimony}
                  onChange={(e) => setTestimony(e.target.value)}
                  placeholder="Write how the broadcasts, songs, or prayer sessions have blessed you..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Emmanuel M."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Arusha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Post Testimony'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Thank You for Your Testimony!</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              Your words encourage the station presenters, team, and fellow listeners across the world.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
