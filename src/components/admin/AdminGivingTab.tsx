import React, { useState, useEffect } from 'react';
import {
  Heart,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  ArrowUpRight,
  ShieldCheck,
  XCircle,
  Edit3,
  Sliders,
  Users,
  EyeOff,
  Building2,
  Smartphone,
  Globe,
  Wallet,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Donation, DonationCampaign, WithdrawalRequest } from '../../types';

export function AdminGivingTab() {
  const [subTab, setSubTab] = useState<'payouts' | 'donations' | 'campaigns' | 'settings'>('payouts');
  const [loading, setLoading] = useState(true);

  // Overview stats
  const [stats, setStats] = useState<{
    totalDonationsCount: number;
    totalGrossDonations: number;
    totalPlatformFeesRevenue: number;
    totalNetBroadcasterEarnings: number;
    totalDisbursedPayouts: number;
    totalPendingPayouts: number;
    activeCampaignsCount: number;
    pendingWithdrawalsCount: number;
  }>({
    totalDonationsCount: 0,
    totalGrossDonations: 0,
    totalPlatformFeesRevenue: 0,
    totalNetBroadcasterEarnings: 0,
    totalDisbursedPayouts: 0,
    totalPendingPayouts: 0,
    activeCampaignsCount: 0,
    pendingWithdrawalsCount: 0,
  });

  const [topStations, setTopStations] = useState<Array<{ stationName: string; gross: number; count: number }>>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);

  // Settings State
  const [givingSettings, setGivingSettings] = useState({
    givingEnabled: true,
    donationFeePercentage: 5.0,
    donationFixedFee: 0,
    minWithdrawalAmount: 20000,
    withdrawalFeePercentage: 1.0,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Status Filter for Withdrawals
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('ALL');

  // Withdrawal Processing Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [newStatus, setNewStatus] = useState<string>('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isUpdatingWithdrawal, setIsUpdatingWithdrawal] = useState(false);

  // Donation Refund Modal
  const [selectedDonationForRefund, setSelectedDonationForRefund] = useState<Donation | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Donations search query
  const [donationSearch, setDonationSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewRes, withdrawalsRes, donationsRes, campaignsRes] = await Promise.all([
        apiFetch('/api/admin/giving/overview').then((r) => r.json()).catch(() => null),
        apiFetch('/api/admin/giving/withdrawals').then((r) => r.json()).catch(() => ({ withdrawals: [] })),
        apiFetch('/api/admin/giving/donations').then((r) => r.json()).catch(() => ({ donations: [] })),
        apiFetch('/api/admin/giving/campaigns').then((r) => r.json()).catch(() => ({ campaigns: [] })),
      ]);

      if (overviewRes?.stats) {
        setStats(overviewRes.stats);
      }
      if (overviewRes?.topStations) {
        setTopStations(overviewRes.topStations);
      }
      if (overviewRes?.settings) {
        setGivingSettings(overviewRes.settings);
      }

      setWithdrawals(withdrawalsRes?.withdrawals || []);
      setDonations(donationsRes?.donations || []);
      setCampaigns(campaignsRes?.campaigns || []);
    } catch (err) {
      console.error('Failed to load admin giving data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateWithdrawalStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    setIsUpdatingWithdrawal(true);

    try {
      const res = await apiFetch(`/api/admin/giving/withdrawals/${selectedWithdrawal.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          transactionReference: transactionRef,
        }),
      });

      if (!res.ok) throw new Error('Failed to update withdrawal status.');

      setSelectedWithdrawal(null);
      setAdminNotes('');
      setTransactionRef('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingWithdrawal(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonationForRefund) return;
    setIsRefunding(true);

    try {
      const res = await apiFetch(`/api/admin/giving/donations/${selectedDonationForRefund.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });

      if (!res.ok) throw new Error('Failed to refund donation.');

      setSelectedDonationForRefund(null);
      setRefundReason('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleUpdateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      await apiFetch(`/api/admin/giving/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err) {
      console.error('Failed to update campaign status:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);

    try {
      const res = await apiFetch('/api/admin/giving/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(givingSettings),
      });

      if (res.ok) {
        setSettingsSaveSuccess(true);
        setTimeout(() => setSettingsSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalStatusFilter === 'ALL') return true;
    return w.status === withdrawalStatusFilter;
  });

  const filteredDonations = donations.filter((d) => {
    const q = donationSearch.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      (d.trackingId && d.trackingId.toLowerCase().includes(q)) ||
      (d.stationName && d.stationName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP METRIC SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            Total Gross Donations
          </span>
          <div className="text-2xl font-black text-white">
            ${Number(stats.totalGrossDonations || 0).toLocaleString()} USD
          </div>
          <span className="text-[10px] text-slate-500 block">
            {stats.totalDonationsCount || 0} completed gifts
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Platform Fee Revenue
          </span>
          <div className="text-2xl font-black text-emerald-400">
            ${Number(stats.totalPlatformFeesRevenue || 0).toLocaleString()} USD
          </div>
          <span className="text-[10px] text-slate-500 block">
            {givingSettings.donationFeePercentage}% platform maintenance fee
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Payout Queue
          </span>
          <div className="text-2xl font-black text-amber-300">
            ${Number(stats.totalPendingPayouts || 0).toLocaleString()} USD
          </div>
          <span className="text-[10px] text-slate-500 block">
            {stats.pendingWithdrawalsCount || 0} requests requiring review/disbursement
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            Total Disbursed Payouts
          </span>
          <div className="text-2xl font-black text-sky-400">
            ${Number(stats.totalDisbursedPayouts || 0).toLocaleString()} USD
          </div>
          <span className="text-[10px] text-slate-500 block">
            Net broadcaster earnings transferred
          </span>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'payouts', label: `Withdrawals Queue (${stats.pendingWithdrawalsCount})` },
            { id: 'donations', label: `Platform Donations (${donations.length})` },
            { id: 'campaigns', label: `Campaigns Moderation (${campaigns.length})` },
            { id: 'settings', label: 'Giving Settings & Fees' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                subTab === t.id
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1"
          title="Refresh Giving Data"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3. SUB-TAB CONTENTS */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: WITHDRAWALS QUEUE */}
          {subTab === 'payouts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Broadcaster Payout Requests
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['ALL', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setWithdrawalStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${
                        withdrawalStatusFilter === st
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWithdrawals.length > 0 ? (
                <div className="space-y-3">
                  {filteredWithdrawals.map((w) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      PROCESSING: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      APPROVED: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
                      UNDER_REVIEW: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                      REQUESTED: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                      REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    };

                    return (
                      <div
                        key={w.id}
                        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[w.status] || 'bg-slate-800 text-slate-300'}`}>
                              {w.status}
                            </span>
                            <span className="font-bold text-white text-sm">{w.ownerName}</span>
                            <span className="text-xs text-slate-400 font-mono">({w.ownerEmail})</span>
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-3 pt-1.5 flex-wrap">
                            {w.payoutMethod === 'MOBILE_MONEY' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold text-[11px]">
                                <Smartphone className="w-3.5 h-3.5" /> Mobile Money ({w.payoutBankOrProvider || 'M-Pesa / Tigo / Airtel'})
                              </span>
                            ) : w.payoutMethod === 'PAYPAL' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/25 font-bold text-[11px]">
                                <Globe className="w-3.5 h-3.5" /> PayPal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/25 font-bold text-[11px]">
                                <Building2 className="w-3.5 h-3.5" /> Bank Transfer ({w.payoutBankOrProvider || 'Bank'})
                              </span>
                            )}
                            <span className="text-slate-300">
                              Account: <strong className="text-white font-mono">{w.payoutAccountNumber}</strong>{' '}
                              <span className="text-slate-400">({w.payoutAccountName})</span>
                            </span>
                            <span className="text-slate-500">• {new Date(w.requestedAt).toLocaleString()}</span>
                          </div>
                          {w.adminNotes && (
                            <p className="text-[11px] text-amber-300/90 pt-0.5">Admin Note: {w.adminNotes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-xl font-black text-white">
                              {w.currency || 'USD'} {Number(w.amount || 0).toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              Net: {w.currency || 'USD'} {Number(w.netAmount || w.amount || 0).toLocaleString()}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setNewStatus(w.status === 'REQUESTED' ? 'APPROVED' : w.status);
                              setAdminNotes(w.adminNotes || '');
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700 flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Action</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                  <p className="text-xs text-slate-400">No withdrawal requests found for this status.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DONATIONS LEDGER */}
          {subTab === 'donations' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by donor, tracking ID, or station..."
                    value={donationSearch}
                    onChange={(e) => setDonationSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  Showing {filteredDonations.length} total records
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Tracking ID</th>
                        <th className="py-3 px-4">Station</th>
                        <th className="py-3 px-4">Donor</th>
                        <th className="py-3 px-4 text-right">Gross</th>
                        <th className="py-3 px-4 text-right">Platform Fee</th>
                        <th className="py-3 px-4 text-right">Net To Radio</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredDonations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-mono text-amber-300 font-bold">{d.trackingId}</td>
                          <td className="py-3 px-4 font-medium text-white">{d.stationName}</td>
                          <td className="py-3 px-4">
                            {d.isAnonymous ? (
                              <span className="text-slate-400 flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> Anonymous
                              </span>
                            ) : (
                              d.donorName
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-300">
                            {d.currency || 'USD'} {Number(d.grossAmount || d.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                            +{d.currency || 'USD'} {Number(d.platformFeeAmount || Math.round((d.grossAmount || d.amount || 0) * 0.05)).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            {d.currency || 'USD'} {Number(d.netOwnerAmount || Math.round((d.grossAmount || d.amount || 0) * 0.95)).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {d.status === 'COMPLETED' && (
                              <button
                                onClick={() => setSelectedDonationForRefund(d)}
                                className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-[10px] font-bold transition"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMPAIGNS MODERATION */}
          {subTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => {
                  const pct = Math.min(100, Math.round(((camp.amountRaised || 0) / Math.max(1, camp.goalAmount)) * 100));
                  return (
                    <div key={camp.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                            {camp.stationName || 'Christian Radio'}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">{camp.title}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {camp.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">{camp.description}</p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-emerald-400">{camp.currency || 'USD'} {Number(camp.amountRaised || 0).toLocaleString()}</span>
                          <span className="text-slate-400">Target: {camp.currency || 'USD'} {Number(camp.goalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        {camp.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateCampaignStatus(camp.id, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition"
                          >
                            Set Active
                          </button>
                        )}
                        {camp.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateCampaignStatus(camp.id, 'PAUSED')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition"
                          >
                            Pause Campaign
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateCampaignStatus(camp.id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-bold transition"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: GIVING SETTINGS & FEES */}
          {subTab === 'settings' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-rose-400" />
                  Platform Giving & Payout Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust platform transaction fees, minimum broadcaster payout thresholds, and system policies.
                </p>
              </div>

              {settingsSaveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Platform giving settings saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="font-bold text-white text-xs block">Enable Giving & Donations System</span>
                    <span className="text-[11px] text-slate-400">Allow listeners to support stations and campaigns across the platform.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={givingSettings.givingEnabled}
                    onChange={(e) => setGivingSettings({ ...givingSettings, givingEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Platform Fee Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={givingSettings.donationFeePercentage}
                      onChange={(e) => setGivingSettings({ ...givingSettings, donationFeePercentage: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Retained by Christian Radios platform</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Minimum Broadcaster Payout (USD $)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      value={givingSettings.minWithdrawalAmount}
                      onChange={(e) => setGivingSettings({ ...givingSettings, minWithdrawalAmount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Threshold for radio owners to withdraw</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* 4. WITHDRAWAL PROCESSING MODAL */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Process Broadcaster Payout</h3>
            <p className="text-xs text-slate-400 mb-4">
              Payout ID: <strong className="text-amber-300 font-mono">{selectedWithdrawal.id}</strong>
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Broadcaster:</span>
                <span className="font-bold text-white">{selectedWithdrawal.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Requested:</span>
                <span className="font-bold text-emerald-400">
                  {selectedWithdrawal.currency || 'USD'} {Number(selectedWithdrawal.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Disbursement Channel:</span>
                <span className="text-white">{selectedWithdrawal.payoutMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account / Phone:</span>
                <span className="font-mono text-slate-200">{selectedWithdrawal.payoutAccountNumber}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateWithdrawalStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Compliance check)</option>
                  <option value="APPROVED">APPROVED (Scheduled for payout)</option>
                  <option value="PROCESSING">PROCESSING (Transfer in progress)</option>
                  <option value="COMPLETED">COMPLETED (Funds sent & verified)</option>
                  <option value="REJECTED">REJECTED (Decline & return balance)</option>
                </select>
              </div>

              {newStatus === 'COMPLETED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    B2C / Bank Transaction Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. MPESA-B2C-982104 / CRDB-FT-491"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Notes / Receipt Note</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes for owner (e.g. Disbursed via Vodacom M-Pesa Bulk Payout Portal)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingWithdrawal}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {isUpdatingWithdrawal ? 'Saving...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DONATION REFUND MODAL */}
      {selectedDonationForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Process Donation Refund</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tracking ID: <strong className="text-amber-300 font-mono">{selectedDonationForRefund.trackingId}</strong>
            </p>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Refund / Dispute Reason</label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why this donation is being reversed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDonationForRefund(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                >
                  {isRefunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
