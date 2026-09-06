import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ExternalLink,
  Trash2,
  RefreshCw,
  Loader2,
  Radio,
  PlusCircle,
  MessageSquare,
  Send,
  ArrowRight,
  X,
} from 'lucide-react';
import type { RadioStationClaim, Station } from '../../types';
import { ClaimStationModal } from '../station/ClaimStationModal';
import { apiFetch } from '../../lib/api';

interface StationClaimsTabProps {
  ownerEmail: string;
  ownerName: string;
  stations: Station[];
  onNavigateTab?: (tab: string) => void;
  onStationClaimed?: () => void;
}

type ClaimStatusFilter = 'ALL' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export const StationClaimsTab: React.FC<StationClaimsTabProps> = ({
  ownerEmail,
  ownerName,
  onNavigateTab,
  onStationClaimed,
}) => {
  const [claims, setClaims] = useState<RadioStationClaim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<{ id: string; name: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ClaimStatusFilter>('ALL');

  // Follow-up modal state
  const [followUpClaim, setFollowUpClaim] = useState<RadioStationClaim | null>(null);
  const [followUpSubject, setFollowUpSubject] = useState('');
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  // Fetch Submitted Claims
  const fetchClaims = async () => {
    setIsLoadingClaims(true);
    try {
      const res = await apiFetch('/api/owner/claims');
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  // Cancel a pending/under-review claim
  const handleCancelClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to cancel this pending ownership claim request?')) return;
    setCancellingId(claimId);
    try {
      const res = await apiFetch(`/api/owner/claims/${claimId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchClaims();
        if (onStationClaimed) onStationClaimed();
      }
    } catch {
      // Ignore
    } finally {
      setCancellingId(null);
    }
  };

  // Permanently delete a cancelled or rejected claim record
  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to permanently remove this claim from your history?')) return;
    setDeletingId(claimId);
    try {
      const res = await apiFetch(`/api/owner/claims/${claimId}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        await fetchClaims();
        if (onStationClaimed) onStationClaimed();
      }
    } catch {
      // Ignore
    } finally {
      setDeletingId(null);
    }
  };

  // Open follow-up modal for a claim
  const handleOpenFollowUp = (claim: RadioStationClaim) => {
    setFollowUpClaim(claim);
    setFollowUpSubject(`Follow-up on Claim #${claim.id.slice(-6)}: ${claim.stationName}`);
    setFollowUpMessage(
      `Hello Christian Radios Support,\n\nI am writing to inquire about the status of my claim for ${claim.stationName} (Claim ID: ${claim.id}).\n\nPlease let me know if any additional broadcast documentation or verification details are needed.\n\nThank you!`
    );
    setFollowUpSuccess(false);
    setFollowUpError(null);
  };

  // Submit follow-up inquiry as a support ticket
  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpClaim || !followUpSubject.trim() || !followUpMessage.trim()) return;

    setIsSendingFollowUp(true);
    setFollowUpError(null);
    try {
      const res = await apiFetch('/api/owner/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: followUpSubject.trim(),
          category: 'Station Ownership & Claims',
          message: followUpMessage.trim(),
          priority: 'HIGH',
        }),
      });

      if (res.ok) {
        setFollowUpSuccess(true);
        setTimeout(() => {
          setFollowUpClaim(null);
        }, 1800);
      } else {
        const data = await res.json();
        setFollowUpError(data.error || 'Failed to submit follow-up inquiry.');
      }
    } catch {
      setFollowUpError('Failed to send follow-up inquiry. Please try again.');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const getStatusBadge = (status: RadioStationClaim['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Transferred
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> In Admin Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
          </span>
        );
    }
  };

  // Filter claims
  const filteredClaims = claims.filter((claim) => {
    if (filterStatus === 'ALL') return true;
    return claim.status === filterStatus;
  });

  const countPending = claims.filter((c) => c.status === 'PENDING').length;
  const countReview = claims.filter((c) => c.status === 'UNDER_REVIEW').length;
  const countApproved = claims.filter((c) => c.status === 'APPROVED').length;
  const countRejected = claims.filter((c) => c.status === 'REJECTED').length;
  const countCancelled = claims.filter((c) => c.status === 'CANCELLED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Station Claims & Verification</h2>
          </div>
          <p className="text-xs text-slate-400">
            View all your claimed radio stations, monitor verification statuses, manage active requests, or claim a station already in the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchClaims}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-800 shadow-sm"
            title="Refresh Claims List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClaims ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setSelectedStation(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Claim a Station
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoadingClaims ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs font-semibold">Loading your claimed radio stations...</p>
        </div>
      ) : claims.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-5 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Radio className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">No Claimed Radio Stations Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Is your Christian radio station already indexed on our platform? Submit an official ownership claim to manage your stream, view analytics, and engage listeners.
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                setSelectedStation(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Claim a Station Now
            </button>
          </div>
        </div>
      ) : (
        /* Claims List View */
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Claims <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{claims.length}</span>
            </button>
            {countPending > 0 && (
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-amber-400 hover:text-white border border-slate-800'
                }`}
              >
                Pending <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{countPending}</span>
              </button>
            )}
            {countReview > 0 && (
              <button
                onClick={() => setFilterStatus('UNDER_REVIEW')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'UNDER_REVIEW'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-sky-400 hover:text-white border border-slate-800'
                }`}
              >
                In Review <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{countReview}</span>
              </button>
            )}
            {countApproved > 0 && (
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'APPROVED'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
                }`}
              >
                Approved <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{countApproved}</span>
              </button>
            )}
            {countRejected > 0 && (
              <button
                onClick={() => setFilterStatus('REJECTED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'REJECTED'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-900 text-red-400 hover:text-white border border-slate-800'
                }`}
              >
                Declined <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{countRejected}</span>
              </button>
            )}
            {countCancelled > 0 && (
              <button
                onClick={() => setFilterStatus('CANCELLED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'CANCELLED'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Cancelled <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{countCancelled}</span>
              </button>
            )}
          </div>

          {/* Filtered empty state */}
          {filteredClaims.length === 0 ? (
            <div className="py-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">No station claims found in this category.</p>
              <button
                onClick={() => setFilterStatus('ALL')}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
              >
                Show all claims
              </button>
            </div>
          ) : (
            /* Cards List */
            <div className="space-y-3.5">
              {filteredClaims.map((claim) => {
                const isPendingOrReview = claim.status === 'PENDING' || claim.status === 'UNDER_REVIEW';
                const isCancelledOrRejected = claim.status === 'CANCELLED' || claim.status === 'REJECTED';
                const isApproved = claim.status === 'APPROVED';

                return (
                  <div
                    key={claim.id}
                    className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-slate-700/90 transition shadow-sm"
                  >
                    {/* Top Row: Station info & status badge */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{claim.stationName}</h4>
                            <p className="text-[11px] text-slate-500 font-mono">Claim ID: {claim.id}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 pt-1">
                          Role: <strong className="text-slate-300">{claim.roleInStation}</strong> • Verification Method:{' '}
                          <span className="text-slate-300">{claim.verificationMethod.replace(/_/g, ' ')}</span>
                        </p>
                      </div>
                      <div>{getStatusBadge(claim.status)}</div>
                    </div>

                    {/* Evidence & Details Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2">
                      <div>
                        <span className="text-slate-400 font-semibold">Submitted Proof / Reason:</span>
                        <p className="text-slate-300 mt-0.5 whitespace-pre-wrap">{claim.evidence || claim.reason}</p>
                      </div>

                      {claim.evidenceUrls && claim.evidenceUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/60">
                          {claim.evidenceUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> Verification URL {i + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      {claim.adminNotes && (
                        <div className="p-3 mt-2 rounded-xl bg-slate-900 border border-amber-500/20 text-[11px] text-slate-300 space-y-1">
                          <strong className="text-amber-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Platform Admin Review Feedback:
                          </strong>
                          <p>{claim.adminNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Timestamps & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs">
                      <span className="text-[11px] text-slate-500">
                        Submitted on:{' '}
                        {new Date(claim.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Follow Up Button (Always helpful for any inquiries) */}
                        <button
                          onClick={() => handleOpenFollowUp(claim)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700/80"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Follow Up
                        </button>

                        {/* Approved: Quick Jump to Stations */}
                        {isApproved && onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('stations')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-500/30"
                          >
                            <span>Manage in My Stations</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Pending / Under Review: Option to Cancel Request */}
                        {isPendingOrReview && (
                          <button
                            onClick={() => handleCancelClaim(claim.id)}
                            disabled={cancellingId === claim.id}
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-red-500/30"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {cancellingId === claim.id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        )}

                        {/* Cancelled / Rejected: Option to Delete Record or Re-claim */}
                        {isCancelledOrRejected && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedStation({ id: claim.stationId, name: claim.stationName });
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-amber-500/30"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Re-claim
                            </button>
                            <button
                              onClick={() => handleDeleteClaim(claim.id)}
                              disabled={deletingId === claim.id}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700 hover:border-red-500/30"
                              title="Permanently remove claim record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deletingId === claim.id ? 'Deleting...' : 'Delete Record'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Follow Up Modal */}
      {followUpClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Follow Up on Station Claim</h3>
                  <p className="text-xs text-slate-400">{followUpClaim.stationName}</p>
                </div>
              </div>
              <button
                onClick={() => setFollowUpClaim(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {followUpSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white">Follow-up Inquiry Sent!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your inquiry has been delivered directly to platform administrators. We will update your claim or reply shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFollowUp} className="space-y-3.5">
                {followUpError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{followUpError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Subject</label>
                  <input
                    type="text"
                    required
                    value={followUpSubject}
                    onChange={(e) => setFollowUpSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Inquiry Message</label>
                  <textarea
                    rows={4}
                    required
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                    placeholder="Enter your message or update for platform compliance..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setFollowUpClaim(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingFollowUp}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingFollowUp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Follow-up</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      <ClaimStationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStation(null);
        }}
        stationId={selectedStation?.id}
        stationName={selectedStation?.name}
        initialEmail={ownerEmail}
        initialName={ownerName}
        isBroadcasterUser={true}
        onSuccess={() => {
          fetchClaims();
          if (onStationClaimed) onStationClaimed();
        }}
      />
    </div>
  );
};

