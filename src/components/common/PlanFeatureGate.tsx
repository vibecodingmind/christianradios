import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import type { PlanEntitlements } from '../../types';

interface PlanFeatureGateProps {
  featureName: string;
  requiredPlanName?: string;
  isUnlocked: boolean;
  entitlements?: PlanEntitlements;
  description?: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export function PlanFeatureGate({
  featureName,
  requiredPlanName = 'PRO',
  isUnlocked,
  entitlements,
  description,
  onUpgrade,
  children,
}: PlanFeatureGateProps) {
  if (isUnlocked) {
    return <>{children}</>;
  }

  const currentPlanName = entitlements?.plan?.name || 'Free';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-8 shadow-2xl">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto space-y-4 py-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Requires {requiredPlanName} Plan</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            {featureName} is Locked
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {description ||
              `Your current plan (${currentPlanName}) does not include ${featureName}. Upgrade your subscription to unlock full capabilities.`}
          </p>
        </div>

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>Upgrade to {requiredPlanName}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Blurred preview background */}
      <div className="opacity-20 pointer-events-none filter blur-sm select-none mt-4">
        {children}
      </div>
    </div>
  );
}
