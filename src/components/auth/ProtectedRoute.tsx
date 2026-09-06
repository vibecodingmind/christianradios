import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, ShieldAlert, RefreshCw, ArrowLeft, LogIn } from 'lucide-react';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onNavigate: (view: string, param?: string) => void;
  title?: string;
  description?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  onOpenAuth,
  onNavigate,
  title = 'Authentication Required',
  description = 'You must be signed in to access this portal.',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Verifying authorization...</p>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/5">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Continue
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto py-3 px-5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl border border-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // If user role is not permitted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 shadow-xl shadow-red-500/5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Your current account role (<span className="text-red-400 font-semibold">{user.role}</span>) does not have permission to access this area.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-full sm:flex-1 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Directory
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto py-3 px-5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold text-sm rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
