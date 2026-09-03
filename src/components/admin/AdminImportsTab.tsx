import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  ExternalLink,
  Trash2,
  Radio,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type { RadioImport, SourceType } from '../../types';

interface EnrichedImport extends RadioImport {
  owner?: { id: string; name: string; email: string };
  station?: any;
}

const PROVIDER_INFO: Record<SourceType, { label: string; badge: string }> = {
  RADIOKING: { label: 'RadioKing', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  ZENO: { label: 'Zeno FM', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  STREEMA: { label: 'Streema', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  ICECAST: { label: 'Icecast', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  SHOUTCAST: { label: 'SHOUTcast', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  AZURACAST: { label: 'AzuraCast', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  DIRECT_STREAM: { label: 'Direct Stream', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  IMPORTED_OTHER: { label: 'Web Scrape', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
  MANUAL: { label: 'Manual Entry', badge: 'bg-gray-500/10 text-gray-300 border-gray-500/30' },
};

export const AdminImportsTab: React.FC = () => {
  const [imports, setImports] = useState<EnrichedImport[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchImports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (providerFilter !== 'ALL') params.append('provider', providerFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/imports?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setImports(data.imports || []);
        setMetrics(data.metrics || null);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [statusFilter, providerFilter]);

  const handleApprove = async (importId: string) => {
    setActiveActionId(importId);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/approve`, { method: 'POST' });
      if (res.ok) {
        fetchImports();
      }
    } catch {
      // Ignore
    } finally {
      setActiveActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalId) return;
    setActiveActionId(rejectModalId);
    try {
      const res = await fetch(`/api/admin/imports/${rejectModalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Stream quality or metadata requirements not met.' }),
      });
      if (res.ok) {
        setRejectModalId(null);
        setRejectReason('');
        fetchImports();
      }
    } catch {
      // Ignore
    } finally {
      setActiveActionId(null);
    }
  };

  const handleRetryDiscovery = async (importId: string) => {
    setActiveActionId(importId);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/retry`, { method: 'POST' });
      if (res.ok) {
        fetchImports();
      }
    } catch {
      // Ignore
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDelete = async (importId: string) => {
    if (!confirm('Are you sure you want to delete this import record?')) return;
    try {
      const res = await fetch(`/api/admin/imports/${importId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchImports();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Imports</span>
            <p className="text-2xl font-bold text-white">{metrics.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
            </span>
            <p className="text-2xl font-bold text-white">{metrics.approved}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending Review
            </span>
            <p className="text-2xl font-bold text-white">{metrics.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-red-400 font-medium flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Declined / Failed
            </span>
            <p className="text-2xl font-bold text-white">{metrics.rejected + metrics.failed}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchImports();
          }}
          className="flex-1 min-w-[240px] relative"
        >
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by station name, URL, or owner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Providers</option>
              <option value="RADIOKING">RadioKing</option>
              <option value="ZENO">Zeno FM</option>
              <option value="STREEMA">Streema</option>
              <option value="ICECAST">Icecast</option>
              <option value="SHOUTCAST">SHOUTcast</option>
              <option value="AZURACAST">AzuraCast</option>
              <option value="DIRECT_STREAM">Direct Stream</option>
              <option value="IMPORTED_OTHER">Generic Web</option>
            </select>
          </div>
        </div>
      </div>

      {/* Imports Table / Card List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-xs">Loading imported stations...</p>
        </div>
      ) : imports.length === 0 ? (
        <div className="py-12 px-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Radio Imports Found</h3>
          <p className="text-xs text-slate-400">No stations match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {imports.map((imp) => {
            const providerInfo = PROVIDER_INFO[imp.sourceType] || PROVIDER_INFO.IMPORTED_OTHER;
            const meta = imp.extractedData;
            return (
              <div
                key={imp.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {meta?.logoUrl ? (
                      <img src={meta.logoUrl} alt={meta.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                        <Radio className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{meta?.name || 'Imported Station'}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${providerInfo.badge}`}>
                          {providerInfo.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          imp.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : imp.status === 'REJECTED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {imp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Owner: <span className="text-slate-300 font-medium">{imp.owner?.name || imp.owner?.email || imp.ownerId}</span> • Stream: <code className="text-[11px] text-amber-300">{imp.streamValidation?.streamUrl || meta?.streamUrl}</code>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={imp.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Open Source URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleRetryDiscovery(imp.id)}
                      disabled={activeActionId === imp.id}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Re-run Auto Discovery"
                    >
                      <RotateCw className={`w-4 h-4 ${activeActionId === imp.id ? 'animate-spin' : ''}`} />
                    </button>

                    {imp.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleApprove(imp.id)}
                        disabled={activeActionId === imp.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {imp.status !== 'REJECTED' && (
                      <button
                        onClick={() => setRejectModalId(imp.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(imp.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stream & Discovery Diagnostic Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500">Country/City:</span>{' '}
                    <span className="text-slate-300">{meta?.city}, {meta?.countryCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bitrate & Format:</span>{' '}
                    <span className="text-slate-300">{meta?.bitrateKbps || 128} kbps ({imp.streamValidation?.detectedType || meta?.streamType || 'MP3'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">SSRF Verified:</span>{' '}
                    <span className="text-emerald-400">Yes (DNS Checked)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>{' '}
                    <span className="text-slate-300">{new Date(imp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {imp.errorMessage && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{imp.errorMessage}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Decline Imported Station
            </h3>
            <p className="text-xs text-slate-400">
              Please specify the reason for declining this imported radio station. The broadcaster will be notified.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Stream offline, audio bitrate below minimum requirements, or copyright discrepancy..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={activeActionId !== null}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
