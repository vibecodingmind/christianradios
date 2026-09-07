import React from 'react';
import { Home, Compass, Heart, HeartHandshake, Gift } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

interface MobileAppBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

interface BottomTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function MobileAppBottomNav({ currentView, onNavigate }: MobileAppBottomNavProps) {
  const { favoritesCount } = useFavorites();

  const tabs: BottomTab[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'directory', label: 'Discover', icon: Compass },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoritesCount },
    { id: 'prayer-wall', label: 'Prayers', icon: HeartHandshake },
    { id: 'giving', label: 'Giving', icon: Gift },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentView === tab.id ||
            (tab.id === 'directory' && (currentView === 'radios' || currentView === 'category' || currentView === 'country'));

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer relative min-w-[56px] select-none ${
                isActive
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Ambient Glow Pill */}
              {isActive && (
                <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-sky-400' : 'text-slate-400'
                  }`}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] font-extrabold text-white leading-tight shadow-md">
                    {tab.badge! > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-sky-300' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
