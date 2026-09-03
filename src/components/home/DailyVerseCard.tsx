import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, Share2, Sparkles, Check, Globe } from 'lucide-react';
import type { DailyVerse } from '../../types';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { apiFetch } from '../../lib/api';

export function DailyVerseCard() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [lang, setLang] = useState<'SW' | 'EN'>('EN');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const { playStream } = useAudioPlayer();

  useEffect(() => {
    apiFetch('/api/public/verse-of-the-day')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.verse) setVerse(data.verse);
      })
      .catch((err) => console.error('Failed to fetch daily verse', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !verse) return null;

  const handleShare = () => {
    const text = `${verse.reference}\n\n${lang === 'EN' ? verse.textEnglish : verse.textSwahili}\n\nStream Christian Radios: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayNarration = () => {
    if (verse.audioNarrationUrl) {
      playStream({
        id: `verse_${verse.id}`,
        name: `Daily Scripture: ${verse.reference}`,
        slug: 'daily-scripture',
        streamUrl: verse.audioNarrationUrl,
        streamType: 'MP3',
        streamStatus: 'ONLINE',
        countryCode: 'TZ',
        city: 'Daily Bread',
        genre: 'Scripture Meditation',
        tagline: verse.theme,
        logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        categoryId: 'scripture',
        ownerId: 'system',
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        isFeatured: false,
        totalPlayCount: 1,
        totalFavoritesCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 md:p-8 shadow-xl shadow-indigo-950/30 mb-10">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Verse of the Day</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{new Date(verse.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">{verse.reference}</h3>
          </div>
        </div>

        {/* Action buttons & language switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Language Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLang('EN')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                lang === 'EN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('SW')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                lang === 'SW' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kiswahili
            </button>
          </div>

          <button
            onClick={handlePlayNarration}
            title="Listen to scripture meditation"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Listen</span>
          </button>

          <button
            onClick={handleShare}
            title="Copy verse to share"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Scripture Quote */}
      <div className="relative z-10 space-y-3">
        <blockquote className="text-base sm:text-xl font-serif italic leading-relaxed text-slate-100">
          {lang === 'EN' ? verse.textEnglish : verse.textSwahili}
        </blockquote>

        {verse.reflection && (
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-semibold">{verse.theme}:</strong> {verse.reflection}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
