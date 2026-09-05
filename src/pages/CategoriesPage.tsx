import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, Music, BookOpen, HeartHandshake, Mic2, Flame, ArrowRight, Layers } from 'lucide-react';
import type { Category } from '../types';

interface CategoriesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function CategoriesPage({ onNavigate }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'gospel-music':
        return <Music className="w-6 h-6 text-sky-400" />;
      case 'praise-worship':
        return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'bible-teaching':
        return <BookOpen className="w-6 h-6 text-indigo-400" />;
      case 'prayer-intercession':
        return <Flame className="w-6 h-6 text-rose-400" />;
      case 'christian-talk':
        return <Mic2 className="w-6 h-6 text-emerald-400" />;
      default:
        return <Radio className="w-6 h-6 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-page-fade-up">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-sky-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-3">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-500 opacity-90" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Broadcast Taxonomy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Explore Radio Categories & Formats
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
          Discover Christian radio stations categorized by ministry focus, musical styles, biblical exposition, and prayer intercession formats.
        </p>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('category', cat.slug)}
              className="group bg-gradient-to-b from-slate-900/90 to-slate-950 hover:bg-slate-900 border border-slate-800/90 hover:border-sky-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-sky-500/10"
            >
              <div className="space-y-4">
                <div className="w-13 h-13 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  {getCategoryIcon(cat.slug)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-sky-300 transition-colors mb-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-normal">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">
                  {cat.stationCount || 1} Stations Live
                </span>
                <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5 font-extrabold">
                  Browse Stations <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
