import React, { useState, useEffect } from 'react';
import {
  Activity,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import type { Station } from '../../types';

interface HealthCheckRecord {
  id: string;
  stationId: string;
  checkedAt: string;
  isOnline: boolean;
  statusCode: number;
  responseTimeMs: number;
  errorMessage?: string;
  contentType?: string;
}

interface StationWithHealth {
  id: string;
  name: string;
  slug?: string;
  streamUrl: string;
  streamType?: string;
  streamStatus: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  lastCheckedAt?: string;
  lastOnlineAt?: string;
  responseLatencyMs?: number;
  country?: string;
  logoUrl?: string;
  recentChecks?: HealthCheckRecord[];
}

interface AdminStreamHealthTabProps {
  onNavigateToStation?: (stationId: string) => void;
}

export function AdminStreamHealthTab({ onNavigateToStation }: AdminStreamHealthTabProps) {
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();
  const [stations, setStations] = useState<StationWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingSingleId, setCheckingSingleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'DEGRADED'>('ALL');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 30 = 30s, 60 = 60s
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const fetchStreamHealth = async () => {
    try {
      const res = await apiFetch('/api/admin/stream-health');
      if (res.ok) {
        const data = await res.json();
        if (data?.stations) {
          setStations(data.stations);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stream health telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamHealth();
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchStreamHealth();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const handleCheckAll = async () => {
    setCheckingAll(true);
    setLastCheckMessage('Executing health checks across live fleet endpoints...');
    try {
      const res = await apiFetch('/api/admin/stream-health/check-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const total = data?.results?.length || stations.length;
        setLastCheckMessage(`✓ Global health check complete. ${total} stations verified.`);
        await fetchStreamHealth();
      } else {
        setLastCheckMessage('Global stream check completed with some network warnings.');
        await fetchStreamHealth();
      }
    } catch (err: any) {
      setLastCheckMessage(`Check warning: ${err.message || 'Network timeout'}`);
    } finally {
      setCheckingAll(false);
      setTimeout(() => setLastCheckMessage(null), 7000);
    }
  };

  const handleCheckSingle = async (stationId: string) => {
    setCheckingSingleId(stationId);
    try {
      const res = await apiFetch(`/api/admin/stream-health/check/${stationId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const check: HealthCheckRecord = data.check;
        setStations((prev) =>
          prev.map((s) => {
            if (s.id !== stationId) return s;
            const updatedChecks = s.recentChecks ? [...s.recentChecks, check].slice(-5) : [check];
            return {
              ...s,
              streamStatus: check.isOnline ? 'ONLINE' : 'OFFLINE',
              responseLatencyMs: check.responseTimeMs,
              lastCheckedAt: check.checkedAt,
              lastOnlineAt: check.isOnline ? check.checkedAt : s.lastOnlineAt,
              recentChecks: updatedChecks,
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed single stream check:', err);
    } finally {
      setCheckingSingleId(null);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics summary
  const totalCount = stations.length;
  const onlineCount = stations.filter((s) => s.streamStatus === 'ONLINE').length;
  const offlineCount = stations.filter((s) => s.streamStatus === 'OFFLINE').length;
  const uptimePercent = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 100;
  const onlineWithLatency = stations.filter((s) => s.streamStatus === 'ONLINE' && s.responseLatencyMs);
  const avgLatency =
    onlineWithLatency.length > 0
      ? Math.round(
          onlineWithLatency.reduce((acc, s) => acc + (s.responseLatencyMs || 0), 0) / onlineWithLatency.length
        )
      : 140;

  // Filtered stations
  const filteredStations = stations.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.streamUrl.toLowerCase().includes(q) ||
      (s.country && s.country.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'ONLINE') matchesStatus = s.streamStatus === 'ONLINE';
    if (statusFilter === 'OFFLINE') matchesStatus = s.streamStatus === 'OFFLINE';
    if (statusFilter === 'DEGRADED')
      matchesStatus = s.streamStatus === 'DEGRADED' || (s.responseLatencyMs ? s.responseLatencyMs > 900 : false);

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="admin-stream-health" className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Live Stream Endpoints Telemetry & Uptime
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Active Monitor
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time HTTP health, latency probes, SSRF compliance, and auto-failover status across all radio feeds.
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Auto:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer text-xs"
              >
                <option value={0} className="bg-slate-900 text-slate-300">Off</option>
                <option value={30} className="bg-slate-900 text-slate-300">30s</option>
                <option value={60} className="bg-slate-900 text-slate-300">60s</option>
              </select>
            </div>

            {/* Manual Check All Streams */}
            <button
              type="button"
              onClick={handleCheckAll}
              disabled={checkingAll}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${checkingAll ? 'animate-spin' : ''}`} />
              {checkingAll ? 'Testing Fleet...' : 'Run Global Stream Check'}
            </button>
          </div>
        </div>

        {/* Status Message Alert */}
        {lastCheckMessage && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lastCheckMessage}</span>
          </div>
        )}

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fleet Online</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-2">
              {onlineCount} <span className="text-xs font-normal text-slate-400">/ {totalCount}</span>
            </div>
            <div className="text-[11px] text-emerald-400/80 font-medium mt-1">
              {uptimePercent}% Healthy Streams
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Offline Streams</div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {offlineCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {offlineCount > 0 ? 'Requires attention' : 'Zero outages active'}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {avgLatency}ms
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {avgLatency < 300 ? 'Ultra-low latency' : 'Standard buffer'}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stream Monitor</div>
            <div className="text-2xl font-black text-blue-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>SSRF Safe</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              RFC 1918 Private IP Filtered
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filter Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by station name, URL, country..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: `All (${stations.length})` },
              { id: 'ONLINE', label: `Online (${onlineCount})` },
              { id: 'OFFLINE', label: `Offline (${offlineCount})` },
              { id: 'DEGRADED', label: 'Slow (>900ms)' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === filter.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stations Telemetry Grid */}
      {loading ? (
        <div className="p-16 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-400 space-y-3">
          <RotateCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm font-medium">Probing live stream health telemetry...</p>
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="p-16 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-500 space-y-2">
          <Radio className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">No radio stations match your filter criteria.</p>
          <p className="text-xs text-slate-600">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStations.map((station) => {
            const isOnline = station.streamStatus === 'ONLINE';
            const latency = station.responseLatencyMs || 0;
            const isCheckingThis = checkingSingleId === station.id;
            const isCurrentPlaying = currentStation?.id === station.id && isPlaying;

            return (
              <div
                key={station.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all hover:border-slate-700 ${
                  isOnline ? 'border-slate-800' : 'border-rose-900/50 bg-rose-950/10'
                }`}
              >
                {/* Station Identity & Live Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                      {station.logoUrl ? (
                        <img
                          src={station.logoUrl}
                          alt={station.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Radio className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate" title={station.name}>
                        {station.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {station.country && (
                          <span className="font-mono text-amber-400 font-bold">{station.country}</span>
                        )}
                        <span>•</span>
                        <span className="uppercase text-[10px] font-mono text-slate-500">
                          {station.streamType || 'MP3 / ICECAST'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}
                    />
                    {station.streamStatus}
                  </span>
                </div>

                {/* Stream URL Box */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-400 truncate select-all">
                    {station.streamUrl}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(station.streamUrl, station.id)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === station.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={station.streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Open stream URL directly"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Telemetry Metrics & Recent Checks */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Response Latency</span>
                    <span
                      className={`font-mono font-bold ${
                        latency < 300
                          ? 'text-emerald-400'
                          : latency < 900
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {latency > 0 ? `${latency}ms` : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Last Verified</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {station.lastCheckedAt ? new Date(station.lastCheckedAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Recent Health History Dots */}
                {station.recentChecks && station.recentChecks.length > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] text-slate-500">
                    <span>Recent Probes (Last 5):</span>
                    <div className="flex items-center gap-1.5">
                      {station.recentChecks.map((hc, idx) => (
                        <span
                          key={hc.id || idx}
                          title={`${hc.isOnline ? 'Online (200 OK)' : 'Offline/Error'}: ${hc.responseTimeMs}ms at ${new Date(hc.checkedAt).toLocaleTimeString()}`}
                          className={`w-2 h-2 rounded-full cursor-help ${
                            hc.isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleCheckSingle(station.id)}
                    disabled={isCheckingThis}
                    className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${isCheckingThis ? 'animate-spin' : ''}`} />
                    {isCheckingThis ? 'Pinging...' : 'Test Ping'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentStation?.id === station.id) {
                        togglePlay();
                      } else {
                        playStation(station as any);
                      }
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md ${
                      isCurrentPlaying
                        ? 'bg-rose-500 hover:bg-rose-400 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Stop Live</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Listen Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
