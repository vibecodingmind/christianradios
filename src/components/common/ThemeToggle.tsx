import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme, type ThemeMode } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4 text-sky-400" /> },
    { mode: 'system', label: 'System', icon: <Monitor className="w-4 h-4 text-indigo-400" /> },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Theme: ${themeMode} mode active`}
        title={`Theme: ${themeMode} mode (Click to change)`}
        className={`p-2 sm:px-3 sm:py-2 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs font-bold active:scale-95 ${
          effectiveTheme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
            : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />}
          {themeMode === 'dark' && <Moon className="w-4 h-4 text-sky-400 fill-sky-400/20" />}
          {themeMode === 'system' && <Monitor className="w-4 h-4 text-indigo-400" />}
          <span className="hidden md:inline-block capitalize">{themeMode}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-36 rounded-2xl border shadow-2xl py-1.5 z-50 transition-all ${
            effectiveTheme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => {
                setThemeMode(opt.mode);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                themeMode === opt.mode
                  ? effectiveTheme === 'dark'
                    ? 'bg-slate-800 text-sky-400 font-bold'
                    : 'bg-sky-50 text-sky-600 font-bold'
                  : effectiveTheme === 'dark'
                  ? 'hover:bg-slate-800/60 text-slate-300'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              {themeMode === opt.mode && <Check className="w-3.5 h-3.5 text-sky-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
