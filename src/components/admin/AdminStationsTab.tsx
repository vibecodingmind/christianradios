import React, { useState } from 'react';
import {
  Radio,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Sparkles,
  ShieldCheck,
  Edit2,
  Trash2,
  Layers,
  Globe,
  ExternalLink,
  RefreshCw,
  X,
  Save,
  Check,
  Sliders,
  LayoutGrid,
  List,
  MapPin,
  Tag,
  Signal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { apiFetch } from '../../lib/api';
import type { Station, SubscriptionPlan, Category, Country } from '../../types';

interface AdminStationsTabProps {
  stations: Station[];
  plans: SubscriptionPlan[];
  categories: Category[];
  countries: Country[];
  onRefresh: () => void;
}

export function AdminStationsTab({
  stations,
  plans,
  categories,
  countries,
  onRefresh,
}: AdminStationsTabProps) {
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [assigningPlanStation, setAssigningPlanStation] = useState<Station | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [rejectingStation, setRejectingStation] = useState<Station | null>(null);
  const [rejectReason, setRejectReason] = useState('Stream URL is unreachable or content does not match broadcast standards.');

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Station edit form
  const [formData, setFormData] = useState<Partial<Station>>({});

  const startEdit = (station: Station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      tagline: station.tagline,
      description: station.description,
      streamUrl: station.streamUrl,
      streamType: station.streamType,
      bitrate: station.bitrate,
      language: station.language,
      city: station.city,
      countryCode: station.countryCode,
      categoryId: station.categoryId,
      website: station.website,
      logoUrl: station.logoUrl,
      donationEnabled: station.donationEnabled,
      isFeatured: station.isFeatured,
      verificationStatus: station.verificationStatus,
      status: station.status,
    });
    setErrorMsg('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await apiFetch(`/api/admin/stations/${editingStation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update radio station');
      }

      setEditingStation(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating station');
    } finally {
      setSaving(false);
    }
  };

  const handleModerate = async (id: string, action: 'approve' | 'reject' | 'suspend' | 'verify' | 'feature', reason?: string) => {
    setProcessingId(id);
    try {
      const res = await apiFetch(`/api/admin/stations/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Moderation error', err);
    } finally {
      setProcessingId(null);
      setRejectingStation(null);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPlanStation || !selectedPlanId) return;
    setSaving(true);

    try {
      const res = await apiFetch(`/api/admin/stations/${assigningPlanStation.id}/assign-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      if (res.ok) {
        setAssigningPlanStation(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Plan assignment error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStation = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/admin/stations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Filter stations
  const filteredStations = stations.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesVerification =
      verificationFilter === 'ALL' || s.verificationStatus === verificationFilter;
    const matchesFeatured =
      featuredFilter === 'ALL' ||
      (featuredFilter === 'FEATURED' && s.isFeatured) ||
      (featuredFilter === 'STANDARD' && !s.isFeatured);

    return matchesSearch && matchesStatus && matchesVerification && matchesFeatured;
  });

  return (
    <div id="admin-stations-tab" className="space-y-6">
      {/* Search & Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-amber-400" />
              Radio Stations Management & Moderation
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Review live streams, approve/reject submissions, edit broadcast parameters, and assign packages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>Total: <strong className="text-white">{stations.length}</strong></span>
              <span>•</span>
              <span>Active: <strong className="text-emerald-400">{stations.filter(s => s.status === 'ACTIVE').length}</strong></span>
              <span>•</span>
              <span>Pending: <strong className="text-amber-400">{stations.filter(s => s.status === 'PENDING_APPROVAL').length}</strong></span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Card Grid View (All Data Visible)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dense Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station, city, country..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Status: Active & Live</option>
              <option value="PENDING_APPROVAL">Status: Pending Approval ⚠️</option>
              <option value="REJECTED">Status: Rejected</option>
              <option value="SUSPENDED">Status: Suspended</option>
            </select>
          </div>

          <div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Badge: All Badges</option>
              <option value="VERIFIED">Verified Badges Only ✓</option>
              <option value="UNVERIFIED">Unverified Only</option>
            </select>
          </div>

          <div>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Spotlight: All Tiers</option>
              <option value="FEATURED">Featured Spotlight ⭐</option>
              <option value="STANDARD">Standard Listing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stations List: Grid View or Table View */}
      {viewMode === 'grid' ? (
        <div className="space-y-4">
          {filteredStations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
              No radio stations matched your current filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStations.map((station) => {
                const isCurrentPlaying = currentStation?.id === station.id && isPlaying;
                const isStreamOnline = station.streamStatus === 'ONLINE';

                return (
                  <div
                    key={station.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-lg hover:shadow-2xl relative group"
                  >
                    {/* Top Row: Station Identity & Status */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => {
                              if (currentStation?.id === station.id) {
                                togglePlay();
                              } else {
                                playStation(station);
                              }
                            }}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md ${
                              isCurrentPlaying
                                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950'
                            }`}
                            title={isCurrentPlaying ? 'Pause' : 'Preview Stream'}
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="font-extrabold text-white text-base leading-tight truncate flex items-center gap-1.5">
                              <span>{station.name}</span>
                              {station.verificationStatus === 'VERIFIED' && (
                                <span title="Verified Broadcaster">
                                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 inline" />
                                </span>
                              )}
                              {station.isFeatured && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                  ⭐
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-amber-400/80 shrink-0" />
                              <span>{station.city}, {station.countryCode}</span>
                              <span>•</span>
                              <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{station.genre || 'Gospel'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stream Online Indicator */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                            isStreamOnline
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isStreamOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          <span>{isStreamOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                      </div>

                      {/* Stream URL & Specs */}
                      <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                        <div className="text-slate-400 truncate text-[11px] flex items-center justify-between">
                          <span className="truncate">{station.streamUrl}</span>
                          <span className="text-slate-500 ml-2 shrink-0">{station.bitrate || 128}kbps</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                          <span>Owner: {station.ownerId ? station.ownerId.slice(0, 14) : 'System'}</span>
                          <span>Latency: {station.responseLatencyMs ? `${station.responseLatencyMs}ms` : '120ms'}</span>
                        </div>
                      </div>

                      {/* Tags & Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${
                            station.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : station.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : station.status === 'SUSPENDED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Status: {station.status}
                        </span>

                        {station.planId && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                            Plan: {plans.find(p => p.id === station.planId)?.name || 'Custom'}
                          </span>
                        )}

                        {station.donationEnabled && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
                            Giving Enabled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleModerate(station.id, 'verify')}
                          className={`p-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            station.verificationStatus === 'VERIFIED'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Toggle Verified Badge"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleModerate(station.id, 'feature')}
                          className={`p-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            station.isFeatured
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Toggle Featured Spotlight"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setAssigningPlanStation(station);
                            setSelectedPlanId(plans[0]?.id || '');
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 text-purple-400 hover:bg-purple-500/20 transition-colors"
                          title="Assign Subscription Plan"
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => startEdit(station)}
                          className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                          title="Edit Station Parameters"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteStation(station.id, station.name)}
                          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-colors"
                          title="Delete Station"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Primary Workflow Buttons */}
                      <div className="flex items-center gap-1.5">
                        {station.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleModerate(station.id, 'approve')}
                              disabled={processingId === station.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingStation(station)}
                              disabled={processingId === station.id}
                              className="px-2.5 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {station.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleModerate(station.id, 'suspend')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 text-xs font-bold transition-colors"
                          >
                            Suspend
                          </button>
                        )}

                        {station.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleModerate(station.id, 'approve')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Dense Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300 min-w-[950px]">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Station & Stream</th>
                  <th className="py-3.5 px-4">Category & Location</th>
                  <th className="py-3.5 px-4">Stream Status</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Badges</th>
                  <th className="py-3.5 px-4 text-right">Moderation & Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No radio stations matched your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((station) => {
                    const isCurrentPlaying = currentStation?.id === station.id && isPlaying;
                    const isStreamOnline = station.streamStatus === 'ONLINE';

                    return (
                      <tr key={station.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Station & Stream */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (currentStation?.id === station.id) {
                                  togglePlay();
                                } else {
                                  playStation(station);
                                }
                              }}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isCurrentPlaying
                                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950'
                              }`}
                              title="Preview Radio Stream"
                            >
                              {isCurrentPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>

                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                {station.name}
                                {station.isFeatured && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ⭐ Featured
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 text-[11px] font-mono block truncate max-w-xs">
                                {station.streamUrl}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Location */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="text-slate-300 font-medium">{station.city}, {station.countryCode}</span>
                            <span className="text-slate-500 text-[11px] block">{station.genre || 'Gospel'}</span>
                          </div>
                        </td>

                        {/* Stream Status */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isStreamOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                              }`}
                            />
                            <span
                              className={`font-semibold text-xs ${
                                isStreamOnline ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {station.streamStatus || 'UNKNOWN'}
                            </span>
                            {station.responseLatencyMs && (
                              <span className="text-[10px] text-slate-500 ml-1">
                                ({station.responseLatencyMs}ms)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Account Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              station.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : station.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : station.status === 'SUSPENDED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {station.status}
                          </span>
                        </td>

                        {/* Badges */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleModerate(station.id, 'verify')}
                              className={`p-1 rounded-lg text-xs font-semibold transition-colors ${
                                station.verificationStatus === 'VERIFIED'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                              title="Toggle Verified Badge"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleModerate(station.id, 'feature')}
                              className={`p-1 rounded-lg text-xs font-semibold transition-colors ${
                                station.isFeatured
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                              title="Toggle Featured Spotlight"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        {/* Moderation Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {station.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleModerate(station.id, 'approve')}
                                  disabled={processingId === station.id}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectingStation(station)}
                                  disabled={processingId === station.id}
                                  className="px-2.5 py-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {station.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleModerate(station.id, 'suspend')}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Suspend Broadcast"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            {station.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleModerate(station.id, 'approve')}
                                className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Reactivate Station"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Assign Package */}
                            <button
                              onClick={() => {
                                setAssigningPlanStation(station);
                                setSelectedPlanId(plans[0]?.id || '');
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 text-purple-400 hover:bg-purple-500/20 transition-colors"
                              title="Assign Subscription Plan"
                            >
                              <Layers className="w-4 h-4" />
                            </button>

                            {/* Edit Station */}
                            <button
                              onClick={() => startEdit(station)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                              title="Edit Full Parameters"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Station */}
                            <button
                              onClick={() => handleDeleteStation(station.id, station.name)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete Station"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT STATION MODAL */}
      {editingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Edit Station: {editingStation.name}</h3>
              </div>
              <button
                onClick={() => setEditingStation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Station Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stream URL</label>
                  <input
                    type="url"
                    required
                    value={formData.streamUrl || ''}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stream Protocol</label>
                  <select
                    value={formData.streamType || 'MP3'}
                    onChange={(e) => setFormData({ ...formData, streamType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="MP3">MP3 / Icecast / Shoutcast</option>
                    <option value="AAC">AAC / AAC+</option>
                    <option value="HLS">HLS (m3u8)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bitrate (Kbps)</label>
                  <input
                    type="number"
                    value={formData.bitrate || 128}
                    onChange={(e) => setFormData({ ...formData, bitrate: parseInt(e.target.value, 10) || 128 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <select
                    value={formData.countryCode || 'TZ'}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.categoryId || (categories[0]?.id || '')}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PLAN MODAL */}
      {assigningPlanStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Assign Subscription Plan
              </h3>
              <button
                onClick={() => setAssigningPlanStation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select the active tier package to immediately assign to{' '}
              <strong className="text-white">{assigningPlanStation.name}</strong>.
            </p>

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Package
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — TZS {Number(p.monthlyPriceTzs || 0).toLocaleString()}/mo (${p.monthlyPriceUsd}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningPlanStation(null)}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20"
                >
                  {saving ? 'Assigning...' : 'Assign Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT SUBMISSION MODAL */}
      {rejectingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Decline Submission: {rejectingStation.name}
              </h3>
              <button
                onClick={() => setRejectingStation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide a feedback note that will be sent via internal notification to the station owner.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingStation(null)}
                className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerate(rejectingStation.id, 'reject', rejectReason)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/20"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
