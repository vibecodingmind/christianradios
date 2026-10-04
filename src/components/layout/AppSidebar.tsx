import React from 'react';
import {
  Compass,
  Radio,
  Layers,
  Globe,
  Heart,
  HeartHandshake,
  Tag,
  PlusCircle,
  Shield,
  Smartphone,
  Download,
  Play,
  Pause,
  LogIn,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
  onOpenAuth,
  onPublicAction,
}: AppSidebarProps) {
  const { user } = useAuth();
  const { favoritesCount } = useFavorites();
  const { currentStation, isPlaying, togglePlay } = useAudioPlayer();

  const mainNav = [
    { id: 'home', label: 'Discover', icon: Radio },
    { id: 'categories', label: 'Genres & Formats', icon: Layers },
    { id: 'countries', label: 'Countries', icon: Globe },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : null,
    },
  ];

  const kingdomNav = [
    { id: 'prayer-wall', label: 'Prayers', icon: HeartHandshake },
    { id: 'giving', label: 'Givings & Support', icon: Heart },
    { id: 'pricing', label: 'Broadcaster Plans', icon: Tag },
  ];

  const handleAddStation = () => {
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

  return (
    <aside
      aria-label="Desktop App Navigation"
      className="w-64 xl:w-72 shrink-0 h-screen sticky top-0 hidden lg:flex flex-col justify-between bg-slate-950/95 border-r border-slate-800/80 text-slate-300 p-4 xl:p-5 select-none z-30 backdrop-blur-2xl overflow-y-auto scrollbar-none"
    >
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. BRAND LOGO (Single logo on desktop)                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <img
              src="/brand-logo.png"
              alt="Christian Radios"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Live 24/7
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                Worldwide Faith
              </span>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN APP NAVIGATION                                                    */}
        {/* ========================================================================= */}
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
            Discover
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs xl:text-sm font-semibold transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-sky-300 bg-sky-500/15 border border-sky-500/30 shadow-sm shadow-sky-500/10 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. KINGDOM & MINISTRIES                                                   */}
        {/* ========================================================================= */}
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
            Kingdom &amp; Giving
          </div>
          {kingdomNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs xl:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'text-sky-300 bg-sky-500/15 border border-sky-500/30 shadow-sm shadow-sky-500/10 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. BROADCASTER ACTIONS                                                    */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <button
            onClick={handleAddStation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 cursor-pointer transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-sky-200" />
            <span>Add Your Station</span>
          </button>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Console</span>
            </button>
          )}

          {user?.role === 'RADIO_OWNER' && (
            <button
              onClick={() => onNavigate('owner')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/25 transition-all cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Studio Desk</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. NATIVE MOBILE APP DOWNLOAD CARD                                        */}
        {/* ========================================================================= */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">Christian Radios App</div>
              <div className="text-[10px] text-slate-400 truncate">Android APK &amp; iOS PWA</div>
            </div>
          </div>
          <a
            href="/downloads/ChristianRadios.apk"
            download="ChristianRadios.apk"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM SECTION: NOW PLAYING MINI-CARD & USER ACCOUNT                   */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {/* Now Playing Widget in Rail (when playing) */}
        {currentStation && (
          <div
            onClick={() => onNavigate('station', currentStation.slug || currentStation.id)}
            className="p-2.5 rounded-2xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-400/50 shadow-md flex items-center gap-3 cursor-pointer group transition-all"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
              <img
                src={
                  currentStation.logoUrl ||
                  currentStation.coverUrl ||
                  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&auto=format&fit=crop&q=80'
                }
                alt=""
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5">
                  <span
                    className="w-0.5 bg-emerald-400 h-3 rounded-full animate-bounce"
                    style={{ animationDuration: '0.4s' }}
                  />
                  <span
                    className="w-0.5 bg-emerald-400 h-4 rounded-full animate-bounce"
                    style={{ animationDuration: '0.6s' }}
                  />
                  <span
                    className="w-0.5 bg-emerald-400 h-2 rounded-full animate-bounce"
                    style={{ animationDuration: '0.5s' }}
                  />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                {currentStation.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentStation.genre || 'Live Stream'}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-7 h-7 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-sm cursor-pointer shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
          </div>
        )}

        {/* User Account Bar */}
        {user ? (
          <div
            onClick={() => onNavigate('profile')}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-white">{user.name || user.email}</div>
                <div className="text-[10px] text-slate-400 truncate uppercase font-semibold">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
}
