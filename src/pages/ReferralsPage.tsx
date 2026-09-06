import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Coins,
  ArrowUpRight,
  Users,
  Award,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { Referral, ReferralCommission } from '../types';
import { PayoutRequestModal } from '../components/payout/PayoutRequestModal';

interface FinancialSummary {
  grossEarnings: number;
  totalDonations: number;
  totalPremiumShare: number;
  totalCommissions: number;
  totalWithdrawn: number;
  availableBalance: number;
}

export function ReferralsPage({
  onNavigate,
  onOpenAuth,
}: {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralsCount, setReferralsCount] = useState(0);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [financial, setFinancial] = useState<FinancialSummary>({
    grossEarnings: 0,
    totalDonations: 0,
    totalPremiumShare: 0,
    totalCommissions: 0,
    totalWithdrawn: 0,
    availableBalance: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);

  // Withdrawal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const endpoint = user.role === 'RADIO_OWNER' ? '/api/owner/referrals' : '/api/listener/referrals';
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode || '');
        setReferralLink(data.referralLink || window.location.origin + '?ref=' + (data.referralCode || ''));
        setReferralsCount(data.referralsCount || 0);
        setQualifiedCount(data.qualifiedCount || 0);
        setFinancial(data.financialSummary || { grossEarnings: 0, totalDonations: 0, totalPremiumShare: 0, totalCommissions: 0, totalWithdrawn: 0, availableBalance: 0 });
        setReferrals(data.referrals || []);
        setCommissions(data.commissions || []);
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-slate-400">Please sign in to access your referral link and earnings dashboard.</p>
        <button
          onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('home'))}
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <Coins className="w-3.5 h-3.5" /> Christian Radios Referral Program
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Share the Gospel & <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">Earn Kingdom Commissions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Invite radio broadcasters or fellow listeners to Christian Radios. Earn up to 10% commission on every qualifying paid subscription or premium stream!
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            TZS {financial.availableBalance.toLocaleString()}
          </p>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            disabled={financial.availableBalance < 20000}
            className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-4 h-4" /> Request Payout
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Commissions Earned</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">
            TZS {financial.totalCommissions.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">100% Immutable Ledger</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Invited Members</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{referralsCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">{qualifiedCount} Qualified Paying</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Withdrawn</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-200">
            TZS {financial.totalWithdrawn.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Verified Payouts</span>
        </div>
      </div>

      {/* Referral Link & Social Sharing Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400" /> Your Personal Referral Link
          </h3>
          <p className="text-xs text-slate-400">
            Share this link via WhatsApp, Email, or Social Media. Anyone who registers using your link is linked to your referral account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-mono text-sky-300 truncate select-all">
            {referralLink || 'Loading referral link...'}
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-2 shrink-0 transition shadow-lg"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Link
              </>
            )}
          </button>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="pt-2 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400">Quick Share:</span>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Listen to live Christian Radios worldwide or publish your station! ${referralLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent('Join Christian Radios Platform')}&body=${encodeURIComponent(`Check out Christian Radios: ${referralLink}`)}`}
            className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Mail className="w-4 h-4" /> Email
          </a>
        </div>
      </div>

      {/* Commissions History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Commission Activity Ledger
          </h3>
          <span className="text-xs font-semibold text-slate-400">{commissions.length} Entries</span>
        </div>

        {commissions.length === 0 ? (
          <div className="py-12 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-400">No referral commissions recorded yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Share your link with radio station owners or listeners. Commissions generate automatically upon qualifying paid subscriptions!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <th className="py-3 px-4">Payment Type</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Commission Earned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {c.paymentType === 'OWNER_SUBSCRIPTION' ? 'Broadcaster Plan' : 'Premium Radio Subscription'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      TZS {c.grossAmountTzs.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-sky-400 font-bold">
                      {c.commissionPercentage}%
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-300">
                      + TZS {c.commissionAmountTzs.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> SETTLED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Withdrawal Modal */}
      {/* Unified Payout Request Modal */}
      <PayoutRequestModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        userRole={user.role}
        availableBalance={financial.availableBalance}
        currency="TZS"
        onSuccess={() => {
          loadReferralData();
        }}
      />
    </div>
  );
}
