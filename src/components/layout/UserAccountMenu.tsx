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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserAccountMenuProps {
  onNavigate: (view: string, param?: string) => void;
  onLogoutSuccess?: () => void;
  className?: string;
}

export function UserAccountMenu({ onNavigate, onLogoutSuccess, className = '' }: UserAccountMenuProps) {
  const { user, logout } = useAuth();
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
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
      <ShieldCheck className="w-3 h-3 text-indigo-400" />
      Super Admin
    </span>
  ) : isRadioOwner ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
      <Radio className="w-3 h-3 text-emerald-400" />
      Radio Owner
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3 text-sky-400" />
      Listener
    </span>
  );

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* 1. Pro Avatar Trigger Button (Icon Only - No Name or Role Text) */}
      <button
        id="user-account-menu-button"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative group p-0.5 rounded-full focus:outline-none transition-transform active:scale-95"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile and account settings"
        title={user.name || 'Account Menu'}
      >
        <div className={`w-10 h-10 rounded-full p-[2px] transition-all duration-300 ${
          isOpen
            ? 'bg-gradient-to-tr from-sky-400 via-indigo-500 to-amber-400 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/40'
            : 'bg-slate-700/80 hover:bg-gradient-to-tr hover:from-sky-500 hover:to-indigo-500 group-hover:shadow-md'
        }`}>
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
          className="absolute right-0 mt-3 w-64 sm:w-72 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 p-2 z-50 divide-y divide-slate-800/90 text-slate-100 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-account-menu-button"
        >
          {/* Top User Profile Header */}
          <div className="p-3 bg-gradient-to-b from-slate-950/80 to-slate-900/90 border border-slate-800/80 rounded-xl mb-1.5 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-0.5 shrink-0 shadow-md">
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
              <div className="mt-1.5">{roleBadge}</div>
            </div>
          </div>

          {/* Role-Specific Menu Options */}
          <div className="py-1.5 space-y-1" role="none">
            {/* SUPER ADMIN MENU: Admin Panel, Following, Favourite, Profile Setting, Sign Out */}
            {isSuperAdmin && (
              <button
                id="menu-admin-panel"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin');
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-500/15 rounded-xl flex items-center gap-3 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Admin Panel</span>
              </button>
            )}

            {/* RADIO OWNER MENU: Workspace, Following, Favourite, Profile Setting, Sign Out */}
            {isRadioOwner && (
              <button
                id="menu-broadcaster-workspace"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('owner');
                }}
                className="w-full text-left px-3 py-2.5 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-500/15 rounded-xl flex items-center gap-3 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                  <Radio className="w-4 h-4" />
                </div>
                <span>Workspace</span>
              </button>
            )}

            {/* FOLLOWING (Available for Radio Owners, Listeners, and Super Admin) */}
            <button
              id="menu-following"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate('following');
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Following</span>
            </button>

            {/* FAVOURITE (Available for Radio Owners, Listeners, and Super Admin) */}
            <button
              id="menu-favourite"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate('favorites');
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 group-hover:bg-rose-500 group-hover:text-white flex items-center justify-center transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              <span>Favourite</span>
            </button>

            {/* REFERRALS / EARNINGS (Available for all authenticated users) */}
            <button
              id="menu-referrals"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate('referrals');
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Referrals / Earnings</span>
            </button>

            {/* PROFILE SETTING (Available for all) */}
            <button
              id="menu-profile-setting"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onNavigate('profile');
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white flex items-center justify-center transition-colors">
                <Settings className="w-4 h-4" />
              </div>
              <span>Profile Setting</span>
            </button>
          </div>

          {/* SIGN OUT ACTION */}
          <div className="pt-1.5" role="none">
            <button
              id="menu-sign-out"
              role="menuitem"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl flex items-center gap-3 transition-colors disabled:opacity-50 group"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white flex items-center justify-center transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

