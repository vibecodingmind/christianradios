import React, { useState } from 'react';
import { Radio, Building2, Phone, Globe, Sparkles, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OwnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intent?: 'ADD_RADIO' | 'CLAIM_STATION';
}

export function OwnerOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
  intent = 'ADD_RADIO',
}: OwnerOnboardingModalProps) {
  const { user, becomeOwner } = useAuth();
  const [organizationName, setOrganizationName] = useState(
    user?.name ? `${user.name}'s Ministry Radio` : ''
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState('Tanzania');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      setError('Please enter your radio station or organization name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await becomeOwner({
        organizationName: organizationName.trim(),
        phone: phone.trim(),
        country,
      });

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Failed to complete broadcaster onboarding.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Radio className="w-6 h-6 text-sky-200" />
            </div>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-sky-400/20 text-sky-100 rounded-full border border-sky-300/30 uppercase tracking-wider">
              Broadcaster Onboarding
            </span>
          </div>
          <h2 className="text-xl font-bold">
            {intent === 'CLAIM_STATION'
              ? 'Claim Station Broadcaster Verification'
              : 'Broadcast Your Radio on Christian Radios'}
          </h2>
          <p className="text-sm text-sky-100/90 mt-1">
            Upgrade your listener profile to a Radio Broadcaster account to list, manage, and stream your station globally.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              Radio Station / Ministry Organization Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Radio Maria Tanzania, Upendo FM, CITAM Hope Media"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                Phone Number (WhatsApp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 700 123 456"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 text-sm transition-colors"
              >
                <option value="Tanzania">🇹🇿 Tanzania</option>
                <option value="Kenya">🇰🇪 Kenya</option>
                <option value="Uganda">🇺🇬 Uganda</option>
                <option value="Rwanda">🇷🇼 Rwanda</option>
                <option value="Nigeria">🇳🇬 Nigeria</option>
                <option value="South Africa">🇿🇦 South Africa</option>
                <option value="United States">🇺🇸 United States</option>
                <option value="United Kingdom">🇬🇧 United Kingdom</option>
                <option value="Other">🌍 Other Country</option>
              </select>
            </div>
          </div>

          {/* Included Features List */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Broadcaster Account Perks:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Free 24/7 directory listing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Real-time listener analytics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Stream health monitoring</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mobile money donations</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Activate Broadcaster Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
