import React, { useState } from 'react';
import {
  Music,
  Radio,
  Send,
  X,
  Sparkles,
  Heart,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface SongRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  onSuccess?: () => void;
}

export function SongRequestModal({
  isOpen,
  onClose,
  station,
  onSuccess,
}: SongRequestModalProps) {
  const { user } = useAuth();

  const [mode, setMode] = useState<'SONG' | 'SHOUTOUT'>('SONG');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorCity, setAuthorCity] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [dedicationTo, setDedicationTo] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authorName.trim()) {
      setError('Please provide your name.');
      return;
    }

    if (mode === 'SONG' && !songTitle.trim()) {
      setError('Please enter the gospel song title.');
      return;
    }

    if (mode === 'SHOUTOUT' && !message.trim()) {
      setError('Please enter your shoutout greeting.');
      return;
    }

    try {
      setLoading(true);

      const content = mode === 'SONG'
        ? `🎵 Song Request: "${songTitle.trim()}" by ${artistName.trim() || 'Gospel Artist'}${
            dedicationTo ? ` (Dedicated to: ${dedicationTo.trim()})` : ''
          }${message ? ` — "${message.trim()}"` : ''}`
        : message.trim();

      const res = await apiFetch(`/api/public/stations/${station.id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName.trim(),
          authorCity: authorCity.trim() || undefined,
          content,
          postType: mode === 'SONG' ? 'SONG_REQUEST' : 'SHOUTOUT',
          songTitle: mode === 'SONG' ? songTitle.trim() : undefined,
          artistName: mode === 'SONG' ? artistName.trim() : undefined,
          dedicationMessage: dedicationTo.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSongTitle('');
    setArtistName('');
    setDedicationTo('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Live Studio Desk & Requests
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3 h-3 text-emerald-400" />
                Live on {station.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-white">
                {mode === 'SONG' ? 'Song Request Delivered!' : 'Shout-Out Sent to Live Studio!'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your message has been placed on the live studio desk for the presenters of{' '}
                <strong className="text-emerald-400">{station.name}</strong>. Stay tuned to the broadcast!
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition cursor-pointer"
            >
              Done / Return to Broadcast
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('SONG')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                  mode === 'SONG'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Request a Song
              </button>
              <button
                type="button"
                onClick={() => setMode('SHOUTOUT')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                  mode === 'SHOUTOUT'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Live Studio Shoutout
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Author Name & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Sister Grace"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Your City / Region
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={authorCity}
                    onChange={(e) => setAuthorCity(e.target.value)}
                    placeholder="e.g. Mwanza, Tanzania"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Song Details Fields */}
            {mode === 'SONG' ? (
              <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Gospel Song Title *
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. 10,000 Reasons / Kaza Moyo"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Artist / Choir
                    </label>
                    <input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="e.g. Christina Shusho"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Dedicated To
                    </label>
                    <input
                      type="text"
                      value={dedicationTo}
                      onChange={(e) => setDedicationTo(e.target.value)}
                      placeholder="e.g. My mom Mary on her birthday"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Special Note to Presenter (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Please play this during the evening fellowship hour..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              /* Shoutout Message */
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Your Shoutout / Greeting to Presenter & Listeners *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Greeting all saints tuning in from Nairobi! May the peace of the Lord fill your homes today..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <p className="text-[11px] text-slate-500">
                Delivered directly to {station.name} on-air desk
              </p>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Submitting...' : mode === 'SONG' ? 'Send Song Request' : 'Post Shout-Out'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
