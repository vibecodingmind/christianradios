import React, { useState, useMemo } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Send,
  User,
  ShieldCheck,
  Check,
  Copy,
  ChevronRight,
  X,
  Radio,
  Sparkles,
  ArrowRight,
  Building,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { SupportTicket } from '../../types';

interface ExtendedTicket extends Omit<SupportTicket, 'owner'> {
  owner?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

interface AdminSupportDeskTabProps {
  tickets: ExtendedTicket[];
  tenants?: any[];
  onRefresh: () => void;
}

const MACRO_TEMPLATES = [
  {
    title: 'Stream Troubleshooting',
    icon: Radio,
    text: 'Hello, our engineering team has checked your audio stream endpoint. Please ensure your encoder is serving valid audio/mpeg or audio/aacp with CORS headers (Access-Control-Allow-Origin: *) enabled so listeners on all web browsers can stream smoothly.',
  },
  {
    title: 'Billing & Tier Activated',
    icon: Sparkles,
    text: 'Hello, we have confirmed your package subscription and payment settlement. Your broadcaster tier is now active, and your station limits have been updated on the platform.',
  },
  {
    title: 'Station Verified & Approved',
    icon: CheckCircle2,
    text: 'Great news! Your radio station has passed our directory moderation and KYC verification. Your station is now live on the Christian Radios public directory and apps.',
  },
  {
    title: 'Issue Resolved',
    icon: Check,
    text: 'We have applied a platform patch to address this behavior. Please refresh your broadcaster portal and verify. Let us know if you need any additional assistance!',
  },
];

export function AdminSupportDeskTab({ tickets, tenants = [], onRefresh }: AdminSupportDeskTabProps) {
  // Selected ticket for thread
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].id : null
  );

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Action states
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyStatusResolve, setReplyStatusResolve] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New ticket modal
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    recipientId: '',
    subject: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    message: '',
  });
  const [isSubmittingNewTicket, setIsSubmittingNewTicket] = useState(false);
  const [newTicketError, setNewTicketError] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Refresh
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority?.toUpperCase() !== priorityFilter.toUpperCase()) return false;
      if (categoryFilter !== 'ALL' && t.category?.toUpperCase() !== categoryFilter.toUpperCase()) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const subMatch = t.subject?.toLowerCase().includes(term);
        const idMatch = t.id?.toLowerCase().includes(term);
        const emailMatch = t.owner?.email?.toLowerCase().includes(term);
        const nameMatch = t.owner?.name?.toLowerCase().includes(term);
        const msgMatch = t.message?.toLowerCase().includes(term);
        if (!subMatch && !idMatch && !emailMatch && !nameMatch && !msgMatch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Currently selected ticket
  const currentTicket = useMemo(() => {
    if (!selectedTicketId) return filteredTickets[0] || null;
    return tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;
  }, [selectedTicketId, tickets, filteredTickets]);

  // Executive KPI summary
  const kpis = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'OPEN');
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS');
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const urgent = tickets.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'RESOLVED' && t.status !== 'CLOSED');

    return {
      total: tickets.length,
      openCount: open.length,
      inProgressCount: inProgress.length,
      resolvedCount: resolved.length,
      urgentCount: urgent.length,
    };
  }, [tickets]);

  // Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const nextStatus = replyStatusResolve ? 'RESOLVED' : 'IN_PROGRESS';
      await apiFetch(`/api/admin/tickets/${currentTicket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText.trim(),
          status: nextStatus,
        }),
      });

      setReplyText('');
      setReplyStatusResolve(false);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to send ticket response');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Change ticket status directly
  const handleUpdateStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', note?: string) => {
    if (!currentTicket) return;
    setIsUpdatingStatus(true);
    try {
      await apiFetch(`/api/admin/tickets/${currentTicket.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Create new ticket / notice
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewTicket(true);
    setNewTicketError(null);

    try {
      if (!newTicketForm.subject.trim() || !newTicketForm.message.trim()) {
        throw new Error('Subject and message are required.');
      }

      const res = await apiFetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketForm),
      });
      const data = await res.json();

      setIsNewTicketModalOpen(false);
      setNewTicketForm({
        recipientId: '',
        subject: '',
        category: 'GENERAL',
        priority: 'NORMAL',
        message: '',
      });
      await onRefresh();
      if (data?.ticket?.id) {
        setSelectedTicketId(data.ticket.id);
      }
    } catch (err: any) {
      setNewTicketError(err.message || 'Failed to create support ticket');
    } finally {
      setIsSubmittingNewTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <LifeBuoy className="w-4 h-4" />
            <span>Engineering & Broadcaster Support</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Broadcaster Support Desk & Dispatch Center
          </h2>
          <p className="text-xs text-slate-400">
            Triage technical stream inquiries, billing tickets, and station verification notices in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewTicketModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Dispatch Notice / Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Awaiting Action */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Awaiting Staff Action
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Needs Reply
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {kpis.openCount}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Unresolved new broadcaster submissions
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Under Investigation
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Active Threads
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {kpis.inProgressCount}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Tickets in active communication
          </div>
        </div>

        {/* High / Urgent Priority */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> Urgent / High Priority
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Priority
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {kpis.urgentCount}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Critical broadcast or outage alerts
          </div>
        </div>

        {/* Resolved Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Resolved & Closed
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Closed
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {kpis.resolvedCount}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            Successfully closed support cases
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ticket Queue (5 cols on large) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tickets, email, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Statuses ({tickets.length})</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium / Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Ticket Queue List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-2 max-h-[750px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <LifeBuoy className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No Tickets Found</div>
                <div className="text-xs text-slate-500">
                  No tickets match the selected filters.
                </div>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = currentTicket?.id === t.id;
                const isUrgent = t.priority === 'URGENT' || t.priority === 'HIGH';
                const responseCount = t.responses ? t.responses.length : 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.status === 'OPEN'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                              : t.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>

                        {/* Priority Badge */}
                        {isUrgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {t.priority}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 uppercase font-mono">
                          {t.category || 'GENERAL'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-white line-clamp-1">
                      {t.subject}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {t.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-300 truncate">{t.owner?.name || t.owner?.email || 'Broadcaster'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 font-semibold">
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>{responseCount} msg</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Thread & Reply Workspace (7 cols on large) */}
        <div className="lg:col-span-7 space-y-4">
          {currentTicket ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {/* Thread Header */}
              <div className="p-5 bg-slate-950/80 border-b border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-amber-400 font-bold">
                        #{currentTicket.id}
                      </span>
                      <button
                        onClick={() => handleCopy(currentTicket.id, 'thread-id')}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Copy Ticket ID"
                      >
                        {copiedId === 'thread-id' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        Opened {new Date(currentTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      {currentTicket.subject}
                    </h3>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-2">
                    <select
                      value={currentTicket.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleUpdateStatus(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="OPEN">Status: OPEN</option>
                      <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                      <option value="RESOLVED">Status: RESOLVED</option>
                      <option value="CLOSED">Status: CLOSED</option>
                    </select>

                    {currentTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus('RESOLVED', 'Ticket marked resolved by Super Admin.')}
                        disabled={isUpdatingStatus}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Broadcaster Profile Card */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {currentTicket.owner?.name || 'Broadcaster Account'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {currentTicket.owner?.email || currentTicket.ownerId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div>Category: <span className="text-slate-200 font-semibold">{currentTicket.category || 'GENERAL'}</span></div>
                    <div>Priority: <span className="text-amber-400 font-bold">{currentTicket.priority}</span></div>
                  </div>
                </div>
              </div>

              {/* Thread History Conversation Stream */}
              <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto bg-slate-950/40">
                {/* Initial Ticket Submission */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                        B
                      </div>
                      <span className="font-bold text-white">
                        {currentTicket.owner?.name || 'Broadcaster'} (Initial Ticket)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(currentTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                    {currentTicket.message}
                  </div>
                </div>

                {/* Conversation Responses */}
                {currentTicket.responses && currentTicket.responses.length > 0 ? (
                  currentTicket.responses.map((resp, idx) => {
                    const isStaff =
                      resp.authorRole === 'SUPER_ADMIN' ||
                      resp.authorRole === 'ADMIN' ||
                      resp.authorName?.toLowerCase().includes('admin') ||
                      resp.message.startsWith('[System');

                    return (
                      <div
                        key={resp.id || idx}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          isStaff
                            ? 'bg-amber-950/20 border-amber-500/30 ml-4'
                            : 'bg-slate-900 border-slate-800 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isStaff
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isStaff ? <ShieldCheck className="w-3.5 h-3.5" /> : 'B'}
                            </div>
                            <span className="font-bold text-white flex items-center gap-1.5">
                              {resp.authorName || (isStaff ? 'Christian Radios Staff' : 'Broadcaster')}
                              {isStaff && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                                  Staff
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(resp.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pl-8">
                          {resp.message}
                        </div>
                      </div>
                    );
                  })
                ) : null}
              </div>

              {/* Macro Fast Responses */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Engineering Response Macros</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MACRO_TEMPLATES.map((m, idx) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText((prev) => (prev ? `${prev}\n\n${m.text}` : m.text))}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left text-[11px] text-slate-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-1 font-bold text-white group-hover:text-amber-400 truncate">
                          <Icon className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{m.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Staff Reply Composer */}
              <form onSubmit={handleSendReply} className="p-5 bg-slate-950 border-t border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Compose Engineering Response
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type official response or technical guidance to broadcaster..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replyStatusResolve}
                      onChange={(e) => setReplyStatusResolve(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Mark ticket as <strong className="text-emerald-400">RESOLVED</strong> upon sending</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingReply ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Send Official Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-xl">
              <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-white">No Ticket Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select an open support ticket from the queue on the left to inspect conversation history and dispatch responses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket / Staff Notice Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !isSubmittingNewTicket && setIsNewTicketModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Dispatch Broadcaster Notice</h3>
                  <p className="text-[11px] text-slate-400">Initiate a support ticket or broadcast advisory</p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingNewTicket && setIsNewTicketModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket}>
              <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                {newTicketError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{newTicketError}</span>
                  </div>
                )}

                {/* Recipient */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Recipient Broadcaster</label>
                  <select
                    value={newTicketForm.recipientId}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, recipientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">General Platform Notice (No Specific Recipient)</option>
                    {tenants.map((t) => (
                      <option key={t.id || t.user?.id} value={t.id || t.user?.id}>
                        {t.name || t.user?.name || t.email || t.user?.email} ({t.email || t.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Subject / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stream Health Advisory: Bitrate Exceeded"
                    value={newTicketForm.subject}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-semibold">Category</label>
                    <select
                      value={newTicketForm.category}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="STREAMING">Streaming Issue</option>
                      <option value="BILLING">Billing & Plans</option>
                      <option value="VERIFICATION">KYC / Verification</option>
                      <option value="GENERAL">General Support</option>
                      <option value="MAINTENANCE">Platform Maintenance</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300 font-semibold">Priority</label>
                    <select
                      value={newTicketForm.priority}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="LOW">Low</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Initial Message */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Detailed Message *</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Type detailed technical advisory or notice for broadcaster..."
                    value={newTicketForm.message}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Pinned Sticky Footer */}
              <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmittingNewTicket}
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewTicket}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNewTicket ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <span>Create Ticket</span>
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
