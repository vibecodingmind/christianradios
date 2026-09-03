import React, { useState, useEffect } from 'react';
import { Sparkles, Radio, Music, BookOpen, HeartHandshake, Mic2, Flame, ArrowRight } from 'lucide-react';
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
    <div className="space-y-8 pb-16">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
          <Sparkles className="w-4 h-4" />
          Broadcast Taxonomy
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explore Radio Categories & Formats
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Discover Christian radio stations categorized by ministry focus, musical styles, biblical
          exposition, and prayer formats.
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
              className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-inner">
                  {getCategoryIcon(cat.slug)}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors mb-2">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">
                  {cat.stationCount || 1} Stations Active
                </span>
                <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  Browse Stations <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
