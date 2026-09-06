import React, { useState, useEffect } from 'react';
import {
  Radio,
  PlusCircle,
  Activity,
  BarChart3,
  CreditCard,
  Sparkles,
  Wand2,
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
  Heart,
  DownloadCloud,
  Layers,
  LayoutGrid,
  List,
  ArrowLeft,
  LogOut,
  Mic2,
  Music,
  Play,
  Pause,
  PlayCircle,
  PauseCircle,
  StopCircle,
  ArrowRight,
  Lock,
  Smartphone,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { apiFetch } from '../../lib/api';
import { WeeklyScheduleEditor } from '../../components/owner/WeeklyScheduleEditor';
import { StreamHealthDashboard } from '../../components/owner/StreamHealthDashboard';
import { DonationsLedger } from '../../components/owner/DonationsLedger';
import { OwnerPrayerInbox } from '../../components/owner/OwnerPrayerInbox';
import { OwnerStudioDesk } from '../../components/owner/OwnerStudioDesk';
import { LiveListenerMap } from '../../components/analytics/LiveListenerMap';
import { RadioImportModal } from '../../components/owner/RadioImportModal';
import { StationClaimsTab } from '../../components/owner/StationClaimsTab';
import { StationWizardModal } from '../../components/owner/StationWizardModal';
import { ClaimStationModal } from '../../components/station/ClaimStationModal';
import { OwnerKYCForm } from '../../components/kyc/OwnerKYCForm';
import { OwnerSupportDesk } from '../../components/owner/OwnerSupportDesk';
import { NotificationBell } from '../../components/notifications/NotificationBell';
import { WORLDWIDE_COUNTRIES } from '../../data/worldwideCountries';
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
  initialParam?: string;
}

export function OwnerDashboard({ onNavigate, initialParam }: OwnerDashboardProps) {
  const { user, ownerProfile, subscription, plan, refreshUser, logout } = useAuth();
  const { playStation } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'stations'
    | 'verification'
    | 'claims'
    | 'schedule'
    | 'health'
    | 'donations'
    | 'prayers'
    | 'studio'
    | 'analytics'
    | 'billing'
    | 'promotion'
    | 'support'
  >('overview');

  useEffect(() => {
    if (initialParam === 'add-station') {
      setActiveTab('stations');
      setShowStationModal(true);
    } else if (initialParam === 'prayers' || initialParam === 'prayer-inbox') {
      setActiveTab('prayers');
    } else if (initialParam === 'studio' || initialParam === 'song-requests') {
      setActiveTab('studio');
    } else if (initialParam === 'billing' || initialParam === 'subscription') {
      setActiveTab('billing');
    } else if (initialParam === 'donations' || initialParam === 'withdraw') {
      setActiveTab('donations');
    } else if (initialParam?.startsWith('claim-station')) {
      setActiveTab('claims');
      const stId = initialParam.split(':')[1];
      if (stId) {
        fetch(`/api/public/stations/${stId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.station) {
              setClaimingStationInfo({ id: data.station.id, name: data.station.name });
            } else {
              setClaimingStationInfo({ id: stId, name: 'Target Radio Station' });
            }
            setShowClaimModal(true);
          })
          .catch(() => {
            setClaimingStationInfo({ id: stId, name: 'Target Radio Station' });
            setShowClaimModal(true);
          });
      } else {
        setShowClaimModal(true);
      }
    }
  }, [initialParam]);

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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
    categoryId: 'cat_gospel',
    categoryIds: ['cat_gospel'],
    denomination: '',
    websiteUrl: '',
    email: '',
    phone: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      whatsapp: '',
      tiktok: '',
      linkedin: '',
    },
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

  const [extractingStream, setExtractingStream] = useState(false);
  const [extractPageUrl, setExtractPageUrl] = useState('');
  const [showExtractorInput, setShowExtractorInput] = useState(false);

  // Billing & In-Place Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [checkoutGateway, setCheckoutGateway] = useState<'PESAPAL' | 'PAYPAL' | 'STRIPE'>('PESAPAL');
  const [pesapalMethod, setPesapalMethod] = useState<'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CARD'>('MPESA');
  const [checkoutPhone, setCheckoutPhone] = useState('255754123456');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('Kingdom Broadcaster');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccessData, setCheckoutSuccessData] = useState<{
    payment?: Payment;
    invoice?: Invoice;
  } | null>(null);

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

  // Promotion Campaign State
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteStationId, setPromoteStationId] = useState('');
  const [promotePlacement, setPromotePlacement] = useState<'HOMEPAGE_HERO' | 'CATEGORY_TOP'>('HOMEPAGE_HERO');
  const [promoteDurationDays, setPromoteDurationDays] = useState(30);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [campaignActionLoading, setCampaignActionLoading] = useState<string | null>(null);

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

  // Handle Automatic Stream Link Extraction from Web Page URL
  const handleExtractStream = async () => {
    if (!extractPageUrl.trim()) return;
    setExtractingStream(true);
    try {
      const res = await apiFetch('/api/owner/extract-stream-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl: extractPageUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.extractedStreamUrl) {
        setFormData((prev) => ({
          ...prev,
          streamUrl: data.extractedStreamUrl,
          streamType: data.detectedType || prev.streamType,
        }));
        setStreamTestResult({
          valid: true,
          error: undefined,
          details: { message: `Extracted direct stream URL: ${data.extractedStreamUrl}` },
        });
        alert(`Successfully extracted direct stream URL: ${data.extractedStreamUrl}`);
        setShowExtractorInput(false);
      } else {
        alert(data.error || 'Could not find a direct stream URL on that page source.');
      }
    } catch (err: any) {
      alert('Extraction failed: ' + (err.message || 'Network error'));
    } finally {
      setExtractingStream(false);
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

  // Process Subscription In-Place Checkout
  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setIsProcessingPayment(true);
    setCheckoutError(null);

    const isAnnual = billingInterval === 'ANNUAL';
    const priceUsd = isAnnual
      ? (selectedPlanForCheckout.annualPriceUsd || (selectedPlanForCheckout.monthlyPriceUsd ? Math.round(selectedPlanForCheckout.monthlyPriceUsd * 10) : 0))
      : (selectedPlanForCheckout.monthlyPriceUsd || 0);

    try {
      if (checkoutGateway === 'PESAPAL') {
        const res = await apiFetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: selectedPlanForCheckout.id,
            billingInterval,
            paymentMethod: pesapalMethod,
            phoneNumber: checkoutPhone,
            simulateInstant: true,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'PesaPal payment processing failed.');
        }

        setCheckoutSuccessData({
          payment: data.payment,
          invoice: data.invoice,
        });
      } else if (checkoutGateway === 'PAYPAL') {
        const createRes = await apiFetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceUsd,
            currency: 'USD',
            description: `${selectedPlanForCheckout.name} Broadcaster Plan (${billingInterval})`,
            ownerId: user?.id,
            planId: selectedPlanForCheckout.id,
            billingInterval,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || 'PayPal order creation failed.');

        const capRes = await apiFetch('/api/payments/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createData.orderId,
            trackingId: createData.trackingId,
          }),
        });

        const capData = await capRes.json();
        if (!capRes.ok || !capData.success) {
          throw new Error(capData.error || 'PayPal transaction capture failed.');
        }

        setCheckoutSuccessData({
          payment: capData.payment,
          invoice: capData.invoice,
        });
      } else if (checkoutGateway === 'STRIPE') {
        const intentRes = await apiFetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceUsd,
            currency: 'USD',
            description: `${selectedPlanForCheckout.name} Broadcaster Subscription (${billingInterval})`,
            ownerId: user?.id,
            planId: selectedPlanForCheckout.id,
            billingInterval,
          }),
        });

        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.error || 'Stripe intent creation failed.');

        const confirmRes = await apiFetch('/api/payments/stripe/confirm-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingId: intentData.trackingId,
            paymentIntentId: intentData.clientSecret,
          }),
        });

        const confirmData = await confirmRes.json();
        if (!confirmRes.ok || !confirmData.success) {
          throw new Error(confirmData.error || 'Card payment confirmation failed.');
        }

        setCheckoutSuccessData({
          payment: confirmData.payment,
          invoice: confirmData.invoice,
        });
      }

      setPaymentSuccess(true);
      await refreshUser();
      await loadOwnerData();

      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment processing failed. Please verify your details.');
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

  // Launch Promotion Campaign
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteStationId) {
      alert('Please select a station to promote');
      return;
    }
    setIsCreatingCampaign(true);
    try {
      const res = await apiFetch('/api/owner/featured-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: promoteStationId,
          placement: promotePlacement,
          durationDays: promoteDurationDays,
          status: 'ACTIVE',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPromoteModal(false);
        await loadOwnerData();
      } else {
        alert(data.error || 'Failed to launch promotion campaign');
      }
    } catch {
      alert('Error launching promotion campaign');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Pause / Resume Promotion Campaign
  const handleUpdateCampaignStatus = async (campaignId: string, status: 'ACTIVE' | 'PAUSED') => {
    setCampaignActionLoading(campaignId);
    try {
      const res = await apiFetch(`/api/owner/featured-campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadOwnerData();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to update campaign');
      }
    } catch {
      alert('Failed to update campaign status');
    } finally {
      setCampaignActionLoading(null);
    }
  };

  // Cancel / Delete Promotion Campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to cancel and remove this promotional campaign?')) return;
    setCampaignActionLoading(campaignId);
    try {
      const res = await apiFetch(`/api/owner/featured-campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadOwnerData();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to cancel campaign');
      }
    } catch {
      alert('Failed to cancel campaign');
    } finally {
      setCampaignActionLoading(null);
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
        { id: 'studio', label: 'Song Requests', icon: Mic2, badge: 'Live Show', badgeColor: 'bg-sky-500/20 text-sky-300' },
        { id: 'prayers', label: 'Prayer Requests', icon: Heart, badge: 'Live', badgeColor: 'bg-amber-500/20 text-amber-300' },
        { id: 'donations', label: 'Donations & Tithes', icon: HeartHandshake },
        { id: 'promotion', label: 'Featured Promotion', icon: Sparkles, badge: campaigns.length || undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
      ],
    },
    {
      title: 'Account & Desk',
      items: [
        {
          id: 'verification',
          label: 'Verification (KYC)',
          icon: ShieldCheck,
          badge: ownerProfile?.verified ? '✓ Verified' : 'Pending',
          badgeColor: ownerProfile?.verified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300',
        },
        { id: 'billing', label: 'Subscriptions', icon: CreditCard },
        { id: 'support', label: 'Support Desk', icon: LifeBuoy, badge: tickets.length || undefined, badgeColor: 'bg-sky-500/20 text-sky-300' },
      ],
    },
  ];

  const currentTabObj = ownerMenuGroups.flatMap((g) => g.items).find((i) => i.id === activeTab);

  return (
    <div className="space-y-6 pb-20">
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

        <div className="flex items-center gap-2">
          <NotificationBell onNavigate={onNavigate} />
          <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            Menu
          </span>
        </div>
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

          {/* Sidebar Footer: Back to Website & Logout */}
          <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1">
            <button
              onClick={() => onNavigate('home')}
              title={!isSidebarOpen ? 'Back to Christian Radios' : undefined}
              className={`w-full rounded-2xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center ${
                isSidebarOpen ? 'px-3 py-2.5 gap-2.5' : 'p-3 justify-center'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400 shrink-0" />
              {isSidebarOpen && <span>Back to Website</span>}
            </button>

            <button
              onClick={async () => {
                await logout();
                onNavigate('home');
              }}
              title={!isSidebarOpen ? 'Sign Out' : undefined}
              className={`w-full rounded-2xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all flex items-center ${
                isSidebarOpen ? 'px-3 py-2.5 gap-2.5' : 'p-3 justify-center'
              }`}
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Tab Content Panel (Right side) */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Radio Owner Verification Alert Banner */}
          {!ownerProfile?.verified && (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Radio Owner Verification Required
                    <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {ownerProfile?.verificationStatus || 'UNVERIFIED'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Complete your Radio Owner KYC verification to publish stations, display public verification badges, and receive listener donations.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('verification')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Complete Verification</span>
              </button>
            </div>
          )}

          {/* Tab: Verification & Compliance */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <OwnerKYCForm
                onSuccess={() => {
                  refreshUser();
                  loadOwnerData();
                }}
              />
            </div>
          )}

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
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800/80 shadow-md">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-emerald-400" />
                My Broadcast Stations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your audio streams, weekly programming schedules, live broadcast metrics, and promotion campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap shrink-0">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dense Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
              </div>

              <button
                onClick={() => setShowImportModal(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Import Radio
              </button>
              <button
                onClick={() => {
                  setEditingStation(null);
                  setShowStationModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" /> Add New Station
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
                    Use our 5-step wizard to setup your station profile, cover graphics, and stream feed.
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
                  onClick={() => setActiveTab('claims')}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">Claim Existing Radio</h4>
                  <p className="text-[11px] text-slate-400">
                    Search already listed Christian stations on our platform and claim verified ownership.
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 px-4 font-bold">Station</th>
                      <th className="py-3 px-4 font-bold">Location</th>
                      <th className="py-3 px-4 font-bold">Stream Health</th>
                      <th className="py-3 px-4 font-bold">Format & Bitrate</th>
                      <th className="py-3 px-4 font-bold">Total Plays</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {stations.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.logoUrl}
                              alt={st.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=100&h=100&fit=crop';
                              }}
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {st.name}
                                {st.isFeatured && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ⭐ FEATURED
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                                {st.streamUrl}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-200">{st.city}, {st.countryCode}</div>
                            <div className="text-[11px] text-slate-400">{st.genre}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {st.streamStatus === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online ({st.responseLatencyMs || 120}ms)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200">
                            {st.streamType} • {st.bitrateKbps || 128} kbps
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-sky-400">
                            {(st.playCount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => playStation(st)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                              Play
                            </button>
                            <button
                              onClick={() => {
                                setScheduleStation(st);
                                setActiveTab('schedule');
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                              title="Edit Schedule"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStation(st);
                                setShowStationModal(true);
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                              title="Edit Station"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((st) => (
                <div
                  key={st.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-200 group"
                >
                  {/* Top Cover Banner */}
                  <div className="relative h-28 w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
                    {st.coverUrl ? (
                      <img
                        src={st.coverUrl}
                        alt={st.name}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-950/40 via-slate-900 to-emerald-950/30" />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                    {/* Top Status & Featured Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div>
                        {st.isFeatured && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                            ⭐ FEATURED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {st.streamStatus === 'ONLINE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live ({st.responseLatencyMs || 60}ms)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Station Info Content */}
                  <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Logo overlapping banner */}
                      <div className="-mt-10 mb-3 flex items-end justify-between">
                        <img
                          src={st.logoUrl}
                          alt={st.name}
                          className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border-2 border-slate-900 shadow-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=120&h=120&fit=crop';
                          }}
                        />
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-semibold text-slate-300">
                          {st.genre}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-white tracking-tight leading-snug">
                        {st.name}
                      </h3>
                      {st.tagline && (
                        <p className="text-xs text-sky-400 italic mt-0.5 truncate">"{st.tagline}"</p>
                      )}
                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {st.description}
                      </p>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Plays</span>
                        <span className="font-extrabold text-white">{(st.playCount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Format</span>
                        <span className="font-extrabold text-sky-400">{st.streamType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Bitrate</span>
                        <span className="font-extrabold text-emerald-400">{st.bitrateKbps || 128}k</span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => playStation(st)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Preview
                      </button>

                      <button
                        onClick={() => {
                          setEditingStation(st);
                          setShowStationModal(true);
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                        title="Edit Station Settings"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setScheduleStation(st);
                          setActiveTab('schedule');
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                        title="Weekly Broadcast Timetable"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setPromoteStationId(st.id);
                          setShowPromoteModal(true);
                        }}
                        className="p-2 bg-slate-800 hover:bg-amber-950/40 text-slate-300 hover:text-amber-400 rounded-xl transition cursor-pointer"
                        title="Promote Station (Top Placement)"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteStation(st.id, st.name)}
                        className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                        title="Delete Station"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Station Ownership Claims */}
      {activeTab === 'claims' && (
        <StationClaimsTab
          ownerEmail={user?.email || ''}
          ownerName={ownerProfile?.contactPerson || ownerProfile?.organizationName || user?.name || ''}
          stations={stations}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onStationClaimed={loadOwnerData}
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

      {/* Tab: Broadcaster Prayer Requests Inbox */}
      {activeTab === 'prayers' && (
        <OwnerPrayerInbox stations={stations} />
      )}

      {/* Tab: Broadcaster Studio Song Requests & Shoutouts */}
      {activeTab === 'studio' && (
        <OwnerStudioDesk
          stations={stations}
          onAddStation={() => {
            setActiveTab('stations');
            setShowStationModal(true);
          }}
          onStationUpdated={(updated) => {
            setStations((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          }}
        />
      )}

      {/* Tab 3: Listener Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Real-time Global Listener Map */}
          <LiveListenerMap />
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

      {/* Tab 4: Subscriptions */}
      {/* Tab 4: Subscriptions */}
      {activeTab === 'billing' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white">Broadcaster Subscriptions & Plans</h2>
            <p className="text-xs text-slate-400">
              Upgrade your station limits, stream monitoring frequency, and analytics level with instant automated activation.
            </p>
          </div>

          {/* Current Active Package Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Current Package
                  </span>
                  <span className="text-xs text-slate-400">
                    Status: <span className="text-emerald-400 font-semibold">{subscription?.status || 'ACTIVE'}</span>
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
                  {plan?.name || 'Free Starter Package'}
                  {plan?.id === 'plan_free' ? (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-md">
                      Default Free Broadcaster
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 rounded-md">
                      Premium Ministry
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  {plan?.description || 'Your default broadcaster package is active with basic station broadcasting tools.'}
                </p>

                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Radio className="w-3.5 h-3.5 text-sky-400" />
                    <span><strong>{stations.length}</strong> of <strong>{plan?.maxStations || 1}</strong> Stations Used</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span><strong>{plan?.streamMonitoringIntervalMinutes || 15} min</strong> Monitoring</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span><strong>{(plan?.analyticsAccessLevel || (plan?.advancedAnalyticsEnabled ? 'ADVANCED' : 'BASIC')).replace('_', ' ')}</strong> Analytics</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {subscription?.currentPeriodEnd
                        ? `Valid until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                        : 'Lifetime Free Starter'}
                    </span>
                  </div>
                </div>
              </div>

              {plan?.id === 'plan_free' && (
                <button
                  onClick={() => {
                    const proPlan = plans.find((p) => p.tier === 'PRO' || p.tier === 'PROFESSIONAL') || plans[1] || plans[0];
                    if (proPlan) {
                      setSelectedPlanForCheckout(proPlan);
                      setPaymentSuccess(false);
                      setCheckoutError(null);
                      setCheckoutSuccessData(null);
                      setShowCheckoutModal(true);
                    }
                  }}
                  className="px-6 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl shadow-sky-500/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade to Pro Ministry
                </button>
              )}
            </div>
          </div>

          {/* Billing Interval Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h4 className="text-sm font-bold text-white">Choose Billing Cycle</h4>
              <p className="text-xs text-slate-400">Save 15% when billed annually for any ministry package.</p>
            </div>
            <div className="inline-flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setBillingInterval('MONTHLY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  billingInterval === 'MONTHLY'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Plans
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('ANNUAL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  billingInterval === 'ANNUAL'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Plans</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                  Save 15%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Tier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent = plan?.id === p.id;
              const analyticsText = (p.analyticsAccessLevel || (p.advancedAnalyticsEnabled ? 'ADVANCED' : 'BASIC')).replace('_', ' ');

              // Prices based on interval
              const priceUsd = billingInterval === 'ANNUAL'
                ? (p.annualPriceUsd || (p.monthlyPriceUsd ? Math.round(p.monthlyPriceUsd * 10) : 0))
                : (p.monthlyPriceUsd || 0);

              const isFreePackage = p.id === 'plan_free' || p.tier === 'FREE' || (!p.monthlyPriceUsd && !p.annualPriceUsd);

              const priceTzs = billingInterval === 'ANNUAL'
                ? (p.annualPriceTzs || (p.monthlyPriceTzs ? Math.round(p.monthlyPriceTzs * 10) : 0))
                : (p.monthlyPriceTzs || 0);

              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/30'
                      : isFreePackage
                      ? 'bg-slate-900/40 border-slate-800/80'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{p.name}</h3>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active Plan
                        </span>
                      ) : isFreePackage ? (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                          Default Free
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-2xl font-extrabold text-white">
                        {isFreePackage ? (
                          <>
                            $0 USD
                            <span className="text-xs text-slate-400 font-normal"> / forever</span>
                          </>
                        ) : (
                          <>
                            ${Number(priceUsd).toLocaleString()} USD
                            <span className="text-xs text-slate-400 font-normal">
                              {' '}/ {billingInterval === 'ANNUAL' ? 'year' : 'month'}
                            </span>
                          </>
                        )}
                      </div>
                      {!isFreePackage && priceTzs > 0 && (
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          approx. TZS {Number(priceTzs).toLocaleString()}
                        </div>
                      )}
                      {isFreePackage && (
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">
                          Always included for all registered broadcasters
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">{p.description}</p>

                    <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Up to {p.maxStations} Station{p.maxStations === 1 ? '' : 's'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{analyticsText} Analytics</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{p.streamMonitoringIntervalMinutes || 15}-min Health Monitoring</span>
                      </div>
                      {p.prioritySupport && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Priority Engineering Support</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60">
                    {isFreePackage ? (
                      <button
                        type="button"
                        disabled={true}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800/70 text-slate-400 border border-slate-750 cursor-not-allowed opacity-80 select-none flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isCurrent ? 'Current Default Plan' : 'Default Free Package'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            setSelectedPlanForCheckout(p);
                            setPaymentSuccess(false);
                            setCheckoutError(null);
                            setCheckoutSuccessData(null);
                            setShowCheckoutModal(true);
                          }
                        }}
                        disabled={isCurrent}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-slate-800 text-slate-500 cursor-default opacity-70 border border-slate-700'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 cursor-pointer'
                        }`}
                      >
                        {isCurrent ? 'Current Package' : 'Select Plan & Checkout'}
                      </button>
                    )}
                    {isFreePackage && (
                      <p className="text-[10px] text-slate-500 text-center mt-2">
                        Free default package is automatically active. Cannot be subscribed as a paid plan.
                      </p>
                    )}
                  </div>
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
                        {inv.currency || 'USD'} ${Number(inv.amount || 0).toLocaleString()}
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
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                Grow Your Listener Base
              </div>
              <h2 className="text-2xl font-bold text-white">
                Featured Homepage & Top Placement Campaigns
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Feature your radio station at the top of Christian Radios to get up to 5x more
                listeners. Placements include high-visibility homepage hero carousel, top category badges,
                and prioritized search recommendations.
              </p>
            </div>
            <button
              onClick={() => {
                if (stations.length === 0) {
                  alert('Please register or claim a station first before launching a promotion.');
                  return;
                }
                setPromoteStationId(stations[0].id);
                setShowPromoteModal(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Promote a Station
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Your Promotion Campaigns</h3>
              <span className="text-xs text-slate-400 font-mono">{campaigns.length} campaigns</span>
            </div>

            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((camp) => {
                  const station = stations.find((s) => s.id === camp.stationId);
                  const isActionLoading = campaignActionLoading === camp.id;

                  return (
                    <div
                      key={camp.id}
                      className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={station?.logoUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=100&h=100&fit=crop'}
                          alt={station?.name || 'Radio'}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=100&h=100&fit=crop';
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm truncate">
                              {station?.name || 'Station Promotion'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              {camp.placement ? camp.placement.replace('_', ' ') : 'HOMEPAGE HERO'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {new Date(camp.startDate).toLocaleDateString()} -{' '}
                            {new Date(camp.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Impressions</span>
                          <span className="font-bold text-white text-sm">{Number(camp.impressions || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Clicks</span>
                          <span className="font-bold text-sky-400 text-sm">{Number(camp.clicks || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Status</span>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block mt-0.5 ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : camp.status === 'PAUSED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>

                        {/* Action Controls: Pause, Resume, Delete */}
                        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 w-full md:w-auto justify-end">
                          {camp.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateCampaignStatus(camp.id, 'PAUSED')}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                              title="Pause Campaign"
                            >
                              <Pause className="w-3.5 h-3.5" /> Pause
                            </button>
                          )}

                          {camp.status === 'PAUSED' && (
                            <button
                              onClick={() => handleUpdateCampaignStatus(camp.id, 'ACTIVE')}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                              title="Resume Campaign"
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Resume
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            disabled={isActionLoading}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
                            title="Cancel / Stop Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-3">
                <Sparkles className="w-8 h-8 text-amber-500/60 mx-auto" />
                <h4 className="text-sm font-bold text-white">No active promotional campaigns</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Launch a homepage placement campaign to get featured on Christian Radios and broadcast to thousands of eager believers.
                </p>
                <button
                  onClick={() => {
                    if (stations.length === 0) {
                      alert('Please register or claim a station first before launching a promotion.');
                      return;
                    }
                    setPromoteStationId(stations[0].id);
                    setShowPromoteModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Launch First Promotion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Support */}
      {activeTab === 'support' && (
        <OwnerSupportDesk
          stations={stations}
          onOpenStationModal={() => setShowStationModal(true)}
        />
      )}
        </main>
      </div>

      {/* Progressive Multi-step Station Wizard Modal */}
      <StationWizardModal
        isOpen={showStationModal}
        onClose={() => {
          setShowStationModal(false);
          setEditingStation(null);
        }}
        onSaved={async () => {
          await loadOwnerData();
        }}
        stationToEdit={editingStation}
        categories={categories}
      />

      {/* Promotion Launch Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Sparkles className="w-5 h-5" />
                Launch Station Promotion
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Radio Station</label>
                <select
                  value={promoteStationId}
                  onChange={(e) => setPromoteStationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none cursor-pointer"
                  required
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.city}, {st.countryCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Placement Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromotePlacement('HOMEPAGE_HERO')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      promotePlacement === 'HOMEPAGE_HERO'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs">Homepage Hero</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-1">Top Carousel (TZS 2,500/day)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromotePlacement('CATEGORY_TOP')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      promotePlacement === 'CATEGORY_TOP'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs">Category Spotlight</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-1">Top category badge (TZS 1,500/day)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Campaign Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPromoteDurationDays(days)}
                      className={`p-2 rounded-xl border text-center font-semibold transition cursor-pointer ${
                        promoteDurationDays === days
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 flex items-center justify-between font-bold">
                <span>Estimated Budget:</span>
                <span className="font-mono text-sm">
                  TZS {(promoteDurationDays * (promotePlacement === 'HOMEPAGE_HERO' ? 2500 : 1500)).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingCampaign ? 'Activating...' : 'Activate Campaign Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: In-Place Broadcaster Subscription Checkout & Activation Modal */}
      {showCheckoutModal && selectedPlanForCheckout && (() => {
        const isAnnual = billingInterval === 'ANNUAL';
        const priceUsd = isAnnual
          ? (selectedPlanForCheckout.annualPriceUsd || (selectedPlanForCheckout.monthlyPriceUsd ? Math.round(selectedPlanForCheckout.monthlyPriceUsd * 10) : 0))
          : (selectedPlanForCheckout.monthlyPriceUsd || 0);

        const priceTzs = isAnnual
          ? (selectedPlanForCheckout.annualPriceTzs || (selectedPlanForCheckout.monthlyPriceTzs ? Math.round(selectedPlanForCheckout.monthlyPriceTzs * 10) : Math.round(priceUsd * 2600)))
          : (selectedPlanForCheckout.monthlyPriceTzs || Math.round(priceUsd * 2600));

        const analyticsText = (
          selectedPlanForCheckout.analyticsAccessLevel ||
          (selectedPlanForCheckout.advancedAnalyticsEnabled ? 'ADVANCED' : 'BASIC')
        ).replace('_', ' ');

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-slate-100 shadow-2xl relative my-8">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (!isProcessingPayment) {
                    setShowCheckoutModal(false);
                    setPaymentSuccess(false);
                    setCheckoutError(null);
                    setCheckoutSuccessData(null);
                  }
                }}
                disabled={isProcessingPayment}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>

              {paymentSuccess ? (
                /* ACTIVATION CELEBRATION SCREEN ("show activations & just back to subscription page") */
                <div className="text-center py-4 space-y-6">
                  <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/25">
                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Package Active & Live</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Welcome to {selectedPlanForCheckout.name}!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                      Your payment was successfully received and your broadcaster tier is now activated. Your station quotas, stream monitors, and dashboard privileges have updated immediately.
                    </p>
                  </div>

                  {/* Unlocked Capabilities Summary */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3 font-mono">
                    <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-900">
                      <span>Subscribed Package:</span>
                      <span className="font-bold text-white">
                        {selectedPlanForCheckout.name} ({billingInterval})
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-900">
                      <span>Station Capacity:</span>
                      <span className="font-bold text-emerald-400">
                        Up to {selectedPlanForCheckout.maxStations} Station{selectedPlanForCheckout.maxStations === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-900">
                      <span>Health Monitoring:</span>
                      <span className="font-bold text-sky-400">
                        Every {selectedPlanForCheckout.streamMonitoringIntervalMinutes || 15} mins
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-900">
                      <span>Analytics Tier:</span>
                      <span className="font-bold text-indigo-300">
                        {analyticsText}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-900">
                      <span>Gateway Succeeded:</span>
                      <span className="font-bold text-white">
                        {checkoutGateway}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Transaction Reference:</span>
                      <span className="font-bold text-amber-300 text-[11px]">
                        {checkoutSuccessData?.payment?.id || `CR-PAY-${Date.now().toString().slice(-6)}`}
                      </span>
                    </div>
                  </div>

                  {/* Back to Subscription Desk Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setPaymentSuccess(false);
                        setSelectedPlanForCheckout(null);
                        setCheckoutSuccessData(null);
                        setCheckoutError(null);
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>Back to Subscriptions Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] text-slate-500 mt-2.5">
                      Your subscription is now marked as Active in your Broadcaster Workspace.
                    </p>
                  </div>
                </div>
              ) : (
                /* IN-PLACE CHECKOUT FORM */
                <form onSubmit={handleProcessCheckout} className="space-y-5 text-xs">
                  {/* Modal Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wide">
                        {selectedPlanForCheckout.tier || 'MINISTRY'}
                      </span>
                      <span className="text-xs text-slate-400">Broadcaster Checkout</span>
                    </div>
                    <h2 className="text-xl font-black text-white">
                      Upgrade to {selectedPlanForCheckout.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct in-panel activation. Choose your cycle and preferred gateway below.
                    </p>
                  </div>

                  {/* Pricing Overview & Cycle Picker */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-black text-white">
                          ${Number(priceUsd).toLocaleString()} USD
                        </div>
                        {priceTzs > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            approx. TZS {Number(priceTzs).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">
                          {isAnnual ? 'Billed annually' : 'Billed monthly'}
                        </span>
                      </div>
                    </div>

                    {/* Cycle Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setBillingInterval('MONTHLY')}
                        className={`p-2.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
                          billingInterval === 'MONTHLY'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Monthly Billing
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingInterval('ANNUAL')}
                        className={`p-2.5 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          billingInterval === 'ANNUAL'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Annual Billing</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
                          -15%
                        </span>
                      </button>
                    </div>

                    {/* Included Features Mini List */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Up to {selectedPlanForCheckout.maxStations} Station(s)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{analyticsText} Analytics</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{selectedPlanForCheckout.streamMonitoringIntervalMinutes || 15}m Health Checks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Priority Support</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Gateway Tabs */}
                  <div>
                    <label className="block font-bold text-slate-200 mb-2">
                      Select Payment Gateway
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutGateway('PESAPAL')}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          checkoutGateway === 'PESAPAL'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span className="text-xs font-extrabold">PesaPal</span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight">
                          Mobile Money & Cards
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutGateway('PAYPAL')}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          checkoutGateway === 'PAYPAL'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-md ring-1 ring-sky-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-xs font-extrabold">PayPal</span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight">
                          Express Account
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutGateway('STRIPE')}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          checkoutGateway === 'STRIPE'
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-md ring-1 ring-indigo-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="text-xs font-extrabold">Card (Stripe)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight">
                          Visa / MasterCard
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Gateway Dependent Details */}
                  {checkoutGateway === 'PESAPAL' && (
                    <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                          Choose Mobile Money Provider
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['MPESA', 'TIGO_PESA', 'AIRTEL_MONEY', 'CARD'] as const).map((method) => {
                            const labels: Record<string, string> = {
                              MPESA: 'M-Pesa',
                              TIGO_PESA: 'Tigo Pesa',
                              AIRTEL_MONEY: 'Airtel',
                              CARD: 'Bank Card',
                            };
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPesapalMethod(method)}
                                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                                  pesapalMethod === method
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                              >
                                {labels[method]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Handset Mobile Money Number
                        </label>
                        <div className="relative">
                          <Smartphone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="tel"
                            required
                            placeholder="255754123456"
                            value={checkoutPhone}
                            onChange={(e) => setCheckoutPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Instant USSD push prompt will be sent to your phone to enter your PIN.
                        </p>
                      </div>
                    </div>
                  )}

                  {checkoutGateway === 'PAYPAL' && (
                    <div className="bg-sky-950/20 border border-sky-800/40 rounded-2xl p-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-white">PayPal Instant Capture</h4>
                      <p className="text-[11px] text-slate-300 max-w-sm mx-auto">
                        Seamlessly subscribe with your PayPal balance or attached international debit/credit cards. Activates automatically upon completion.
                      </p>
                    </div>
                  )}

                  {checkoutGateway === 'STRIPE' && (
                    <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Card Number
                        </label>
                        <div className="relative">
                          <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {checkoutError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setPaymentSuccess(false);
                        setCheckoutError(null);
                        setCheckoutSuccessData(null);
                      }}
                      className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold py-3 px-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Pay ${Number(priceUsd).toLocaleString()} USD & Activate</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Security Assurance */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>256-Bit SSL Encrypted • Instant Automatic Activation • No Delays</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

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
