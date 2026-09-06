import React, { useState, useEffect } from 'react';
import {
  Heart,
  Radio,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Mic2,
  Volume2,
  Share2,
  Copy,
  Check,
  Maximize2,
  X,
  Printer,
  ChevronDown,
  Layers,
  Flame,
  Globe2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station, PrayerRequest } from '../../types';
import { PrayerPublisherAvatar } from '../common/PrayerPublisherAvatar';

interface OwnerPrayerInboxProps {
  stations: Station[];
}

export function OwnerPrayerInbox({ stations }: OwnerPrayerInboxProps) {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'on_air' | 'answered'>('all');
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Studio Teleprompter Mode State
  const [teleprompterPrayer, setTeleprompterPrayer] = useState<PrayerRequest | null>(null);

  useEffect(() => {
    loadPrayers();
  }, []);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/owner/prayers');
      const data = await res.json();
      setPrayers(data.prayers || []);
    } catch (err) {
      console.error('Failed to load owner prayers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrayOnAir = async (prayerId: string, stationIdToUse?: string) => {
    try {
      setActionInProgress(prayerId);
      const chosenStationId = stationIdToUse || (stations[0]?.id);
      const res = await apiFetch(
        `/api/owner/prayers/${prayerId}/pray-on-air`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stationId: chosenStationId }),
        }
      );
      const data = await res.json();

      if (data.prayer) {
        setPrayers((prev) =>
          prev.map((p) => (p.id === prayerId ? { ...p, ...data.prayer } : p))
        );
        if (teleprompterPrayer && teleprompterPrayer.id === prayerId) {
          setTeleprompterPrayer({ ...teleprompterPrayer, ...data.prayer });
        }
      }
    } catch (err) {
      console.error('Failed to mark prayer on-air:', err);
      alert('Could not mark as prayed on-air. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const copyPrayerForShow = (prayer: PrayerRequest) => {
    const text = `🎙️ [ON-AIR PRAYER REQUEST]\nStation: ${prayer.stationName || 'Community'}\nCategory: ${prayer.category}\nFrom: ${prayer.isAnonymous ? 'An Anonymous Intercessor' : prayer.authorName}\nTitle: ${prayer.title}\n\nPrayer Points:\n${prayer.prayerPoints}\n\nLet us lift our hands in faith as we pray together.`;
    navigator.clipboard.writeText(text);
    setCopiedId(prayer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter logic
  const filteredPrayers = prayers.filter((p) => {
    if (filterTab === 'pending' && p.prayedOnAir) return false;
    if (filterTab === 'on_air' && !p.prayedOnAir) return false;
    if (filterTab === 'answered' && p.status !== 'ANSWERED') return false;

    if (selectedStationId !== 'all') {
      if (p.stationId && p.stationId !== selectedStationId) return false;
    }

    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchPoints = p.prayerPoints.toLowerCase().includes(q);
      const matchAuthor = p.authorName.toLowerCase().includes(q);
      return matchTitle || matchPoints || matchAuthor;
    }

    return true;
  });

  const totalPrayers = prayers.length;
  const onAirCount = prayers.filter((p) => p.prayedOnAir).length;
  const pendingOnAirCount = prayers.filter((p) => !p.prayedOnAir).length;
  const answeredCount = prayers.filter((p) => p.status === 'ANSWERED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-5 sm:p-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Mic2 className="w-3.5 h-3.5" />
            Live Ministry & Intercession Desk
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Broadcaster Prayer Inbox
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Intercede for your listening audience during live programming. When you mark a prayer as lifted on-air, the listener is immediately notified that their station family stood with them in agreement!
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Prayers ({totalPrayers})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Pending Intercession ({pendingOnAirCount})
            </button>
            <button
              onClick={() => setFilterTab('on_air')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTab === 'on_air'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Lifted On-Air ({onAirCount})
            </button>
            <button
              onClick={() => setFilterTab('answered')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTab === 'answered'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              ✨ Praise Reports ({answeredCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search prayers or names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Secondary Filters: Station & Category */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
          {stations.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Station:</span>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All My Stations</option>
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              <option value="Healing">Healing & Health</option>
              <option value="Family">Family & Marriage</option>
              <option value="Salvation">Salvation & Souls</option>
              <option value="Ministry">Ministry & Missions</option>
              <option value="Financial">Financial Breakthrough</option>
              <option value="Peace">Peace & Deliverance</option>
              <option value="Guidance">Guidance & Wisdom</option>
              <option value="General">General Prayer</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500">
            Showing <span className="text-slate-300 font-semibold">{filteredPrayers.length}</span> intercession items
          </div>
        </div>
      </div>

      {/* Prayers List / Grid */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Retrieving intercession requests...</p>
        </div>
      ) : filteredPrayers.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center">
          <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-1">No Prayer Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || filterTab !== 'all'
              ? 'Try clearing your filters or search keywords.'
              : 'When listeners submit prayers for your station or the community, they will appear here ready for on-air intercession.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrayers.map((prayer) => {
            const isActing = actionInProgress === prayer.id;
            const isCopied = copiedId === prayer.id;

            return (
              <div
                key={prayer.id}
                className={`flex flex-col justify-between bg-slate-900/70 border rounded-2xl p-5 sm:p-6 transition-all hover:border-slate-700 ${
                  prayer.prayedOnAir
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {prayer.category}
                      </span>
                      {prayer.stationName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          <Radio className="w-2.5 h-2.5 text-emerald-400" />
                          {prayer.stationName}
                        </span>
                      )}
                    </div>

                    {prayer.prayedOnAir ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                        <Mic2 className="w-3 h-3 text-emerald-400" />
                        Lifted On-Air
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-400 border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5" />
                        Awaiting On-Air Cue
                      </span>
                    )}
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 leading-snug">
                      {prayer.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                      {prayer.prayerPoints}
                    </p>
                  </div>

                  {/* Praise Report / Answered testimony if any */}
                  {prayer.status === 'ANSWERED' && prayer.testimony && (
                    <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        Praise Report from Listener:
                      </div>
                      <p className="text-xs text-purple-200/90 italic">"{prayer.testimony}"</p>
                    </div>
                  )}
                </div>

                {/* Footer and Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PrayerPublisherAvatar
                      authorAvatar={prayer.authorAvatar}
                      authorName={prayer.authorName}
                      isAnonymous={prayer.isAnonymous}
                      size="sm"
                    />
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>
                        From:{' '}
                        <span className="text-slate-300 font-medium">
                          {prayer.isAnonymous ? 'Anonymous Intercessor' : prayer.authorName}
                        </span>
                      </div>
                      <div>
                        {new Date(prayer.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {prayer.prayedOnAirAt && (
                          <span className="text-emerald-400 ml-1.5">
                            • On-Air {new Date(prayer.prayedOnAirAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy to clipboard for show notes */}
                    <button
                      onClick={() => copyPrayerForShow(prayer)}
                      title="Copy script for on-air reading"
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Open Studio Teleprompter */}
                    <button
                      onClick={() => setTeleprompterPrayer(prayer)}
                      title="Open in Studio Teleprompter Mode"
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Mark Prayed On-Air Action */}
                    {!prayer.prayedOnAir ? (
                      <button
                        onClick={() => handlePrayOnAir(prayer.id)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                      >
                        <Mic2 className="w-3.5 h-3.5" />
                        {isActing ? 'Updating...' : 'Lift On-Air'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePrayOnAir(prayer.id)}
                        disabled={isActing}
                        title="Prayer already broadcast. Click to re-affirm on today's show."
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-medium text-xs transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Re-Pray
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Studio Teleprompter Mode Modal */}
      {teleprompterPrayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Mic2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Studio Live Intercession Teleprompter
                    <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ON-AIR DESK
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-legibility reading mode for radio hosts and studio ministers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTeleprompterPrayer(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teleprompter Content */}
            <div className="space-y-6 overflow-y-auto py-2 pr-2">
              <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
                <PrayerPublisherAvatar
                  authorAvatar={teleprompterPrayer.authorAvatar}
                  authorName={teleprompterPrayer.authorName}
                  isAnonymous={teleprompterPrayer.isAnonymous}
                  size="md"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-wider">
                    {teleprompterPrayer.category}
                  </span>
                  <span>
                    Listener: <strong className="text-white">{teleprompterPrayer.isAnonymous ? 'An Anonymous Saint' : teleprompterPrayer.authorName}</strong>
                  </span>
                  {teleprompterPrayer.stationName && (
                    <span>
                      Station: <strong className="text-emerald-400">{teleprompterPrayer.stationName}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* High Contrast Reading Block */}
              <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  "{teleprompterPrayer.title}"
                </h1>
                <p className="text-lg sm:text-xl text-slate-200 leading-relaxed font-serif whitespace-pre-line">
                  {teleprompterPrayer.prayerPoints}
                </p>
              </div>

              {/* On-air Suggested Script Lead-in */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed space-y-1">
                <span className="font-bold uppercase tracking-wider text-amber-400 block">
                  Studio Lead-In Suggestion:
                </span>
                "Beloved listeners across the airwaves, we lift our hands and agree in prayer for {teleprompterPrayer.isAnonymous ? 'our brother/sister' : teleprompterPrayer.authorName} regarding {teleprompterPrayer.category.toLowerCase()}. Scripture reminds us in Matthew 18:19 that if two agree on earth touching anything, it shall be done. Father, in Jesus' mighty name, release Your power and peace right now..."
              </div>
            </div>

            {/* Teleprompter Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {teleprompterPrayer.prayedOnAir ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Lifted on-air at {new Date(teleprompterPrayer.prayedOnAirAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span>Status: Standing in prayer queue</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyPrayerForShow(teleprompterPrayer)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  {copiedId === teleprompterPrayer.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Script
                    </>
                  )}
                </button>

                <button
                  onClick={() => handlePrayOnAir(teleprompterPrayer.id)}
                  disabled={actionInProgress === teleprompterPrayer.id}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Mic2 className="w-4 h-4" />
                  {teleprompterPrayer.prayedOnAir ? 'Re-Affirm On Air' : 'Mark as Prayed On-Air Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
