import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ReportModalProps {
  stationId: string;
  stationName: string;
  onClose: () => void;
}

export function ReportModal({ stationId, stationName, onClose }: ReportModalProps) {
  const [reporterEmail, setReporterEmail] = useState('');
  const [reason, setReason] = useState('STREAM_OFFLINE');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterEmail.trim()) {
      setError('Please provide your email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          reporterEmail: reporterEmail.trim(),
          reason,
          details: details.trim(),
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to submit report');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-slate-400">
              Thank you for helping keep Christian Radios reliable. Our broadcast engineering team has
              been notified and will investigate the issue.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-6 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Report Broadcast Issue</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Reporting issues for <span className="font-semibold text-slate-200">{stationName}</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Issue Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="STREAM_OFFLINE">Stream is silent / not playing</option>
                  <option value="AUDIO_STUTTER">Audio stuttering or constant buffering</option>
                  <option value="WRONG_METADATA">Incorrect station information or schedule</option>
                  <option value="INAPPROPRIATE_CONTENT">Non-Christian / Inappropriate content</option>
                  <option value="OTHER">Other technical issue</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what happened or device information..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
