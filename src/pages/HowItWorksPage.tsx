import React, { useEffect } from 'react';
import {
  Compass,
  Radio,
  Heart,
  Headphones,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  PlusCircle,
  Share2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface HowItWorksPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function HowItWorksPage({ onNavigate, onOpenAuth, onPublicAction }: HowItWorksPageProps) {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'How It Works — Christian Radios';
  }, []);

  return (
    <div id="how-it-works-page-root" className="space-y-12 pb-24">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          Platform Guide
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          How Christian Radios Works
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          The simple journey from discovering live Gospel streams to broadcasting your ministry to global listeners.
        </p>
      </div>

      {/* SECTION 1: FOR LISTENERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">For Listeners & Believers</h2>
            <p className="text-xs text-slate-400">Discover → Listen → Save → Support → Pray</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs">
              1
            </div>
            <h3 className="font-bold text-white text-base">Discover Stations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search by genre (Praise & Worship, Gospel, Bible Teaching), country (Tanzania, Kenya, USA), or language.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs">
              2
            </div>
            <h3 className="font-bold text-white text-base">Listen Anywhere</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stream uninterrupted HD audio with persistent player controls, song title metadata, and sleep timer.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs">
              3
            </div>
            <h3 className="font-bold text-white text-base">Save & Share</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bookmark favorite stations, receive broadcast notifications, and share stream links with family and friends.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs">
              4
            </div>
            <h3 className="font-bold text-white text-base">Pray & Bless</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit prayer requests on the Community Prayer Wall and bless radio ministries with direct mobile money giving.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: FOR RADIO OWNERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">For Radio Station Owners & Broadcasters</h2>
            <p className="text-xs text-slate-400">Add/Import → Verify → Stream → Promote → Receive Support</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
              1
            </div>
            <h3 className="font-bold text-white text-base">Add or Import Radio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create a new station listing, import your stream URL from RadioKing / Zeno / AzuraCast, or claim an existing entry.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
              2
            </div>
            <h3 className="font-bold text-white text-base">SSRF & Stream Validation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our automated engine validates stream health, verifies network security, and assigns your verified station badge.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
              3
            </div>
            <h3 className="font-bold text-white text-base">24/7 Monitoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enjoy automated uptime pings and configure backup failover stream URLs to ensure continuous broadcast.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
              4
            </div>
            <h3 className="font-bold text-white text-base">Receive Giving & Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track active listeners and receive direct financial support via M-Pesa, Airtel Money, Tigo Pesa, and Cards.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-sky-950/40 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-white">Get Started Today</h2>
          <p className="text-xs text-slate-400 mt-1">Join the premier global SaaS platform for Christian radio streaming.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('directory')}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition"
          >
            Start Listening
          </button>
          <button
            onClick={() => {
              if (user) {
                onNavigate('owner');
              } else {
                onOpenAuth('register');
              }
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition"
          >
            {user ? 'Broadcaster Workspace' : 'List Your Station'}
          </button>
        </div>
      </div>
    </div>
  );
}
