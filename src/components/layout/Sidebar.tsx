import React from 'react';
import {
  Radio,
  SlidersHorizontal,
  BarChart3,
  Heart,
  Clock,
  Calendar,
  Mic,
  Plus,
  Compass,
  Tag,
  Globe2,
  HeartHandshake,
  Gift,
  X,
  Sparkles,
} from 'lucide-react';
import type { User } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
  user: User | null;
  onCloseMobile?: () => void;
}

export function Sidebar({ currentView, onNavigate, onPublicAction, user, onCloseMobile }: SidebarProps) {
  const handleItemClick = (view: string, param?: string) => {
    onNavigate(view, param);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    { id: 'home', label: 'Feed', icon: Radio },
    { id: 'directory', label: 'Playlists', icon: SlidersHorizontal },
    { id: 'pricing', label: 'Statistics', icon: BarChart3 },
  ];

  const yourFaithItems = [
    { id: 'favorites', label: 'Favourites', icon: Heart, count: null },
    { id: 'prayer-wall', label: 'Prayer Wall', icon: HeartHandshake, count: null },
    { id: 'giving', label: 'Giving & Support', icon: Gift, count: null },
  ];

  const genreCategories = [
    { name: 'Praise & Worship', slug: 'praise-worship', color: 'bg-[#ff5e3a]' },
    { name: 'Bible Teaching', slug: 'teaching', color: 'bg-emerald-400' },
    { name: 'Prayer & Faith', slug: 'prayer', color: 'bg-amber-400' },
    { name: 'Gospel Classics', slug: 'gospel', color: 'bg-purple-400' },
    { name: 'Christian Talk', slug: 'talk', color: 'bg-sky-400' },
  ];

  return (
    <aside className="w-64 bg-[#0d0d0f] border-r border-[#1e1e24] flex flex-col justify-between h-full p-6 text-[#9999ab] select-none shrink-0 overflow-y-auto scrollbar-none">
      
      <div className="space-y-8">
        {/* Logo Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleItemClick('home')}
            className="flex items-center gap-2 text-left group"
          >
            <img
              src="/brand-logo.png"
              alt="radios.org"
              className="h-9 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </button>

          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden text-[#9999ab] hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
                  isActive
                    ? 'text-white bg-[#18181c] shadow-sm'
                    : 'text-[#9999ab] hover:text-white hover:bg-[#18181c]/50'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#ff5e3a] rounded-r-full shadow-md shadow-[#ff5e3a]/40" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff5e3a]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* YOUR MUSIC / FAITH */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e82] px-3">
            YOUR FAITH
          </div>
          <div className="space-y-1">
            {yourFaithItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-white bg-[#18181c]'
                      : 'text-[#9999ab] hover:text-white hover:bg-[#18181c]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff5e3a]' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* YOUR PLAYLISTS / CATEGORIES */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6e6e82] px-3">
            POPULAR GENRES
          </div>
          <div className="space-y-1">
            {genreCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleItemClick('directory', `category:${cat.slug}`)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#9999ab] hover:text-white hover:bg-[#18181c]/50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action: Create new playlist / Add Radio Station */}
      <div className="pt-6 border-t border-[#1e1e24]">
        <button
          onClick={() => {
            if (onPublicAction) onPublicAction('ADD_RADIO');
            else handleItemClick('owner');
          }}
          className="w-full text-left flex items-center gap-2 text-xs font-bold text-[#ff5e3a] hover:text-[#ff7352] transition-colors py-2 px-3 rounded-xl hover:bg-[#ff5e3a]/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Radio Station</span>
        </button>
      </div>

    </aside>
  );
}
