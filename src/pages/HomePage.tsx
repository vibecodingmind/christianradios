import React, { useEffect, useState } from 'react';
import {
  Radio,
  Globe,
  Filter,
  SlidersHorizontal,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { StationCard } from '../components/station/StationCard';
import { apiFetch } from '../lib/api';
import type { Category, Country, Station } from '../types';

const quickCategoryChips = [
  { id: 'worship', label: 'Praise & Worship', icon: '🎵', slug: 'praise-worship' },
  { id: 'gospel', label: 'Gospel Classics', icon: '📻', slug: 'gospel-music' },
  { id: 'swahili', label: 'Swahili Gospel', icon: '🇹🇿', slug: 'swahili-gospel' },
  { id: 'awr', label: 'Adventist (AWR)', icon: '🌍', slug: 'adventist-world-radios' },
  { id: 'teaching', label: 'Bible Teaching', icon: '📖', slug: 'sound-doctrine-teachings' },
  { id: 'afro', label: 'Afro Gospel', icon: '⚡', slug: 'afro-gospel' },
  { id: 'youth', label: 'Hip-Hop & Youth', icon: '🔥', slug: 'christian-hip-hop' },
  { id: 'prayer', label: 'Prayer & Instrumental', icon: '🕊️', slug: 'prayer-deliverance' },
  { id: 'talk', label: 'Christian Talk', icon: '🗣️', slug: 'christian-talk' },
];

export interface HomePageProps {
  initialSearch?: string;
  initialCategory?: string;
  initialCountry?: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
  onPublicAction?: (intent: 'ADD_RADIO' | 'CLAIM_STATION', options?: { stationId?: string }) => void;
}

export function HomePage({
  initialSearch = '',
  initialCategory = '',
  initialCountry = '',
  onNavigate,
}: HomePageProps) {
  // Directory state
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStations, setTotalStations] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [directoryStations, setDirectoryStations] = useState<Station[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
      setPage(1);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialCountry !== undefined) {
      setSelectedCountry(initialCountry);
      setPage(1);
    }
  }, [initialCountry]);

  useEffect(() => {
    async function fetchTaxonomies() {
      try {
        const [catRes, countRes] = await Promise.all([
          apiFetch('/api/public/categories'),
          apiFetch('/api/public/countries'),
        ]);
        if (catRes.ok) setCategories((await catRes.json()).categories || []);
        if (countRes.ok) setCountries((await countRes.json()).countries || []);
      } catch (err) {
        console.error('Failed to load taxonomies:', err);
      }
    }
    fetchTaxonomies();
  }, []);

  useEffect(() => {
    async function fetchDirectoryStations() {
      setLoadingDirectory(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '24');
        if (search) params.set('search', search);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedCategory) params.set('category', selectedCategory);
        if (sortBy) params.set('sortBy', sortBy);

        const res = await apiFetch(`/api/public/stations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDirectoryStations(data.stations || []);
          const totalPg = data.pagination?.totalPages ?? data.totalPages ?? 1;
          const totalStns = data.pagination?.total ?? data.total ?? (data.stations ? data.stations.length : 0);
          setTotalPages(totalPg);
          setTotalStations(totalStns);
        }
      } catch (err) {
        console.error('Failed to load directory stations:', err);
      } finally {
        setLoadingDirectory(false);
      }
    }
    fetchDirectoryStations();
  }, [page, search, selectedCountry, selectedCategory, sortBy]);

  const resetDirectoryFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSortBy('popular');
    setPage(1);
  };

  const hasActiveDirectoryFilters = Boolean(search || selectedCountry || selectedCategory || sortBy !== 'popular');

  return (
    <div className="space-y-6 pb-28 animate-page-fade-up">
      {/* ========================================================================= */}
      {/* DISCOVER LIVE CHRISTIAN RADIOS (ALL STATIONS DIRECTORY)                   */}
      {/* ========================================================================= */}
      <section id="discover-stations" aria-label="Discover Christian Radios" className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Broadcast Catalog</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-sky-400" />
              <span>Discover Christian Radios</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Listen to 24/7 verified Christian radio stations from East Africa and around the globe. Filter by country, genre, or search directly.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
              <strong className="text-amber-400">{totalStations.toLocaleString()}</strong> Stations Online
            </span>
            {hasActiveDirectoryFilters && (
              <button
                onClick={resetDirectoryFilters}
                className="px-3 py-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Taxonomy Filters & Sort Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-3.5 sm:p-5 space-y-3.5 shadow-xl backdrop-blur-xl">
          {/* Top Row: Search + Country + Category + Sort */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search stations by name, city, frequency, or tag..."
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

            {/* Country Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">🌍 All Countries ({countries.length || '10+'})</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flagEmoji || '🏳️'} {c.name}
                  </option>
                ))}
              </select>
              <Globe className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto bg-slate-950 border border-slate-800/90 focus:border-sky-500/60 rounded-2xl py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">🎵 All Genres ({categories.length || '15+'})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
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
              <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              Quick Genres:
            </span>
            <button
              onClick={() => {
                setSelectedCategory('');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                !selectedCategory
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-extrabold'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              All
            </button>
            {quickCategoryChips.map((chip) => {
              const isSelected = selectedCategory === chip.slug;
              return (
                <button
                  key={chip.slug}
                  onClick={() => {
                    setSelectedCategory(isSelected ? '' : chip.slug);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-extrabold'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
          <div>
            Showing <span className="text-white font-bold">{totalStations > 0 ? (page - 1) * 24 + 1 : 0}–{Math.min(page * 24, totalStations)}</span> of <span className="text-amber-400 font-bold">{totalStations.toLocaleString()}</span> stations
          </div>
          {loadingDirectory && (
            <div className="flex items-center gap-2 text-sky-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Loading stations...</span>
            </div>
          )}
        </div>

        {/* Radio Cards Grid */}
        {loadingDirectory ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 h-60 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-800/60 rounded-2xl" />
                <div className="space-y-2 mt-3">
                  <div className="h-4 bg-slate-800/80 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : directoryStations.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-4 px-4">
            <Compass className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">No stations matched your search</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                We couldn&apos;t find any stations matching &ldquo;{search}&rdquo;. Try another search term or reset your category/country filters.
              </p>
            </div>
            {hasActiveDirectoryFilters && (
              <button
                onClick={resetDirectoryFilters}
                className="px-5 py-2.5 rounded-2xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
            {directoryStations.map((stn) => (
              <StationCard
                key={stn.id}
                station={stn}
                variant="featured"
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {(totalPages > 1 || totalStations > 24) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400">
              Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (page > 1) {
                    setPage(1);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page <= 1}
                title="First Page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (page > 1) {
                    setPage((p) => p - 1);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page <= 1}
                title="Previous Page"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-600 font-bold text-xs">...</span>}
                        <button
                          onClick={() => {
                            setPage(p);
                            document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            page === p
                              ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md shadow-sky-500/20'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage((p) => p + 1);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page >= totalPages}
                title="Next Page"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>

              <button
                onClick={() => {
                  if (page < totalPages) {
                    setPage(totalPages);
                    document.getElementById('discover-stations')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={page >= totalPages}
                title="Last Page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
