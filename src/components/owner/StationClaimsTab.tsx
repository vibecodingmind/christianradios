import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ExternalLink,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { RadioStationClaim, Station } from '../../types';
import { ClaimStationModal } from '../station/ClaimStationModal';

interface StationClaimsTabProps {
  ownerEmail: string;
  ownerName: string;
  stations: Station[];
}

export const StationClaimsTab: React.FC<StationClaimsTabProps> = ({
  ownerEmail,
  ownerName,
  stations,
}) => {
  const [claims, setClaims] = useState<RadioStationClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<{ id: string; name: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/owner/claims');
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCancelClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to cancel this pending ownership claim?')) return;
    setCancellingId(claimId);
    try {
      const res = await fetch(`/api/owner/claims/${claimId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClaims();
      }
    } catch {
      // Ignore
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: RadioStationClaim['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Transferred
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> In Admin Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Broadcaster Station Claims</h2>
          </div>
          <p className="text-xs text-slate-400">
            Claim ownership of an existing Christian radio station already listed in our global directory.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchClaims}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Claims"
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
        <div className="py-12 px-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Ownership Claims Submitted Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            If your Christian radio station is already streaming on our platform under a generic listing, you can claim ownership to take full management control, view real-time analytics, and receive listener donations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">{claim.stationName}</h3>
                    <span className="text-[11px] text-slate-500 font-mono">ID: {claim.stationId}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Claimed Role: <strong className="text-slate-300">{claim.roleInStation}</strong> • Method: <span className="text-slate-300">{claim.verificationMethod}</span>
                  </p>
                </div>
                <div>{getStatusBadge(claim.status)}</div>
              </div>

              {/* Evidence details */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5">
                <p className="text-slate-400">
                  <strong className="text-slate-300">Submitted Proof:</strong> {claim.evidence}
                </p>
                {claim.evidenceUrls && claim.evidenceUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {claim.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Verification URL {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {claim.adminNotes && (
                  <div className="p-2 mt-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                    <strong className="text-amber-400">Admin Review Notes:</strong> {claim.adminNotes}
                  </div>
                )}
              </div>

              {/* Timestamp & Actions */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Submitted: {new Date(claim.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {(claim.status === 'PENDING' || claim.status === 'UNDER_REVIEW') && (
                  <button
                    onClick={() => handleCancelClaim(claim.id)}
                    disabled={cancellingId === claim.id}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {cancellingId === claim.id ? 'Cancelling...' : 'Cancel Claim'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {selectedStation && (
        <ClaimStationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStation(null);
          }}
          stationId={selectedStation.id}
          stationName={selectedStation.name}
          initialEmail={ownerEmail}
          initialName={ownerName}
          isBroadcasterUser={true}
          onSuccess={fetchClaims}
        />
      )}
    </div>
  );
};
