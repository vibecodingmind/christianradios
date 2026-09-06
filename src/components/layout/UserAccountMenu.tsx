import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  Radio,
  ShieldCheck,
  Heart,
  Settings,
  LogOut,
  Sparkles,
  CheckCircle2,
  Wallet,
  Calendar,
  Activity,
  Mic2,
  Gift,
  PlusCircle,
  ExternalLink,
  Zap,
  Sliders,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserAccountMenuProps {
  onNavigate: (view: string, param?: string) => void;
  onLogoutSuccess?: () => void;
  onRequestPayout?: () => void;
  className?: string;
}

export function UserAccountMenu({
  onNavigate,
  onLogoutSuccess,
  onRequestPayout,
  className = '',
}: UserAccountMenuProps) {
  const { user, plan, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsOpen(false);
      if (onLogoutSuccess) {
        onLogoutSuccess();
      } else {
        onNavigate('home');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isRadioOwner = user.role === 'RADIO_OWNER';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const roleBadge = isSuperAdmin ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full shadow-sm">
      <ShieldCheck className="w-3 h-3 text-indigo-400" />
      Super Admin
    </span>
  ) : isRadioOwner ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full shadow-sm">
      <Radio className="w-3 h-3 text-emerald-400" />
      Broadcaster
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full shadow-sm">
      <CheckCircle2 className="w-3 h-3 text-sky-400" />
      Faithful Listener
    </span>
  );

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* 1. Pro Avatar Trigger Button */}
      <button
        id="user-account-menu-button"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative group p-0.5 rounded-full focus:outline-none transition-transform active:scale-95 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile and account settings"
        title={user.name || 'Account Menu'}
      >
        <div
          className={`w-10 h-10 rounded-full p-[2px] transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-tr from-sky-400 via-indigo-500 to-amber-400 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/40'
              : 'bg-slate-700/80 hover:bg-gradient-to-tr hover:from-sky-500 hover:to-indigo-500 group-hover:shadow-md'
          }`}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User avatar'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm select-none shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}
          </div>
        </div>

        {/* Live Active Status Indicator Dot */}
        <span
          className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 absolute bottom-0 right-0 shadow-sm"
          title="Online"
        />
      </button>

      {/* 2. Pro Dropdown Menu Panel */}
      {isOpen && (
        <div
          id="user-account-dropdown-panel"
          className="absolute right-0 mt-3 w-72 sm:w-80 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 p-2.5 z-50 divide-y divide-slate-800/90 text-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-account-menu-button"
        >
          {/* Top User Profile Header */}
          <div className="p-3 bg-gradient-to-b from-slate-950/90 to-slate-900/90 border border-slate-800/80 rounded-2xl mb-2 shadow-inner space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-0.5 shrink-0 shadow-md">
                <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-950 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="font-bold text-sm text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate leading-snug">
                  {user.name || 'Account'}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5 font-normal">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Badges Bar: Role + Current Package */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
              {roleBadge}

              {/* For Radio Owner: Prominently show Current Package */}
              {isRadioOwner && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-sm ${
                    plan?.tier === 'VIP'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : plan?.tier === 'PRO' || plan?.tier === 'PROFESSIONAL'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Current Active Package"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {plan?.name || 'Free Starter'}
                </span>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* ROLE 1: LISTENER MENU                                      */}
          {/* ============================================================ */}
          {!isRadioOwner && !isSuperAdmin && (
            <>
              {/* Section: My Sanctuary */}
              <div className="py-2 space-y-1" role="none">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  My Sanctuary
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('favorites');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <span>Favourite Stations</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('following');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <span>Following Stations</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('prayer-wall');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>Prayer Wall & Requests</span>
                </button>
              </div>

              {/* Section: Giving & Earnings */}
              <div className="py-2 space-y-1" role="none">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Giving & Earnings
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('giving');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span>Tithes & Giving Receipts</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('referrals');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <span>Referrals & Rewards</span>
                  </div>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded-full">
                    Earn
                  </span>
                </button>
              </div>

              {/* Section: Broadcaster Onboarding */}
              <div className="py-2 space-y-1" role="none">
                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('list-your-radio');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate leading-tight">Broadcaster Portal</div>
                    <div className="text-[10px] text-slate-400 font-normal">List or claim a station</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* ROLE 2: RADIO OWNER MENU                                   */}
          {/* ============================================================ */}
          {isRadioOwner && (
            <>
              {/* Section: Broadcast Management */}
              <div className="py-2 space-y-1" role="none">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Broadcast Studio
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('owner');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-500/15 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <span>Broadcaster Workspace</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('owner', 'health');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span>Stream Health & Uptime</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('owner', 'schedule');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>Broadcast Schedule</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('owner', 'studio');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Mic2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Live Studio & Requests</span>
                </button>
              </div>

              {/* Section: Subscription & Finances */}
              <div className="py-2 space-y-1" role="none">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Plans & Monetization
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('owner', 'billing');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span>Subscriptions & Plans</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    {plan?.name || 'Free Starter'}
                  </span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    if (onRequestPayout) {
                      onRequestPayout();
                    } else {
                      onNavigate('owner', 'donations');
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <span>Payouts & Withdrawals</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Request</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('owner', 'donations');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span>Donations & Tithes Received</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('referrals');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span>Referrals & Commissions</span>
                </button>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* ROLE 3: SUPER ADMIN MENU                                   */}
          {/* ============================================================ */}
          {isSuperAdmin && (
            <>
              {/* Section: Management Hub */}
              <div className="py-2 space-y-1" role="none">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Platform Admin
                </div>

                <button
                  id="menu-admin-panel"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('admin');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-500/15 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Super Admin Panel</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('admin', 'stations');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <span>Station Verifications</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('admin', 'plans');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span>Plans & Pricing Settings</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('admin', 'giving');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <span>Payouts & Giving Queue</span>
                </button>
              </div>

              {/* Section: Platform Directory */}
              <div className="py-2 space-y-1" role="none">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Personal & Directory
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('favorites');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <span>Favourites & Followed</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('admin', 'settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <span>System Settings</span>
                </button>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* COMMON FOOTER: PROFILE & SIGN OUT                         */}
          {/* ============================================================ */}
          <div className="pt-2 space-y-1" role="none">
            <button
              id="menu-profile-setting"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate('profile');
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <span>Profile Settings</span>
            </button>

            <button
              id="menu-sign-out"
              role="menuitem"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl flex items-center gap-2.5 transition disabled:opacity-50 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
