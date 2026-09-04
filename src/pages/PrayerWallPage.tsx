import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, Search, Filter, Sparkles, Heart, Radio, Shield, Users, ArrowRight, MessageCircle, AlertTriangle } from 'lucide-react';
import type { PrayerRequest } from '../types';
import { PrayerRequestModal } from '../components/modals/PrayerRequestModal';
import { ReportPrayerModal } from '../components/modals/ReportPrayerModal';
import { AIPrayerModal } from '../components/ai/AIPrayerModal';
import { apiFetch } from '../lib/api';

interface PrayerWallPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function PrayerWallPage({ onNavigate }: PrayerWallPageProps) {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiPrayerOpen, setAiPrayerOpen] = useState(false);
  const [reportingPrayer, setReportingPrayer] = useState<PrayerRequest | null>(null);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());

  const categories = ['ALL', 'Healing', 'Family', 'Salvation', 'Financial', 'Ministry', 'Deliverance', 'General'];

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/public/prayers', window.location.origin);
      if (selectedCategory !== 'ALL') url.searchParams.set('category', selectedCategory);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await apiFetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setPrayers(data.prayers || []);
      } else {
        console.warn('Prayer wall endpoint returned non-OK status:', res.status);
      }
    } catch (err) {
      console.error('Failed to load prayer wall', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, [selectedCategory, searchQuery]);

  const handlePrayClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (prayedIds.has(id)) return;

    // Optimistically update
    setPrayedIds((prev) => new Set(prev).add(id));
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, prayedCount: (p.prayedCount || 0) + 1 } : p))
    );

    try {
      await apiFetch(`/api/public/prayers/${id}/pray`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to increment prayer count', err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Community Intercession Wall</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Stand in Prayer with Believers Across the World
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            “Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.” Submit your prayer request to be carried on Christian radio broadcasts and lifted by global saints.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Prayer Request</span>
            </button>

            <button
              onClick={() => setAiPrayerOpen(true)}
              className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-bold text-sm shadow-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>AI Prayer Helper</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Prayers' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prayer requests..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Prayer Request Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading prayer wall...</p>
        </div>
      ) : prayers.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Prayer Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Be the first to submit a prayer request in this category.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
          >
            Post a Prayer Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prayers.map((prayer) => {
            const hasPrayed = prayedIds.has(prayer.id);

            return (
              <div
                key={prayer.id}
                className="group relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-purple-950/20"
              >
                <div>
                  {/* Top Bar: Category, Date, and Report */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      {prayer.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {new Date(prayer.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportingPrayer(prayer);
                        }}
                        className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Report Inappropriate Prayer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-purple-300 transition">
                    {prayer.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 whitespace-pre-line line-clamp-4">
                    {prayer.prayerPoints}
                  </p>
                </div>

                {/* Footer Section */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Author & Station */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      {prayer.isAnonymous ? 'Anonymous Listener' : prayer.authorName}
                    </span>
                    {prayer.stationName && (
                      <button
                        onClick={() => prayer.stationId && onNavigate('station', prayer.stationId)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                      >
                        <Radio className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{prayer.stationName}</span>
                      </button>
                    )}
                  </div>

                  {/* "I Prayed for this" Action Button */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handlePrayClick(prayer.id, e)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        hasPrayed
                          ? 'bg-purple-600/30 border border-purple-500 text-purple-300 shadow-inner'
                          : 'bg-slate-950 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-200'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform ${
                          hasPrayed ? 'fill-purple-400 text-purple-400 scale-110 animate-bounce' : 'text-slate-400'
                        }`}
                      />
                      <span>{hasPrayed ? 'You Stood in Prayer' : 'I Prayed For This'}</span>
                    </button>

                    <div
                      title="Total saints who prayed"
                      className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300 font-bold"
                    >
                      {prayer.prayedCount || 1} 🙏
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      <PrayerRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchPrayers();
        }}
      />

      {/* AI Prayer Assistant Modal */}
      <AIPrayerModal
        isOpen={aiPrayerOpen}
        onClose={() => setAiPrayerOpen(false)}
        onShareToPrayerWall={(title, content, category) => {
          setModalOpen(true);
        }}
      />

      {/* Report Modal */}
      <ReportPrayerModal
        isOpen={!!reportingPrayer}
        prayer={reportingPrayer}
        onClose={() => setReportingPrayer(null)}
      />
    </div>
  );
}
