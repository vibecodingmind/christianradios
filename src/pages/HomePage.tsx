import React, { useEffect, useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Compass,
  Sparkles,
  Globe,
  Heart,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
  Headphones,
  ArrowRight,
  Flame,
  Volume2,
  HeartHandshake,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { StationCard } from '../components/station/StationCard';
import { DailyVerseCard } from '../components/home/DailyVerseCard';
import type { Category, Country, Station } from '../types';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export function HomePage({ onNavigate, onOpenAuth }: HomePageProps) {
  const { currentStation, isPlaying, playStation, togglePlay } = useAudioPlayer();
  const [featuredStations, setFeaturedStations] = useState<Station[]>([]);
  const [liveStations, setLiveStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [stats, setStats] = useState<{
    totalStations: number;
    onlineStations: number;
    countriesCount: number;
    totalPlays: number;
    liveListenersEstimate: number;
  }>({
    totalStations: 10,
    onlineStations: 10,
    countriesCount: 7,
    totalPlays: 125000,
    liveListenersEstimate: 3450,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featRes, liveRes, catRes, countRes, statsRes] = await Promise.all([
          fetch('/api/public/featured'),
          fetch('/api/public/live'),
          fetch('/api/public/categories'),
          fetch('/api/public/countries'),
          fetch('/api/public/stats'),
        ]);

        if (featRes.ok) {
          const data = await featRes.json();
          setFeaturedStations(data.stations || []);
        }
        if (liveRes.ok) {
          const data = await liveRes.json();
          setLiveStations(data.stations || []);
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
        if (countRes.ok) {
          const data = await countRes.json();
          setCountries(data.countries || []);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const heroSpotlight = featuredStations[0] || liveStations[0];
  const isHeroPlaying = heroSpotlight && currentStation?.id === heroSpotlight.id && isPlaying;

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Showcase Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs text-sky-400 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{stats.onlineStations} Christian Radios Online Now</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Listen to Uplifting{' '}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                Christian Radios
              </span>{' '}
              Worldwide
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Stream 24/7 Gospel music, live prayers, inspiring Christian talk, and worship anthems from
              Tanzania, East Africa, and across the globe with high-fidelity audio.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('directory')}
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Explore Radios Directory
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Broadcaster Portal
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 max-w-md text-slate-400">
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-white">
                  {stats.totalStations}+
                </div>
                <div className="text-[11px]">Stations Listed</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-white">
                  {stats.countriesCount}
                </div>
                <div className="text-[11px]">Countries</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-white">24/7</div>
                <div className="text-[11px]">Live Streaming</div>
              </div>
            </div>
          </div>

          {/* Right Spotlight Station Card */}
          {heroSpotlight && (
            <div className="lg:col-span-5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative group">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Broadcast
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={heroSpotlight.logoUrl}
                    alt={heroSpotlight.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-800 border border-slate-700 shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                      {heroSpotlight.name}
                    </h2>
                    <p className="text-xs text-sky-400 italic truncate">
                      "{heroSpotlight.tagline || heroSpotlight.genre}"
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {heroSpotlight.country?.flagEmoji} {heroSpotlight.city},{' '}
                      {heroSpotlight.country?.name}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 mb-5 leading-relaxed">
                  {heroSpotlight.description}
                </p>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online • 128 kbps
                  </span>

                  <button
                    onClick={() => {
                      if (currentStation?.id === heroSpotlight.id) {
                        togglePlay();
                      } else {
                        playStation(heroSpotlight);
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                      isHeroPlaying
                        ? 'bg-sky-400 text-slate-950 shadow-sky-400/30'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/25'
                    }`}
                  >
                    {isHeroPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current ml-0.5" /> Listen Live
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Daily Scripture Meditation (Bilingual EN/SW with audio narration) */}
      <DailyVerseCard />

      {/* Quick Spiritual Hub Cards (Prayer Wall & Radio Discovery) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          onClick={() => onNavigate('prayer-wall')}
          className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/20 hover:border-purple-500/40 p-6 sm:p-8 transition-all shadow-lg hover:shadow-purple-950/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition">
              Community Prayer Wall
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Post your prayer needs, intercede for others worldwide, and receive agreement in prayer from believers and on-air pastors.
            </p>
          </div>

          <div className="pt-5 flex items-center gap-1.5 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
            <span>Explore Prayer Requests</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('directory')}
          className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/20 hover:border-sky-500/40 p-6 sm:p-8 transition-all shadow-lg hover:shadow-sky-950/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition">
              Explore Live Radio Stations
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Discover verified Christian radio stations by country, genre, language, or city streaming inspiring worship and spiritual music 24/7.
            </p>
          </div>

          <div className="pt-5 flex items-center gap-1.5 text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
            <span>Discover All Radios</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* 2. Popular Categories Pills */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Browse by Category</h2>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('category', cat.slug)}
              className="bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 p-3 rounded-2xl text-left transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                  {cat.name}
                </div>
                <div className="text-[10px] text-slate-500">{cat.stationCount || 1} stations</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Featured Radio Stations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Featured Broadcasters</h2>
          </div>
          <button
            onClick={() => onNavigate('directory')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {featuredStations.slice(0, 4).map((station) => (
            <StationCard key={station.id} station={station} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 4. Top Stations in Tanzania 🇹🇿 & East Africa */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇹🇿</span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Top Christian Radios in Tanzania
              </h2>
              <p className="text-xs text-slate-400">
                Radio Maria, Upendo FM, Wapo Radio, Safina, Praise FM & more
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('country', 'TZ')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            View Tanzania Radios <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredStations
            .filter((s) => s.countryCode === 'TZ')
            .slice(0, 6)
            .map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onNavigate={onNavigate}
                layout="horizontal"
              />
            ))}
        </div>
      </section>

      {/* 5. Live Streams Now */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">Live Streams Worldwide</h2>
          </div>
          <button
            onClick={() => onNavigate('directory')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            Full Directory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {liveStations.slice(0, 8).map((station) => (
            <StationCard key={station.id} station={station} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 6. Explore By Country Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Explore by Country</h2>
          </div>
          <button
            onClick={() => onNavigate('countries')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            All Countries <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => onNavigate('country', country.code)}
              className="bg-slate-900/60 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 transition-colors text-left"
            >
              <span className="text-2xl">{country.flagEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-200 truncate">{country.name}</div>
                <div className="text-[10px] text-slate-500">
                  {country.stationCount || 1} stations
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 7. Broadcaster SaaS Onboarding Card */}
      <section className="bg-gradient-to-r from-sky-900/60 via-indigo-950 to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
            For Christian Broadcasters & Radio Stations
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Broadcasting the Gospel? Join the Christian Radios SaaS Network.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Reach thousands of listeners globally with real-time stream uptime telemetry, automatic
            backup stream failover, verified listing, broadcast timetable scheduling, and in-depth
            listener analytics.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-sky-500/20"
            >
              Register Your Radio Station
            </button>
            <button
              onClick={() => onNavigate('owner')}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              View Broadcaster Pricing & Plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
