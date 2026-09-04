import React, { useEffect } from 'react';
import {
  Radio,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Globe,
  Zap,
  Activity,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Headphones,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface ListYourRadioPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function ListYourRadioPage({ onNavigate, onOpenAuth, onPublicAction }: ListYourRadioPageProps) {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'List Your Radio Station — Christian Radios Broadcaster SaaS';
  }, []);

  const handleBroadcasterAction = () => {
    if (onPublicAction) {
      onPublicAction('ADD_RADIO');
    } else if (user) {
      if (user.role === 'SUPER_ADMIN') {
        onNavigate('admin');
      } else {
        onNavigate('owner');
      }
    } else {
      onOpenAuth('register');
    }
  };

  return (
    <div id="list-your-radio-page-root" className="space-y-12 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5" />
          For Radio Station Owners & Ministry Engineers
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
          Publish Your Radio Station to Thousands of Global Listeners
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
          Expand your Christian ministry footprint with enterprise stream uptime telemetry, mobile app support, backup failover streams, and integrated listener giving.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={handleBroadcasterAction}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {user ? 'Go to Broadcaster Workspace' : 'Add Station Free'}
          </button>
          <button
            onClick={() => onNavigate('pricing')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
          >
            View Subscription Packages
          </button>
        </div>
      </div>

      {/* 3 Simple Onboarding Paths */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">3 Easy Ways to Join Christian Radios</h2>
          <p className="text-xs text-slate-400">Choose the path that best fits your current broadcasting setup.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Path 1: Create Scratch */}
          <div
            onClick={handleBroadcasterAction}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 space-y-4 transition-all cursor-pointer group shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              1. Add Station manually
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your station title, cover artwork, city, country, genre, and Shoutcast/Icecast/HLS live stream URL directly.
            </p>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              Start Manual Listing <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Path 2: Import URL */}
          <div
            onClick={handleBroadcasterAction}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 space-y-4 transition-all cursor-pointer group shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              2. 1-Click Stream Import
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste your RadioKing, Zeno Media, or AzuraCast URL to automatically extract logos, genres, and live audio streams.
            </p>
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
              Import Station Stream <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Path 3: Claim Listing */}
          <div
            onClick={() => onNavigate('directory')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 space-y-4 transition-all cursor-pointer group shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
              3. Claim Existing Listing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Is your radio station already listed in our directory? Verify your official email or credentials to take ownership.
            </p>
            <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">
              Search & Claim Listing <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Why Broadcasters Choose Christian Radios */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <h2 className="text-2xl font-extrabold text-white text-center">Built for Professional Ministry Radio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Automated SSRF Stream Firewall</div>
              <div className="text-xs text-slate-400 mt-0.5">Protect your audio servers against loopback probing and unauthorized pings.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Failover Backup Stream URLs</div>
              <div className="text-xs text-slate-400 mt-0.5">Configure secondary backup URLs so your listeners never experience dead silence.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Pesapal & Mobile Money Giving</div>
              <div className="text-xs text-slate-400 mt-0.5">Collect donations directly from listeners via Vodacom M-Pesa, Airtel Money, Tigo Pesa & Cards.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Real-Time Audience Telemetry</div>
              <div className="text-xs text-slate-400 mt-0.5">Monitor total streams, active listening time, top listener countries, and daily play trends.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Embeddable HTML Radio Player</div>
              <div className="text-xs text-slate-400 mt-0.5">Generate customized HTML iframe player widgets to embed on your own ministry website.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">Verified Broadcaster Badge</div>
              <div className="text-xs text-slate-400 mt-0.5">Gain trust with an official verified badge signifying verified radio station ownership.</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
        <h2 className="text-2xl font-black text-white">Ready to Reach Thousands of Global Listeners?</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          {user ? 'Manage your stations and stream settings in your workspace.' : 'Create your free broadcaster account today and list your radio station in minutes.'}
        </p>
        <button
          onClick={handleBroadcasterAction}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          {user ? 'Go to Broadcaster Workspace' : 'Publish Station Now'}
        </button>
      </div>
    </div>
  );
}
