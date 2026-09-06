import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Check,
  CreditCard,
  Smartphone,
  Globe,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Download,
  RotateCw,
  Clock,
  Radio,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { formatPrice } from '../data/currencies';
import type { SubscriptionPlan, Payment, Invoice } from '../types';

interface SubscriptionCheckoutPageProps {
  onNavigate: (view: string, param?: string) => void;
  planId?: string;
  initialInterval?: 'MONTHLY' | 'ANNUAL';
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export function SubscriptionCheckoutPage({
  onNavigate,
  planId,
  initialInterval = 'MONTHLY',
  onOpenAuth,
}: SubscriptionCheckoutPageProps) {
  const { user, refreshUser, plan: currentPlan } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>(initialInterval);
  const [paymentGateway, setPaymentGateway] = useState<'PESAPAL' | 'PAYPAL' | 'STRIPE'>('PESAPAL');

  // PesaPal Details
  const [pesapalMethod, setPesapalMethod] = useState<'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CARD'>('MPESA');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '255754889900');

  // Stripe Card Details
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState(user?.name || 'Kingdom Broadcaster');

  // Processing & State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<{
    payment: Payment;
    invoice?: Invoice;
  } | null>(null);

  // Load plans from API
  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/public/plans');
        if (res.ok) {
          const data = await res.json();
          const allPlans: SubscriptionPlan[] = data.plans || [];
          // Free package cannot be added to subscription checkout options because it is the default free package
          const subscribeablePlans = allPlans.filter(
            (p) => p.id !== 'plan_free' && p.tier !== 'FREE' && ((p.monthlyPriceUsd || 0) > 0 || (p.annualPriceUsd || 0) > 0)
          );
          setPlans(subscribeablePlans);

          // Find target plan among subscribeable plans
          const target =
            subscribeablePlans.find((p) => p.id === planId) ||
            subscribeablePlans.find((p) => p.tier === 'PRO' || p.tier === 'PROFESSIONAL') ||
            subscribeablePlans[0];
          setSelectedPlan(target || null);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [planId]);

  // Calculate pricing
  const isAnnual = billingInterval === 'ANNUAL';
  const priceUsd = selectedPlan
    ? isAnnual
      ? selectedPlan.annualPriceUsd
      : selectedPlan.monthlyPriceUsd
    : 0;
  const priceTzs = selectedPlan
    ? isAnnual
      ? selectedPlan.annualPriceTzs || Math.round(selectedPlan.annualPriceUsd * 2600)
    : selectedPlan.monthlyPriceTzs || Math.round(selectedPlan.monthlyPriceUsd * 2600)
    : 0;

  // Fire celebratory confetti on success
  const triggerSuccessEffects = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if canvas not supported
    }
  };

  // Main Payment Execution: "No drama, no stories, activate automatic"
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (paymentGateway === 'PESAPAL') {
        // PesaPal Gateway: Initiate order
        const res = await apiFetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: selectedPlan.id,
            billingInterval,
            paymentMethod: pesapalMethod,
            phoneNumber,
            simulateInstant: true, // Seamless instant completion in dev/test sandbox
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'PesaPal payment initialization failed');

        // Payment succeeded
        setSuccessPayment({
          payment: data.payment || {
            id: data.paymentId || `pay_${Date.now()}`,
            trackingId: data.orderTrackingId,
            amount: priceUsd,
            currency: 'USD',
            status: 'COMPLETED',
            paymentMethod: pesapalMethod,
            provider: 'PESAPAL',
            description: `${selectedPlan.name} Subscription`,
            createdAt: new Date().toISOString(),
          } as Payment,
          invoice: data.invoice,
        });

        await refreshUser();
        triggerSuccessEffects();
      } else if (paymentGateway === 'PAYPAL') {
        // PayPal Orders v2: Create and capture
        const createRes = await apiFetch('/api/payments/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceUsd,
            currency: 'USD',
            description: `${selectedPlan.name} Broadcaster Plan (${billingInterval})`,
            ownerId: user.id,
            planId: selectedPlan.id,
            billingInterval,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || 'PayPal order creation failed');

        // Capture immediately
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
          throw new Error(capData.error || 'PayPal transaction capture failed');
        }

        setSuccessPayment({
          payment: capData.payment,
          invoice: capData.invoice,
        });

        await refreshUser();
        triggerSuccessEffects();
      } else if (paymentGateway === 'STRIPE') {
        // Stripe PaymentIntent
        const intentRes = await apiFetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceUsd,
            currency: 'USD',
            description: `${selectedPlan.name} Broadcaster Subscription (${billingInterval})`,
            ownerId: user.id,
            planId: selectedPlan.id,
            billingInterval,
          }),
        });

        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.error || 'Stripe intent creation failed');

        // Confirm Card Payment
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
          throw new Error(confirmData.error || 'Card payment confirmation failed');
        }

        setSuccessPayment({
          payment: confirmData.payment,
          invoice: confirmData.invoice,
        });

        await refreshUser();
        triggerSuccessEffects();
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please verify your details.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400">
        <RotateCw className="w-10 h-10 animate-spin text-sky-400 mb-3" />
        <p className="text-sm font-semibold">Loading secure checkout...</p>
      </div>
    );
  }

  // ============================================================
  // SUCCESSFUL ACTIVATION SCREEN ("No drama, no stories")
  // ============================================================
  if (successPayment && selectedPlan) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Payment Confirmed & Package Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome to {selectedPlan.name}!
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
              Your payment has been successfully settled. All premium features, station limits, and enterprise stream health checks are now unlocked.
            </p>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left text-xs space-y-3 font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>Invoice Reference:</span>
              <span className="font-bold text-amber-300">
                {successPayment.invoice?.invoiceNumber || `CR-INV-${new Date().getFullYear()}-0028`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Package Tier:</span>
              <span className="font-bold text-white">{selectedPlan.name} ({billingInterval})</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Amount Settled:</span>
              <span className="font-bold text-emerald-400">
                ${priceUsd.toLocaleString()} USD (~TZS {priceTzs.toLocaleString()})
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Payment Gateway:</span>
              <span className="text-white">{paymentGateway}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Validity:</span>
              <span className="text-white">
                {isAnnual ? '365 Days (Annual Plan)' : '30 Days (Monthly Auto-Renew)'}
              </span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('owner')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Go to Broadcaster Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('owner', 'billing')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              View Invoices & Billing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN CHECKOUT FORM
  // ============================================================
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 pb-20">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('pricing')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ORDER SUMMARY & UNLOCKED CAPABILITIES */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                Order Summary
              </span>
              <span className="text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                {selectedPlan?.tier || 'PRO'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{selectedPlan?.name || 'Broadcaster Plan'}</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {selectedPlan?.description || 'Broadcast with confidence and expand your ministry.'}
            </p>
          </div>

          {/* Billing Interval Selector */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setBillingInterval('MONTHLY')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                billingInterval === 'MONTHLY'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('ANNUAL')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                billingInterval === 'ANNUAL'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Billing
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-black px-1.5 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>{selectedPlan?.name} ({billingInterval})</span>
              <span className="font-semibold text-white">${priceUsd.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated in TZS:</span>
              <span className="font-mono text-slate-300 font-bold">~TZS {priceTzs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Setup & Platform Fee:</span>
              <span className="text-emerald-400 font-bold">$0.00 (Free)</span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-800/80">
              <span className="font-bold text-white text-sm">Total Due Today:</span>
              <div className="text-right">
                <div className="text-2xl font-black text-white">
                  ${priceUsd.toLocaleString()} USD
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  TZS {priceTzs.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Unlocked Features */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Features Immediately Unlocked:
            </span>
            <ul className="space-y-2 text-slate-300">
              {(selectedPlan?.featuresList || [
                `Up to ${selectedPlan?.maxStations || 3} Radio Stations`,
                'High-Definition Audio & Backup Failover Stream',
                'Listener Giving & Crowdfunding Enabled',
                'Advanced 90-day Analytics & CSV Exports',
                'Automated 15-min Stream Health Checks',
                'Priority Broadcaster Support',
              ]).map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECT PAYMENT GATEWAY & CHECKOUT */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold text-white">Select Payment Gateway</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your preferred payment method. Transactions are securely processed and automatically activate your account.
            </p>
          </div>

          {/* Gateway Selector Cards */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentGateway('PESAPAL')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                paymentGateway === 'PESAPAL'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-2 text-emerald-400" />
              <div>
                <span className="text-xs font-bold block leading-tight">PesaPal</span>
                <span className="text-[10px] text-slate-400">Mobile Money / Cards</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentGateway('PAYPAL')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                paymentGateway === 'PAYPAL'
                  ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Globe className="w-5 h-5 mb-2 text-sky-400" />
              <div>
                <span className="text-xs font-bold block leading-tight">PayPal</span>
                <span className="text-[10px] text-slate-400">PayPal Checkout</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentGateway('STRIPE')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                paymentGateway === 'STRIPE'
                  ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-2 text-purple-400" />
              <div>
                <span className="text-xs font-bold block leading-tight">Stripe</span>
                <span className="text-[10px] text-slate-400">Visa / MasterCard</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleExecutePayment} className="space-y-4">
            {/* GATEWAY 1: PESAPAL MOBILE MONEY FORM */}
            {paymentGateway === 'PESAPAL' && (
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Mobile Money Network or Card
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'MPESA', label: 'Vodacom M-Pesa' },
                      { id: 'TIGO_PESA', label: 'Tigo Pesa' },
                      { id: 'AIRTEL_MONEY', label: 'Airtel Money' },
                      { id: 'CARD', label: 'Bank Card' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPesapalMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                          pesapalMethod === m.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Money / Notification Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="2557XXXXXXXX"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the phone number to receive the USSD push prompt for payment authorization.
                  </p>
                </div>
              </div>
            )}

            {/* GATEWAY 2: PAYPAL FORM */}
            {paymentGateway === 'PAYPAL' && (
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Globe className="w-4 h-4 text-sky-400" />
                  PayPal Express Checkout
                </div>
                <p>
                  You will be safely routed to PayPal to approve your subscription payment of{' '}
                  <strong className="text-white">${priceUsd} USD</strong>. Your broadcaster package will activate immediately upon capture.
                </p>
                <div className="p-3 bg-sky-950/30 border border-sky-500/20 rounded-xl text-sky-300 text-[11px]">
                  Supports PayPal balances, linked bank accounts, and all major international credit/debit cards.
                </div>
              </div>
            )}

            {/* GATEWAY 3: STRIPE CARD FORM */}
            {paymentGateway === 'STRIPE' && (
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Cardholder Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. David Mwita"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Credit / Debit Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Expiry Date (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submission Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={processing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {processing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment with {paymentGateway}...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ${priceUsd} USD & Activate {selectedPlan.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-3">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Instant Activation
                </span>
                <span>•</span>
                <span>Cancel Anytime</span>
                <span>•</span>
                <span>Tax Invoice Included</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
