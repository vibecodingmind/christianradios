import React from 'react';
import { Radio, Compass, Heart, HeartHandshake, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAccountMenu } from './UserAccountMenu';

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
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-sky-400 group-hover:text-amber-300 transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Christian Radios
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Discover & Listen Worldwide
                </p>
              </div>
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
              <UserAccountMenu onNavigate={onNavigate} />
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
                  className="text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sm border border-sky-400/30 px-3.5 py-2 rounded-xl transition-all"
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
