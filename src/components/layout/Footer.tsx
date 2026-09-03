import React from 'react';
import { Radio, Heart, ShieldCheck, Mail, Globe, Sparkles, PlusCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export function Footer({ onNavigate, onOpenAuth }: FooterProps) {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm pb-24 md:pb-16 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Radio className="w-4 h-4 text-sky-400" />
                </div>
              </div>
              <span className="font-bold text-lg text-white">Christian Radios</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The global SaaS directory dedicated exclusively to discovering, broadcasting, and
              streaming online Christian radio stations 24/7. Connecting believers with uplifting
              gospel melodies, prayer, and life-changing biblical teachings.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Broadcast Feeds
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Broadcasters
              </span>
            </div>
          </div>

          {/* Quick Browse */}
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
                  Live Stations Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Categories & Genres
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
                  className="hover:text-purple-400 text-purple-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>🙏 Community Prayer Wall</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('giving')}
                  className="hover:text-rose-400 text-rose-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>❤️ Giving & Station Support</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('country', 'TZ')}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <span>🇹🇿 Tanzania Gospel Radios</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Genres & Formats
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('category', 'gospel-music')}
                  className="hover:text-sky-400 transition-colors"
                >
                  African & Global Gospel
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'praise-worship')}
                  className="hover:text-sky-400 transition-colors"
                >
                  24/7 Praise & Worship
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'bible-teaching')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Bible Teaching & Ministry
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'prayer-intercession')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Prayer & Intercession Altars
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'christian-talk')}
                  className="hover:text-sky-400 transition-colors"
                >
                  Christian Talk & News
                </button>
              </li>
            </ul>
          </div>

          {/* For Broadcasters SaaS CTA */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              For Radio Owners
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Broadcasting a Christian radio station? Reach global listeners with reliable stream
              monitoring, listener telemetry, and verified directory listing.
            </p>
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-xl transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Publish Your Radio
            </button>
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
