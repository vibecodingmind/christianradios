import React, { useState, useEffect } from 'react';
import {
  Heart,
  X,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  CreditCard,
  Smartphone,
  ArrowRight,
  Printer,
  Target,
  UserCheck,
  EyeOff,
  Coins,
  Globe,
  Zap,
  LogIn,
} from 'lucide-react';
import type { Station, DonationCampaign } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station;
  campaign?: DonationCampaign;
  onDonationSuccess?: (trackingId: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export function DonationModal({
  isOpen,
  onClose,
  station,
  campaign,
  onDonationSuccess,
  onOpenAuth,
}: DonationModalProps) {
  const { user } = useAuth();

  const [amount, setAmount] = useState<number>(25);
  const currency = 'USD';
  const [fundType, setFundType] = useState<string>(campaign ? 'CAMPAIGN' : 'GOSPEL_OUTREACH');
  const [paymentGateway, setPaymentGateway] = useState<'PESAPAL' | 'PAYPAL' | 'STRIPE'>('PESAPAL');
  const [donorName, setDonorName] = useState(user?.name || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [donorPhone, setDonorPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedDonation, setCompletedDonation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      if (user.name && !donorName) setDonorName(user.name);
      if (user.email && !donorEmail) setDonorEmail(user.email);
      if (user.phone && !donorPhone) setDonorPhone(user.phone);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const presetAmounts = [5, 15, 25, 50, 100, 250];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/public/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: station.id,
          campaignId: campaign?.id,
          campaignTitle: campaign?.title,
          donorName: isAnonymous ? 'Anonymous Kingdom Partner' : donorName,
          isAnonymous,
          donorEmail,
          donorPhone,
          amount,
          currency,
          fundType: campaign ? 'CAMPAIGN' : fundType,
          paymentMethod: paymentGateway,
          paymentGateway,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process donation');

      setCompletedDonation(data.donation);
      if (onDonationSuccess) {
        onDonationSuccess(data.donation.trackingId);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
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

        {!completedDonation ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                <Heart className="w-6 h-6 text-slate-950 fill-slate-950" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white truncate">
                  Support {station.name}
                </h3>
                {campaign ? (
                  <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 mt-0.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Campaign: {campaign.title}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Bless the ministry, transmitters & gospel broadcast
                  </p>
                )}
              </div>
            </div>

            {/* Member / Guest Giving Banner */}
            {user ? (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Giving as <strong>{user.name}</strong> • Linked to your member account
                </span>
              </div>
            ) : onOpenAuth ? (
              <div className="mb-4 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span>Giving as Guest. Have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('login');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  Sign In
                </button>
              </div>
            ) : null}

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Currency & Amount Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Select Contribution Amount (USD $)
                  </label>
                </div>

                <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        amount === preset
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-rose-500"
                    placeholder="Enter custom USD amount"
                  />
                </div>
              </div>

              {/* Fund Designation (if not a specific campaign) */}
              {!campaign && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Fund Designation
                  </label>
                  <select
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="GOSPEL_OUTREACH">Gospel Outreach & Crusades</option>
                    <option value="TRANSMITTER_FUND">Transmitter & Signal Expansion</option>
                    <option value="TITHE_OFFERING">Tithe & Seed Offering</option>
                    <option value="STUDIO_UPGRADE">Studio Equipment & Power Generator</option>
                    <option value="GENERAL">General Ministry Needs</option>
                  </select>
                </div>
              )}

              {/* Payment Method - 3 Main Gateways */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentGateway('PESAPAL')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentGateway === 'PESAPAL'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 mb-1 text-emerald-400" />
                    <div>
                      <span className="text-[11px] font-bold block leading-tight">PesaPal</span>
                      <span className="text-[9px] text-slate-400">Mobile Money / Cards</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentGateway('PAYPAL')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentGateway === 'PAYPAL'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Globe className="w-4 h-4 mb-1 text-sky-400" />
                    <div>
                      <span className="text-[11px] font-bold block leading-tight">PayPal</span>
                      <span className="text-[9px] text-slate-400">PayPal Account</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentGateway('STRIPE')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentGateway === 'STRIPE'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1 text-purple-400" />
                    <div>
                      <span className="text-[11px] font-bold block leading-tight">Stripe</span>
                      <span className="text-[9px] text-slate-400">Visa / MasterCard</span>
                    </div>
                  </button>
                </div>


              </div>

              {/* Donor Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-300">Your Full Name</label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500"
                      />
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      Give Anonymously
                    </label>
                  </div>
                  <input
                    type="text"
                    required={!isAnonymous}
                    disabled={isAnonymous}
                    value={isAnonymous ? 'Anonymous Kingdom Partner' : donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Samuel & Grace Mwita"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email for Receipt</label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="donor@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Mobile Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="+255 7XX XXX XXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Prayer Note or Word of Encouragement (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="May God bless this station to win more souls for Christ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Encrypted & Direct to Radio
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : (
                    <>
                      <span>Complete Support</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS VIEW */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">God Bless You, {completedDonation.donorName}!</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Your support of <strong className="text-emerald-400">{completedDonation.currency || 'TZS'} {Number(completedDonation.amount || 0).toLocaleString()}</strong> has been directly credited to <strong>{completedDonation.stationName}</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Tracking Receipt ID:</span>
                <span className="font-mono text-amber-300 font-bold">{completedDonation.trackingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fund Designation:</span>
                <span className="text-slate-200">{completedDonation.campaignTitle || (completedDonation.fundType ? completedDonation.fundType.replace('_', ' ') : 'General Support')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="text-slate-200">{completedDonation.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-200">{new Date(completedDonation.createdAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>

            {!user && onOpenAuth && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-left">
                <span>Want to track your kingdom seeds and download annual tax statements?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('register');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold hover:bg-rose-500/25 transition whitespace-nowrap cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={`/?receipt=${completedDonation.trackingId}`}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                View Receipt
              </a>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
