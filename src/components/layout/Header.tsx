import React, { useState, useEffect } from 'react';
import {
  Compass,
  Heart,
  HeartHandshake,
  Tag,
  Radio,
  Layers,
  Globe,
  LogIn,
  Menu,
  X,
  Shield,
  Download,
  Search,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAccountMenu } from './UserAccountMenu';
import { NotificationBell } from '../notifications/NotificationBell';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

interface NavItem {
  view: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'directory', label: 'Discover', icon: Compass },
  { view: 'categories', label: 'Genres', icon: Layers },
  { view: 'countries', label: 'Countries', icon: Globe },
  { view: 'giving', label: 'Givings', icon: Heart },
  { view: 'prayer-wall', label: 'Prayers', icon: HeartHandshake },
  { view: 'pricing', label: 'Plans', icon: Tag },
];

const QUICK_APP_GENRES = [
  { label: 'All Radios', view: 'directory', param: undefined },
  { label: 'Praise & Worship', view: 'category', param: 'praise-worship' },
  { label: 'Gospel Music', view: 'category', param: 'gospel-music' },
  { label: 'Swahili Gospel', view: 'category', param: 'swahili-gospel' },
  { label: 'Adventist (AWR)', view: 'category', param: 'adventist-world-radios' },
  { label: 'Bible Teaching', view: 'category', param: 'sound-doctrine-teachings' },
  { label: 'Afro Gospel', view: 'category', param: 'afro-gospel' },
];

export function Header({ currentView, onNavigate, onOpenAuth, onPublicAction }: HeaderProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close mobile menu on view change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentView]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddStationClick = () => {
    setMobileMenuOpen(false);
    if (onPublicAction) {
      onPublicAction('ADD_RADIO');
    } else if (!user) {
      onOpenAuth('register');
    } else if (user.role === 'SUPER_ADMIN') {
      onNavigate('admin', 'create-station');
    } else {
      onNavigate('owner', 'add-station');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('directory', searchQuery.trim());
    } else {
      onNavigate('directory');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 shadow-md shadow-black/30 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 lg:h-20 gap-3 sm:gap-6">
          
          {/* ========================================================================= */}
          {/* 1. MOBILE BRAND LOGO (Shown only on mobile < lg, hidden on desktop lg+)   */}
          {/* ========================================================================= */}
          <div className="flex lg:hidden items-center gap-3 shrink-0">
            <button
              id="header-logo-brand"
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <img
                src="/brand-logo.png"
                alt="Christian Radios"
                className="h-9 w-auto object-contain"
              />
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Live
                </span>
              </div>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. DESKTOP INTEGRATED SEARCH & APP GENRES BAR (lg+ only)                  */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex items-center gap-4 flex-1 min-w-0">
            {/* Global Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-72 xl:w-96 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Christian Radios, preachers, genres..."
                className="w-full pl-10 pr-12 py-2 text-xs font-medium text-white placeholder-slate-400 bg-slate-900/90 border border-slate-800 rounded-2xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all shadow-inner"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (currentView === 'directory') onNavigate('directory');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 pointer-events-none">
                  ⌘K
                </span>
              )}
            </form>

            {/* Quick Genre Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 min-w-0">
              {QUICK_APP_GENRES.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(chip.view, chip.param)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. RIGHT ACTION AREA (GET APP, ADD STATION, USER MENU)                    */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Direct Android APK Download Pill */}
            <a
              href="/downloads/ChristianRadios.apk"
              download="ChristianRadios.apk"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer"
              title="Download Official Android App (APK)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Get App</span>
            </a>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Add Station Button for authenticated users */}
                <button
                  onClick={handleAddStationClick}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 hover:border-sky-500/40 transition-all cursor-pointer shadow-sm"
                  title="Add another Christian radio station"
                >
                  <Radio className="w-3.5 h-3.5 text-sky-400" />
                  <span>Add Station</span>
                </button>

                {/* Role Console Quick Link */}
                {user.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Console</span>
                  </button>
                )}
                {user.role === 'RADIO_OWNER' && (
                  <button
                    onClick={() => onNavigate('owner')}
                    className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-sky-400" />
                    <span>Studio Desk</span>
                  </button>
                )}

                <NotificationBell onNavigate={onNavigate} />
                <UserAccountMenu onNavigate={onNavigate} />
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Redesigned Sign In Button */}
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 shadow-sm transition-all cursor-pointer group"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  <span>Sign In</span>
                </button>

                {/* Primary CTA: "Add Your Station" Button */}
                <button
                  onClick={handleAddStationClick}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-400 hover:via-indigo-500 hover:to-sky-500 border border-sky-400/30 shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
                  <span>Add Your Station</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MOBILE NAVIGATION DRAWER (Used on mobile & small tablets)               */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/98 backdrop-blur-2xl px-4 py-4 space-y-3 animate-fadeIn shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    onNavigate(item.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'text-sky-300 bg-sky-500/20 border border-sky-500/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <a
              href="/downloads/ChristianRadios.apk"
              download="ChristianRadios.apk"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Android App (APK)</span>
            </a>

            <button
              onClick={handleAddStationClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-sky-200 animate-pulse" />
              <span>Add Your Station</span>
            </button>

            {!user && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
