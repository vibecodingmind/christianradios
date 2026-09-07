import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  User,
  X,
  ArrowUpDown,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Printer,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Payment, Invoice } from '../../types';

interface ExtendedPayment extends Omit<Payment, 'owner'> {
  invoice?: Invoice;
  owner?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

interface AdminTransactionsTabProps {
  payments: ExtendedPayment[];
  tenants?: any[];
  onRefresh: () => void;
}

export function AdminTransactionsTab({ payments, tenants = [], onRefresh }: AdminTransactionsTabProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modals & Details
  const [selectedPayment, setSelectedPayment] = useState<ExtendedPayment | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual payment form state
  const [manualForm, setManualForm] = useState({
    ownerId: '',
    amount: '',
    currency: 'USD',
    paymentMethod: 'BANK_TRANSFER',
    status: 'COMPLETED',
    reference: '',
    description: '',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Copy tracking ID
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Refresh handler
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filtered & Sorted Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      // Currency filter
      if (currencyFilter !== 'ALL' && p.currency?.toUpperCase() !== currencyFilter.toUpperCase()) return false;

      // Method filter
      if (methodFilter !== 'ALL') {
        const methodUpper = (p.paymentMethod || p.provider || '').toUpperCase();
        if (!methodUpper.includes(methodFilter.toUpperCase())) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const trackingMatch = p.trackingId?.toLowerCase().includes(term);
        const descMatch = p.description?.toLowerCase().includes(term);
        const emailMatch = p.owner?.email?.toLowerCase().includes(term);
        const nameMatch = p.owner?.name?.toLowerCase().includes(term);
        const refMatch = p.providerRef?.toLowerCase().includes(term);
        const invMatch = p.invoice?.invoiceNumber?.toLowerCase().includes(term);
        const amountMatch = p.amount?.toString().includes(term);
        if (!trackingMatch && !descMatch && !emailMatch && !nameMatch && !refMatch && !invMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'amount_desc') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === 'amount_asc') {
        return (a.amount || 0) - (b.amount || 0);
      }
      return 0;
    });
  }, [payments, searchTerm, statusFilter, currencyFilter, methodFilter, sortBy]);

  // Executive KPI Calculations
  const kpis = useMemo(() => {
    const completed = payments.filter((p) => p.status === 'COMPLETED');
    const pending = payments.filter((p) => p.status === 'PENDING');
    const failed = payments.filter((p) => p.status === 'FAILED');

    // Revenue in USD and TZS
    const totalUsd = completed
      .filter((p) => (p.currency || 'USD').toUpperCase() === 'USD')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalTzs = completed
      .filter((p) => (p.currency || '').toUpperCase() === 'TZS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const successRate = payments.length > 0
      ? Math.round((completed.length / payments.length) * 100)
      : 100;

    const avgTicketUsd = completed.length > 0
      ? Math.round(completed.reduce((sum, p) => sum + (p.amount || 0), 0) / completed.length)
      : 0;

    return {
      totalCount: payments.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      totalUsd,
      totalTzs,
      successRate,
      avgTicketUsd,
    };
  }, [payments]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      'Tracking ID',
      'Invoice #',
      'Date',
      'Customer Email',
      'Amount',
      'Currency',
      'Status',
      'Provider',
      'Payment Method',
      'Description',
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.trackingId || ''}"`,
      `"${p.invoice?.invoiceNumber || ''}"`,
      `"${new Date(p.createdAt).toISOString()}"`,
      `"${p.owner?.email || p.ownerId || ''}"`,
      p.amount || 0,
      `"${p.currency || 'USD'}"`,
      `"${p.status || 'COMPLETED'}"`,
      `"${p.provider || ''}"`,
      `"${p.paymentMethod || ''}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `christian-radios-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Manual Payment
  const handleCreateManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    setManualError(null);

    try {
      const payload = {
        ownerId: manualForm.ownerId || undefined,
        amount: parseFloat(manualForm.amount),
        currency: manualForm.currency,
        paymentMethod: manualForm.paymentMethod,
        status: manualForm.status,
        reference: manualForm.reference.trim() || undefined,
        description: manualForm.description.trim() || undefined,
      };

      if (!payload.amount || isNaN(payload.amount) || payload.amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      await apiFetch('/api/admin/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setIsManualModalOpen(false);
      setManualForm({
        ownerId: '',
        amount: '',
        currency: 'USD',
        paymentMethod: 'BANK_TRANSFER',
        status: 'COMPLETED',
        reference: '',
        description: '',
      });
      await onRefresh();
    } catch (err: any) {
      setManualError(err.message || 'Failed to record manual transaction');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Receipt className="w-4 h-4" />
            <span>Financial Command & Audit Trail</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Transaction Ledger & Revenue Operations
          </h2>
          <p className="text-xs text-slate-400">
            Real-time audit log of all broadcaster subscriptions, featured listings, and offline transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredPayments.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV ({filteredPayments.length})</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Record Manual Payment</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume USD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Volume (USD)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {kpis.successRate}% Success
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ${kpis.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            From {kpis.completedCount} settled transactions
          </div>
        </div>

        {/* Total Volume TZS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Volume (TZS)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Mobile Money
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
            TZS {kpis.totalTzs.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Pesapal / MPesa / Tigo / Airtel
          </div>
        </div>

        {/* Pending Clearance */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Pending Verification
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {kpis.pendingCount} Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {kpis.pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Awaiting gateway webhook or approval
          </div>
        </div>

        {/* Average Transaction Size */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Avg Ticket Size
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              Per Broadcaster
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ${kpis.avgTicketUsd.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Across active subscription tiers
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Multi-Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracking ID, email, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Multi-Filters */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses ({payments.length})</option>
            <option value="COMPLETED">Completed (Paid)</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="TZS">TZS (Shilling)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Gateways & Methods</option>
            <option value="PESAPAL">Pesapal</option>
            <option value="STRIPE">Stripe</option>
            <option value="PAYPAL">PayPal</option>
            <option value="MPESA">M-Pesa</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="BANK_TRANSFER">Bank Wire</option>
            <option value="MANUAL">Manual Offline</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Transactions Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3.5 px-4">Tracking ID & Date</th>
                <th className="py-3.5 px-4">Broadcaster / Payer</th>
                <th className="py-3.5 px-4">Description & Invoice</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method / Provider</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 space-y-2">
                    <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-300">No Transactions Found</div>
                    <div className="text-xs text-slate-500">
                      Try adjusting your search query, status, or date filters.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isCompleted = p.status === 'COMPLETED';
                  const isPending = p.status === 'PENDING';
                  const isFailed = p.status === 'FAILED';
                  const isRefunded = p.status === 'REFUNDED';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPayment(p)}
                    >
                      {/* Tracking ID & Date */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white tracking-wide">
                            {p.trackingId || p.id}
                          </span>
                          <button
                            onClick={() => handleCopy(p.trackingId || p.id, p.id)}
                            className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                            title="Copy Tracking ID"
                          >
                            {copiedId === p.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Broadcaster / Payer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0">
                            {p.owner?.name ? p.owner.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate max-w-[150px]">
                              {p.owner?.name || p.owner?.email || 'Broadcaster Account'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {p.owner?.email || p.ownerId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description & Invoice */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-200 truncate">
                          {p.description || 'Subscription Package Renewal'}
                        </div>
                        {p.invoice ? (
                          <div className="text-[10px] text-amber-400/90 font-mono mt-0.5 flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            <span>{p.invoice.invoiceNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Standard Ledger Receipt</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-black text-sm text-emerald-400">
                          {p.currency || 'USD'} {(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: p.currency === 'TZS' ? 0 : 2 })}
                        </div>
                        {p.billingInterval && (
                          <div className="text-[10px] text-slate-500 uppercase font-sans">
                            {p.billingInterval.toLowerCase()}
                          </div>
                        )}
                      </td>

                      {/* Method / Provider */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-[10px]">
                          <CreditCard className="w-3 h-3 text-amber-400" />
                          <span>{p.paymentMethod || p.provider || 'Gateway'}</span>
                        </div>
                        {p.providerRef && (
                          <div className="text-[9px] font-mono text-slate-500 truncate max-w-[110px] mt-0.5">
                            ref: {p.providerRef}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-[10px] tracking-wide border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-400'
                                : isPending
                                ? 'bg-amber-400 animate-pulse'
                                : isFailed
                                ? 'bg-rose-400'
                                : 'bg-purple-400'
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Receipt & Audit Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
          />
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Transaction Audit & Receipt</h3>
                  <p className="text-[11px] text-slate-400">Tracking Reference: {selectedPayment.trackingId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  selectedPayment.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : selectedPayment.status === 'PENDING'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedPayment.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : selectedPayment.status === 'PENDING' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">
                      {selectedPayment.status === 'COMPLETED'
                        ? 'Payment Cleared & Settled'
                        : selectedPayment.status === 'PENDING'
                        ? 'Payment Pending Settlement'
                        : 'Payment Attempt Failed'}
                    </div>
                    <div className="text-[11px] opacity-90">
                      Processed via {selectedPayment.provider || selectedPayment.paymentMethod || 'Platform Gateway'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black">
                    {selectedPayment.currency} {(selectedPayment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: selectedPayment.currency === 'TZS' ? 0 : 2 })}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Transaction ID</span>
                  <p className="font-mono text-white break-all mt-0.5">{selectedPayment.id}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Gateway Reference</span>
                  <p className="font-mono text-white break-all mt-0.5">{selectedPayment.providerRef || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Execution Date</span>
                  <p className="text-white mt-0.5">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Payment Gateway</span>
                  <p className="text-white mt-0.5">{selectedPayment.paymentMethod || selectedPayment.provider}</p>
                </div>
              </div>

              {/* Broadcaster Customer Profile */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Payer / Broadcaster Profile</span>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {selectedPayment.owner?.name || 'Broadcaster Account'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {selectedPayment.owner?.email || selectedPayment.ownerId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Associated Invoice */}
              {selectedPayment.invoice && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Official Platform Invoice</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {selectedPayment.invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold font-mono">{selectedPayment.invoice.invoiceNumber}</span>
                    <span className="text-slate-400">Issued: {new Date(selectedPayment.invoice.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Plan: <span className="text-amber-400 font-semibold">{selectedPayment.invoice.planName}</span>
                  </div>
                </div>
              )}

              {/* Failure Reason if any */}
              {selectedPayment.failureReason && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                  <span className="font-bold">Gateway Failure Notice: </span>
                  {selectedPayment.failureReason}
                </div>
              )}
            </div>

            {/* Sticky Modal Footer */}
            <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Statement</span>
              </button>

              <button
                onClick={() => setSelectedPayment(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !isSubmittingManual && setIsManualModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Record Manual / Offline Payment</h3>
                  <p className="text-[11px] text-slate-400">Register cash, check, or direct wire transactions</p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingManual && setIsManualModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateManualPayment}>
              <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                {manualError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{manualError}</span>
                  </div>
                )}

                {/* Broadcaster / Owner Select */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Broadcaster Account</label>
                  <select
                    value={manualForm.ownerId}
                    onChange={(e) => setManualForm({ ...manualForm, ownerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">Select Broadcaster (or leave empty for admin ledger)</option>
                    {tenants.map((t) => (
                      <option key={t.id || t.user?.id} value={t.id || t.user?.id}>
                        {t.name || t.user?.name || t.email || t.user?.email} ({t.email || t.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-semibold">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 50.00"
                      value={manualForm.amount}
                      onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-semibold">Currency *</label>
                    <select
                      value={manualForm.currency}
                      onChange={(e) => setManualForm({ ...manualForm, currency: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="TZS">TZS (Shilling)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-semibold">Payment Channel</label>
                    <select
                      value={manualForm.paymentMethod}
                      onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                      <option value="MPESA">M-Pesa Direct</option>
                      <option value="TIGO_PESA">Tigo Pesa Direct</option>
                      <option value="AIRTEL_MONEY">Airtel Money Direct</option>
                      <option value="CARD">Manual POS / Card</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-semibold">Initial Status</label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="COMPLETED">Completed (Settled)</option>
                      <option value="PENDING">Pending Clearance</option>
                    </select>
                  </div>
                </div>

                {/* Reference Note */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Reference / Slip Number</label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-892348 or Bank Slip #44"
                    value={manualForm.reference}
                    onChange={(e) => setManualForm({ ...manualForm, reference: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Description / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Kingdom Plan paid via CRDB Bank transfer"
                    value={manualForm.description}
                    onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Pinned Sticky Footer */}
              <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmittingManual}
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
