import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { PrayerRequest, StationReview, StationReport } from '../../types';

export function AdminCommunityTab() {
  const [activeSubTab, setActiveSubTab] = useState<'prayers' | 'reviews' | 'reports'>('prayers');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [reports, setReports] = useState<StationReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, repRes] = await Promise.all([
        apiFetch('/api/admin/prayers'),
        apiFetch('/api/admin/reviews'),
        apiFetch('/api/admin/reports'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPrayers(pData.prayers || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReviews(rData.reviews || []);
      }
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prayer actions
  const handleUpdatePrayer = async (id: string, updates: Partial<PrayerRequest>) => {
    try {
      await apiFetch(`/api/admin/prayers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      loadCommunityData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePrayer = async (id: string) => {
    if (!window.confirm('Delete prayer request?')) return;
    try {
      await apiFetch(`/api/admin/prayers/${id}`, { method: 'DELETE' });
      loadCommunityData();
    } catch (err) {
      console.error(err);
    }
  };

  // Review actions
  const handleUpdateReview = async (id: string, updates: Partial<StationReview>) => {
    try {
      await apiFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      loadCommunityData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete review/testimony?')) return;
    try {
      await apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      loadCommunityData();
    } catch (err) {
      console.error(err);
    }
  };

  // Report actions
  const handleUpdateReport = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/admin/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadCommunityData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mr-3" />
        <span>Loading ministry and listener data...</span>
      </div>
    );
  }

  return (
    <div id="admin-community-tab" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-amber-400" />
            Ministry, Community Wall & Incident Reports
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Moderate prayer intercession requests, listener testimonies, and station downtime/abuse reports.
          </p>
        </div>

        <button
          onClick={loadCommunityData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('prayers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'prayers'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HeartHandshake className="w-4 h-4" /> Prayer Wall Requests ({prayers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'reviews'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Listener Testimonies ({reviews.length})
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'reports'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Incident & Outage Reports ({reports.length})
        </button>
      </div>

      {/* PRAYERS LIST */}
      {activeSubTab === 'prayers' && (
        <div className="space-y-4">
          {prayers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No prayer requests in the moderation queue.
            </div>
          ) : (
            prayers.map((prayer) => (
              <div
                key={prayer.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{prayer.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {prayer.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        prayer.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : prayer.status === 'ANSWERED'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {prayer.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{prayer.prayerPoints}</p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>By: {prayer.isAnonymous ? 'Anonymous Intercessor' : prayer.authorName}</span>
                    <span>•</span>
                    <span>🙏 {prayer.prayedCount || 0} prayers recorded</span>
                    <span>•</span>
                    <span>{new Date(prayer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {prayer.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdatePrayer(prayer.id, { status: 'APPROVED' })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {prayer.status !== 'ANSWERED' && (
                    <button
                      onClick={() => handleUpdatePrayer(prayer.id, { status: 'ANSWERED' })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Mark Answered ✨
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePrayer(prayer.id)}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REVIEWS LIST */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No listener reviews or testimonies found.
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{rev.title}</span>
                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    {rev.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        Featured Testimony ⭐
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{rev.testimony}</p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>By: {rev.authorName} ({rev.city || rev.countryCode})</span>
                    <span>•</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleUpdateReview(rev.id, { isApproved: !rev.isApproved })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      rev.isApproved
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {rev.isApproved ? 'Unpublish' : 'Approve'}
                  </button>

                  <button
                    onClick={() => handleUpdateReview(rev.id, { isFeatured: !rev.isFeatured })}
                    className="p-1.5 bg-slate-800 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                    title="Toggle Featured"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REPORTS LIST */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No outstanding incident or stream downtime reports.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Reason: {rep.reason}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        rep.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : rep.status === 'OPEN'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{rep.details || 'No additional details provided.'}</p>

                  <div className="text-[11px] text-slate-500">
                    Reporter: {rep.reporterEmail || 'Anonymous'} • {new Date(rep.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rep.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateReport(rep.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {rep.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleUpdateReport(rep.id, 'DISMISSED')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
