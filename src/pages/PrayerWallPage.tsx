import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  Search,
  Filter,
  Sparkles,
  Heart,
  Radio,
  Shield,
  Users,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { PrayerRequest } from '../types';
import { PrayerRequestModal } from '../components/modals/PrayerRequestModal';
import { ReportPrayerModal } from '../components/modals/ReportPrayerModal';
import { AIPrayerModal } from '../components/ai/AIPrayerModal';
import { PrayerPublisherAvatar } from '../components/common/PrayerPublisherAvatar';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface PrayerWallPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export function PrayerWallPage({ onNavigate, onOpenAuth }: PrayerWallPageProps) {
  const { user } = useAuth();

  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiPrayerOpen, setAiPrayerOpen] = useState(false);
  const [reportingPrayer, setReportingPrayer] = useState<PrayerRequest | null>(null);
  const [answeringPrayer, setAnsweringPrayer] = useState<PrayerRequest | null>(null);
  const [praiseReportText, setPraiseReportText] = useState('');
  const [isSubmittingPraise, setIsSubmittingPraise] = useState(false);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Draft state from AI assistant
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPoints, setDraftPoints] = useState('');
  const [draftCategory, setDraftCategory] = useState('Healing');

  const categories = [
    'ALL',
    'Answered',
    'Healing',
    'Family',
    'Salvation',
    'Financial',
    'Ministry',
    'Deliverance',
    'General',
  ];

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/public/prayers', window.location.origin);
      if (selectedCategory !== 'ALL' && selectedCategory !== 'Answered') {
        url.searchParams.set('category', selectedCategory);
      }
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await apiFetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        let list: PrayerRequest[] = data.prayers || [];
        if (selectedCategory === 'Answered') {
          list = list.filter((p) => p.status === 'ANSWERED');
        }
        setPrayers(list);
      } else {
        console.warn('Prayer wall endpoint returned non-OK status:', res.status);
      }
    } catch (err) {
      console.error('Failed to load prayer wall', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPrayers = prayers.length;
  const totalPages = Math.max(1, Math.ceil(totalPrayers / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedPrayers = prayers.slice(
    (validPage - 1) * ITEMS_PER_PAGE,
    validPage * ITEMS_PER_PAGE
  );

  const scrollToPrayers = () => {
    const el = document.getElementById('prayer-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    scrollToPrayers();
  };

  useEffect(() => {
    setCurrentPage(1);
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

  const handleOpenCreatePrayer = () => {
    setDraftTitle('');
    setDraftPoints('');
    setDraftCategory('Healing');
    setModalOpen(true);
  };

  const handleSubmitPraiseReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringPrayer || !praiseReportText.trim()) return;

    setIsSubmittingPraise(true);
    try {
      const res = await apiFetch(`/api/public/prayers/${answeringPrayer.id}/answered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimony: praiseReportText.trim() }),
      });

      if (res.ok) {
        setPrayers((prev) =>
          prev.map((p) =>
            p.id === answeringPrayer.id
              ? { ...p, status: 'ANSWERED', testimony: praiseReportText.trim() }
              : p
          )
        );
        setAnsweringPrayer(null);
        setPraiseReportText('');
      }
    } catch (err) {
      console.error('Failed to submit praise report', err);
    } finally {
      setIsSubmittingPraise(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/20 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Live Global Intercession
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Community Prayer Wall
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            "For where two or three gather in my name, there am I with them." (Matthew 18:20).
            Post your prayer needs, intercede for fellow listeners worldwide, and celebrate answered prayers.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCreatePrayer}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Prayer Request</span>
            </button>

            <button
              onClick={() => setAiPrayerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Prayer Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div id="prayer-grid-section" className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl scroll-mt-24">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Prayers' : cat === 'Answered' ? '✨ Answered Prayers' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search prayer requests..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Prayer Request Grid (4 CARDS PER ROW, UP TO 24 PER PAGE) */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading prayer wall...</p>
        </div>
      ) : paginatedPrayers.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Prayer Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Be the first to submit a prayer request in this category.
          </p>
          <button
            onClick={handleOpenCreatePrayer}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Post a Prayer Request
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginatedPrayers.map((prayer) => {
              const hasPrayed = prayedIds.has(prayer.id);
              const isAuthor = user && prayer.userId === user.id;
              const isAnswered = prayer.status === 'ANSWERED';

              return (
                <div
                  key={prayer.id}
                  className={`group relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-900 border ${
                    isAnswered ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-slate-800/80 hover:border-purple-500/40'
                  } rounded-2xl p-5 transition-all duration-200 shadow-lg hover:shadow-purple-950/20`}
                >
                  <div>
                    {/* Top Bar: Category, Answered Badge, Date, and Report */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                          {prayer.category}
                        </span>
                        {isAnswered && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Answered</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                          className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Report Inappropriate Prayer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Content */}
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug group-hover:text-purple-300 transition line-clamp-2">
                      {prayer.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 whitespace-pre-line line-clamp-4">
                      {prayer.prayerPoints}
                    </p>

                    {/* Answered Prayer Testimony / Praise Report */}
                    {isAnswered && prayer.testimony && (
                      <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-400 text-[11px]">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Praise Report:</span>
                        </div>
                        <p className="italic text-[11px] leading-relaxed line-clamp-3">"{prayer.testimony}"</p>
                      </div>
                    )}

                    {/* Author prompt to share praise report */}
                    {isAuthor && !isAnswered && (
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            setAnsweringPrayer(prayer);
                            setPraiseReportText('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-bold transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>God Answered? Share Praise</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer Section */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    {/* Author & Station */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PrayerPublisherAvatar
                          authorName={prayer.authorName}
                          authorAvatar={prayer.authorAvatar}
                          isAnonymous={prayer.isAnonymous}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-200 truncate block text-xs">
                            {prayer.isAnonymous ? 'Anonymous Listener' : prayer.authorName}
                            {isAuthor && <span className="ml-1 text-[10px] text-purple-400 font-normal">(You)</span>}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {prayer.countryCode ? `${prayer.countryCode} • ` : ''}Intercessor
                          </span>
                        </div>
                      </div>
                      {prayer.stationName && (
                        <button
                          onClick={() => prayer.stationId && onNavigate('station', prayer.stationId)}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium cursor-pointer shrink-0 ml-1"
                        >
                          <Radio className="w-3 h-3" />
                          <span className="truncate max-w-[105px]">{prayer.stationName}</span>
                        </button>
                      )}
                    </div>

                    {/* "I Prayed for this" Action Button */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => handlePrayClick(prayer.id, e)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          hasPrayed
                            ? 'bg-purple-600/30 border border-purple-500 text-purple-300 shadow-inner'
                            : 'bg-slate-950 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-200'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-transform ${
                            hasPrayed ? 'fill-purple-400 text-purple-400 scale-110 animate-bounce' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{hasPrayed ? 'Stood in Prayer' : 'I Prayed For This'}</span>
                      </button>

                      <div
                        title="Total saints who prayed"
                        className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300 font-bold shrink-0"
                      >
                        {prayer.prayedCount || 1} 🙏
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400">
                Showing{' '}
                <span className="text-white font-bold">
                  {(validPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="text-white font-bold">
                  {Math.min(validPage * ITEMS_PER_PAGE, totalPrayers)}
                </span>{' '}
                of <span className="text-purple-400 font-bold">{totalPrayers}</span> prayer requests
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={validPage <= 1}
                  title="First Page"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage <= 1}
                  title="Previous Page"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 2)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-slate-600 text-xs font-bold">...</span>}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center ${
                              validPage === p
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 ring-1 ring-purple-400'
                                : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(validPage + 1)}
                  disabled={validPage >= totalPages}
                  title="Next Page"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={validPage >= totalPages}
                  title="Last Page"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Modal */}
      <PrayerRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onOpenAuth={onOpenAuth}
        initialTitle={draftTitle}
        initialPrayerPoints={draftPoints}
        initialCategory={draftCategory}
        onSuccess={() => {
          fetchPrayers();
        }}
      />

      {/* AI Prayer Assistant Modal */}
      <AIPrayerModal
        isOpen={aiPrayerOpen}
        onClose={() => setAiPrayerOpen(false)}
        onShareToPrayerWall={(title, content, category) => {
          setDraftTitle(title);
          setDraftPoints(content);
          setDraftCategory(category);
          setModalOpen(true);
        }}
      />

      {/* Report Modal */}
      <ReportPrayerModal
        isOpen={!!reportingPrayer}
        prayer={reportingPrayer}
        onClose={() => setReportingPrayer(null)}
      />

      {/* Praise Report / Answered Prayer Modal */}
      {answeringPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setAnsweringPrayer(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Share Your Praise Report</h3>
                <p className="text-xs text-slate-400">Give God the glory for answering your prayer</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPraiseReport} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-white">Request: </span>
                <span>{answeringPrayer.title}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  How did God answer your prayer? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={praiseReportText}
                  onChange={(e) => setPraiseReportText(e.target.value)}
                  placeholder="Share the testimony of what the Lord has done to encourage fellow believers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnsweringPrayer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPraise || !praiseReportText.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingPraise ? 'Publishing...' : 'Publish Praise Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
