import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  Globe,
  Radio,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
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
  const [onlineOnly, setOnlineOnly] = useState(false);
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
        if (search) params.set('search', search);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedLanguage) params.set('language', selectedLanguage);
        if (onlineOnly) params.set('onlineOnly', 'true');
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
  }, [search, selectedCountry, selectedCategory, selectedLanguage, onlineOnly, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setOnlineOnly(false);
    setSortBy('popular');
  };

  const hasActiveFilters =
    search || selectedCountry || selectedCategory || selectedLanguage || onlineOnly;

  return (
    <div className="space-y-6 pb-16">
      {/* Directory Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
              <Layers className="w-4 h-4" />
              Global Christian Radio Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore All Radio Stations
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Showing {stations.length} broadcast stations matching your criteria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl border transition-colors ${
                viewMode === 'list'
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search station or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji} {c.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Languages</option>
            <option value="Swahili">Swahili (Kiswahili)</option>
            <option value="English">English</option>
            <option value="Luganda">Luganda</option>
            <option value="Yoruba">Yoruba</option>
            <option value="Zulu">Zulu</option>
            <option value="French">French</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="popular">Most Popular</option>
            <option value="trending">Trending Now</option>
            <option value="newest">Recently Added</option>
            <option value="name">Name (A - Z)</option>
          </select>
        </div>

        {/* Secondary Toggles & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live & Online Only
              </span>
            </label>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Stations List/Grid Results */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading radio broadcasts...</p>
        </div>
      ) : stations.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
          <h3 className="text-base font-bold text-white">No Christian radio stations found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or clearing selected country/category filters.
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
