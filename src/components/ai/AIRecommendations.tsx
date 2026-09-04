import React, { useEffect, useState } from 'react';
import { Sparkles, Radio, Compass, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { StationCard } from '../station/StationCard';
import type { Station } from '../../types';

interface AIRecommendationsProps {
  contextTitle?: string;
  contextTag?: string;
  onNavigate?: (view: string, param?: string) => void;
}

const contexts = [
  { label: 'Morning Prayer', tag: 'prayer' },
  { label: 'Deep Worship', tag: 'worship' },
  { label: 'Bible Teaching', tag: 'teaching' },
  { label: 'Swahili Radios', tag: 'swahili' },
  { label: 'African Gospel', tag: 'gospel' },
  { label: 'Encouragement', tag: 'talk' },
];

export function AIRecommendations({ contextTitle = 'Recommended For You', contextTag = 'worship', onNavigate }: AIRecommendationsProps) {
  const [selectedTag, setSelectedTag] = useState(contextTag);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { playStation } = useAudioPlayer();

  useEffect(() => {
    fetchRecommendations(selectedTag);
  }, [selectedTag]);

  const fetchRecommendations = async (tag: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/ai/recommendations?context=${encodeURIComponent(tag)}&limit=6`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStations(data.data);
      }
    } catch (err) {
      console.error('[AIRecommendations] Error loading recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6 my-12">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {contextTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contextual station picks matched by genre, region & listening mood
            </p>
          </div>
        </div>

        {/* Tags ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {contexts.map((c) => (
            <button
              key={c.tag}
              onClick={() => setSelectedTag(c.tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === c.tag
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Stations */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : stations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stations.map((st) => (
            <StationCard
              key={st.id}
              station={st}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">No specific recommendations found for this tag.</p>
      )}
    </section>
  );
}
