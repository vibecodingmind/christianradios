import React, { useState, useEffect } from 'react';
import { Globe, Radio, ArrowRight, Search, X } from 'lucide-react';
import type { Country } from '../types';

interface CountriesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function CountriesPage({ onNavigate }: CountriesPageProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/countries');
        if (res.ok) {
          const data = await res.json();
          setCountries(data.countries || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const continents = ['Africa', 'North America', 'Europe', 'South America', 'Asia', 'Oceania'];

  const filteredCountries = countries.filter((c) =>
    searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-8 pb-20 animate-page-fade-up">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border border-sky-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-extrabold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Global Coverage</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Browse Radios by Country & Region
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Listen live to Christian radio broadcasts originating from countries across East Africa and worldwide.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <input
            type="text"
            placeholder="Filter country by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500/60 rounded-2xl py-2.5 pl-9 pr-8 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
          />
          <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {continents.map((continent) => {
            const list = filteredCountries.filter(
              (c) => c.continent.toLowerCase() === continent.toLowerCase()
            );
            if (list.length === 0) return null;

            return (
              <div key={continent} className="space-y-4">
                <h2 className="text-lg font-black text-white tracking-tight border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    {continent}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {list.reduce((acc, c) => acc + (c.stationCount || 1), 0)} Stations Live
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {list.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => onNavigate('country', country.code)}
                      className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-sky-500/50 p-4.5 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center justify-between shadow-lg hover:shadow-sky-500/10 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform">{country.flagEmoji}</span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-slate-200 group-hover:text-white truncate">
                            {country.name}
                          </h3>
                          <span className="text-[11px] font-semibold text-sky-400/90 block mt-0.5">
                            {country.stationCount || 1} Stations Active
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
