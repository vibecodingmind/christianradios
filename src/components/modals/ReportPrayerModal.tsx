import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { PrayerRequest } from '../../types';

interface ReportPrayerModalProps {
  isOpen: boolean;
  prayer: PrayerRequest | null;
  onClose: () => void;
}

export function ReportPrayerModal({ isOpen, prayer, onClose }: ReportPrayerModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('Inappropriate content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !prayer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to report prayer requests.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/listener/prayers/${prayer.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setDetails('');
          onClose();
        }, 1800);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting the report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Report Prayer Request</h3>
            <p className="text-xs text-slate-400">Help keep our community intercession wall clean & sacred</p>
          </div>
        </div>

        {/* Prayer snippet preview */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1 text-xs">
          <div className="font-semibold text-slate-200 truncate">{prayer.title}</div>
          <div className="text-slate-400 text-[11px] line-clamp-2 italic leading-relaxed">
            "{prayer.prayerPoints}"
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-slate-400">
              Our moderation team will review this prayer request promptly. Thank you for your diligence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Inappropriate content">Inappropriate or Profane Content</option>
                <option value="Spam or marketing">Spam, Promotional or Commercial Ad</option>
                <option value="Harassment or hate speech">Harassment, Insults or Hate Speech</option>
                <option value="Personal private info">Private Personal Information (Doxxing)</option>
                <option value="Other violation">Other Community Policy Violation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Additional Details <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Explain why this prayer request violates community standards..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
