import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  Radio,
  Activity,
  Headphones,
  TrendingUp,
  RotateCw,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Globe,
  Flame,
  ShieldCheck,
  ChevronRight,
  Plus,
  ArrowUpRight,
  HeartHandshake,
  Layers,
  Search,
  ExternalLink,
  CreditCard,
  Building,
  Check,
  X,
  Send,
  Zap,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import type {
  Station,
  SubscriptionPlan,
  AuditLog,
  SupportTicket,
  Category,
  Country,
  Payment,
} from '../../types';

interface AdminOverviewTabProps {
  metrics: any;
  stations: Station[];
  tenants: any[];
  plans: SubscriptionPlan[];
  payments: Payment[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  categories: Category[];
  countries: Country[];
  isCheckingStreams: boolean;
  onTriggerStreamCheck: () => Promise<void>;
  onNavigateTab: (tab: string, param?: string) => void;
  onRefresh: () => Promise<void>;
}

export function AdminOverviewTab({
  metrics,
  stations,
  tenants,
  plans,
  payments,
  tickets,
  auditLogs,
  categories,
  countries,
  isCheckingStreams,
  onTriggerStreamCheck,
  onNavigateTab,
  onRefresh,
}: AdminOverviewTabProps) {
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();

  // Active triage tab: 'stations' | 'tickets' | 'activity'
  const [triageTab, setTriageTab] = useState<'stations' | 'tickets' | 'activity'>('stations');

  // Approving / rejecting state
  const [processingStationId, setProcessingStationId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered pending stations
  const pendingStations = useMemo(() => {
    return stations.filter((s) => s.status === 'PENDING_APPROVAL');
  }, [stations]);

  // Open support tickets
  const openTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  }, [tickets]);

  // Calculated stream health percentage
  const onlineStationsCount = useMemo(() => {
    if (metrics?.onlineStations !== undefined && metrics.onlineStations !== null) {
      return metrics.onlineStations;
    }
    return stations.filter((s) => s.streamStatus === 'ONLINE').length;
  }, [metrics, stations]);

  const totalStationsCount = useMemo(() => {
    return metrics?.totalStations || stations.length || 1;
  }, [metrics, stations]);

  const streamHealthPercent = Math.round((onlineStationsCount / Math.max(1, totalStationsCount)) * 100);

  // Station Approval Action
  const handleApproveStation = async (station: Station) => {
    setProcessingStationId(station.id);
    try {
      const res = await apiFetch(`/api/admin/stations/${station.id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        await onRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to approve station.');
      }
    } catch {
      alert('Error communicating with approval service.');
    } finally {
      setProcessingStationId(null);
    }
  };

  // Station Rejection Action
  const handleRejectStation = async (station: Station) => {
    const reason = prompt(
      `Please enter the rejection reason for "${station.name}":`,
      'Stream URL is unreachable or content does not meet broadcast directory standards.'
    );
    if (!reason || !reason.trim()) return;

    setProcessingStationId(station.id);
    try {
      const res = await apiFetch(`/api/admin/stations/${station.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) {
        await onRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to decline station.');
      }
    } catch {
      alert('Error declining station submission.');
    } finally {
      setProcessingStationId(null);
    }
  };

  // Refresh handler
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Operations Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Command Center</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Global Telemetry Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Christian Radios Global Overview
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Live operations summary of all broadcaster fleets, audio endpoints, platform subscriptions, and moderation queues.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh All Telemetry"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onTriggerStreamCheck}
            disabled={isCheckingStreams}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isCheckingStreams ? 'animate-spin' : ''}`} />
            <span>{isCheckingStreams ? 'Testing Streams...' : 'Run Fleet Stream Scan'}</span>
          </button>

          <button
            onClick={() => onNavigateTab('tenants')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Broadcasters ({tenants.length})</span>
          </button>

          <button
            onClick={() => onNavigateTab('stations', 'add-station')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Add Station</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Platform MRR & Revenue */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 border border-slate-800 hover:border-amber-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Platform MRR
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.8%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            TZS {(metrics?.mrrTzs ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>≈ ${(metrics?.mrrUsd ?? 0).toLocaleString()} USD</span>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-amber-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Broadcaster Fleet */}
        <div className="bg-gradient-to-br from-slate-900 to-sky-950/20 border border-slate-800 hover:border-sky-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Broadcaster Fleet
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {tenants.length} Registered
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {metrics?.totalTenants ?? tenants.length}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>{stations.length} fleet stations</span>
            <button
              onClick={() => onNavigateTab('tenants')}
              className="text-sky-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Stream Fleet Health */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Stream Health
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                streamHealthPercent >= 80
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
            >
              {streamHealthPercent}% Online
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {onlineStationsCount} / {totalStationsCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Live audio telemetry</span>
            <button
              onClick={() => onNavigateTab('streams')}
              className="text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Diagnostics</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Global Network Reach */}
        <div className="bg-gradient-to-br from-slate-900 to-purple-950/20 border border-slate-800 hover:border-purple-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" /> Global Reach
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {countries.length} Nations
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {(metrics?.totalPlays ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Cumulative stream plays</span>
            <button
              onClick={() => onNavigateTab('taxonomy')}
              className="text-purple-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Taxonomy</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Triage Command Center & Operations Dispatch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Actionable Moderation & Triage Queue */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Operations Triage & Moderation Queue</h3>
                <p className="text-[11px] text-slate-400">Review pending broadcasts, open support tickets, and system actions</p>
              </div>
            </div>

            {/* Triage Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTriageTab('stations')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  triageTab === 'stations'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Stations</span>
                {pendingStations.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      triageTab === 'stations' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {pendingStations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTriageTab('tickets')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  triageTab === 'tickets'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Support</span>
                {openTickets.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      triageTab === 'tickets' ? 'bg-slate-950 text-amber-400' : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {openTickets.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTriageTab('activity')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  triageTab === 'activity'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Audit Trail</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Pending Stations Queue */}
          {triageTab === 'stations' && (
            <div className="space-y-3">
              {pendingStations.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">No Pending Station Submissions</div>
                  <div className="text-[11px] text-slate-500">
                    All broadcaster station submissions have been reviewed and approved.
                  </div>
                </div>
              ) : (
                pendingStations.slice(0, 5).map((st) => {
                  const isCurrent = currentStation?.id === st.id;
                  const isProcessing = processingStationId === st.id;

                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => {
                            if (isCurrent) togglePlay();
                            else playStation(st);
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform hover:scale-105 cursor-pointer ${
                            isCurrent && isPlaying
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 text-amber-400 hover:bg-slate-750'
                          }`}
                          title="Preview Stream"
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                            <span>{st.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {st.countryCode} • {st.city || 'National'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm mt-0.5">
                            {st.streamUrl}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleRejectStation(st)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApproveStation(st)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Open Support Tickets Queue */}
          {triageTab === 'tickets' && (
            <div className="space-y-3">
              {openTickets.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">No Open Tickets</div>
                  <div className="text-[11px] text-slate-500">
                    All broadcaster inquiries and engineering tickets are resolved.
                  </div>
                </div>
              ) : (
                openTickets.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigateTab('tickets')}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.priority === 'URGENT' || t.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {t.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{t.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Recent Audit Stream */}
          {triageTab === 'activity' && (
            <div className="space-y-2.5">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No audit events logged yet.</div>
              ) : (
                auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">
                          {log.action}
                        </span>
                        {log.actorEmail && (
                          <span className="text-slate-500 text-[10px]">by {log.actorEmail}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        {log.details || log.targetType || 'System action executed'}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right 4 Cols: Operations Hub & System Node Status */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Operations Triggers */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Platform Portals & Dispatch</h3>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('streams')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all hover:bg-slate-850 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Stream Health Monitor
                    </div>
                    <div className="text-[11px] text-slate-400">{onlineStationsCount} of {stations.length} endpoints online</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('tenants')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left transition-all hover:bg-slate-850 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                      Broadcaster Management
                    </div>
                    <div className="text-[11px] text-slate-400">Manage fleet tiers & suspend/activate</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('finance')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-850 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      Financial Transactions
                    </div>
                    <div className="text-[11px] text-slate-400">{payments.length} ledger entries recorded</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('tickets')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left transition-all hover:bg-slate-850 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                      Broadcaster Support Desk
                    </div>
                    <div className="text-[11px] text-slate-400">{openTickets.length} tickets awaiting triage</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* System Environment Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Platform Infrastructure
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Healthy
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Web & API Engine</span>
                <span className="text-slate-200 font-semibold font-mono">Node.js 22 LTS</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Database Layer</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  PostgreSQL / Hybrid
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Stream Proxy</span>
                <span className="text-emerald-400 font-semibold font-mono">Active (Port 3000)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footprint Breakdown: Geographic & Genres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Countries Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Geographic Footprint</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{countries.length} Regions</span>
          </div>

          <div className="space-y-3">
            {countries.slice(0, 5).map((c) => {
              const count = stations.filter(
                (s) => s.countryCode?.toUpperCase() === c.code?.toUpperCase()
              ).length;
              const percent = Math.round((count / Math.max(1, stations.length)) * 100);
              return (
                <div key={c.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span>{c.flagEmoji || '🌍'}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="text-slate-400 font-bold">
                      {count} stations ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ministry Genres */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Ministry Genres & Formats</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{categories.length} Categories</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => {
              const count = stations.filter((s) => s.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs"
                >
                  <span className="font-bold text-slate-200">{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-400 font-bold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Financial Receipts Pulse */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Latest Transactions</h3>
            </div>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-[10px] font-bold text-emerald-400 hover:underline"
            >
              All Ledger →
            </button>
          </div>

          <div className="space-y-2.5">
            {payments.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigateTab('finance')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate max-w-[150px]">
                    {p.description || 'Subscription Renewal'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {p.trackingId || p.id}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-emerald-400 font-mono">
                    {p.currency} {(p.amount || 0).toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">No transactions recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
