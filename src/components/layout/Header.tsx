import React from 'react';
import { Radio, Compass, Heart, HeartHandshake, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAccountMenu } from './UserAccountMenu';
import { NotificationBell } from '../notifications/NotificationBell';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function Header({ currentView, onNavigate, onOpenAuth }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
          
          {/* Logo on Left */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="header-logo-brand"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <img
                src="/brand-logo.png"
                alt="radios.org"
                className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => onNavigate('directory')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'directory'
                  ? 'text-sky-300 bg-sky-500/20 border border-sky-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-400" />
              Discover
            </button>

            <button
              onClick={() => onNavigate('giving')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'giving'
                  ? 'text-rose-300 bg-rose-500/20 border border-rose-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
              Givings
            </button>

            <button
              onClick={() => onNavigate('prayer-wall')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'prayer-wall'
                  ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              Prayer Requests
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'pricing'
                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-400" />
              Pricing
            </button>
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell onNavigate={onNavigate} />
                <UserAccountMenu onNavigate={onNavigate} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm border border-emerald-400/30 px-3.5 py-2 rounded-xl transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
