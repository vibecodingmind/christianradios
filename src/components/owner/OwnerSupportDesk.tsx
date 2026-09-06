import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  HelpCircle,
  Radio,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  PhoneCall,
  ExternalLink,
  Filter,
  Check,
  RotateCw,
  X,
  FileText,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station, SupportTicket } from '../../types';

interface OwnerSupportDeskProps {
  stations: Station[];
  onOpenStationModal?: () => void;
}

export function OwnerSupportDesk({ stations }: OwnerSupportDeskProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Selected Ticket for conversation thread drawer/modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // New Ticket Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('STREAM_SETUP');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newStationId, setNewStationId] = useState(stations[0]?.id || '');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/owner/support-tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const chosenStation = stations.find((s) => s.id === newStationId);
      const stationPrefix = chosenStation ? `[${chosenStation.name}] ` : '';

      const res = await apiFetch('/api/owner/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `${stationPrefix}${newSubject}`,
          category: newCategory,
          priority: newPriority,
          message: newMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit support ticket');

      if (data.ticket) {
        setTickets((prev) => [data.ticket, ...prev]);
        setActiveTicket(data.ticket);
      }

      setShowNewTicketModal(false);
      setNewSubject('');
      setNewMessage('');
      setNewPriority('MEDIUM');
    } catch (err: any) {
      setSubmitError(err.message || 'Could not submit ticket. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    setReplyError(null);

    try {
      const res = await apiFetch(`/api/owner/support/${activeTicket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit response');

      if (data.ticket) {
        setActiveTicket(data.ticket);
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
      }
      setReplyMessage('');
    } catch (err: any) {
      setReplyError(err.message || 'Could not post message.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (activeStatusTab !== 'ALL' && ticket.status !== activeStatusTab) {
      return false;
    }
    if (selectedPriority !== 'ALL' && ticket.priority !== selectedPriority) {
      return false;
    }
    if (selectedCategory !== 'ALL' && ticket.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const subjectMatch = ticket.subject.toLowerCase().includes(q);
      const messageMatch = ticket.message.toLowerCase().includes(q);
      const responseMatch = (ticket.responses || []).some((r) =>
        r.message.toLowerCase().includes(q)
      );
      return subjectMatch || messageMatch || responseMatch;
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  const faqs = [
    {
      q: 'How do I configure HTTPS / SSL for my Icecast or Shoutcast audio stream?',
      a: 'Modern browsers block insecure HTTP audio streams on HTTPS platforms due to Mixed Content policies. To resolve this, install an SSL certificate on your Icecast/Shoutcast server using Let’s Encrypt, or place a secure reverse proxy like NGINX or Cloudflare in front of your streaming port (e.g., https://stream.yourstation.org/live). Our engineering team can configure an SSL proxy tunnel for your station if you open a ticket under "Stream Setup & Audio".',
    },
    {
      q: 'Why does my radio stream buffer or disconnect for international listeners?',
      a: 'Stream buffering is typically caused by insufficient server uplink bandwidth or high bitrate encoding on congested listener networks. We recommend broadcasting at 64 kbps or 128 kbps stereo AAC+ / MP3 for optimal mobile listening across Africa, Europe, and the Americas. Christian Radios also automatically activates failover to your backup stream if configured.',
    },
    {
      q: 'How does Christian Radios handle listener donations and PesaPal payouts?',
      a: 'When listeners support your ministry through your station page, funds are collected securely via PesaPal (M-Pesa, Airtel Money, Tigo Pesa, Visa/Mastercard). Payouts are automatically routed to your verified bank or mobile money account every Friday with full settlement reports in your Finance tab.',
    },
    {
      q: 'How does the Studio WhatsApp Bridge work for live shows?',
      a: 'Listeners can tap "WhatsApp Hotline" on your station page or scan the QR code to send gospel song requests and prayer points directly to your studio phone. Incoming messages can also be ingested straight into your Studio Presenter Console so your on-air host sees requests in real time without needing a phone.',
    },
    {
      q: 'What is required for Broadcaster Verification (KYC) badge approval?',
      a: 'To receive the verified blue shield badge on your station page, provide your station’s official broadcast license or church registration certificate, proof of domain ownership, and a government ID of the station director in the Verification (KYC) tab. Reviews are completed within 24 to 48 hours.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <LifeBuoy className="w-3.5 h-3.5" />
              Broadcaster Technical Support Desk
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineering & Operational Care
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Direct access to our senior audio streaming engineers, Icecast/SSL architects, and broadcaster billing specialists. We ensure your radio ministry stays on air 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Ticket</span>
            </button>
            <button
              onClick={loadTickets}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center justify-center"
              title="Refresh tickets"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SLA & KPIs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Inquiries</span>
            <span className="text-xl font-bold text-white mt-1 block">{tickets.length}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-amber-400 block">Active / Pending</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">{openCount + inProgressCount}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-emerald-400 block">Resolved</span>
            <span className="text-xl font-bold text-emerald-300 mt-1 block">{resolvedCount}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-sky-400 block">Target SLA</span>
            <span className="text-xl font-bold text-sky-300 mt-1 block">&lt; 45 Mins</span>
          </div>
        </div>
      </div>

      {/* Main Content: Tickets + Knowledgebase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tickets Management (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status Tabs & Filter Bar */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'ALL', label: 'All Tickets', count: tickets.length },
                { id: 'OPEN', label: 'Open', count: openCount },
                { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
                { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
                { id: 'CLOSED', label: 'Closed', count: tickets.filter((t) => t.status === 'CLOSED').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeStatusTab === tab.id
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeStatusTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Secondary Filter dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tickets by topic or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="STREAM_SETUP">Stream Setup & SSL</option>
                  <option value="BILLING">Billing & Plans</option>
                  <option value="VERIFICATION">Broadcaster KYC</option>
                  <option value="WHATSAPP">WhatsApp Bridge</option>
                  <option value="OTHER">Other Questions</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent SLA (&lt; 1hr)</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ticket List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <RotateCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading support inquiries...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <LifeBuoy className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Support Tickets Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {tickets.length === 0
                    ? "You haven't opened any support tickets yet. Need help with stream encoding, SSL certificates, or billing? Our engineers are ready."
                    : 'No tickets matched your search criteria.'}
                </p>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Submit First Ticket
                </button>
              </div>
            ) : (
              filteredTickets.map((tick) => {
                const responseCount = tick.responses ? tick.responses.length : 0;
                const lastResponse = responseCount > 0 ? tick.responses[responseCount - 1] : null;

                return (
                  <div
                    key={tick.id}
                    onClick={() => setActiveTicket(tick)}
                    className="p-5 bg-slate-900/80 hover:bg-slate-850/90 border border-slate-800 hover:border-slate-700 rounded-2xl transition cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              tick.status === 'RESOLVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : tick.status === 'IN_PROGRESS'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                : tick.status === 'CLOSED'
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {tick.status.replace('_', ' ')}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tick.priority === 'URGENT'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : tick.priority === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {tick.priority} PRIORITY
                          </span>

                          <span className="text-[11px] text-slate-500">
                            {tick.category.replace('_', ' ')}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                          {tick.subject}
                        </h3>
                      </div>

                      <span className="text-[11px] text-slate-500 shrink-0">
                        {new Date(tick.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {tick.message}
                    </p>

                    {/* Latest reply snippet if any */}
                    {lastResponse && (
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-sky-300 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            {lastResponse.authorName} ({lastResponse.authorRole.replace('_', ' ')})
                          </span>
                          <span className="text-slate-500">
                            {new Date(lastResponse.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs line-clamp-1 italic">
                          "{lastResponse.message}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        {responseCount} {responseCount === 1 ? 'Message' : 'Messages'} in thread
                      </span>
                      <span className="text-sky-400 font-semibold group-hover:underline flex items-center gap-1">
                        View Thread & Reply →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Knowledgebase & Emergency Hotline (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Emergency Broadcaster Contact */}
          <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-800/30 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Critical Off-Air Emergency?</h3>
                <p className="text-[11px] text-rose-300">24/7 Priority Broadcaster Line</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If your stream is dropping listeners or your main transmission server is down, open an <strong>URGENT</strong> ticket or contact our on-duty engineer directly.
            </p>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Engineering WhatsApp:</span>
                <a
                  href="https://wa.me/255754000000?text=Broadcaster%20Urgent%20Outage"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  +255 754 000 000 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Emergency NOC:</span>
                <span className="font-mono text-slate-200">noc@christianradios.org</span>
              </div>
            </div>
          </div>

          {/* Broadcaster FAQ / Guides */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Broadcaster Knowledgebase</h3>
            </div>
            <p className="text-xs text-slate-400">
              Quick troubleshooting steps for audio encoders, SSL proxies, and payouts.
            </p>

            <div className="space-y-2 pt-1">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-800/80 rounded-2xl bg-slate-950/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2.5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Conversation Thread Modal / Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      activeTicket.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {activeTicket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    Ticket #{activeTicket.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {activeTicket.subject}
                </h3>
                <p className="text-xs text-slate-500">
                  Category: {activeTicket.category.replace('_', ' ')} • Submitted on {new Date(activeTicket.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setActiveTicket(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Timeline */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 no-scrollbar">
              {/* Initial Broadcaster Query */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-sky-400" />
                    Broadcaster Request
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(activeTicket.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeTicket.message}
                </p>
              </div>

              {/* Thread Responses */}
              {activeTicket.responses && activeTicket.responses.length > 0 ? (
                activeTicket.responses.map((resp, idx) => {
                  const isStaff = resp.authorRole === 'SUPERADMIN' || resp.authorRole === 'STAFF';
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl space-y-2 border ${
                        isStaff
                          ? 'bg-sky-950/20 border-sky-800/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-bold flex items-center gap-1.5 ${
                            isStaff ? 'text-sky-300' : 'text-slate-200'
                          }`}
                        >
                          {isStaff ? (
                            <Shield className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <Radio className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {resp.authorName}{' '}
                          <span className="text-[10px] opacity-75">
                            ({resp.authorRole.replace('_', ' ')})
                          </span>
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(resp.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                        {resp.message}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  An engineering team member is reviewing your query. First response is usually within 45 minutes.
                </div>
              )}
            </div>

            {/* Error Message if reply failed */}
            {replyError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {replyError}
              </div>
            )}

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">
                Add Reply or Additional Technical Details:
              </label>
              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response to engineering team..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Updates notify engineering immediately.
                </span>
                <button
                  type="submit"
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Post Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Support Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Support Ticket</h3>
                  <p className="text-xs text-slate-400">Our audio engineers will assist promptly</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Affected Radio Station
                </label>
                <select
                  value={newStationId}
                  onChange={(e) => setNewStationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.city}, {st.countryCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Ticket Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mixed content SSL error on Icecast mountpoint"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="STREAM_SETUP">Stream Setup & Audio</option>
                    <option value="BILLING">Subscription & Billing</option>
                    <option value="VERIFICATION">Broadcaster Verification</option>
                    <option value="WHATSAPP">WhatsApp Bridge Hotline</option>
                    <option value="OTHER">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Urgency & Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="LOW">Low (Standard Question)</option>
                    <option value="MEDIUM">Medium (Setup Assistance)</option>
                    <option value="HIGH">High (Stream Degraded)</option>
                    <option value="URGENT">Urgent (Radio Off-Air Outage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please provide stream URLs, error codes, encoder logs, or any relevant details..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-600/30 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
