import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Globe,
  Radio,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Compass,
  X,
  Star,
  CheckCircle2,
  Gem,
  HandHeart,
  Calendar,
  Activity,
} from 'lucide-react';
import { StationCard } from '../components/station/StationCard';
import type { Category, Country, Station } from '../types';

interface DirectoryPageProps {
  initialSearch?: string;
  initialCountry?: string;
  initialCategory?: string;
  onNavigate: (view: string, param?: string) => void;
}

export function DirectoryPage({
  initialSearch = '',
  initialCountry = '',
  initialCategory = '',
  onNavigate,
}: DirectoryPageProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(initialSearch);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'featured' | 'verified' | 'premium' | 'donations' | 'online' | 'schedule'>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function loadFilterTaxonomies() {
      try {
        const [catRes, countRes] = await Promise.all([
          fetch('/api/public/categories'),
          fetch('/api/public/countries'),
        ]);
        if (catRes.ok) setCategories((await catRes.json()).categories || []);
        if (countRes.ok) setCountries((await countRes.json()).countries || []);
      } catch (err) {
        console.error('Failed to load taxonomies:', err);
      }
    }
    loadFilterTaxonomies();
  }, []);

  useEffect(() => {
    async function fetchStations() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '500');
        if (search) params.set('search', search);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedLanguage) params.set('language', selectedLanguage);
        if (sortBy) params.set('sortBy', sortBy);

        if (featureFilter === 'featured') params.set('isFeatured', 'true');
        if (featureFilter === 'verified') params.set('isVerified', 'true');
        if (featureFilter === 'premium') params.set('accessType', 'PREMIUM');
        if (featureFilter === 'donations') params.set('donationEnabled', 'true');
        if (featureFilter === 'online') params.set('streamStatus', 'ONLINE');
        if (featureFilter === 'schedule') params.set('hasSchedule', 'true');

        const res = await fetch(`/api/public/stations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStations(data.stations || []);
        }
      } catch (err) {
        console.error('Failed to fetch stations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStations();
  }, [search, selectedCountry, selectedCategory, selectedLanguage, featureFilter, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setFeatureFilter('all');
    setSortBy('popular');
  };

  const hasActiveFilters =
    search || selectedCountry || selectedCategory || selectedLanguage || featureFilter !== 'all';

  // Feature metrics calculation
  const featuredCount = stations.filter((s) => s.isFeatured).length;
  const verifiedCount = stations.filter((s) => s.verificationStatus === 'VERIFIED').length;
  const premiumCount = stations.filter((s) => s.accessType === 'PREMIUM').length;
  const donationCount = stations.filter((s) => s.donationEnabled).length;

  return (
    <div className="space-y-8 pb-20 animate-page-fade-up">
      {/* 1. DISCOVER HEADER BANNER (REDESIGNED WITH ADMIN & OWNER FEATURE COUNTERS) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-sky-500/25 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Ambient Gradient Lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400 opacity-90" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] font-extrabold uppercase tracking-wider shadow-inner">
              <Compass className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              <span>Global Radio Directory</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
              {stations.length} Radio Broadcasters
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Discover Christian Radio Stations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              Explore 24/7 live worship, Bible teachings, and radio ministries with features powered by verified station owners and platform administration.
            </p>
          </div>

          {/* Live Feature Control Statistics Ribbon */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Admin Featured: <strong className="text-amber-300">{featuredCount}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Verified Broadcasters: <strong className="text-sky-300">{verifiedCount}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
              <Gem className="w-3.5 h-3.5 text-purple-400" />
              <span>Premium Access: <strong className="text-purple-300">{premiumCount}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
              <HandHeart className="w-3.5 h-3.5 text-rose-400" />
              <span>Ministry Giving: <strong className="text-rose-300">{donationCount}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ADMIN & OWNER FEATURE FILTER PILLS BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <button
          onClick={() => setFeatureFilter('all')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'all'
              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          All Stations
        </button>

        <button
          onClick={() => setFeatureFilter('featured')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'featured'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-amber-500/40 hover:text-amber-300'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          ⭐ Admin Featured
        </button>

        <button
          onClick={() => setFeatureFilter('verified')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'verified'
              ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-md shadow-sky-400/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-sky-500/40 hover:text-sky-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          ☑️ Verified Broadcasters
        </button>

        <button
          onClick={() => setFeatureFilter('premium')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'premium'
              ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-purple-500/40 hover:text-purple-300'
          }`}
        >
          <Gem className="w-3.5 h-3.5" />
          💎 Premium Radios
        </button>

        <button
          onClick={() => setFeatureFilter('donations')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'donations'
              ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-rose-500/40 hover:text-rose-300'
          }`}
        >
          <HandHeart className="w-3.5 h-3.5" />
          🙏 Ministry Giving Active
        </button>

        <button
          onClick={() => setFeatureFilter('online')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'online'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          🔴 Live Broadcasts
        </button>

        <button
          onClick={() => setFeatureFilter('schedule')}
          className={`px-4 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            featureFilter === 'schedule'
              ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          📅 Has Broadcast Schedule
        </button>
      </div>

      {/* 3. ADVANCED SEARCH & TAXONOMY TOOLBAR */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search station, city, genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-9 pr-8 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Country Filter */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="">🌍 All Countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flagEmoji} {c.name}
                </option>
              ))}
            </select>
            <Globe className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="">🎵 All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Language Filter */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="">🗣️ All Languages</option>
              <option value="Swahili">Swahili</option>
              <option value="English">English</option>
              <option value="Luganda">Luganda</option>
              <option value="Yoruba">Yoruba</option>
              <option value="Zulu">Zulu</option>
              <option value="French">French</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="popular">🔥 Most Popular</option>
              <option value="trending">⚡ Trending</option>
              <option value="newest">✨ Newest</option>
              <option value="name">🔤 Name (A-Z)</option>
            </select>
            <Sparkles className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggles */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Grid View"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              aria-label="List View"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors font-bold px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/60 text-xs">
            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold">
                Query: "{search}"
                <button onClick={() => setSearch('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCountry && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                Country: {selectedCountry}
                <button onClick={() => setSelectedCountry('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {featureFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                Filter: {featureFilter.toUpperCase()}
                <button onClick={() => setFeatureFilter('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stations Results */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading radio broadcasts...</p>
        </div>
      ) : stations.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onNavigate={onNavigate}
                layout="horizontal"
              />
            ))}
          </div>
        )
      ) : (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
          <Radio className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Christian radio stations match this filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria, feature filters, or clearing country/category filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
