import React, { useState } from 'react';
import {
  X,
  Wallet,
  Smartphone,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { WithdrawalRequest } from '../../types';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'RADIO_OWNER' | 'LISTENER' | 'SUPER_ADMIN';
  availableBalance: number;
  currency?: string;
  stationId?: string;
  stationName?: string;
  onSuccess?: (withdrawal: WithdrawalRequest) => void;
}

export function PayoutRequestModal({
  isOpen,
  onClose,
  userRole,
  availableBalance,
  currency = 'TZS',
  stationId,
  stationName,
  onSuccess,
}: PayoutRequestModalProps) {
  // Selected Payment Mode: MOBILE_MONEY, PAYPAL, BANK_TRANSFER
  const [payoutMode, setPayoutMode] = useState<'MOBILE_MONEY' | 'PAYPAL' | 'BANK_TRANSFER'>('MOBILE_MONEY');

  // Amount & Notes
  const defaultMin = currency === 'USD' ? 10 : 20000;
  const [amount, setAmount] = useState<number | string>(
    availableBalance > 0 ? Math.min(availableBalance, defaultMin) : defaultMin
  );
  const [notes, setNotes] = useState('');

  // Mobile Money Details
  const [mobileProvider, setMobileProvider] = useState('Vodacom M-Pesa');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileAccountName, setMobileAccountName] = useState('');

  // PayPal Details
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalName, setPaypalName] = useState('');

  // Bank Transfer Details
  const [bankName, setBankName] = useState('CRDB Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<WithdrawalRequest | null>(null);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const feeRate = 0.01; // 1% fee
  const fee = Math.round(numAmount * feeRate);
  const netAmount = Math.max(0, numAmount - fee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount < defaultMin) {
      setError(`Minimum withdrawal amount is ${currency} ${defaultMin.toLocaleString()}.`);
      return;
    }

    if (numAmount > availableBalance) {
      setError(`Requested amount exceeds your available balance of ${currency} ${availableBalance.toLocaleString()}.`);
      return;
    }

    let finalMethod = payoutMode;
    let finalAccountName = '';
    let finalAccountNumber = '';
    let finalBankOrProvider = '';

    if (payoutMode === 'MOBILE_MONEY') {
      if (!mobileNumber.trim() || !mobileAccountName.trim()) {
        setError('Please provide your Mobile Money number and registered account name.');
        return;
      }
      finalMethod = 'MOBILE_MONEY';
      finalAccountName = mobileAccountName.trim();
      finalAccountNumber = mobileNumber.trim();
      finalBankOrProvider = mobileProvider;
    } else if (payoutMode === 'PAYPAL') {
      if (!paypalEmail.trim() || !paypalName.trim()) {
        setError('Please provide your PayPal email address and account name.');
        return;
      }
      finalMethod = 'PAYPAL';
      finalAccountName = paypalName.trim();
      finalAccountNumber = paypalEmail.trim();
      finalBankOrProvider = 'PayPal Inc.';
    } else if (payoutMode === 'BANK_TRANSFER') {
      if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
        setError('Please provide the bank name, account number, and registered account name.');
        return;
      }
      finalMethod = 'BANK_TRANSFER';
      finalAccountName = bankAccountName.trim();
      finalAccountNumber = bankAccountNumber.trim();
      finalBankOrProvider = swiftCode.trim() ? `${bankName.trim()} (SWIFT: ${swiftCode.trim()})` : bankName.trim();
    }

    setLoading(true);

    try {
      const endpoint = userRole === 'RADIO_OWNER' ? '/api/owner/withdrawals' : '/api/listener/withdrawals';
      const payload = {
        amount: numAmount,
        currency,
        payoutMethod: finalMethod,
        payoutAccountName: finalAccountName,
        payoutAccountNumber: finalAccountNumber,
        payoutBankOrProvider: finalBankOrProvider,
        accountDetails: `${finalBankOrProvider} • ${finalAccountNumber} (${finalAccountName})`,
        stationId: stationId || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request.');
      }

      setSubmittedWithdrawal(data.withdrawal);
      if (onSuccess) {
        onSuccess(data.withdrawal);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing payout request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl my-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submittedWithdrawal ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Wallet className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {userRole === 'RADIO_OWNER' ? 'Request Broadcaster Payout' : 'Request Referral Payout'}
                </h3>
                <p className="text-xs text-slate-400">
                  {stationName ? `Disbursement for ${stationName}` : 'Transfer your earned ministry funds safely'}
                </p>
              </div>
            </div>

            {/* Balance Badge */}
            <div className="p-4 mb-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Available for Payout
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {currency} {availableBalance.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Minimum threshold</span>
                <div className="font-bold text-white">{currency} {defaultMin.toLocaleString()}</div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Withdrawal Amount ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={defaultMin}
                    max={availableBalance}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    placeholder={`Enter amount (min ${defaultMin.toLocaleString()})`}
                  />
                  {availableBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(availableBalance)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>

              {/* Mode of Payment Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Mode of Payment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMode('MOBILE_MONEY')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      payoutMode === 'MOBILE_MONEY'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1.5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold block leading-tight">Mobile Money</span>
                      <span className="text-[9px] text-slate-400">M-Pesa / Tigo / Airtel</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMode('PAYPAL')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      payoutMode === 'PAYPAL'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Globe className="w-4 h-4 mb-1.5 text-sky-400" />
                    <div>
                      <span className="text-xs font-bold block leading-tight">PayPal</span>
                      <span className="text-[9px] text-slate-400">Global Account</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMode('BANK_TRANSFER')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      payoutMode === 'BANK_TRANSFER'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mb-1.5 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold block leading-tight">Bank Wire</span>
                      <span className="text-[9px] text-slate-400">EFT / TISS / SWIFT</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode-Specific Fields */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/90 space-y-3">
                {payoutMode === 'MOBILE_MONEY' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Network / Provider
                        </label>
                        <select
                          value={mobileProvider}
                          onChange={(e) => setMobileProvider(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Vodacom M-Pesa">Vodacom M-Pesa</option>
                          <option value="Tigo Pesa">Tigo Pesa (Mixx)</option>
                          <option value="Airtel Money">Airtel Money</option>
                          <option value="HaloPesa">HaloPesa</option>
                          <option value="MTN Mobile Money">MTN Mobile Money</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="+255 7XX XXX XXX"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Registered SIM / Account Name
                      </label>
                      <input
                        type="text"
                        required
                        value={mobileAccountName}
                        onChange={(e) => setMobileAccountName(e.target.value)}
                        placeholder="e.g. John Peter Mwamba"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}

                {payoutMode === 'PAYPAL' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        PayPal Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="your-paypal-email@example.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        PayPal Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={paypalName}
                        onChange={(e) => setPaypalName(e.target.value)}
                        placeholder="Full Name registered with PayPal"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </>
                )}

                {payoutMode === 'BANK_TRANSFER' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. CRDB Bank, NMB Bank"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Account Number / IBAN
                        </label>
                        <input
                          type="text"
                          required
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="0150XXXXXXXX"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          required
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          placeholder="Name on Bank Statement"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          SWIFT / Branch Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={swiftCode}
                          onChange={(e) => setSwiftCode(e.target.value)}
                          placeholder="e.g. CORUTZTZ"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Notes for Finance Team (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Monthly station ministry disburse"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              {/* Fee and Net Preview */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Requested Amount:</span>
                  <span className="font-semibold text-white">{currency} {numAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Disbursement Processing Fee (1%):</span>
                  <span>- {currency} {fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-800/80 text-white">
                  <span>Estimated Net Received:</span>
                  <span className="text-emerald-400 font-black">{currency} {netAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Turnaround: 24-48 business hours
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || numAmount < defaultMin || numAmount > availableBalance}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Submitting...' : 'Submit Payout Request'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS VIEW */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Payout Request Submitted!</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Your request of <strong className="text-emerald-400">{submittedWithdrawal.currency} {submittedWithdrawal.amount.toLocaleString()}</strong> has been submitted to the Christian Radios finance queue.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Tracking Reference:</span>
                <span className="font-mono text-amber-300 font-bold">{submittedWithdrawal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Channel:</span>
                <span className="text-slate-200 font-bold">{submittedWithdrawal.payoutMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account / Recipient:</span>
                <span className="text-slate-200">{submittedWithdrawal.payoutAccountNumber} ({submittedWithdrawal.payoutAccountName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Disbursement:</span>
                <span className="text-slate-200">24 to 48 hours</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
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
