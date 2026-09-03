import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Mail,
  User,
  Phone,
  FileText,
  Link2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Search,
  Radio,
} from 'lucide-react';
import type { VerificationMethod } from '../../types';

interface ClaimStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId?: string;
  stationName?: string;
  stationSlug?: string;
  initialEmail?: string;
  initialName?: string;
  isBroadcasterUser?: boolean;
  onSuccess?: () => void;
}

const ROLES = [
  'Founder / Ministry Leader',
  'Station Director / CEO',
  'Station Manager',
  'Chief Technical Officer / Sound Engineer',
  'Program Director / Host',
  'Communications / Media Coordinator',
  'Legal Representative',
];

const METHODS: { id: VerificationMethod; label: string; desc: string }[] = [
  { id: 'ADMIN_REVIEW', label: 'Platform Admin Credential Review', desc: 'Manual review by Christian Radios platform compliance team' },
  { id: 'EMAIL_DOMAIN', label: 'Official Station Domain Email', desc: 'Match your login email with the official station website domain' },
  { id: 'WEBSITE_META_TAG', label: 'Website HTML Verification Code', desc: 'Place a verification meta tag or DNS record on your domain' },
  { id: 'DOCUMENT_UPLOAD', label: 'Official Broadcast License / Letter', desc: 'Provide a link or scan of TCRA/FCC broadcast authorization' },
];

export const ClaimStationModal: React.FC<ClaimStationModalProps> = ({
  isOpen,
  onClose,
  stationId: initialStationId,
  stationName: initialStationName,
  stationSlug: initialStationSlug,
  initialEmail = '',
  initialName = '',
  isBroadcasterUser = false,
  onSuccess,
}) => {
  const [selectedStationId, setSelectedStationId] = useState(initialStationId || '');
  const [selectedStationName, setSelectedStationName] = useState(initialStationName || '');
  const [selectedStationSlug, setSelectedStationSlug] = useState(initialStationSlug || '');
  const [claimantName, setClaimantName] = useState(initialName);
  const [claimantEmail, setClaimantEmail] = useState(initialEmail);
  const [claimantPhone, setClaimantPhone] = useState('');
  const [roleInStation, setRoleInStation] = useState(ROLES[0]);
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('ADMIN_REVIEW');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (initialStationId) {
      setSelectedStationId(initialStationId);
      setSelectedStationName(initialStationName || 'Selected Station');
      setSelectedStationSlug(initialStationSlug || '');
    }
  }, [initialStationId, initialStationName, initialStationSlug]);

  const handleSearchStations = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/public/stations?search=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.stations || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) {
      setErrorMsg('Please select a radio station to claim.');
      return;
    }
    if (!claimantName.trim() || !claimantEmail.trim() || !roleInStation || !evidence.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const endpoint = isBroadcasterUser
        ? '/api/owner/claims'
        : `/api/public/stations/${selectedStationSlug || selectedStationId}/claim`;

      const payload = isBroadcasterUser
        ? {
            stationId: selectedStationId,
            roleInStation,
            reason: reason.trim() || 'Ministry leadership claiming official broadcast ownership.',
            evidence: evidence.trim(),
            evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
            verificationMethod,
            phone: claimantPhone.trim(),
          }
        : {
            claimantName: claimantName.trim(),
            claimantEmail: claimantEmail.trim(),
            claimantPhone: claimantPhone.trim(),
            roleInStation,
            reason: reason.trim() || 'Ministry leadership claiming official broadcast ownership.',
            evidence: evidence.trim(),
            evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
            verificationMethod,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ownership claim.');
      }

      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Claim Station Ownership
              </h2>
              <p className="text-xs text-slate-400">
                {selectedStationName
                  ? `Claiming broadcast authority for: ${selectedStationName}`
                  : 'Search and claim an existing radio station listed in our directory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {submittedSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ownership Claim Submitted!</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  Thank you for submitting your verification details for <strong>{selectedStationName}</strong>. Our platform compliance team is reviewing your ministry credentials.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto text-left space-y-1">
                <p className="text-slate-300 font-semibold">What happens next?</p>
                <p>1. Our admin team cross-references your submitted website, email, and ministry authorization.</p>
                <p>2. Once verified, ownership of this station will transfer to your broadcaster dashboard.</p>
                <p>3. You will receive an email confirmation and notification.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 transition cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Station Selection or Search */}
              {selectedStationId ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white">Target Station: {selectedStationName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">ID: {selectedStationId}</p>
                    </div>
                  </div>
                  {!initialStationId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStationId('');
                        setSelectedStationName('');
                        setSelectedStationSlug('');
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                    >
                      Change Station
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-amber-400" /> Search Station in Directory to Claim <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type station name, city, frequency (e.g. Radio Maria, Praise Power)..."
                      value={searchQuery}
                      onChange={(e) => handleSearchStations(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-amber-400" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1 pt-1 divide-y divide-slate-800">
                      {searchResults.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStationId(st.id);
                            setSelectedStationName(st.name);
                            setSelectedStationSlug(st.slug || '');
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="w-full p-2 rounded text-left hover:bg-slate-800/80 flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-white">{st.name}</p>
                              <p className="text-[10px] text-slate-400">{st.city}, {st.countryCode} • {st.genre}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Claimant Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    placeholder="e.g. Pastor David Emmanuel"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Official / Ministry Email <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={claimantEmail}
                    onChange={(e) => setClaimantEmail(e.target.value)}
                    placeholder="e.g. director@gospelradiotz.org"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={claimantPhone}
                    onChange={(e) => setClaimantPhone(e.target.value)}
                    placeholder="e.g. +255 700 000 000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Role in Radio Station <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={roleInStation}
                    onChange={(e) => setRoleInStation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Verification Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Preferred Verification Method</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setVerificationMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        verificationMethod === m.id
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${verificationMethod === m.id ? 'bg-amber-400' : 'bg-slate-600'}`} />
                        {m.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Evidence & Verification Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Proof of Broadcaster Authorization <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Provide verification details (e.g. your name appears on the station contact page, or provide your TCRA/broadcasting license details or station address)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Evidence URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" /> Verification Link (Website Contact Page, Social Bio, or Document Link)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://yourministry.org/contact or https://facebook.com/yourstation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Encrypted & secure platform verification.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Claim...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Submit Ownership Claim
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
