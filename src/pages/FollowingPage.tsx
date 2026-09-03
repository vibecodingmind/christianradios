import React, { useState, useEffect } from 'react';
import {
  Bell,
  Radio,
  Play,
  Pause,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Heart,
  Volume2,
  History,
  SlidersHorizontal,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { StationCard } from '../components/station/StationCard';
import { apiFetch } from '../lib/api';
import type { Station } from '../types';

interface FollowingPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export function FollowingPage({ onNavigate, onOpenAuth }: FollowingPageProps) {
  const { user } = useAuth();
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();
  const [activeTab, setActiveTab] = useState<'following' | 'recent'>('following');
  const [followingStations, setFollowingStations] = useState<Station[]>([]);
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [folRes, recRes] = await Promise.all([
        apiFetch('/api/listener/following'),
        apiFetch('/api/listener/recently-listened'),
      ]);

      if (folRes.ok) {
        const data = await folRes.json();
        setFollowingStations(data.stations || []);
      }
      if (recRes.ok) {
        const data = await recRes.json();
        setRecentStations(data.stations || []);
      }
    } catch (err) {
      console.error('Failed to load following & recent data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
          <Bell className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Follow Your Cherished Radios
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Create an account or sign in to follow Christian radio stations, track broadcasting
            schedules, and quickly resume listening across your devices.
          </p>
        </div>
        <button
          onClick={() => onOpenAuth('login')}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs transition shadow-lg shadow-sky-500/25 inline-flex items-center gap-2"
        >
          <span>Sign In to View Followed Radios</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5" />
            <span>Listener Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Following & Listening History
          </h1>
          <p className="text-xs text-slate-400">
            Keep track of live streams from broadcasters you follow and your recently played stations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'following'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Followed ({followingStations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recent'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recently Listened ({recentStations.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'following' ? (
        followingStations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {followingStations.map((station) => (
              <StationCard key={station.id} station={station} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-4 max-w-xl mx-auto">
            <Bell className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Not Following Any Radios Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                When you find Christian radio stations you love, click the follow button on their profile to keep them at your fingertips.
              </p>
            </div>
            <button
              onClick={() => onNavigate('directory')}
              className="mt-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              Explore Stations Directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      ) : (
        /* Recently Listened Tab */
        recentStations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentStations.map((station) => (
              <StationCard key={station.id} station={station} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-4 max-w-xl mx-auto">
            <History className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Recent Listening History</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Stations you tune into will automatically appear here for easy one-click access.
              </p>
            </div>
            <button
              onClick={() => onNavigate('directory')}
              className="mt-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              Tune Into Live Broadcasts <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      )}
    </div>
  );
}
