import React, { useState } from 'react';
import { Sparkles, Search, Loader2, Play, Radio, Volume2, Globe, Heart, BookOpen, MessageSquare, RefreshCw, ChevronRight, Compass } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { StationCard } from '../station/StationCard';
import type { Station, PodcastEpisode, PrayerRequest } from '../../types';

const quickPrompts = [
  'Find peaceful worship music for prayer',
  'Show me Christian radio stations in Tanzania',
  'I want Swahili Christian radio',
  'Find African gospel stations',
  'I want Bible teaching',
  'Find something uplifting',
];

interface AIRadioGuideProps {
  onNavigate?: (view: string, param?: string) => void;
}

export function AIRadioGuide({ onNavigate }: AIRadioGuideProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    stations: Station[];
    sermons?: PodcastEpisode[];
    prayers?: PrayerRequest[];
    verses?: Array<{ reference: string; text: string }>;
    isFallback?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { playStation } = useAudioPlayer();

  const handleSearch = async (queryText?: string) => {
    const q = (queryText || prompt).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to search using AI Radio Guide.');
      }
    } catch (err: any) {
      console.error('[AIRadioGuide] Fetch error:', err);
      setError('Unable to connect to AI Guide. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-12 text-white shadow-2xl border border-sky-500/25 backdrop-blur-xl mb-12">
      {/* Decorative background lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-sky-500/15 via-indigo-500/10 to-amber-500/15 rounded-full blur-3xl pointer-events-none animate-aura-spin" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping-slow" />
            <span>Listen. Discover. Connect.</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>AI Radio Guide</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          One World. One Faith.{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            Thousands of Voices.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto font-medium">
          Explore inspiring worship, gospel music, Bible teaching, prayer and uplifting messages from global stations — or use our AI Radio Guide to find your favorite sound.
        </p>

        {/* AI Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative max-w-2xl mx-auto pt-2"
        >
          <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-slate-900/95 border border-sky-500/40 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
            <div className="pl-4 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find peaceful worship music for prayer..."
              className="w-full py-4 px-4 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm md:text-base font-medium"
            />

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="mr-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Prompts */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(p);
                handleSearch(p);
              }}
              className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-sky-500/20 text-xs text-slate-300 hover:text-sky-200 border border-slate-700/60 hover:border-sky-500/40 transition-all cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap pt-4 border-t border-slate-800/80">
          <button
            onClick={() => onNavigate?.('directory')}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-xl shadow-sky-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" /> Explore Live Radios
          </button>
          <button
            onClick={() => onNavigate?.('countries')}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm px-6 py-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-sky-400" /> Browse Countries
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-8 p-4 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="mt-10 pt-8 border-t border-slate-800 text-left space-y-8 animate-fadeIn">
          {/* AI Response Message Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <span>AI Radio Guide Answer</span>
                {result.isFallback && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    Direct Database Match
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                {result.message}
              </p>
            </div>
          </div>

          {/* Verses Card if present */}
          {result.verses && result.verses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <BookOpen className="w-4 h-4" />
                <span>Scripture Reference</span>
              </div>
              <div className="grid gap-3">
                {result.verses.map((v, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 italic text-amber-100 text-sm">
                    <p>{v.text}</p>
                    <span className="block mt-2 font-bold not-italic text-xs text-amber-300">— {v.reference}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Radio Stations Results */}
          {result.stations && result.stations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>Matching Christian Radio Stations ({result.stations.length})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {result.stations.map((st) => (
                  <StationCard
                    key={st.id}
                    station={st}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sermons / Podcast Episodes Results */}
          {result.sermons && result.sermons.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-purple-300">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Relevant Sermons & Audio Teaching ({result.sermons.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.sermons.map((ep) => (
                  <div key={ep.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all space-y-2">
                    <h4 className="font-bold text-sm text-white line-clamp-1">{ep.title}</h4>
                    <p className="text-xs text-purple-300 font-medium">{ep.preacherName || 'Christian Speaker'}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{ep.description || 'Audio sermon content.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
