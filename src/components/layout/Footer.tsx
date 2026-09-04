import React from 'react';
import { Radio, Heart, ShieldCheck, Mail, Globe, Sparkles, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function Footer({ onNavigate, onOpenAuth, onPublicAction }: FooterProps) {
  const { user } = useAuth();
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm pb-24 md:pb-16 pt-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Radio className="w-4 h-4 text-sky-400" />
                </div>
              </div>
              <span className="font-bold text-lg text-white">Christian Radios</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The global SaaS directory dedicated exclusively to discovering, broadcasting, and
              streaming online Christian radio stations 24/7. Connecting believers with uplifting
              gospel melodies, prayer, and life-changing biblical teachings.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Feeds
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          </div>

          {/* Column 2: Explore & Listen */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Explore & Listen
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Featured Stations
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('directory')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Live Radio Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Genres & Formats
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('countries')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Countries & Continents
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('prayer-wall')}
                  className="hover:text-purple-400 text-purple-300 font-medium transition-colors flex items-center gap-1"
                >
                  <span>🙏 Prayer Altar Wall</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('giving')}
                  className="hover:text-rose-400 text-rose-300 font-medium transition-colors flex items-center gap-1"
                >
                  <span>❤️ Giving & Station Support</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: For Radio Owners */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Radio Broadcasters
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onPublicAction ? onPublicAction('ADD_RADIO') : onNavigate('list-your-radio')}
                  className="hover:text-amber-400 text-amber-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>✨ List Your Radio</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPublicAction ? onPublicAction('ADD_RADIO') : onNavigate('owner')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Add / Import Station
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('directory')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Claim Existing Listing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-sky-400 transition-colors font-medium text-slate-300"
                >
                  Broadcaster Pricing Plans
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Broadcaster Uptime FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: About & Support */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              About & Help
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-sky-400 transition-colors"
                >
                  About Christian Radios
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-sky-400 transition-colors"
                >
                  How Platform Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Help Center & Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('help')}
                  className="hover:text-rose-400 transition-colors"
                >
                  Report Stream Issue
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal & Policies */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Legal & Policies
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('legal', 'terms')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'privacy')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'cookies')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'copyright')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Copyright & DMCA
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'giving')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Giving Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal', 'refund')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Refund & Cancellation Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} Christian Radios SaaS.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-400">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for the Kingdom of God
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
