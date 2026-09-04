import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Search,
  Filter,
  Radio,
  FileCheck,
  History,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function AdminVerificationCenter() {
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'kyc' | 'stations' | 'audit'>('metrics');

  // Metrics
  const [metrics, setMetrics] = useState<{
    pendingKYC: number;
    approvedOwners: number;
    pendingStations: number;
    approvedStations: number;
    rejectedApplications: number;
    suspendedAccounts: number;
    totalAuditLogs: number;
  }>({
    pendingKYC: 0,
    approvedOwners: 0,
    pendingStations: 0,
    approvedStations: 0,
    rejectedApplications: 0,
    suspendedAccounts: 0,
    totalAuditLogs: 0,
  });

  // KYC Applications List
  const [kycApps, setKycApps] = useState<any[]>([]);
  const [kycFilterStatus, setKycFilterStatus] = useState<string>('');
  const [kycSearch, setKycSearch] = useState<string>('');
  const [kycLoading, setKycLoading] = useState(false);

  // Selected Application Review Modal/Drawer
  const [selectedKycApp, setSelectedKycApp] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Station Applications List
  const [stationApps, setStationApps] = useState<any[]>([]);
  const [stationFilterStatus, setStationFilterStatus] = useState<string>('');
  const [stationSearch, setStationSearch] = useState<string>('');
  const [stationLoading, setStationLoading] = useState(false);
  const [selectedStationApp, setSelectedStationApp] = useState<any | null>(null);

  // Document Inspection Viewer Overlay
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  // Audit Trail Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Load Metrics
  const loadMetrics = async () => {
    try {
      const res = await apiFetch('/api/admin/verification/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {}
  };

  // Load KYC Applications
  const loadKYCApplications = async () => {
    setKycLoading(true);
    try {
      const query = new URLSearchParams();
      if (kycFilterStatus) query.set('status', kycFilterStatus);
      if (kycSearch) query.set('search', kycSearch);

      const res = await apiFetch(`/api/admin/verification/kyc-applications?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKycApps(data.applications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setKycLoading(false);
    }
  };

  // Load Station Applications
  const loadStationApplications = async () => {
    setStationLoading(true);
    try {
      const query = new URLSearchParams();
      if (stationFilterStatus) query.set('status', stationFilterStatus);
      if (stationSearch) query.set('search', stationSearch);

      const res = await apiFetch(`/api/admin/verification/station-applications?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStationApps(data.applications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStationLoading(false);
    }
  };

  // Load Audit Trail
  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await apiFetch('/api/admin/verification/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {}
    finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadKYCApplications();
    loadStationApplications();
    loadAuditLogs();
  }, [kycFilterStatus, kycSearch, stationFilterStatus, stationSearch]);

  const handleKycAction = async (action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'SUSPEND') => {
    if (!selectedKycApp) return;

    if ((action === 'REQUEST_CHANGES' || action === 'REJECT') && !actionReason.trim()) {
      alert(`Please provide a reason for ${action === 'REJECT' ? 'rejection' : 'requesting changes'}.`);
      return;
    }

    setProcessingAction(true);
    try {
      const res = await apiFetch(`/api/admin/verification/kyc-applications/${selectedKycApp.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: actionReason,
          adminNotes,
        }),
      });

      if (res.ok) {
        setSelectedKycApp(null);
        setActionReason('');
        setAdminNotes('');
        await loadMetrics();
        await loadKYCApplications();
        await loadAuditLogs();
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch {
      alert('Error communicating with backend server.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDocumentAction = async (docId: string, action: 'VERIFY' | 'INVALID' | 'REQUEST_REPLACEMENT') => {
    try {
      const res = await apiFetch(`/api/admin/verification/documents/${docId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        if (selectedKycApp) {
          const updatedRes = await apiFetch(`/api/admin/verification/kyc-applications/${selectedKycApp.id}`);
          if (updatedRes.ok) {
            const updatedData = await updatedRes.json();
            setSelectedKycApp(updatedData.application);
          }
        }
        await loadKYCApplications();
      }
    } catch {}
  };

  const handleStationAction = async (action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'SUSPEND') => {
    if (!selectedStationApp) return;

    if ((action === 'REQUEST_CHANGES' || action === 'REJECT') && !actionReason.trim()) {
      alert(`Please provide a reason for ${action === 'REJECT' ? 'rejection' : 'requesting changes'}.`);
      return;
    }

    setProcessingAction(true);
    try {
      const res = await apiFetch(`/api/admin/verification/station-applications/${selectedStationApp.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: actionReason,
          adminNotes,
        }),
      });

      if (res.ok) {
        setSelectedStationApp(null);
        setActionReason('');
        setAdminNotes('');
        await loadMetrics();
        await loadStationApplications();
        await loadAuditLogs();
      } else {
        const err = await res.json();
        alert(err.error || 'Station action failed');
      }
    } catch {
      alert('Error updating station application.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleVerifyLicence = async (stationId: string, licenceVerificationStatus: string) => {
    try {
      const res = await apiFetch(`/api/admin/verification/stations/${stationId}/verify-licence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenceVerificationStatus }),
      });

      if (res.ok) {
        await loadStationApplications();
        await loadAuditLogs();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            <ShieldCheck className="w-4 h-4" />
            Verification & Compliance Center
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Admin Radio Verification Hub</h2>
          <p className="text-xs text-slate-300">
            Review Radio Owner KYC applications, inspect authorization documents, approve station broadcasting permits, and audit decisions.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0 flex-wrap">
          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'metrics' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveSubTab('kyc')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'kyc' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Owner KYC ({metrics.pendingKYC})
          </button>
          <button
            onClick={() => setActiveSubTab('stations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'stations' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stations ({metrics.pendingStations})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'audit' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* VIEW 1: METRICS OVERVIEW */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Pending KYC Review</span>
              <div className="text-3xl font-black text-white">{metrics.pendingKYC}</div>
              <span className="text-[11px] text-slate-400">Owners awaiting review</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Approved Owners</span>
              <div className="text-3xl font-black text-emerald-400">{metrics.approvedOwners}</div>
              <span className="text-[11px] text-slate-400">Verified radio owners</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">Pending Stations</span>
              <div className="text-3xl font-black text-sky-400">{metrics.pendingStations}</div>
              <span className="text-[11px] text-slate-400">Station permits to review</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">Verified Stations</span>
              <div className="text-3xl font-black text-white">{metrics.approvedStations}</div>
              <span className="text-[11px] text-slate-400">Publicly active & verified</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: OWNER KYC APPLICATIONS */}
      {activeSubTab === 'kyc' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter / Search Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="Search owner name, organization, email, country..."
                value={kycSearch}
                onChange={(e) => setKycSearch(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              <select
                value={kycFilterStatus}
                onChange={(e) => setKycFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 rounded-xl focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CHANGES_REQUIRED">Changes Required</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Applications Table / Cards */}
          {kycLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <span>Loading KYC Applications...</span>
            </div>
          ) : kycApps.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/40 rounded-3xl border border-slate-800">
              No KYC applications matching the filter.
            </div>
          ) : (
            <div className="space-y-3">
              {kycApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {app.verificationType === 'INDIVIDUAL' ? (
                        <UserCheck className="w-6 h-6 text-sky-400" />
                      ) : (
                        <Building2 className="w-6 h-6 text-purple-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white">
                          {app.verificationType === 'INDIVIDUAL' ? app.fullName : app.organizationName}
                        </strong>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {app.verificationType}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : app.status === 'CHANGES_REQUIRED'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-3">
                        <span>Email: <strong className="text-slate-200">{app.email}</strong></span>
                        <span>Phone: <strong className="text-slate-200">{app.phone}</strong></span>
                        <span>Country: <strong className="text-slate-200">{app.country}</strong></span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedKycApp(app)}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Application</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: STATION APPLICATIONS */}
      {activeSubTab === 'stations' && (
        <div className="space-y-6 animate-fadeIn">
          {stationLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <span>Loading Station Applications...</span>
            </div>
          ) : stationApps.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/40 rounded-3xl border border-slate-800">
              No station verification applications pending.
            </div>
          ) : (
            <div className="space-y-3">
              {stationApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Radio className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white">{app.stationName}</strong>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : app.status === 'SUBMITTED'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Owner: <strong className="text-slate-200">{app.ownerName}</strong> ({app.ownerEmail}) • Status: {app.ownerVerificationStatus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStationAction('APPROVE')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Station
                    </button>

                    <button
                      onClick={() => handleVerifyLicence(app.stationId, 'VERIFIED')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-bold text-xs transition"
                      title="Verify Licence Document"
                    >
                      Verify Licence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: AUDIT TRAIL LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              Verification Audit Log History
            </h3>

            {auditLoading ? (
              <div className="py-10 text-center text-slate-400 text-xs">Loading audit trail logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">No verification audit logs recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-400 uppercase text-[10px] bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                          {log.action}
                        </span>
                        <strong className="text-white font-semibold">{log.actorName}</strong>
                        <span className="text-slate-500">({log.actorRole})</span>
                      </div>
                      {log.reason && <p className="text-[11px] text-slate-400 italic">"{log.reason}"</p>}
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELECTED KYC APPLICATION REVIEW MODAL */}
      {selectedKycApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Review KYC Application</h3>
                <p className="text-xs text-slate-400">ID: {selectedKycApp.id}</p>
              </div>
              <button onClick={() => setSelectedKycApp(null)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Preview Row */}
            {selectedKycApp.documents && selectedKycApp.documents.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Uploaded Documents:</span>
                <div className="space-y-2">
                  {selectedKycApp.documents.map((doc: any) => (
                    <div key={doc.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <span className="font-semibold text-white">{doc.fileName}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{doc.documentType}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/admin/verification/documents/${doc.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>
                        <button
                          onClick={() => handleDocumentAction(doc.id, 'VERIFY')}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-300">Reason / Internal Explanation (Mandatory for Rejection or Requesting Changes):</label>
              <textarea
                rows={2}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Please re-upload a clearer high-resolution scan of your national identity card."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleKycAction('REQUEST_CHANGES')}
                  disabled={processingAction}
                  className="px-4 py-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-xs"
                >
                  Request Changes
                </button>

                <button
                  onClick={() => handleKycAction('REJECT')}
                  disabled={processingAction}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs"
                >
                  Reject Application
                </button>

                <button
                  onClick={() => handleKycAction('APPROVE')}
                  disabled={processingAction}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
                >
                  Approve Owner KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
