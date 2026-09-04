import React, { useState, useEffect } from 'react';
import { BookOpen, X, Sparkles, Volume2, Share2, Check, Play, Heart } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import type { DailyVerse } from '../../types';

interface ScripturePopupModalProps {
  onNavigate?: (view: string, param?: string) => void;
}

export function ScripturePopupModal({ onNavigate }: ScripturePopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [lang, setLang] = useState<'SW' | 'EN'>('EN');
  const [copied, setCopied] = useState(false);

  const { playStream } = useAudioPlayer();

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('cr_scripture_popup_dismissed');
    if (isDismissed === 'true') {
      return;
    }

    // Fetch verse of the day
    apiFetch('/api/public/verse-of-the-day')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.verse) {
          setVerse(data.verse);
        } else {
          // Fallback default verse
          setVerse({
            id: 'default_v1',
            date: new Date().toISOString(),
            reference: 'Psalm 96:3',
            textEnglish: 'Declare His glory among the nations, His marvelous deeds among all peoples.',
            textSwahili: 'Wahubirieni mataifa utukufu wake, na watu wote maajabu yake.',
            theme: 'Global Gospel Proclamation',
            reflection: 'God calls us to shine His light and broadcast His glory across every nation and tongue.',
            audioNarrationUrl: '',
          });
        }
        // Auto open popup after a pleasant 1.2s delay on first visit
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      })
      .catch(() => {
        // Fallback default verse on error
        setVerse({
          id: 'default_v1',
          date: new Date().toISOString(),
          reference: 'Psalm 96:3',
          textEnglish: 'Declare His glory among the nations, His marvelous deeds among all peoples.',
          textSwahili: 'Wahubirieni mataifa utukufu wake, na watu wote maajabu yake.',
          theme: 'Global Gospel Proclamation',
          reflection: 'God calls us to shine His light and broadcast His glory across every nation and tongue.',
          audioNarrationUrl: '',
        });
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      });
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('cr_scripture_popup_dismissed', 'true');
    setIsOpen(false);
  };

  const handleShare = () => {
    if (!verse) return;
    const text = `${verse.reference}\n\n"${lang === 'EN' ? verse.textEnglish : verse.textSwahili}"\n\nListen 24/7 on Christian Radios: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayNarration = () => {
    if (verse?.audioNarrationUrl) {
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

  if (!isOpen || !verse) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 overflow-hidden space-y-6 animate-scaleUp">
        {/* Background Ambient Lights */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  Scripture of the Day
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">{verse.reference}</h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Tabs & Audio Options */}
        <div className="flex items-center justify-between gap-2 border-y border-slate-800/80 py-3 relative z-10 flex-wrap">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLang('EN')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                lang === 'EN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('SW')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                lang === 'SW' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kiswahili
            </button>
          </div>

          <div className="flex items-center gap-2">
            {verse.audioNarrationUrl && (
              <button
                onClick={handlePlayNarration}
                title="Listen to audio narration"
                className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen Audio</span>
              </button>
            )}

            <button
              onClick={handleShare}
              title="Share Verse"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Verse Quote */}
        <div className="relative z-10 space-y-4">
          <blockquote className="text-base sm:text-xl font-medium leading-relaxed text-slate-100 italic bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
            "{lang === 'EN' ? verse.textEnglish : verse.textSwahili}"
          </blockquote>

          {verse.reflection && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold">{verse.theme}:</strong> {verse.reflection}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 relative z-10">
          <button
            onClick={handleDismiss}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Amen & Close
          </button>
          <button
            onClick={() => {
              handleDismiss();
              onNavigate?.('directory');
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Tune In To Live Radios</span>
          </button>
        </div>
      </div>
    </div>
  );
}
