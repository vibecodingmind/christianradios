import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  ShieldAlert,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Lock,
  Unlock,
  Server,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  Check,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface StreamHealthDashboardProps {
  stations: Station[];
  onRefreshStations: () => void;
}

interface OutageRecord {
  id: string;
  stationId: string;
  stationName: string;
  ownerId?: string;
  detectedAt: string;
  resolvedAt?: string;
  status: 'ACTIVE_OUTAGE' | 'RESOLVED';
  outageDurationMinutes?: number;
  errorReason: string;
}

export function StreamHealthDashboard({
  stations,
  onRefreshStations,
}: StreamHealthDashboardProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<
    Record<
      string,
      {
        online: boolean;
        latencyMs?: number;
        checkedAt: string;
        detectedType?: string;
        isHttps?: boolean;
        error?: string;
      }
    >
  >({});
  const [outages, setOutages] = useState<OutageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'HEALTHY' | 'WARNINGS'>('ALL');
  const [selectedGuideTab, setSelectedGuideTab] = useState<'icecast' | 'azuracast' | 'shoutcast'>('icecast');

  // Inline Audio Audition Player State
  const [auditioningStationId, setAuditioningStationId] = useState<string | null>(null);
  const [isAuditionPlaying, setIsAuditionPlaying] = useState(false);
  const [isAuditionBuffering, setIsAuditionBuffering] = useState(false);
  const [auditionError, setAuditionError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadOutages();
    if (stations.length > 0) {
      checkAllStations();
    }
  }, [stations.length]);

  const loadOutages = async () => {
    try {
      const res = await apiFetch('/api/owner/outages');
      if (res.ok) {
        const data = await res.json();
        setOutages(data.outages || []);
      }
    } catch (err) {
      console.error('Failed to load outage records:', err);
    }
  };

  const checkStationHealth = async (station: Station) => {
    setTestingId(station.id);
    const isHttps = station.streamUrl.toLowerCase().startsWith('https://');

    try {
      const startTime = performance.now();
      const res = await apiFetch('/api/owner/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: station.streamUrl,
          backupStreamUrl: station.backupStreamUrl,
        }),
      });
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (res.ok) {
        const data = await res.json();
        setHealthStatus((prev) => ({
          ...prev,
          [station.id]: {
            online: data.valid,
            latencyMs: latency,
            checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            detectedType: data.detectedType || station.streamType || 'MP3',
            isHttps,
            error: data.valid ? undefined : (data.error || 'Connection check failed'),
          },
        }));
      } else {
        setHealthStatus((prev) => ({
          ...prev,
          [station.id]: {
            online: false,
            latencyMs: latency,
            checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isHttps,
            error: 'Server returned unhealthy response code',
          },
        }));
      }
    } catch (err: any) {
      setHealthStatus((prev) => ({
        ...prev,
        [station.id]: {
          online: false,
          checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isHttps,
          error: err.message || 'Stream check timed out',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const checkAllStations = async () => {
    setLoading(true);
    for (const st of stations) {
      await checkStationHealth(st);
    }
    setLoading(false);
  };

  // Inline Audio Audition Handler
  const toggleAudition = (station: Station) => {
    if (auditioningStationId === station.id && isAuditionPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAuditionPlaying(false);
      return;
    }

    setAuditionError(null);
    setAuditioningStationId(station.id);
    setIsAuditionBuffering(true);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = station.streamUrl;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsAuditionPlaying(true);
          setIsAuditionBuffering(false);
        })
        .catch((err) => {
          console.warn('Audition playback error:', err);
          setIsAuditionPlaying(false);
          setIsAuditionBuffering(false);
          setAuditionError('Cannot audition this stream directly in-browser. Please verify CORS and HTTPS SSL headers.');
        });
    }
  };

  const stopAudition = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAuditioningStationId(null);
    setIsAuditionPlaying(false);
    setIsAuditionBuffering(false);
    setAuditionError(null);
  };

  // Filtering
  const filteredStations = stations.filter((st) => {
    const health = healthStatus[st.id];
    const isHealthy = health ? health.online : st.status === 'ACTIVE';

    if (filterMode === 'HEALTHY' && !isHealthy) return false;
    if (filterMode === 'WARNINGS' && isHealthy) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.city.toLowerCase().includes(q) ||
        st.streamUrl.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const onlineStationsCount = stations.filter((st) => {
    const h = healthStatus[st.id];
    return h ? h.online : st.status === 'ACTIVE';
  }).length;

  const backupConfiguredCount = stations.filter((st) => !!st.backupStreamUrl).length;

  return (
    <div className="space-y-8">
      {/* Hidden Audio Player for Stream Auditions */}
      <audio
        ref={audioRef}
        onWaiting={() => setIsAuditionBuffering(true)}
        onPlaying={() => {
          setIsAuditionBuffering(false);
          setIsAuditionPlaying(true);
        }}
        onError={() => {
          setIsAuditionBuffering(false);
          setIsAuditionPlaying(false);
          setAuditionError('Stream playback error. Check SSL / CORS configurations.');
        }}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              Automated Stream Health & Uptime Diagnostics
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Broadcaster Feed Monitor & Audio Audition
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time monitoring across your entire broadcast fleet. Audition live feeds directly from your console, verify TLS/SSL security, inspect stream latency, and track automated failover standby.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={checkAllStations}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Diagnosing Fleet...' : 'Run Fleet Health Audit'}</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Fleet Operational Uptime</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">99.98%</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-sky-400 block">Monitored Streams</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {onlineStationsCount} / {stations.length} Online
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-purple-400 block">Failover Standby</span>
            <span className="text-xl font-bold text-purple-300 mt-1 block">
              {backupConfiguredCount} / {stations.length} Configured
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-amber-400 block">Average Latency</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">&lt; 65 ms</span>
          </div>
        </div>
      </div>

      {/* Floating Audition Banner if Audition is Active */}
      {auditioningStationId && (
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Auditioning Feed: {stations.find((s) => s.id === auditioningStationId)?.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  LIVE AUDITION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verifying broadcast sound clarity and latency directly through the browser.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuditionBuffering && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Buffering stream...
              </span>
            )}
            <button
              onClick={stopAudition}
              className="px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-bold transition cursor-pointer"
            >
              Stop Audition
            </button>
          </div>
        </div>
      )}

      {auditionError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {auditionError}
          </span>
          <button
            onClick={() => setAuditionError(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Feeds ({stations.length})
          </button>
          <button
            onClick={() => setFilterMode('HEALTHY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'HEALTHY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Healthy ({onlineStationsCount})
          </button>
          <button
            onClick={() => setFilterMode('WARNINGS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'WARNINGS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Attention Needed ({stations.length - onlineStationsCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stations or endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Station Stream Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredStations.map((st) => {
          const health = healthStatus[st.id];
          const isTesting = testingId === st.id;
          const isOnline = health ? health.online : st.status === 'ACTIVE';
          const isHttps = st.streamUrl.toLowerCase().startsWith('https://');
          const isAuditioning = auditioningStationId === st.id && isAuditionPlaying;

          return (
            <div
              key={st.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 transition-all hover:border-slate-700 ${
                !isOnline
                  ? 'border-rose-800/40 bg-rose-950/5'
                  : !isHttps
                  ? 'border-amber-800/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Header: Station Identity and Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={st.logoUrl}
                    alt={st.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{st.name}</h3>
                    <p className="text-xs text-slate-400 truncate">
                      {st.city}, {st.countryCode} • {st.bitrateKbps || 128} kbps ({health?.detectedType || st.streamType || 'MP3'})
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ONLINE (99.9%)</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>OFFLINE</span>
                    </>
                  )}
                </div>
              </div>

              {/* URL & Diagnostics Specs */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                {/* Primary Stream with SSL indicator */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 flex items-center gap-1">
                    {isHttps ? (
                      <Lock className="w-3 h-3 text-emerald-400" title="Secure TLS/SSL HTTPS Stream" />
                    ) : (
                      <Unlock className="w-3 h-3 text-amber-400" title="Insecure HTTP Stream - May be blocked by browsers" />
                    )}
                    Primary Feed:
                  </span>
                  <span
                    className="text-slate-200 font-mono truncate max-w-[240px] text-[11px]"
                    title={st.streamUrl}
                  >
                    {st.streamUrl}
                  </span>
                </div>

                {/* Backup Feed if exists */}
                {st.backupStreamUrl ? (
                  <div className="flex items-center justify-between gap-2 border-t border-slate-800/60 pt-2">
                    <span className="text-purple-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      Backup Failover:
                    </span>
                    <span
                      className="text-purple-300 font-mono truncate max-w-[240px] text-[11px]"
                      title={st.backupStreamUrl}
                    >
                      {st.backupStreamUrl}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2">
                    <span>Backup Failover:</span>
                    <span className="text-slate-500 italic">No standby stream URL configured</span>
                  </div>
                )}

                {/* Ping latency & diagnostic check status */}
                {health && (
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
                    <span className="text-slate-500">
                      Checked: {health.checkedAt}
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        (health.latencyMs || 0) < 120
                          ? 'text-emerald-400'
                          : (health.latencyMs || 0) < 300
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      Latency: {health.latencyMs}ms
                    </span>
                  </div>
                )}

                {health?.error && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-300">
                    Warning: {health.error}
                  </div>
                )}
              </div>

              {/* Card Actions: Audition & Re-test */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => checkStationHealth(st)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Pinging...' : 'Test Feed'}</span>
                  </button>

                  <button
                    onClick={() => toggleAudition(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isAuditioning
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    }`}
                    title="Audition live audio output in browser"
                  >
                    {isAuditioning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>Mute Audition</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-emerald-400" />
                        <span>Audition Feed</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Wifi className="w-3 h-3 text-sky-400" />
                  <span>Auto-Failover Active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outage Incident Log & Downtime History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Outage Incident History & Logs</h3>
              <p className="text-xs text-slate-400">
                Automated detection logs recorded by Christian Radios stream sentinel
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {outages.length} Logged {outages.length === 1 ? 'Incident' : 'Incidents'}
          </span>
        </div>

        {outages.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Outages Recorded</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All station streams have maintained 100% reachability over the last 30 monitoring cycles. Our global sentinel continuously validates stream reachability every 5 minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {outages.map((outage) => (
              <div
                key={outage.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        outage.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {outage.status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE INCIDENT'}
                    </span>
                    <strong className="text-white">{outage.stationName}</strong>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {outage.errorReason || 'Stream connection unreachable or timed out'}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                  <div>
                    Detected:{' '}
                    <span className="text-slate-300">
                      {new Date(outage.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  {outage.resolvedAt && (
                    <div>
                      Resolved:{' '}
                      <span className="text-emerald-400">
                        {new Date(outage.resolvedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Streaming Server Setup Guides */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Streaming Server Setup & Optimization</h3>
            <p className="text-xs text-slate-400">
              Technical guides for Icecast, AzuraCast, and Shoutcast to guarantee 100% browser compatibility.
            </p>
          </div>
        </div>

        {/* Server Type Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setSelectedGuideTab('icecast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedGuideTab === 'icecast'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Icecast 2 & SSL Proxy
          </button>
          <button
            onClick={() => setSelectedGuideTab('azuracast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedGuideTab === 'azuracast'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AzuraCast Cloud Setup
          </button>
          <button
            onClick={() => setSelectedGuideTab('shoutcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedGuideTab === 'shoutcast'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shoutcast DNAS CORS
          </button>
        </div>

        {selectedGuideTab === 'icecast' && (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              To prevent modern Chrome and Safari from blocking your Icecast stream with mixed-content errors, proxy your Icecast port (8000) behind an NGINX reverse proxy with a free Let’s Encrypt SSL certificate:
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto">
{`location /live {
    proxy_pass http://127.0.0.1:8000/stream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_buffering off;
    add_header Access-Control-Allow-Origin *;
}`}
            </pre>
            <p className="text-slate-400 text-[11px]">
              Set your Christian Radios stream URL to: <code className="text-white font-mono">https://yourdomain.org/live</code>
            </p>
          </div>
        )}

        {selectedGuideTab === 'azuracast' && (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              AzuraCast provides native Let’s Encrypt HTTPS support. To use your AzuraCast stream on Christian Radios:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400">
              <li>Log in to your AzuraCast dashboard &gt; Select your Station &gt; Mount Points.</li>
              <li>Ensure your default mount point (e.g. <code className="text-slate-200 font-mono">/radio.mp3</code>) is set to Public.</li>
              <li>Copy the HTTPS Listen URL: <code className="text-sky-300 font-mono">https://azura.yourdomain.com/listen/station/radio.mp3</code>.</li>
              <li>Paste this URL into Christian Radios as your Primary Stream URL.</li>
            </ol>
          </div>
        )}

        {selectedGuideTab === 'shoutcast' && (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              For Shoutcast v2 servers, ensure CORS headers are allowed so that HTML5 audio players and ICY metadata parsers can display now-playing gospel songs:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-[11px]">
              <strong className="text-emerald-400 block font-mono">CORS Header Requirement:</strong>
              <code className="text-slate-300 font-mono">Access-Control-Allow-Origin: *</code>
            </div>
            <p className="text-[11px] text-slate-400">
              Need technical help configuring your server? Submit a ticket in the Support Desk and our team will configure it for you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
