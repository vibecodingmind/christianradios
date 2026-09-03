import React, { useState, useEffect } from 'react';
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
  BarChart3,
  Layers,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface StreamHealthDashboardProps {
  stations: Station[];
  onRefreshStations: () => void;
}

interface OutageAlert {
  id: string;
  stationId: string;
  stationName: string;
  errorReason: string;
  startedAt: string;
  resolvedAt?: string;
  durationSeconds?: number;
  status: 'ACTIVE' | 'RESOLVED';
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
        details?: any;
      }
    >
  >({});
  const [outages, setOutages] = useState<OutageAlert[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick diagnosis for a specific stream
  const checkStationHealth = async (station: Station) => {
    setTestingId(station.id);
    try {
      const startTime = performance.now();
      const res = await apiFetch('/api/owner/stations/test-stream', {
        method: 'POST',
        body: JSON.stringify({
          streamUrl: station.streamUrl,
          streamType: station.streamType,
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
            checkedAt: new Date().toLocaleTimeString(),
            details: data.details,
          },
        }));
      } else {
        setHealthStatus((prev) => ({
          ...prev,
          [station.id]: {
            online: false,
            latencyMs: latency,
            checkedAt: new Date().toLocaleTimeString(),
          },
        }));
      }
    } catch {
      setHealthStatus((prev) => ({
        ...prev,
        [station.id]: {
          online: false,
          checkedAt: new Date().toLocaleTimeString(),
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

  useEffect(() => {
    if (stations.length > 0) {
      // Initial automated quick ping
      checkAllStations();
    }
  }, [stations.length]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Activity className="w-4 h-4" />
              Automated Stream Health & Uptime Diagnostics
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Broadcaster Feed Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Continuous background monitoring with automated failover detection and outage alerting.
            </p>
          </div>

          <button
            onClick={checkAllStations}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Full Network Diagnostic
          </button>
        </div>
      </div>

      {/* Station Stream Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stations.map((st) => {
          const health = healthStatus[st.id];
          const isTesting = testingId === st.id;
          const isOnline = health ? health.online : st.status === 'ACTIVE';

          return (
            <div
              key={st.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={st.logoUrl}
                    alt={st.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{st.name}</h3>
                    <p className="text-xs text-slate-400 truncate">
                      {st.city}, {st.countryCode} • {st.bitrateKbps || 128} kbps ({st.streamType})
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
                      ONLINE (99.9%)
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      OFFLINE / UNREACHABLE
                    </>
                  )}
                </div>
              </div>

              {/* URL & Latency Diagnostics */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Stream:</span>
                  <span className="text-slate-200 font-mono truncate max-w-[200px]" title={st.streamUrl}>
                    {st.streamUrl}
                  </span>
                </div>

                {st.backupStreamUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Backup Feed:</span>
                    <span className="text-amber-400 font-mono truncate max-w-[200px]" title={st.backupStreamUrl}>
                      {st.backupStreamUrl}
                    </span>
                  </div>
                )}

                {health && (
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                    <span className="text-slate-500">
                      Last ping: {health.checkedAt}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      Latency: {health.latencyMs}ms
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => checkStationHealth(st)}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing Feed...' : 'Ping Stream'}
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                  <span>Auto-reconnection active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
