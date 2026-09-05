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
  Flame,
  Volume2,
  CheckCircle2,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { StationCard } from '../components/station/StationCard';
import type { Category, Country, Station } from '../types';

interface DirectoryPageProps {
  initialSearch?: string;
  initialCountry?: string;
  initialCategory?: string;
  onNavigate: (view: string, param?: string) => void;
}

const quickCategoryChips = [
  { label: 'Praise & Worship', slug: 'praise-worship', icon: '🎵' },
  { label: 'Bible Teaching', slug: 'bible-teaching', icon: '📖' },
  { label: 'Prayer & Deliverance', slug: 'prayer-intercession', icon: '🙏' },
  { label: 'Gospel Classics', slug: 'gospel-music', icon: '📻' },
  { label: 'Christian Talk', slug: 'christian-talk', icon: '🗣️' },
];

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

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStations, setTotalStations] = useState(0);

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
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (search) params.set('search', search);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedLanguage) params.set('language', selectedLanguage);
        if (sortBy) params.set('sortBy', sortBy);

        const res = await fetch(`/api/public/stations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStations(data.stations || []);
          const totalPg = data.pagination?.totalPages ?? data.totalPages ?? 1;
          const totalStns = data.pagination?.total ?? data.total ?? (data.stations ? data.stations.length : 0);
          setTotalPages(totalPg);
          setTotalStations(totalStns);
        }
      } catch (err) {
        console.error('Failed to fetch stations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStations();
  }, [page, limit, search, selectedCountry, selectedCategory, selectedLanguage, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setSortBy('popular');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedCountry || selectedCategory || selectedLanguage);

  return (
    <div className="space-y-6 pb-24 animate-page-fade-up">
      {/* HERO DISCOVER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-sky-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 opacity-90" />

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>Global Christian Radio Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Discover Live Praise, Worship & Sermons
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Explore live 24/7 Christian radio stations from East Africa and around the globe. Filter by country, genre focus, or spoken language.
          </p>
        </div>

        {/* Quick Genre Chips */}
        <div className="relative z-10 flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Categories:
          </span>
          {quickCategoryChips.map((chip) => {
            const isSelected = selectedCategory === chip.slug;
            return (
              <button
                key={chip.slug}
                onClick={() => setSelectedCategory(isSelected ? '' : chip.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTROL & FILTER TOOLBAR */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search by station name, city, minister, tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-9 pr-8 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Country Filter */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="">🎵 All Categories ({categories.length})</option>
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
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="">🗣️ All Languages</option>
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
              <option value="Español">Español</option>
              <option value="Português">Português</option>
              <option value="Français">Français</option>
              <option value="Luganda">Luganda</option>
              <option value="Română">Română</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
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
        </div>

        {/* ACTIVE FILTERS PILL BADGES */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>

            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold">
                Search: "{search}"
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => { setSearch(''); setPage(1); }} />
              </span>
            )}

            {selectedCountry && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold">
                Country: {countries.find((c) => c.code === selectedCountry)?.name || selectedCountry}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => { setSelectedCountry(''); setPage(1); }} />
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold">
                Category: {categories.find((cat) => cat.slug === selectedCategory)?.name || selectedCategory}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => { setSelectedCategory(''); setPage(1); }} />
              </span>
            )}

            {selectedLanguage && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold">
                Language: {selectedLanguage}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => { setSelectedLanguage(''); setPage(1); }} />
              </span>
            )}

            <button
              onClick={resetFilters}
              className="text-rose-400 hover:text-rose-300 font-bold ml-auto flex items-center gap-1 underline underline-offset-4 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* RESULTS HEADER & COUNTER */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <span>
            Showing <strong className="text-white">{totalStations > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalStations)}</strong> of <strong className="text-amber-400">{totalStations}</strong> Christian Radio Stations
          </span>
        </h2>
      </div>

      {/* RESULTS GRID / LIST */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-3 h-64 animate-pulse" />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4">
            <Compass className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No stations matched your criteria</h3>
              <p className="text-xs text-slate-400">Try broadening your search term or clearing active category filters.</p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-2xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-colors cursor-pointer shadow-md"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4.5'
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

        {/* Pagination Bar */}
        {(totalPages > 1 || totalStations > 12) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400">
              Showing <span className="text-white font-bold">{Math.min((page - 1) * limit + 1, totalStations)}</span>–<span className="text-white font-bold">{Math.min(page * limit, totalStations)}</span> of <span className="text-amber-400 font-bold">{totalStations}</span> stations
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page Arrow */}
              <button
                onClick={() => {
                  if (page > 1) {
                    setPage(1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                disabled={page <= 1}
                title="First Page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page Arrow */}
              <button
                onClick={() => {
                  if (page > 1) {
                    setPage((p) => p - 1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                disabled={page <= 1}
                title="Previous Page"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-600 text-xs font-bold">...</span>}
                        <button
                          onClick={() => {
                            setPage(p);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center ${
                            page === p
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                              : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page Arrow */}
              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                disabled={page >= totalPages}
                title="Next Page"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>

              {/* Last Page Arrow */}
              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage(totalPages);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                disabled={page >= totalPages}
                title="Last Page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Items Per Page Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* COMMUNITY TESTIMONIALS & 5-STAR REVIEWS SECTION */}
      <div className="space-y-6 pt-10 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Listener Voices & Feedback</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Community Testimonies & 5-Star Ratings
            </h2>
            <p className="text-xs text-slate-400">
              Hear how Christian radio streams are encouraging believers across cities and countries.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 relative group">
            <Quote className="w-10 h-10 text-slate-800/50 absolute top-4 right-4 pointer-events-none group-hover:text-amber-500/20 transition-colors" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <h4 className="font-bold text-sm text-white">"Transformed our daily family prayer time"</h4>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "Listening to morning worship and teaching programs has brought immense peace and spiritual strength into our home every single morning."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-200">Theresia M.</span>
              <span>Dar es Salaam, 🇹🇿</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 relative group">
            <Quote className="w-10 h-10 text-slate-800/50 absolute top-4 right-4 pointer-events-none group-hover:text-amber-500/20 transition-colors" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <h4 className="font-bold text-sm text-white">"Crystal clear HD stream quality!"</h4>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "The audio player streams without buffering even on mobile networks while traveling. Being able to bookmark favorites is fantastic."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-200">Baraka Joshua</span>
              <span>Arusha, 🇹🇿</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 relative group">
            <Quote className="w-10 h-10 text-slate-800/50 absolute top-4 right-4 pointer-events-none group-hover:text-amber-500/20 transition-colors" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <h4 className="font-bold text-sm text-white">"Connecting African gospel ministries"</h4>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "A unified directory for Christian broadcasting across East Africa. It helps our ministry reach diaspora listeners worldwide."
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-200">Grace Wambui</span>
              <span>Nairobi, 🇰🇪</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
