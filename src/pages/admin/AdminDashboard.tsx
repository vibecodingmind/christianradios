import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Radio,
  Users,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Layers,
  Globe,
  FileText,
  LifeBuoy,
  Settings,
  Flame,
  Search,
  Check,
  X,
  TrendingUp,
  HeartHandshake,
  Key,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  ChevronRight,
  ChevronLeft,
  Headphones,
  Zap,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Play,
  Pause,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { apiFetch } from '../../lib/api';
import { AdminStationsTab } from '../../components/admin/AdminStationsTab';
import { AdminTenantsTab } from '../../components/admin/AdminTenantsTab';
import { AdminPlansTab } from '../../components/admin/AdminPlansTab';
import { AdminTaxonomyTab } from '../../components/admin/AdminTaxonomyTab';
import { AdminCommunityTab } from '../../components/admin/AdminCommunityTab';
import { AdminSettingsTab } from '../../components/admin/AdminSettingsTab';
import { AdminGivingTab } from '../../components/admin/AdminGivingTab';
import { AdminImportsTab } from '../../components/admin/AdminImportsTab';
import { AdminClaimsTab } from '../../components/admin/AdminClaimsTab';
import type {
  Station,
  User,
  SubscriptionPlan,
  Payment,
  SupportTicket,
  StationReport,
  AuditLog,
  Advertisement,
  Category,
  Country,
} from '../../types';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const { playStation } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<
    | 'metrics'
    | 'stations'
    | 'imports'
    | 'claims'
    | 'tenants'
    | 'plans'
    | 'giving'
    | 'settings'
    | 'streams'
    | 'taxonomy'
    | 'community'
    | 'finance'
    | 'tickets'
    | 'audit'
  >('metrics');

  const [metrics, setMetrics] = useState<any>({
    totalTenants: 0,
    totalStations: 0,
    onlineStations: 0,
    mrrTzs: 0,
    mrrUsd: 0,
    totalRevenueTzs: 0,
    totalPlays: 0,
    openTicketsCount: 0,
    openReportsCount: 0,
  });

  const [stations, setStations] = useState<Station[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [reports, setReports] = useState<StationReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Stream check state
  const [isCheckingStreams, setIsCheckingStreams] = useState(false);

  // Ticket reply state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  // Sidebar navigation state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Safe JSON extraction helper
  const safeJson = async (res: Response) => {
    try {
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [
        metRes,
        stRes,
        tenRes,
        plRes,
        payRes,
        tickRes,
        repRes,
        audRes,
        adRes,
        catRes,
        countRes,
      ] = await Promise.all([
        apiFetch('/api/admin/metrics'),
        apiFetch('/api/admin/stations'),
        apiFetch('/api/admin/tenants'),
        apiFetch('/api/admin/plans'),
        apiFetch('/api/admin/payments'),
        apiFetch('/api/admin/tickets'),
        apiFetch('/api/admin/reports'),
        apiFetch('/api/admin/audit-logs'),
        apiFetch('/api/admin/ads'),
        apiFetch('/api/public/categories'),
        apiFetch('/api/public/countries'),
      ]);

      const [
        metData,
        stData,
        tenData,
        plData,
        payData,
        tickData,
        repData,
        audData,
        adData,
        catData,
        countData,
      ] = await Promise.all([
        safeJson(metRes),
        safeJson(stRes),
        safeJson(tenRes),
        safeJson(plRes),
        safeJson(payRes),
        safeJson(tickRes),
        safeJson(repRes),
        safeJson(audRes),
        safeJson(adRes),
        safeJson(catRes),
        safeJson(countRes),
      ]);

      if (metData) {
        const m = metData.metrics || metData;
        setMetrics({
          totalTenants: m.totalOwners ?? m.totalTenants ?? 0,
          totalStations: m.totalStations ?? 0,
          onlineStations: m.onlineStations ?? 0,
          offlineStations: m.offlineStations ?? 0,
          mrrTzs: m.mrrTzs ?? 0,
          mrrUsd: m.mrrUsd ?? Math.round((m.mrrTzs || 0) / 2600),
          totalRevenueTzs: m.totalRevenueTzs ?? 0,
          totalPlays: m.totalPlays ?? 0,
          openTicketsCount: m.openTicketsCount ?? 0,
          openReportsCount: m.openReportsCount ?? 0,
          ...m,
        });
      }
      if (stData?.stations) setStations(stData.stations);
      if (tenData?.tenants) setTenants(tenData.tenants);
      if (plData?.plans) setPlans(plData.plans);
      if (payData?.payments) setPayments(payData.payments);
      if (tickData?.tickets) setTickets(tickData.tickets);
      if (repData?.reports) setReports(repData.reports);
      if (audData?.auditLogs) setAuditLogs(audData.auditLogs);
      if (adData?.ads) setAds(adData.ads);
      if (catData?.categories) setCategories(catData.categories);
      if (countData?.countries) setCountries(countData.countries);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Trigger Global Stream Health Check
  const handleTriggerGlobalStreamCheck = async () => {
    setIsCheckingStreams(true);
    try {
      const res = await apiFetch('/api/admin/trigger-stream-check', { method: 'POST' });
      if (res.ok) {
        await loadAdminData();
      }
    } catch {}
    finally {
      setIsCheckingStreams(false);
    }
  };

  // Reply to ticket
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;

    try {
      const res = await apiFetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: ticketReply.trim(), status: 'IN_PROGRESS' }),
      });
      if (res.ok) {
        setTicketReply('');
        setSelectedTicket(null);
        await loadAdminData();
      }
    } catch {}
  };

  interface AdminMenuItem {
    id: typeof activeTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }

  interface AdminMenuGroup {
    title: string;
    items: AdminMenuItem[];
  }

  const adminMenuGroups: AdminMenuGroup[] = [
    {
      title: 'Executive',
      items: [
        { id: 'metrics', label: 'Overview', icon: TrendingUp },
        { id: 'streams', label: 'Stream Health', icon: Activity },
      ],
    },
    {
      title: 'Directory & Fleet',
      items: [
        { id: 'stations', label: 'Radio Stations', icon: Radio, badge: stations.length },
        { id: 'imports', label: 'Radio Imports', icon: Sparkles },
        { id: 'claims', label: 'Ownership Claims', icon: ShieldCheck },
        { id: 'tenants', label: 'Broadcasters', icon: Users, badge: tenants.length },
        { id: 'taxonomy', label: 'Genres & Countries', icon: Globe },
      ],
    },
    {
      title: 'Finance & Giving',
      items: [
        { id: 'giving', label: 'Giving & Payouts', icon: HeartHandshake },
        { id: 'plans', label: 'Pricing Plans', icon: Layers, badge: plans.length },
        { id: 'finance', label: 'Transactions', icon: DollarSign, badge: payments.length },
      ],
    },
    {
      title: 'Governance & Ops',
      items: [
        { id: 'community', label: 'Ministry & Reports', icon: Flame, badge: reports.length || undefined, badgeColor: 'bg-rose-500/20 text-rose-300' },
        { id: 'tickets', label: 'Support Desk', icon: LifeBuoy, badge: tickets.length || undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
        { id: 'audit', label: 'Audit Trail', icon: FileText },
        { id: 'settings', label: 'Gateways & Security', icon: Settings },
      ],
    },
  ];

  const currentTabObj = adminMenuGroups.flatMap((g) => g.items).find((i) => i.id === activeTab);

  return (
    <div id="admin-dashboard-root" className="space-y-6 pb-20">
      {/* Top Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            Super Administration & Platform Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Christian Radios Global Administration
          </h1>
          <p className="text-xs text-slate-400">
            Operator: <span className="text-slate-200 font-semibold">{user?.email}</span>{' '}
            • Environment: <span className="text-emerald-400 font-medium">Production</span> • Status: Online
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerGlobalStreamCheck}
            disabled={isCheckingStreams}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isCheckingStreams ? 'animate-spin' : ''}`} />
            {isCheckingStreams ? 'Testing Streams...' : 'Run Global Stream Check'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Button & Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 hover:bg-slate-700 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Admin Navigation
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              {currentTabObj && <currentTabObj.icon className="w-3.5 h-3.5 text-amber-400" />}
              {currentTabObj?.label || 'Dashboard'}
            </div>
          </div>
        </div>

        <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
          Menu
        </span>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-none">Admin Panel</div>
                  <div className="text-[10px] text-amber-400 font-semibold leading-none mt-1">Super Admin</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              {adminMenuGroups.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                              isActive
                                ? 'bg-slate-950/20 text-slate-950'
                                : item.badgeColor || 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Desktop Sidebar + Content Area */}
      <div className="flex items-start gap-6">
        {/* Collapsible Left Side Menu (Desktop) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 bg-slate-900/95 border border-slate-800/80 rounded-3xl p-3 shadow-xl backdrop-blur-md transition-all duration-300 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Sidebar Header & Toggle */}
          <div
            className={`flex items-center pb-3 mb-2 border-b border-slate-800/80 ${
              isSidebarOpen ? 'justify-between px-2' : 'justify-center'
            }`}
          >
            {isSidebarOpen && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-none">Admin Panel</div>
                  <div className="text-[10px] text-amber-400/90 font-semibold leading-none mt-1">Super Admin</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Grouped Menu Items */}
          <div className="space-y-4 py-1">
            {adminMenuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {isSidebarOpen ? (
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2.5 pt-1">
                    {group.title}
                  </div>
                ) : (
                  gIdx > 0 && <div className="h-px bg-slate-800/80 my-2 mx-1" />
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={!isSidebarOpen ? item.label : undefined}
                      className={`w-full rounded-2xl text-xs font-bold transition-all flex items-center ${
                        isSidebarOpen
                          ? 'px-3 py-2.5 justify-between'
                          : 'p-3 justify-center'
                      } ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className={`flex items-center ${isSidebarOpen ? 'gap-2.5' : 'justify-center'}`}>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'}`} />
                        {isSidebarOpen && <span className="truncate">{item.label}</span>}
                      </div>

                      {isSidebarOpen && item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                            isActive
                              ? 'bg-slate-950/20 text-slate-950'
                              : item.badgeColor || 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Tab Content Panel (Right side) */}
        <main className="flex-1 min-w-0 space-y-6">

      {/* Tab 1: Executive Metrics & Overview Command Center */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 border border-slate-800 hover:border-amber-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Platform MRR
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +14.8%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                TZS {(metrics?.mrrTzs ?? 0).toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>≈ ${(metrics?.mrrUsd ?? 0).toLocaleString()} USD</span>
                <span className="text-amber-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('finance')}>
                  View billing →
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-sky-950/20 border border-slate-800 hover:border-sky-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400/90 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> Broadcaster Fleet
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {tenants.filter(t => t.role === 'STATION_OWNER').length || tenants.length} Owners
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {metrics?.totalTenants ?? tenants.length}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>{stations.length} Registered stations</span>
                <span className="text-sky-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('tenants')}>
                  Manage fleet →
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Stream Health
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {Math.round(((metrics?.onlineStations ?? stations.filter(s => s.streamStatus === 'ONLINE').length) / Math.max(1, (metrics?.totalStations ?? (stations.length || 1)))) * 100)}% Online
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {metrics?.onlineStations ?? stations.filter(s => s.streamStatus === 'ONLINE').length} / {metrics?.totalStations ?? stations.length}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Healthy audio telemetry</span>
                <span className="text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('streams')}>
                  Test streams →
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-purple-950/20 border border-slate-800 hover:border-purple-500/40 transition-all p-5 rounded-3xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400/90 flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-purple-400" /> Network Reach
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-purple-400" /> Global
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {(metrics?.totalPlays ?? 0).toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Total station streams</span>
                <span className="text-purple-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('taxonomy')}>
                  Taxonomy →
                </span>
              </div>
            </div>
          </div>

          {/* Action Hub & Pending Moderation Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions & Stream Scanner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Platform Operations Hub</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                  Instant Triggers
                </span>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleTriggerGlobalStreamCheck}
                  disabled={isCheckingStreams}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-800/60 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      <Activity className={`w-4 h-4 ${isCheckingStreams ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        Scan All Stream Endpoints
                      </div>
                      <div className="text-[11px] text-slate-400">Pings all {stations.length} streams in parallel</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => setActiveTab('stations')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-800/60 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        Station Directory Moderation
                      </div>
                      <div className="text-[11px] text-slate-400">Review, verify, and spotlight stations</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => setActiveTab('giving')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:bg-slate-800/60 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        Ministry Tithes & Payouts Desk
                      </div>
                      <div className="text-[11px] text-slate-400">Manage donor contributions & disbursement</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* Pending Approvals Triage Queue */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Pending Approval & Triage Queue</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {stations.filter(s => s.status === 'PENDING_APPROVAL').length} Station(s)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {tickets.filter(t => t.status === 'OPEN').length} Open Ticket(s)
                  </span>
                </div>
              </div>

              {stations.filter(s => s.status === 'PENDING_APPROVAL').length === 0 ? (
                <div className="py-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">No Pending Station Approvals</div>
                  <div className="text-[11px] text-slate-500">All broadcaster submissions have been reviewed and processed.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {stations.filter(s => s.status === 'PENDING_APPROVAL').slice(0, 3).map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                            {st.name}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {st.countryCode} • {st.city}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{st.streamUrl}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => playStation(st)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
                          title="Preview Stream"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveTab('stations')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all"
                        >
                          Review & Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fleet Distribution & Country Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Top Countries */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Geographic Footprint</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{countries.length} Regions</span>
              </div>

              <div className="space-y-2.5">
                {countries.slice(0, 5).map((c) => {
                  const stationCount = stations.filter(s => s.countryCode?.toUpperCase() === c.code?.toUpperCase()).length;
                  const percent = Math.round((stationCount / Math.max(1, stations.length)) * 100);
                  return (
                    <div key={c.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span>{c.flagEmoji || '🌍'}</span>
                          <span>{c.name}</span>
                        </span>
                        <span className="text-slate-400 font-bold">{stationCount} stations ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.max(5, percent)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Genres & Languages */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Ministry Genres</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{categories.length} Categories</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((cat) => {
                  const count = stations.filter(s => s.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-200">{cat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-400 font-bold">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Audit & System Health Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Recent Operator Activity</h3>
                </div>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-[10px] font-bold text-sky-400 hover:underline"
                >
                  Full Audit Trail →
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="text-xs space-y-0.5 border-l-2 border-slate-700 pl-3 py-0.5">
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span className="text-amber-400 uppercase text-[10px] tracking-wider">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{log.details || log.targetType}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stations Management & Moderation */}
      {activeTab === 'stations' && (
        <AdminStationsTab
          stations={stations}
          plans={plans}
          categories={categories}
          countries={countries}
          onRefresh={loadAdminData}
        />
      )}

      {/* Tab: Radio Imports Management */}
      {activeTab === 'imports' && (
        <AdminImportsTab onRefresh={loadAdminData} />
      )}

      {/* Tab: Station Ownership Claims */}
      {activeTab === 'claims' && (
        <AdminClaimsTab onRefresh={loadAdminData} />
      )}

      {/* Tab 3: Broadcasters & Tenants */}
      {activeTab === 'tenants' && (
        <AdminTenantsTab
          tenants={tenants}
          plans={plans}
          onRefresh={loadAdminData}
        />
      )}

      {/* Tab 4: Subscription Plans & Pricing */}
      {activeTab === 'plans' && (
        <AdminPlansTab
          plans={plans}
          onRefresh={loadAdminData}
        />
      )}

      {/* Tab: Giving & Payouts Administration */}
      {activeTab === 'giving' && <AdminGivingTab />}

      {/* Tab 5: Platform Settings (Gateways, Security, Social) */}
      {activeTab === 'settings' && <AdminSettingsTab />}

      {/* Tab 6: Stream Health Telemetry */}
      {activeTab === 'streams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Live Stream Endpoints Telemetry</h2>
            <button
              onClick={handleTriggerGlobalStreamCheck}
              disabled={isCheckingStreams}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isCheckingStreams ? 'animate-spin' : ''}`} />
              Refresh All Streams
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((st) => (
              <div
                key={st.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white truncate max-w-[180px]">{st.name}</div>
                  <span
                    className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                      st.streamStatus === 'ONLINE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {st.streamStatus || 'ONLINE'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 truncate">
                  {st.streamUrl}
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-1">
                  <span>Latency: {st.responseLatencyMs || 120}ms</span>
                  <span>Bitrate: {st.bitrate || 128}kbps</span>
                  <button
                    onClick={() => playStation(st)}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Taxonomy & Countries */}
      {activeTab === 'taxonomy' && (
        <AdminTaxonomyTab
          categories={categories}
          countries={countries}
          onRefresh={loadAdminData}
        />
      )}

      {/* Tab 8: Community & Prayer Wall */}
      {activeTab === 'community' && <AdminCommunityTab />}

      {/* Tab 9: Financial Transactions */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Tracking ID</th>
                    <th className="py-3 px-4 font-semibold">Method</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No financial records found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-white">{p.trackingId}</td>
                        <td className="py-3 px-4 text-slate-300">{p.paymentMethod}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          {p.currency} {(p.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{p.description}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 10: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tickets List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Broadcaster Tickets</h3>
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No open tickets at this time.</p>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 rounded-2xl border transition-colors cursor-pointer text-xs space-y-1.5 ${
                        selectedTicket?.id === t.id
                          ? 'bg-amber-950/40 border-amber-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{t.subject}</span>
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{t.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              {selectedTicket ? (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white">
                    Reply to: {selectedTicket.subject}
                  </h3>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">
                      Original Broadcaster Message:
                    </div>
                    {selectedTicket.message}
                  </div>

                  <form onSubmit={handleSendTicketReply} className="space-y-3 text-xs">
                    <label className="block font-medium text-slate-300">Staff Response</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Type engineering resolution or response..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Send Reply
                    </button>
                  </form>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-400">
                  Select a ticket from the list to view details and send engineering reply.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 11: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Immutable Platform Audit Trail</h3>
          <div className="space-y-2 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No audit trail entries recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-amber-400">{log.action}</span>
                    <span className="text-slate-400 ml-2">{log.details}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}

