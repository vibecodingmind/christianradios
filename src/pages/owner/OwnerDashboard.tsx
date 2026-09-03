import React, { useState, useEffect } from 'react';
import {
  Radio,
  PlusCircle,
  Activity,
  BarChart3,
  CreditCard,
  Sparkles,
  LifeBuoy,
  Settings,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Globe,
  Trash2,
  Edit3,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Check,
  Send,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  HeartHandshake,
  DownloadCloud,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { apiFetch } from '../../lib/api';
import { WeeklyScheduleEditor } from '../../components/owner/WeeklyScheduleEditor';
import { StreamHealthDashboard } from '../../components/owner/StreamHealthDashboard';
import { DonationsLedger } from '../../components/owner/DonationsLedger';
import { RadioImportModal } from '../../components/owner/RadioImportModal';
import { StationClaimsTab } from '../../components/owner/StationClaimsTab';
import { ClaimStationModal } from '../../components/station/ClaimStationModal';
import type {
  Station,
  SubscriptionPlan,
  Subscription,
  Payment,
  Invoice,
  FeaturedCampaign,
  SupportTicket,
  BroadcastScheduleItem,
  Category,
  Country,
} from '../../types';

interface OwnerDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const { user, ownerProfile, subscription, plan, refreshUser } = useAuth();
  const { playStation } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'stations'
    | 'claims'
    | 'schedule'
    | 'health'
    | 'donations'
    | 'analytics'
    | 'billing'
    | 'promotion'
    | 'support'
  >('overview');

  const [stations, setStations] = useState<Station[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [campaigns, setCampaigns] = useState<FeaturedCampaign[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalPlays: number;
    totalListeningSeconds: number;
    activeListeners: number;
    recentPlays: Array<{ date: string; plays: number }>;
    topCountries: Array<{ country: string; count: number }>;
  }>({
    totalPlays: 0,
    totalListeningSeconds: 0,
    activeListeners: 0,
    recentPlays: [],
    topCountries: [],
  });

  const [loading, setLoading] = useState(true);
  const [syncingStationId, setSyncingStationId] = useState<string | null>(null);

  // Import & Claims Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimingStationInfo, setClaimingStationInfo] = useState<{ id: string; name: string } | null>(null);

  // Station Creation / Edit Modal State
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    logoUrl: '',
    coverUrl: '',
    countryCode: 'TZ',
    city: '',
    language: 'Swahili',
    genre: 'Gospel & Praise',
    categoryId: 'cat_gospel_music',
    denomination: '',
    websiteUrl: '',
    email: '',
    phone: '',
    streamUrl: '',
    backupStreamUrl: '',
    streamType: 'MP3',
    bitrateKbps: 128,
    timezone: 'Africa/Dar_es_Salaam',
  });
  const [testingStream, setTestingStream] = useState(false);
  const [streamTestResult, setStreamTestResult] = useState<{
    valid: boolean;
    error?: string;
    details?: any;
  } | null>(null);

  // Billing Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CARD'>('MPESA');
  const [checkoutPhone, setCheckoutPhone] = useState('255754123456');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Schedule Editor Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStation, setScheduleStation] = useState<Station | null>(null);
  const [scheduleItems, setScheduleItems] = useState<BroadcastScheduleItem[]>([]);

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('STREAM_SETUP');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

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

  // Load Owner Data
  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const [stRes, plRes, anRes, invRes, campRes, tickRes, catRes, countRes] = await Promise.all([
        apiFetch('/api/owner/stations'),
        apiFetch('/api/owner/plans'),
        apiFetch('/api/owner/analytics'),
        apiFetch('/api/owner/invoices'),
        apiFetch('/api/owner/featured-campaigns'),
        apiFetch('/api/owner/support-tickets'),
        apiFetch('/api/public/categories'),
        apiFetch('/api/public/countries'),
      ]);

      const [stData, plData, anData, invData, campData, tickData, catData, countData] = await Promise.all([
        safeJson(stRes),
        safeJson(plRes),
        safeJson(anRes),
        safeJson(invRes),
        safeJson(campRes),
        safeJson(tickRes),
        safeJson(catRes),
        safeJson(countRes),
      ]);

      if (stData?.stations) setStations(stData.stations);
      if (plData?.plans) setPlans(plData.plans);
      if (catData?.categories) setCategories(catData.categories);
      if (countData?.countries) setCountries(countData.countries);
      if (anData) {
        const topCountries =
          anData.topCountries ||
          (anData.countryBreakdown
            ? Object.entries(anData.countryBreakdown).map(([country, count]) => ({
                country,
                count: Number(count),
              }))
            : []);

        setAnalytics({
          totalPlays: anData.totalPlays ?? anData.metrics?.totalPlays ?? 0,
          totalListeningSeconds:
            anData.totalListeningSeconds ??
            (anData.metrics?.totalListeningMinutes ? anData.metrics.totalListeningMinutes * 60 : 0),
          activeListeners: anData.activeListeners ?? anData.metrics?.estimatedActiveListeners ?? 0,
          recentPlays: anData.recentPlays || anData.dailyPlays || [],
          topCountries,
        });
      }
      if (invData?.invoices) setInvoices(invData.invoices);
      if (campData?.campaigns) setCampaigns(campData.campaigns);
      if (tickData?.tickets) setTickets(tickData.tickets);
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  // Sync Station from External Source (RadioKing, Zeno, Icecast, etc.)
  const handleSyncStation = async (id: string) => {
    setSyncingStationId(id);
    try {
      const res = await apiFetch(`/api/owner/stations/${id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await loadOwnerData();
      } else {
        alert(data.error || 'Failed to sync station from external source');
      }
    } catch {
      alert('Error synchronizing station data');
    } finally {
      setSyncingStationId(null);
    }
  };

  // Handle Stream Test
  const handleTestStream = async () => {
    if (!formData.streamUrl) return;
    setTestingStream(true);
    setStreamTestResult(null);
    try {
      const res = await apiFetch('/api/owner/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: formData.streamUrl,
          backupStreamUrl: formData.backupStreamUrl || undefined,
        }),
      });
      const data = await res.json();
      setStreamTestResult(data);
    } catch (err) {
      setStreamTestResult({ valid: false, error: 'Network error during stream check.' });
    } finally {
      setTestingStream(false);
    }
  };

  // Save Station (Create or Update)
  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStation
        ? `/api/owner/stations/${editingStation.id}`
        : '/api/owner/stations';
      const method = editingStation ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowStationModal(false);
        setEditingStation(null);
        await loadOwnerData();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to save station');
      }
    } catch {
      alert('Error saving station');
    }
  };

  // Delete Station
  const handleDeleteStation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete station "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/owner/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadOwnerData();
      }
    } catch {}
  };

  // Trigger On-Demand Health Check
  const handleCheckStreamHealth = async (id: string) => {
    try {
      const res = await apiFetch(`/api/owner/stations/${id}/health-check`, { method: 'POST' });
      if (res.ok) {
        await loadOwnerData();
      }
    } catch {}
  };

  // Process Subscription Checkout via PesaPal
  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setIsProcessingPayment(true);
    try {
      const res = await apiFetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForCheckout.id,
          billingInterval,
          paymentMethod,
          phoneNumber: checkoutPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentSuccess(true);
        await refreshUser();
        await loadOwnerData();
        setTimeout(() => {
          setShowCheckoutModal(false);
          setPaymentSuccess(false);
        }, 2000);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch {
      alert('Payment processing error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    setIsSubmittingTicket(true);
    try {
      const res = await apiFetch('/api/owner/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          category: ticketCategory,
          message: ticketMessage,
          priority: ticketPriority,
        }),
      });
      if (res.ok) {
        setTicketSubject('');
        setTicketMessage('');
        await loadOwnerData();
      }
    } catch {}
    finally {
      setIsSubmittingTicket(false);
    }
  };

  interface OwnerMenuItem {
    id: typeof activeTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }

  interface OwnerMenuGroup {
    title: string;
    items: OwnerMenuItem[];
  }

  const ownerMenuGroups: OwnerMenuGroup[] = [
    {
      title: 'Station & Stream',
      items: [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'stations', label: 'My Stations', icon: Radio, badge: stations.length },
        { id: 'claims', label: 'Station Claims', icon: ShieldCheck },
        { id: 'health', label: 'Stream Health', icon: Activity },
        { id: 'schedule', label: 'Weekly Schedule', icon: Calendar },
      ],
    },
    {
      title: 'Growth & Ministry',
      items: [
        { id: 'analytics', label: 'Listener Analytics', icon: BarChart3 },
        { id: 'donations', label: 'Donations & Tithes', icon: HeartHandshake },
        { id: 'promotion', label: 'Featured Promotion', icon: Sparkles, badge: campaigns.length || undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
      ],
    },
    {
      title: 'Account & Desk',
      items: [
        { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
        { id: 'support', label: 'Support Desk', icon: LifeBuoy, badge: tickets.length || undefined, badgeColor: 'bg-sky-500/20 text-sky-300' },
      ],
    },
  ];

  const currentTabObj = ownerMenuGroups.flatMap((g) => g.items).find((i) => i.id === activeTab);

  return (
    <div className="space-y-6 pb-20">
      {/* Broadcaster Hub Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Radio className="w-4 h-4" />
            Broadcaster SaaS Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {ownerProfile?.organizationName || 'Broadcaster Workspace'}
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Account: {user?.email}</span>
            <span>•</span>
            <span className="text-sky-400 font-semibold">{plan?.name || 'Starter Tier'}</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Broadcaster Active
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Import Radio Station
          </button>
          <button
            onClick={() => {
              setEditingStation(null);
              setFormData({
                name: '',
                tagline: '',
                description: '',
                logoUrl: '',
                coverUrl: '',
                countryCode: 'TZ',
                city: 'Dar es Salaam',
                language: 'Swahili',
                genre: 'Gospel & Praise',
                categoryId: 'cat_gospel_music',
                denomination: '',
                websiteUrl: '',
                email: '',
                phone: '',
                streamUrl: '',
                backupStreamUrl: '',
                streamType: 'MP3',
                bitrateKbps: 128,
                timezone: 'Africa/Dar_es_Salaam',
              });
              setStreamTestResult(null);
              setShowStationModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Add New Station
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Button & Bar */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors"
            aria-label="Open workspace menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3" /> Broadcaster Workspace
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              {currentTabObj && <currentTabObj.icon className="w-3.5 h-3.5 text-emerald-400" />}
              {currentTabObj?.label || 'Workspace'}
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-none">Workspace</div>
                  <div className="text-[10px] text-emerald-400 font-semibold leading-none mt-1">Broadcaster Hub</div>
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
              {ownerMenuGroups.map((group, idx) => (
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
                            ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-none">Workspace</div>
                  <div className="text-[10px] text-emerald-400 font-semibold leading-none mt-1">Broadcaster Hub</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* Grouped Menu Items */}
          <div className="space-y-4 py-1">
            {ownerMenuGroups.map((group, gIdx) => (
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
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className={`flex items-center ${isSidebarOpen ? 'gap-2.5' : 'justify-center'}`}>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        {isSidebarOpen && <span className="truncate">{item.label}</span>}
                      </div>

                      {isSidebarOpen && item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Station Plays
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {(analytics?.totalPlays ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                +14.2% from last week
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Listening Time
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {Math.round((analytics?.totalListeningSeconds ?? 0) / 3600).toLocaleString()} hrs
              </div>
              <span className="text-[11px] text-sky-400">Recorded across web & mobile</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Stations
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {stations.filter((s) => s.streamStatus === 'ONLINE').length} / {stations.length}
              </div>
              <span className="text-[11px] text-slate-400">Continuous 2-min health check</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Current Plan
              </span>
              <div className="text-xl sm:text-2xl font-bold text-sky-400">
                {plan?.name || 'Professional'}
              </div>
              <span className="text-[11px] text-slate-400">
                Up to {plan?.maxStations || 5} Stations Included
              </span>
            </div>
          </div>

          {/* Quick Stations Status Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                Live Broadcast Feeds & Health
              </h3>
              <button
                onClick={() => setActiveTab('stations')}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300"
              >
                Manage Stations →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Station Name</th>
                    <th className="pb-3 font-semibold">Stream Status</th>
                    <th className="pb-3 font-semibold">Latency</th>
                    <th className="pb-3 font-semibold">Bitrate</th>
                    <th className="pb-3 font-semibold">Total Plays</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stations.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-white flex items-center gap-3">
                        <img
                          src={st.logoUrl}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover bg-slate-800"
                        />
                        <div>
                          <div>{st.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {st.city}, {st.countryCode}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        {st.streamStatus === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-300">{st.responseLatencyMs || 120} ms</td>
                      <td className="py-3 text-slate-300">{st.bitrateKbps || 128} kbps</td>
                      <td className="py-3 text-slate-300 font-semibold">
                        {(st.playCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setScheduleStation(st);
                              setActiveTab('schedule');
                            }}
                            className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                            title="Edit Weekly Schedule"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCheckStreamHealth(st.id)}
                            className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                            title="Run health check"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stations Management */}
      {activeTab === 'stations' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <h2 className="text-xl font-bold text-white">Your Radio Stations</h2>
              <p className="text-xs text-slate-400">
                Manage your broadcast fleet, schedule, external stream sync, or claim existing stations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setClaimingStationInfo(null);
                  setShowClaimModal(true);
                }}
                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Claim Existing Station
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Import Radio
              </button>
              <button
                onClick={() => {
                  setEditingStation(null);
                  setFormData({
                    name: '',
                    tagline: '',
                    description: '',
                    logoUrl: '',
                    coverUrl: '',
                    countryCode: 'TZ',
                    city: 'Dar es Salaam',
                    language: 'Swahili',
                    genre: 'Gospel & Praise',
                    categoryId: 'cat_gospel_music',
                    denomination: '',
                    websiteUrl: '',
                    email: '',
                    phone: '',
                    streamUrl: '',
                    backupStreamUrl: '',
                    streamType: 'MP3',
                    bitrateKbps: 128,
                    timezone: 'Africa/Dar_es_Salaam',
                  });
                  setStreamTestResult(null);
                  setShowStationModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Station
              </button>
            </div>
          </div>

          {stations.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">No Radio Stations Registered Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Start broadcasting your Christian ministry to thousands of global listeners today using any of these 3 easy methods:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                <div
                  onClick={() => {
                    setEditingStation(null);
                    setShowStationModal(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer group space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">Create from Scratch</h4>
                  <p className="text-[11px] text-slate-400">
                    Enter your station details, cover graphics, and Shoutcast/Icecast/HLS stream URL directly.
                  </p>
                </div>

                <div
                  onClick={() => setShowImportModal(true)}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition">Import from Provider</h4>
                  <p className="text-[11px] text-slate-400">
                    Paste your RadioKing, Zeno Media, or AzuraCast page link to auto-extract metadata and live stream.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setClaimingStationInfo(null);
                    setShowClaimModal(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">Claim Existing Station</h4>
                  <p className="text-[11px] text-slate-400">
                    Is your station already in our global directory? Verify your ministry credentials to take ownership.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((st) => (
              <div
                key={st.id}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <img
                      src={st.logoUrl}
                      alt={st.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-800 border border-slate-700 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col items-end gap-1">
                      {st.streamStatus === 'ONLINE' ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Online
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          Offline
                        </span>
                      )}
                      {st.sourceType && st.sourceType !== 'MANUAL' && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.2 rounded">
                          {st.sourceType}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white">{st.name}</h3>
                  <p className="text-xs text-sky-400 italic mb-2">"{st.tagline || st.genre}"</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{st.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Stream Format:</span>
                    <span className="text-slate-200 font-semibold">
                      {st.streamType} • {st.bitrateKbps || 128} kbps
                    </span>
                  </div>

                  {st.sourceType && st.sourceType !== 'MANUAL' && (
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>External Source:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-300 font-medium text-[11px]">{st.sourceType}</span>
                        <button
                          onClick={() => handleSyncStation(st.id)}
                          disabled={syncingStationId === st.id}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                          title="Sync from external provider now"
                        >
                          <RotateCw className={`w-3 h-3 ${syncingStationId === st.id ? 'animate-spin text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Backup Failover:</span>
                    <span className="text-slate-200 font-semibold">
                      {st.backupStreamUrl ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => playStation(st)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold py-1.5 px-3 rounded-xl transition-colors"
                    >
                      Preview Audio
                    </button>

                    <button
                      onClick={() => {
                        setEditingStation(st);
                        setFormData({
                          name: st.name,
                          tagline: st.tagline || '',
                          description: st.description,
                          logoUrl: st.logoUrl,
                          coverUrl: st.coverUrl || '',
                          countryCode: st.countryCode,
                          city: st.city,
                          language: st.language,
                          genre: st.genre,
                          categoryId: st.categoryId,
                          denomination: st.denomination || '',
                          websiteUrl: st.websiteUrl || '',
                          email: st.email || '',
                          phone: st.phone || '',
                          streamUrl: st.streamUrl,
                          backupStreamUrl: st.backupStreamUrl || '',
                          streamType: st.streamType,
                          bitrateKbps: st.bitrateKbps || 128,
                          timezone: st.timezone || 'Africa/Dar_es_Salaam',
                        });
                        setShowStationModal(true);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                      title="Edit Station"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setScheduleStation(st);
                        setActiveTab('schedule');
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl transition"
                      title="Broadcast Timetable & Shows"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteStation(st.id, st.name)}
                      className="p-2 bg-slate-800 hover:bg-rose-900/30 text-rose-400 rounded-xl"
                      title="Delete Station"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Station Ownership Claims */}
      {activeTab === 'claims' && (
        <StationClaimsTab
          ownerEmail={user?.email || ''}
          ownerName={ownerProfile?.contactPerson || ownerProfile?.organizationName || user?.name || ''}
          stations={stations}
        />
      )}

      {/* Tab: Weekly Programming Schedule */}
      {activeTab === 'schedule' && (
        <WeeklyScheduleEditor
          stations={stations}
          initialSelectedStationId={scheduleStation?.id}
          onSaveSchedule={async () => {
            await loadOwnerData();
          }}
        />
      )}

      {/* Tab: Stream Health & Diagnostics */}
      {activeTab === 'health' && (
        <StreamHealthDashboard
          stations={stations}
          onRefreshStations={loadOwnerData}
        />
      )}

      {/* Tab: Donations & Tithes Ledger */}
      {activeTab === 'donations' && (
        <DonationsLedger stations={stations} />
      )}

      {/* Tab 3: Listener Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Real-Time Listener Statistics & Engagement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Play Trends */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daily Play Trends (Last 7 Days)
                </span>
                <div className="space-y-2">
                  {(analytics.recentPlays || []).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{p.date}</span>
                      <div className="flex-1 mx-4 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(15, ((p.plays || 0) / 1500) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-mono font-semibold">
                        {(p.plays || 0).toLocaleString()} plays
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Country Breakdown */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Listener Country Breakdown
                </span>
                <div className="space-y-3">
                  {(analytics.topCountries || []).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{c.country}</span>
                      <div className="flex-1 mx-4 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, ((c.count || 0) / 3000) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="text-emerald-400 font-mono font-semibold">
                        {(c.count || 0).toLocaleString()} listeners
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Plans & Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white">Subscription & Broadcaster Plans</h2>
            <p className="text-xs text-slate-400">
              Upgrade your station limits, stream monitoring frequency, and analytics level.
            </p>
          </div>

          {/* Pricing Tier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => {
              const isCurrent = plan?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/10'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{p.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                          Active Plan
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-2xl font-extrabold text-white">
                        TZS {Number(p.monthlyPriceTzs || 0).toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal"> / month</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        (~${p.monthlyPriceUsd} USD)
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">{p.description}</p>

                    <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Up to {p.maxStations} Stations</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{p.analyticsAccessLevel.replace('_', ' ')} Analytics</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{p.streamMonitoringIntervalMinutes}-min Health Monitoring</span>
                      </div>
                      {p.prioritySupport && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Priority Engineering Support</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlanForCheckout(p);
                      setShowCheckoutModal(true);
                    }}
                    disabled={isCurrent}
                    className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Invoices List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Payment Invoices</h3>
            {invoices.length > 0 ? (
              <div className="divide-y divide-slate-800 text-xs">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {inv.planName} • Issued on {new Date(inv.issuedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-white">
                        {inv.currency || 'TZS'} {Number(inv.amount || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No payment invoices found.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Promotion */}
      {activeTab === 'promotion' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-4 h-4" />
              Grow Your Listener Base
            </div>
            <h2 className="text-2xl font-bold text-white">
              Featured Homepage & Top Placement Campaigns
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Feature your radio station at the top of Christian Radios to get up to 5x more
              listeners. Placement includes high-visibility homepage hero banner, top category badge,
              and highlighted search suggestions.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Your Promotion Campaigns</h3>
            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{camp.placement.replace('_', ' ')}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(camp.startDate).toLocaleDateString()} -{' '}
                        {new Date(camp.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Impressions</span>
                        <span className="font-bold text-white">{Number(camp.impressions || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Clicks</span>
                        <span className="font-bold text-sky-400">{Number(camp.clicks || 0).toLocaleString()}</span>
                      </div>
                      <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">
                        {camp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No active promotional campaigns. Contact support to book prime spot placements.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Support */}
      {activeTab === 'support' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Submit Support Ticket */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Submit Engineering Ticket</h2>
              <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Icecast SSL mount point connection assistance"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    >
                      <option value="STREAM_SETUP">Stream Setup & Audio</option>
                      <option value="BILLING">Subscription & Billing</option>
                      <option value="VERIFICATION">Broadcaster Verification</option>
                      <option value="OTHER">Other Query</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Message Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please describe your technical requirement or issue..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            {/* Right: Existing Tickets */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Your Support Tickets</h2>
              {tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((tick) => (
                    <div
                      key={tick.id}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{tick.subject}</span>
                        <span className="text-[10px] font-bold bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full">
                          {tick.status}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{tick.message}</p>
                      {tick.responses && tick.responses.length > 0 && (
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-sky-300">
                          <span className="font-semibold text-[10px] block">
                            Latest Reply from Christian Radios Engineering:
                          </span>
                          {tick.responses[tick.responses.length - 1].message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No support tickets created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
        </main>
      </div>

      {/* MODAL 1: Create / Edit Station Modal with Live SSRF Test */}
      {showStationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative my-8">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingStation ? 'Edit Radio Station' : 'Register New Radio Station'}
            </h2>

            <form onSubmit={handleSaveStation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Station Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radio Maria Tanzania"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. Sauti ya Kikristo Nyumbani Mwako"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of your Christian radio station..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Country</label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="TZ">🇹🇿 Tanzania</option>
                    <option value="KE">🇰🇪 Kenya</option>
                    <option value="UG">🇺🇬 Uganda</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="ZA">🇿🇦 South Africa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">City / Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dar es Salaam"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swahili"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              {/* Stream URL & Live SSRF Test */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Audio Stream Endpoint Configuration
                </span>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Primary Live Stream URL (Icecast / Shoutcast / Direct MP3 / HLS)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://stream.radiomaria.org/live"
                      value={formData.streamUrl}
                      onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleTestStream}
                      disabled={testingStream || !formData.streamUrl}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-xl shrink-0 disabled:opacity-50"
                    >
                      {testingStream ? 'Testing...' : 'Test Stream'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Backup Failover Stream URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://backup.radiomaria.org/live"
                    value={formData.backupStreamUrl}
                    onChange={(e) => setFormData({ ...formData, backupStreamUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                {streamTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      streamTestResult.valid
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {streamTestResult.valid ? (
                      <span className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Stream reachable & verified!
                      </span>
                    ) : (
                      <span>{streamTestResult.error || 'Stream validation failed'}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Station Logo URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/logo.jpg"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Cover Artwork URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/cover.jpg"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStationModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl"
                >
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PesaPal Plan Checkout Modal */}
      {showCheckoutModal && selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Upgrade to {selectedPlanForCheckout.name}</h2>
            <p className="text-xs text-slate-400 mb-4">
              Secure subscription payment processing via PesaPal Gateway.
            </p>

            {paymentSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Payment Successful!</h3>
                <p className="text-xs text-slate-300">
                  Your subscription is now active. Enjoy higher limits and enterprise stream monitoring.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessCheckout} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Billing Interval</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingInterval('MONTHLY')}
                      className={`p-2.5 rounded-xl border font-semibold ${
                        billingInterval === 'MONTHLY'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Monthly (TZS {Number(selectedPlanForCheckout.monthlyPriceTzs || 0).toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingInterval('ANNUAL')}
                      className={`p-2.5 rounded-xl border font-semibold ${
                        billingInterval === 'ANNUAL'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Annual (Save 15%)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MPESA')}
                      className={`p-2 rounded-xl border font-semibold ${
                        paymentMethod === 'MPESA'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Vodacom M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TIGO_PESA')}
                      className={`p-2 rounded-xl border font-semibold ${
                        paymentMethod === 'TIGO_PESA'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Tigo Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                      className={`p-2 rounded-xl border font-semibold ${
                        paymentMethod === 'AIRTEL_MONEY'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Airtel Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-2 rounded-xl border font-semibold ${
                        paymentMethod === 'CARD'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Credit / Debit Card
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Mobile Money / Notification Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="2557XXXXXXXX"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {isProcessingPayment ? 'Processing PesaPal...' : 'Pay & Activate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Radio Import Modal */}
      <RadioImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={async () => {
          await loadOwnerData();
        }}
        categories={categories}
        availableCountries={countries.map((c) => ({ code: c.code, name: c.name }))}
        onOpenClaimModal={(stationId, stationName) => {
          setClaimingStationInfo({ id: stationId, name: stationName });
          setShowClaimModal(true);
        }}
      />

      {/* Claim Station Modal */}
      <ClaimStationModal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
          setClaimingStationInfo(null);
        }}
        stationId={claimingStationInfo?.id}
        stationName={claimingStationInfo?.name}
        initialEmail={user?.email}
        initialName={user?.name}
        isBroadcasterUser={true}
        onSuccess={async () => {
          await loadOwnerData();
        }}
      />
    </div>
  );
}
