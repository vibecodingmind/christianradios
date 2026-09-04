import React, { useEffect } from 'react';
import {
  Radio,
  Globe,
  ShieldCheck,
  Heart,
  Sparkles,
  Zap,
  Users,
  Compass,
  ArrowRight,
  Headphones,
  Flame,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface AboutPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function AboutPage({ onNavigate, onOpenAuth, onPublicAction }: AboutPageProps) {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'About Us — Christian Radios SaaS';
  }, []);

  return (
    <div id="about-page-root" className="space-y-12 pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5" />
          Global Gospel Broadcast Network
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
          Connecting Believers Worldwide Through 24/7 Christian Radio
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
          Christian Radios is the dedicated SaaS streaming directory built to help believers discover, listen to, and support live online Christian radio stations 24 hours a day, 7 days a week.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('directory')}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
          >
            <Compass className="w-4 h-4" />
            Explore Stations Directory
          </button>
          <button
            onClick={() => {
              if (user) {
                onNavigate('owner');
              } else {
                onOpenAuth('register');
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl text-xs border border-slate-700 transition-all"
          >
            {user ? 'Broadcaster Workspace' : 'Publish Your Radio'}
          </button>
        </div>
      </div>

      {/* Core Mission Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-sky-500/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">1. Seamless Discovery</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Easily search live radio streams by genre (African Gospel, Praise & Worship, Bible Teaching, Talk), location (Tanzania, Kenya, USA, UK), language, or denomination.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-emerald-500/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Headphones className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">2. Uninterrupted Playback</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Low-latency audio streaming with automated uptime checking, ICY metadata parsing for song titles, backup failover streams, and persistent audio player controls.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-rose-500/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">3. Direct Ministry Support</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Empower station owners and Gospel ministries with integrated mobile money giving (M-Pesa, Tigo Pesa, Airtel Money) and verified donation tracking.
          </p>
        </div>
      </div>

      {/* Platform Features Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white">Built for Listeners & Radio Broadcasters</h2>
          <p className="text-xs text-slate-400">
            Everything you need for daily spiritual encouragement and professional radio broadcasting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Listener Features */}
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">For Listeners</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free 24/7 access to live radio streams around the globe</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interactive Community Prayer Wall to post & join in prayer</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Save your favorite stations & track recent playback</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mobile PWA app — install directly on iOS & Android</span>
              </li>
            </ul>
          </div>

          {/* Broadcaster Features */}
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">For Radio Station Owners</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>1-Click Radio Import from RadioKing, Zeno, & AzuraCast</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Automated SSRF security scanning & uptime telemetry</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Failover backup stream URLs to ensure continuous broadcast</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Collect listener support via M-Pesa, Airtel & Cards (Pesapal)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="text-center bg-gradient-to-r from-sky-900/30 via-slate-900 to-indigo-900/30 border border-slate-800 rounded-3xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-white">Ready to Start Listening or Broadcasting?</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Explore our directory of verified live Christian radio stations or publish your station today.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('directory')}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
          >
            Listen Now
          </button>
          <button
            onClick={() => onNavigate('pricing')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
          >
            Broadcaster Pricing
          </button>
        </div>
      </div>
    </div>
  );
}
