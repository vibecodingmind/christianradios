import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Compass,
  Search,
  X,
  HeartHandshake,
  Mic,
  PlusCircle,
  Menu,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Globe2,
  Tag,
  MapPin,
  Heart,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { UserAccountMenu } from './UserAccountMenu';
import type { Category, Country, Station } from '../../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
}

export function Header({ currentView, onNavigate, onOpenAuth }: HeaderProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    stations: Station[];
    categories: Category[];
    countries: Country[];
  }>({ stations: [], categories: [], countries: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search autocomplete debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ stations: [], categories: [], countries: [] });
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/public/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onNavigate('directory', searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({ stations: [], categories: [], countries: [] });
    setShowSearchDropdown(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const hasResults =
    searchResults.stations.length > 0 ||
    searchResults.categories.length > 0 ||
    searchResults.countries.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
          
          {/* 1. Logo on the Left */}
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

          {/* 2. Extended Central Search Bar */}
          <div
            ref={searchContainerRef}
            className="hidden sm:block flex-1 min-w-[240px] max-w-4xl relative mx-3"
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                id="header-search-input"
                ref={searchInputRef}
                type="text"
                placeholder="Search stations, genres, cities, countries, or languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (hasResults) setShowSearchDropdown(true);
                }}
                className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-500 focus:border-sky-400 rounded-2xl py-3 pl-12 pr-20 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20 transition-all shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {isSearching && (
                  <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Discovery Dropdown */}
            {showSearchDropdown && (
              <div
                id="header-search-results-dropdown"
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/80 max-h-[30rem] overflow-y-auto"
              >
                {/* 1. Station Results */}
                {searchResults.stations.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        Radio Stations ({searchResults.stations.length})
                      </span>
                      <button
                        onClick={handleSearchSubmit}
                        className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        View all <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {searchResults.stations.map((station) => (
                        <button
                          key={station.id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            onNavigate('station', station.slug);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/90 transition-colors text-left group"
                        >
                          <img
                            src={station.logoUrl}
                            alt={station.name}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/80 group-hover:border-sky-500/50"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-200 group-hover:text-white truncate flex items-center gap-2">
                              {station.name}
                              {station.streamStatus === 'ONLINE' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  LIVE
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span>{station.city}, {station.countryCode}</span>
                              <span>•</span>
                              <span className="text-sky-300">{station.genre}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Genre / Category Results */}
                {searchResults.categories.length > 0 && (
                  <div className="p-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 px-3 py-1.5 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Genres & Categories
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-3 py-1">
                      {searchResults.categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            onNavigate('category', c.slug);
                          }}
                          className="text-xs bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-400/50 border border-slate-700 text-indigo-200 px-3 py-1.5 rounded-xl transition-all"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Country / Location Results */}
                {searchResults.countries.length > 0 && (
                  <div className="p-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 px-3 py-1.5 flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5" />
                      Countries & Regions
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {searchResults.countries.map((cty) => (
                        <button
                          key={cty.code}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            onNavigate('country', cty.code);
                          }}
                          className="text-left text-xs px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                        >
                          <span className="text-base">{cty.flagEmoji}</span>
                          <span className="truncate font-medium">{cty.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results Fallback */}
                {!hasResults && !isSearching && (
                  <div className="p-6 text-center text-sm text-slate-400">
                    <p className="font-semibold text-slate-300">No matching stations found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching by station name, genre (e.g. Worship, Gospel), city, or country.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Navigation Links (DISCOVER, Giving & Support, Prayer Wall) */}
          <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
            <button
              id="header-nav-discover"
              onClick={() => onNavigate('directory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentView === 'directory' || currentView === 'category' || currentView === 'country'
                  ? 'text-sky-300 bg-sky-500/20 border border-sky-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-400" />
              DISCOVER
            </button>

            <button
              id="header-nav-giving"
              onClick={() => onNavigate('giving')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'giving'
                  ? 'text-rose-300 bg-rose-500/20 border border-rose-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
              Giving & Support
            </button>

            <button
              id="header-nav-prayer-wall"
              onClick={() => onNavigate('prayer-wall')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'prayer-wall'
                  ? 'text-purple-300 bg-purple-500/20 border border-purple-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
              Prayer Wall
            </button>
          </nav>

          {/* 4. Action Area: App Install, Registered Radio Owner Actions, and Pro Avatar Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* App Installation Link */}
            <PWAInstallButton />

            {/* Registered Radio Owners Action Button */}
            {user?.role === 'RADIO_OWNER' && (
              <button
                id="header-owner-add-station-btn"
                onClick={() => onNavigate('owner')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Station
              </button>
            )}

            {/* Authentication / User Session Menu */}
            {user ? (
              <UserAccountMenu onNavigate={onNavigate} />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="header-signin-btn"
                  onClick={() => onOpenAuth('login')}
                  className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="header-signup-btn"
                  onClick={() => onOpenAuth('register')}
                  className="text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sm border border-sky-400/30 px-3.5 py-2 rounded-xl transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              id="header-mobile-menu-trigger"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Drawer */}
        {showMobileMenu && (
          <div id="header-mobile-menu-drawer" className="lg:hidden py-4 border-t border-slate-800 flex flex-col gap-2">
            {/* Authenticated User Status or Auth Buttons */}
            {user ? (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{user.name}</div>
                    <div className="text-xs text-sky-400">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setShowMobileMenu(false);
                    await logout();
                    onNavigate('home');
                  }}
                  className="text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenAuth('login');
                  }}
                  className="w-full text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenAuth('register');
                  }}
                  className="w-full text-center py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Search Input */}
            <form onSubmit={handleSearchSubmit} className="mb-2 relative">
              <input
                type="text"
                placeholder="Search stations, genres, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            {/* Navigation Links on Mobile */}
            <button
              onClick={() => {
                setShowMobileMenu(false);
                onNavigate('directory');
              }}
              className="text-left px-3 py-2 text-sm text-sky-300 font-bold uppercase tracking-wider hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              DISCOVER
            </button>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                onNavigate('giving');
              }}
              className="text-left px-3 py-2 text-sm text-rose-300 font-medium hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              Giving & Support
            </button>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                onNavigate('prayer-wall');
              }}
              className="text-left px-3 py-2 text-sm text-purple-300 font-medium hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-purple-400" />
              Prayer Wall
            </button>

            {/* Role-Specific User Links in Mobile Menu */}
            {user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATIONS_ADMIN' || user?.role === 'FINANCE_ADMIN' ? (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('admin');
                  }}
                  className="text-left px-3 py-2 text-sm text-indigo-400 font-semibold hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('following');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Following
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('favorites');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  Favourite
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('profile');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Profile Setting
                </button>
              </>
            ) : user?.role === 'RADIO_OWNER' ? (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('owner');
                  }}
                  className="text-left px-3 py-2 text-sm text-emerald-400 font-semibold hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  Workspace
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('following');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Following
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('favorites');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  Favourite
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('profile');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Profile Setting
                </button>
              </>
            ) : user ? (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('following');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Following
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('favorites');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  Favourite
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('profile');
                  }}
                  className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Profile Setting
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
