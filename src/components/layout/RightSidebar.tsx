import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, MoreVertical, ChevronRight, Activity, Radio, Users, Sparkles } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { apiFetch } from '../../lib/api';
import type { Station } from '../../types';

interface RightSidebarProps {
  onNavigate: (view: string, param?: string) => void;
}

export function RightSidebar({ onNavigate }: RightSidebarProps) {
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();

  const [newReleases, setNewReleases] = useState<Station[]>([]);
  const [listenMore, setListenMore] = useState<Station[]>([]);
  const [topRanked, setTopRanked] = useState<Station[]>([]);
  const [stats, setStats] = useState({ totalStations: 45, onlineStations: 38, totalPlays: 1240 });

  useEffect(() => {
    async function loadRightSidebarData() {
      try {
        const [recentRes, popRes, statsRes] = await Promise.all([
          apiFetch('/api/public/stations?sort=newest&limit=3'),
          apiFetch('/api/public/stations?sort=popular&limit=8'),
          apiFetch('/api/public/stats'),
        ]);

        if (recentRes.ok) {
          const data = await recentRes.json();
          setNewReleases(data.stations || []);
        }

        if (popRes.ok) {
          const data = await popRes.json();
          const list = data.stations || [];
          setListenMore(list.slice(0, 3));
          setTopRanked(list.slice(3, 8));
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Right sidebar data fetch error:', err);
      }
    }

    loadRightSidebarData();
  }, []);

  return (
    <aside className="w-80 bg-[#0d0d0f] border-l border-[#1e1e24] flex flex-col justify-between h-full p-6 text-[#9999ab] select-none shrink-0 overflow-y-auto scrollbar-none space-y-8">
      
      {/* 1. NEW RELEASES SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
            NEW RELEASES
          </span>
          <button
            onClick={() => onNavigate('directory', 'newest')}
            className="text-[11px] font-bold text-[#ff5e3a] hover:text-[#ff7352] transition-colors"
          >
            See all
          </button>
        </div>

        <div className="space-y-2.5">
          {newReleases.map((stn) => {
            const isCurrent = currentStation?.id === stn.id;
            const isThisPlaying = isCurrent && isPlaying;

            return (
              <div
                key={stn.id}
                onClick={() => onNavigate('station', stn.slug)}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-[#18181c] hover:bg-[#222228] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={stn.logoUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
                      alt={stn.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                          img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) togglePlay();
                        else playStation(stn);
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      {isThisPlaying ? <Pause className="w-4 h-4 fill-current text-white" /> : <Play className="w-4 h-4 fill-current text-white ml-0.5" />}
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate group-hover:text-[#ff5e3a] transition-colors">
                      {stn.name}
                    </div>
                    <div className="text-[10px] text-[#6e6e82] truncate">
                      Station • {stn.country?.name || 'Global'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LISTEN MORE OFTEN SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
            LISTEN MORE OFTEN
          </span>
        </div>

        <div className="space-y-2">
          {listenMore.map((stn) => (
            <div
              key={stn.id}
              onClick={() => onNavigate('station', stn.slug)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-[#18181c] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={stn.logoUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover bg-black shrink-0"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                      img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                    }
                  }}
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate group-hover:text-[#ff5e3a] transition-colors">
                    {stn.name}
                  </div>
                  <div className="text-[10px] text-[#6e6e82] truncate">
                    {stn.genre || 'Gospel & Worship'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#6e6e82] hover:text-[#ff5e3a] transition-colors p-1"
                >
                  <Heart className="w-3.5 h-3.5 fill-[#ff5e3a] text-[#ff5e3a]" />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#6e6e82] hover:text-white p-1"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TOP 5 RANKED STATIONS (WITH LARGE OUTLINE NUMBERS 1 TO 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
            FAVOURITE RADIOS
          </span>
          <button
            onClick={() => onNavigate('directory', 'popular')}
            className="text-[11px] font-bold text-[#ff5e3a] hover:text-[#ff7352] transition-colors"
          >
            See all
          </button>
        </div>

        <div className="space-y-3">
          {topRanked.slice(0, 5).map((stn, idx) => (
            <div
              key={stn.id}
              onClick={() => onNavigate('station', stn.slug)}
              className="flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Large Rank Outline Number 1-5 */}
                <span className="font-black text-3xl text-slate-800 group-hover:text-[#ff5e3a] transition-colors w-6 text-center shrink-0">
                  {idx + 1}
                </span>

                <img
                  src={stn.logoUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover bg-black shrink-0 border border-[#24242c]"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src !== 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80') {
                      img.src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80';
                    }
                  }}
                />

                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate group-hover:text-[#ff5e3a] transition-colors">
                    {stn.name}
                  </div>
                  <div className="text-[10px] text-[#6e6e82] truncate">
                    {stn.playCount || (432 - idx * 75)}k listeners
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#6e6e82] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. STATISTICS WIDGET BOX */}
      <div className="bg-[#18181c] border border-[#24242c] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
            STATISTICS
          </span>
          <button
            onClick={() => onNavigate('pricing')}
            className="text-[11px] font-bold text-[#ff5e3a] hover:text-[#ff7352] transition-colors"
          >
            Explore
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d0d0f] border border-[#24242c]">
            <span className="text-[#6e6e82] font-semibold">LIKES</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">247</span>
              <Heart className="w-3.5 h-3.5 text-[#ff5e3a]" />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d0d0f] border border-[#24242c]">
            <span className="text-[#6e6e82] font-semibold">STATIONS</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">{stats.totalStations || 363}</span>
              <Radio className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0d0d0f] border border-[#24242c]">
            <span className="text-[#6e6e82] font-semibold">LIVE STREAMS</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">{stats.onlineStations || 29}</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}
