import React, { useState } from 'react';
import { Radio, X, Check, ShieldCheck, Zap, Globe, CreditCard, Sparkles } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface PremiumStationSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  onSubscriptionSuccess?: () => void;
}

export function PremiumStationSubscriptionModal({
  isOpen,
  onClose,
  station,
  onSubscriptionSuccess,
}: PremiumStationSubscriptionModalProps) {
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentGateway, setPaymentGateway] = useState<'PESAPAL' | 'PAYPAL' | 'STRIPE'>('PESAPAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthlyPrice = station.monthlyPriceTzs || 5000;
  const annualPrice = station.annualPriceTzs || 50000;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/payments/subscribe-station', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: station.id,
          billingInterval,
          paymentGateway,
          paymentMethod: paymentGateway,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe to station.');

      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during subscription checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/40 shadow-lg shrink-0">
            <img
              src={station.logoUrl || station.coverUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
              alt={station.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded">
              PRO
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Premium Station Subscription
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">{station.name}</h3>
            <p className="text-xs text-slate-400">Unlock 24/7 Unlimited High Quality Live Broadcast</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubscribe} className="space-y-5">
          {/* Plan Interval Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Subscription Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillingInterval('MONTHLY')}
                className={`p-3.5 rounded-2xl border text-left transition relative ${
                  billingInterval === 'MONTHLY'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Monthly Pass</div>
                <div className="text-lg font-black text-white mt-0.5">
                  TZS {monthlyPrice.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">Renews monthly</div>
              </button>

              <button
                type="button"
                onClick={() => setBillingInterval('ANNUAL')}
                className={`p-3.5 rounded-2xl border text-left transition relative ${
                  billingInterval === 'ANNUAL'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase">
                  Save 20%
                </span>
                <div className="text-xs font-semibold">Annual Pass</div>
                <div className="text-lg font-black text-white mt-0.5">
                  TZS {annualPrice.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">Best value for 1 full year</div>
              </button>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full 24/7 Ad-Free Live Stream Audio Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Directly Supports Broadcaster Transmitters & Ministry</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Listen on Web, Mobile PWA, and Background Players</span>
            </div>
          </div>

          {/* Payment Gateway Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentGateway('PESAPAL')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  paymentGateway === 'PESAPAL'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-400 mb-1" />
                <div>
                  <div className="text-xs font-bold text-white">PesaPal</div>
                  <div className="text-[9px] text-slate-400">Mobile Money / Cards</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentGateway('PAYPAL')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  paymentGateway === 'PAYPAL'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Globe className="w-4 h-4 text-sky-400 mb-1" />
                <div>
                  <div className="text-xs font-bold text-white">PayPal</div>
                  <div className="text-[9px] text-slate-400">PayPal Wallet</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentGateway('STRIPE')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  paymentGateway === 'STRIPE'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-400 mb-1" />
                <div>
                  <div className="text-xs font-bold text-white">Stripe</div>
                  <div className="text-[9px] text-slate-400">Visa / MasterCard</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cancel Anytime • Instant Access
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Processing...' : 'Subscribe & Unlock Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
