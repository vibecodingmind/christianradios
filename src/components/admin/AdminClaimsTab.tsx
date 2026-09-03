import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { RadioStationClaim } from '../../types';

interface EnrichedClaim extends RadioStationClaim {
  station?: any;
  claimant?: any;
  currentOwner?: any;
}

export const AdminClaimsTab: React.FC = () => {
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [reviewModalClaim, setReviewModalClaim] = useState<EnrichedClaim | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectModalClaim, setRejectModalClaim] = useState<EnrichedClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/claims?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims || []);
        setMetrics(data.metrics || null);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleMarkUnderReview = async (claimId: string) => {
    setActiveClaimId(claimId);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Claim credentials currently under verification by platform admin.' }),
      });
      if (res.ok) {
        fetchClaims();
      }
    } catch {
      // Ignore
    } finally {
      setActiveClaimId(null);
    }
  };

  const handleApproveClaim = async (claim: EnrichedClaim) => {
    if (!confirm(`Are you sure you want to APPROVE ownership transfer of "${claim.stationName}" to ${claim.claimantName} (${claim.claimantEmail})?`)) {
      return;
    }
    setActiveClaimId(claim.id);
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        setReviewModalClaim(null);
        setAdminNotes('');
        fetchClaims();
      }
    } catch {
      // Ignore
    } finally {
      setActiveClaimId(null);
    }
  };

  const handleRejectClaim = async () => {
    if (!rejectModalClaim) return;
    setActiveClaimId(rejectModalClaim.id);
    try {
      const res = await fetch(`/api/admin/claims/${rejectModalClaim.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Submitted documentation was insufficient to establish official broadcasting ownership.' }),
      });
      if (res.ok) {
        setRejectModalClaim(null);
        setRejectReason('');
        fetchClaims();
      }
    } catch {
      // Ignore
    } finally {
      setActiveClaimId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Claims</span>
            <p className="text-2xl font-bold text-white">{metrics.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </span>
            <p className="text-2xl font-bold text-white">{metrics.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Under Review
            </span>
            <p className="text-2xl font-bold text-white">{metrics.underReview}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved / Transferred
            </span>
            <p className="text-2xl font-bold text-white">{metrics.approved}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchClaims();
          }}
          className="flex-1 min-w-[240px] relative"
        >
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by station, claimant name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Declined</option>
            </select>
          </div>

          <button
            onClick={fetchClaims}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-xs">Loading station claims...</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="py-12 px-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Ownership Claims Found</h3>
          <p className="text-xs text-slate-400">No ownership claims match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-base font-bold text-white">{claim.stationName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      ID: {claim.stationId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      claim.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : claim.status === 'UNDER_REVIEW'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : claim.status === 'REJECTED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Claimant: <strong className="text-white">{claim.claimantName}</strong> ({claim.claimantEmail}) • Role: <strong className="text-amber-300">{claim.roleInStation}</strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {claim.status === 'PENDING' && (
                    <button
                      onClick={() => handleMarkUnderReview(claim.id)}
                      disabled={activeClaimId === claim.id}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition"
                    >
                      Mark Under Review
                    </button>
                  )}

                  {claim.status !== 'APPROVED' && (
                    <button
                      onClick={() => {
                        setReviewModalClaim(claim);
                        setAdminNotes(claim.adminNotes || '');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Transfer
                    </button>
                  )}

                  {claim.status !== 'REJECTED' && (
                    <button
                      onClick={() => setRejectModalClaim(claim)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </button>
                  )}
                </div>
              </div>

              {/* Evidence & Details Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Verification Method:</span>
                    <span className="text-slate-300">{claim.verificationMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Phone / WhatsApp:</span>
                    <span className="text-slate-300">{claim.claimantPhone || 'Not provided'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Proof of Ministry Authority:</span>
                  <p className="text-slate-300 leading-relaxed">{claim.evidence}</p>
                </div>

                {claim.evidenceUrls && claim.evidenceUrls.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-1">Attached Verification URLs:</span>
                    <div className="flex flex-wrap gap-2">
                      {claim.evidenceUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {claim.adminNotes && (
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 mt-2">
                    <strong className="text-amber-400">Admin Notes:</strong> {claim.adminNotes}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Submitted: {new Date(claim.createdAt).toLocaleString()}</span>
                {claim.reviewedBy && <span>Reviewed by: {claim.reviewedBy}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {reviewModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Confirm Ownership Transfer
            </h3>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <p className="text-slate-400">
                Target Station: <strong className="text-white">{reviewModalClaim.stationName}</strong>
              </p>
              <p className="text-slate-400">
                New Owner: <strong className="text-white">{reviewModalClaim.claimantName}</strong> ({reviewModalClaim.claimantEmail})
              </p>
              <p className="text-slate-400">
                Official Role: <strong className="text-amber-300">{reviewModalClaim.roleInStation}</strong>
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Admin Approval Notes (Optional)</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified official domain email and TCRA broadcast certificate match."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalClaim(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveClaim(reviewModalClaim)}
                disabled={activeClaimId !== null}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Decline Ownership Claim
            </h3>
            <p className="text-xs text-slate-400">
              Please enter the reason for declining this claim for <strong>{rejectModalClaim.stationName}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Email domain does not match station website, or ministry authorization letter not provided..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalClaim(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectClaim}
                disabled={activeClaimId !== null}
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
