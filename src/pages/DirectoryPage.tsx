import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Globe,
  Radio,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Compass,
  X,
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
        params.set('limit', '1000');
        if (search) params.set('search', search);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedLanguage) params.set('language', selectedLanguage);
        if (sortBy) params.set('sortBy', sortBy);

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
  }, [search, selectedCountry, selectedCategory, selectedLanguage, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setSortBy('popular');
  };

  const hasActiveFilters = Boolean(search || selectedCountry || selectedCategory || selectedLanguage);

  return (
    <div className="space-y-6 pb-20 animate-page-fade-up">
      {/* DISCOVER HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-sky-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 opacity-90" />

        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Discover Christian Radio Stations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
            Listen live to 24/7 praise, worship, Bible teachings, and sermons from around the world.
          </p>
        </div>
      </div>

      {/* SEARCH & TAXONOMY TOOLBAR */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search station, city, country..."
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
              <option value="">🌍 All Countries ({countries.length})</option>
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
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Português">Português</option>
              <option value="Français">Français</option>
              <option value="Swahili">Swahili</option>
              <option value="Luganda">Luganda</option>
              <option value="Română">Română</option>
              <option value="Pусский">Russian</option>
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
              className="px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* RESULTS GRID / LIST */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-3 h-56 animate-pulse" />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4">
            <Compass className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No stations found</h3>
              <p className="text-xs text-slate-400">Try searching with a different station name or country.</p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-2xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                : 'space-y-3'
            }
          >
            {stations.map((stn) => (
              <StationCard
                key={stn.id}
                station={stn}
                onNavigate={onNavigate}
                layout={viewMode === 'list' ? 'horizontal' : 'grid'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
