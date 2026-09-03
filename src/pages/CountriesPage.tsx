import React, { useState, useEffect } from 'react';
import { Globe, Radio, ArrowRight } from 'lucide-react';
import type { Country } from '../types';

interface CountriesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function CountriesPage({ onNavigate }: CountriesPageProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Group by Continent
  const continents = ['Africa', 'North America', 'Europe', 'South America', 'Asia', 'Oceania'];

  return (
    <div className="space-y-8 pb-16">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
          <Globe className="w-4 h-4" />
          Global Reach
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Browse Radios by Country & Region
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Listen to Christian radio broadcasts originating from countries across Africa and
          worldwide.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {continents.map((continent) => {
            const list = countries.filter(
              (c) => c.continent.toLowerCase() === continent.toLowerCase()
            );
            if (list.length === 0) return null;

            return (
              <div key={continent} className="space-y-4">
                <h2 className="text-lg font-bold text-white tracking-tight border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>{continent}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {list.reduce((acc, c) => acc + (c.stationCount || 1), 0)} stations total
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {list.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => onNavigate('country', country.code)}
                      className="group bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0">{country.flagEmoji}</span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-200 group-hover:text-white truncate">
                            {country.name}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {country.stationCount || 1} Stations
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-transform" />
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
