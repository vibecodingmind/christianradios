import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Radio,
  User,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  Coins,
  ChevronRight,
  Smartphone,
  CreditCard,
  Building2,
  FileText,
  Target,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type {
  Station,
  Donation,
  DonationCampaign,
  WithdrawalRequest,
  LedgerEntry,
} from '../../types';

interface DonationsLedgerProps {
  stations: Station[];
}

export function DonationsLedger({ stations }: DonationsLedgerProps) {
  const [subTab, setSubTab] = useState<'overview' | 'campaigns' | 'donations' | 'withdrawals' | 'statement'>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [balance, setBalance] = useState<{
    totalGrossDonations: number;
    totalPlatformFees: number;
    totalNetEarnings: number;
    totalWithdrawn: number;
    pendingWithdrawals: number;
    availableBalance: number;
    currency: string;
  }>({
    totalGrossDonations: 0,
    totalPlatformFees: 0,
    totalNetEarnings: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    availableBalance: 0,
    currency: 'TZS',
  });

  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  // Modals
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50000);
  const [payoutMethod, setPayoutMethod] = useState<'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'BANK_TRANSFER'>('MPESA');
  const [payoutAccountName, setPayoutAccountName] = useState('');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');
  const [payoutBankOrProvider, setPayoutBankOrProvider] = useState('Vodacom M-Pesa');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawStationId, setWithdrawStationId] = useState(stations[0]?.id || '');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Campaign Form State
  const [campaignStationId, setCampaignStationId] = useState(stations[0]?.id || '');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignGoal, setCampaignGoal] = useState<number>(1500000);
  const [campaignCurrency, setCampaignCurrency] = useState('TZS');
  const [campaignImageUrl, setCampaignImageUrl] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const loadGivingData = async () => {
    try {
      setLoading(true);
      const [overviewRes, campaignsRes, donationsRes, withdrawalsRes, statementRes] = await Promise.all([
        apiFetch('/api/owner/giving/overview').then((r) => r.json()).catch(() => null),
        apiFetch('/api/owner/giving/campaigns').then((r) => r.json()).catch(() => ({ campaigns: [] })),
        apiFetch('/api/owner/giving/donations').then((r) => r.json()).catch(() => ({ donations: [] })),
        apiFetch('/api/owner/giving/withdrawals').then((r) => r.json()).catch(() => ({ withdrawals: [] })),
        apiFetch('/api/owner/giving/statement').then((r) => r.json()).catch(() => ({ statement: [] })),
      ]);

      if (overviewRes?.balance) {
        setBalance(overviewRes.balance);
      }
      setCampaigns(campaignsRes?.campaigns || []);
      setDonations(donationsRes?.donations || []);
      setWithdrawals(withdrawalsRes?.withdrawals || []);
      setLedgerEntries(statementRes?.statement || []);
    } catch (err) {
      console.error('Failed to load owner giving data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGivingData();
  }, []);

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setIsSubmittingWithdrawal(true);

    try {
      const res = await apiFetch('/api/owner/giving/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          stationId: withdrawStationId || undefined,
          payoutMethod,
          payoutAccountName,
          payoutAccountNumber,
          payoutBankOrProvider,
          notes: withdrawNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal request.');

      setShowWithdrawalModal(false);
      loadGivingData();
    } catch (err: any) {
      setWithdrawError(err.message || 'An error occurred.');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignError(null);
    setIsSubmittingCampaign(true);

    try {
      const res = await apiFetch('/api/owner/giving/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: campaignStationId || stations[0]?.id,
          title: campaignTitle,
          description: campaignDescription,
          goalAmount: Number(campaignGoal),
          currency: campaignCurrency,
          imageUrl: campaignImageUrl,
          endDate: campaignEndDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign.');

      setShowCampaignModal(false);
      setCampaignTitle('');
      setCampaignDescription('');
      loadGivingData();
    } catch (err: any) {
      setCampaignError(err.message || 'An error occurred.');
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  const handleExportDonationsCSV = () => {
    if (donations.length === 0) return;
    const headers = ['Date', 'Tracking ID', 'Station', 'Donor Name', 'Fund Type', 'Gross Amount', 'Fee', 'Net Amount', 'Currency', 'Payment Method', 'Status', 'Message'];
    const rows = donations.map((d) => [
      new Date(d.createdAt).toISOString(),
      d.trackingId,
      `"${d.stationName || ''}"`,
      `"${d.isAnonymous ? 'Anonymous' : d.donorName}"`,
      d.fundType,
      d.grossAmount || d.amount,
      d.platformFeeAmount || 0,
      d.netOwnerAmount || d.amount,
      d.currency,
      d.paymentMethod,
      d.status,
      `"${(d.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `giving_donations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & FINANCIAL CARDS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <HeartHandshake className="w-4 h-4" />
              Broadcaster Ministry Giving & Support
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Giving, Tithes & Payout Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Receive direct listener contributions, launch gospel fundraising campaigns, and disburse payouts directly to Mobile Money or Bank.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Launch Campaign</span>
            </button>

            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Request Payout</span>
            </button>
          </div>
        </div>

        {/* Financial Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Available for Payout
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {balance.currency || 'TZS'} {Number(balance.availableBalance || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ready for immediate disbursement</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Net Ministry Earned
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {balance.currency || 'TZS'} {Number(balance.totalNetEarnings || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              From {donations.length} listener gifts (Gross: {balance.currency || 'TZS'} {Number(balance.totalGrossDonations || 0).toLocaleString()})
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Disbursed Payouts
            </span>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {balance.currency || 'TZS'} {Number(balance.totalWithdrawn || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Transferred to Mobile Money / Bank</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Payout Queue
            </span>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {balance.currency || 'TZS'} {Number(balance.pendingWithdrawals || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Under finance review & processing</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Giving Dashboard', icon: TrendingUp },
          { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Target },
          { id: 'donations', label: `Donations Record (${donations.length})`, icon: HeartHandshake },
          { id: 'withdrawals', label: `Payouts & Withdrawals (${withdrawals.length})`, icon: DollarSign },
          { id: 'statement', label: 'Financial Statement / Ledger', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                subTab === tab.id
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENTS */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              {/* Active Campaigns Teaser */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    Active Fundraising Projects
                  </h3>
                  <button
                    onClick={() => setSubTab('campaigns')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Manage All Campaigns →
                  </button>
                </div>

                {campaigns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaigns.slice(0, 2).map((c) => {
                      const pct = Math.min(100, Math.round(((c.amountRaised || 0) / Math.max(1, c.goalAmount)) * 100));
                      return (
                        <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-white text-xs line-clamp-1">{c.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              {c.status}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-emerald-400">{c.currency || 'TZS'} {Number(c.amountRaised || 0).toLocaleString()}</span>
                              <span className="text-slate-400">Goal: {c.currency || 'TZS'} {Number(c.goalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-rose-500 to-emerald-400" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
                    <p className="text-xs text-slate-400">No campaigns launched yet. Start a campaign for a transmitter tower, solar power, or studio equipment!</p>
                  </div>
                )}
              </div>

              {/* Recent Donations Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-400" />
                    Latest Listener Offerings & Seeds
                  </h3>
                  <button
                    onClick={() => setSubTab('donations')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    View All Records →
                  </button>
                </div>

                {donations.length > 0 ? (
                  <div className="space-y-2">
                    {donations.slice(0, 5).map((d) => (
                      <div key={d.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{d.isAnonymous ? 'Anonymous Supporter' : d.donorName}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                              {d.fundType.replace('_', ' ')}
                            </span>
                          </div>
                          {d.message && <p className="text-[11px] text-slate-400 italic truncate max-w-md">&ldquo;{d.message}&rdquo;</p>}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-400 text-sm">{d.currency || 'TZS'} {Number(d.netOwnerAmount || d.amount || 0).toLocaleString()}</span>
                          <span className="block text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No donations received yet. Share your station link to invite listeners to support your ministry!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGNS */}
          {subTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Radio Fundraising Campaigns</h3>
                  <p className="text-xs text-slate-400">Manage fundraising goals for transmission power, outreach crusades, and studio gear.</p>
                </div>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
              </div>

              {campaigns.length > 0 ? (
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
                            <span className="text-emerald-400">{camp.currency || 'TZS'} {Number(camp.amountRaised || 0).toLocaleString()}</span>
                            <span className="text-slate-400">Target: {camp.currency || 'TZS'} {Number(camp.goalAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{pct}% Completed</span>
                            <span>{camp.supportersCount || 0} Supporters</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-2">
                  <Target className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No campaigns created yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a campaign to let your listeners partner with specific projects.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DONATIONS RECORD */}
          {subTab === 'donations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">Itemized Listener Giving Record</h3>
                  <p className="text-xs text-slate-400">Every donation, gross amount, platform fee, and net broadcaster allocation.</p>
                </div>
                <button
                  onClick={handleExportDonationsCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {donations.length > 0 ? (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Tracking ID</th>
                          <th className="py-3 px-4">Donor</th>
                          <th className="py-3 px-4">Fund Type</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4 text-right">Gross</th>
                          <th className="py-3 px-4 text-right">Fee</th>
                          <th className="py-3 px-4 text-right">Net Credited</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {donations.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 font-mono text-amber-300 text-[11px]">{d.trackingId}</td>
                            <td className="py-3 px-4 font-medium text-white">
                              {d.isAnonymous ? (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Anonymous
                                </span>
                              ) : (
                                d.donorName
                              )}
                            </td>
                            <td className="py-3 px-4">{d.fundType.replace('_', ' ')}</td>
                            <td className="py-3 px-4 font-semibold">{d.paymentMethod}</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-300">
                              {d.currency || 'TZS'} {Number(d.grossAmount || d.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-rose-400">
                              -{d.currency || 'TZS'} {Number(d.platformFeeAmount || Math.round((d.grossAmount || d.amount || 0) * 0.05)).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-400">
                              {d.currency || 'TZS'} {Number(d.netOwnerAmount || Math.round((d.grossAmount || d.amount || 0) * 0.95)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-2">
                  <HeartHandshake className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No donations recorded yet</h4>
                  <p className="text-xs text-slate-400">When listeners donate, individual receipts and net allocations will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WITHDRAWALS */}
          {subTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Payout Withdrawals History</h3>
                  <p className="text-xs text-slate-400">Track requested, processing, and disbursed funds transferred to your accounts.</p>
                </div>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Request Payout</span>
                </button>
              </div>

              {withdrawals.length > 0 ? (
                <div className="space-y-3">
                  {withdrawals.map((w) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      PROCESSING: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                      UNDER_REVIEW: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                      REQUESTED: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                      REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    };

                    return (
                      <div key={w.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[w.status] || 'bg-slate-800 text-slate-300'}`}>
                              {w.status}
                            </span>
                            <span className="font-mono text-xs text-slate-400">{w.id}</span>
                            <span className="text-xs text-slate-500">• {new Date(w.requestedAt).toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-2 pt-1">
                            <span className="font-semibold text-white">{w.payoutMethod}:</span>
                            <span>{w.payoutAccountNumber} ({w.payoutAccountName})</span>
                          </div>
                          {w.adminNotes && (
                            <p className="text-[11px] text-amber-300/90 pt-0.5">Admin Note: {w.adminNotes}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-white">
                            {w.currency || 'TZS'} {Number(w.amount || 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            Net Disbursed: {w.currency || 'TZS'} {Number(w.netAmount || w.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-2">
                  <DollarSign className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No payout requests yet</h4>
                  <p className="text-xs text-slate-400">When your ministry receives listener donations, you can withdraw available funds anytime.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCIAL STATEMENT / LEDGER */}
          {subTab === 'statement' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Broadcaster Financial Ledger</h3>
                <p className="text-xs text-slate-400">Immutable ledger history recording all donation credits, fee debits, and withdrawal settlements.</p>
              </div>

              {ledgerEntries.length > 0 ? (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Event Type</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-right">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {ledgerEntries.map((l) => {
                          const isCredit = l.type === 'DONATION_CREDIT' || l.type === 'ADJUSTMENT_CREDIT';
                          return (
                            <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCredit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {l.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate text-slate-300">{l.description}</td>
                              <td className={`py-3 px-4 text-right font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isCredit ? '+' : '-'}{l.currency || 'TZS'} {Number(l.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                                {l.currency || 'TZS'} {Number(l.balanceAfter || 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-2">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No ledger records yet</h4>
                  <p className="text-xs text-slate-400">Transactions will automatically append here upon every completed contribution or payout.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 4. WITHDRAWAL REQUEST MODAL */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Request Broadcaster Payout</h3>
            <p className="text-xs text-slate-400 mb-5">
              Available Balance: <strong className="text-emerald-400">{balance.currency || 'TZS'} {Number(balance.availableBalance || 0).toLocaleString()}</strong>
            </p>

            {withdrawError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleCreateWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Withdrawal Amount ({balance.currency})
                </label>
                <input
                  type="number"
                  min="20000"
                  max={balance.availableBalance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Minimum payout threshold: 20,000 TZS</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payout Channel</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => {
                    const m = e.target.value as any;
                    setPayoutMethod(m);
                    if (m === 'MPESA') setPayoutBankOrProvider('Vodacom M-Pesa');
                    else if (m === 'TIGO_PESA') setPayoutBankOrProvider('Tigo Pesa');
                    else if (m === 'AIRTEL_MONEY') setPayoutBankOrProvider('Airtel Money');
                    else setPayoutBankOrProvider('CRDB Bank');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MPESA">Vodacom M-Pesa</option>
                  <option value="TIGO_PESA">Tigo Pesa (Mixx)</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (EFT / TISS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Account / Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value)}
                  placeholder="e.g. 0754XXXXXX or Account Number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Account / Name
                </label>
                <input
                  type="text"
                  required
                  value={payoutAccountName}
                  onChange={(e) => setPayoutAccountName(e.target.value)}
                  placeholder="e.g. Radio Sauti Ya Tumaini Ministry"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdrawal || withdrawAmount > balance.availableBalance}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Payout Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE CAMPAIGN MODAL */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Launch Ministry Campaign</h3>
            <p className="text-xs text-slate-400 mb-5">Create a fundraising goal for radio tower expansion, solar backup, or gospel crusades.</p>

            {campaignError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {campaignError}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Radio Station</label>
                <select
                  value={campaignStationId}
                  onChange={(e) => setCampaignStationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. 5KW Digital FM Transmitter & Tower Project"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Amount (TZS)</label>
                  <input
                    type="number"
                    min="100000"
                    required
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Target Date</label>
                  <input
                    type="date"
                    required
                    value={campaignEndDate}
                    onChange={(e) => setCampaignEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Story & Details</label>
                <textarea
                  rows={3}
                  required
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Explain why this project is important and how listeners' contributions will directly impact gospel broadcast..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Photo URL (Optional)</label>
                <input
                  type="url"
                  value={campaignImageUrl}
                  onChange={(e) => setCampaignImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCampaign}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                >
                  {isSubmittingCampaign ? 'Publishing...' : 'Launch Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
