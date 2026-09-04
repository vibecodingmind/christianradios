import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

interface CarouselProps {
  title: string;
  subtitle?: string;
  viewAllView?: string;
  viewAllParam?: string;
  onNavigate?: (view: string, param?: string) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  itemClassName?: string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
}

export function Carousel({
  title,
  subtitle,
  viewAllView = 'directory',
  viewAllParam,
  onNavigate,
  children,
  icon,
  itemClassName = 'w-[75vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-14px)] xl:w-[calc(20%-14px)] shrink-0 snap-start',
  isLoading = false,
  error = null,
  emptyMessage = 'No radio stations found in this section.',
  onRetry,
}: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children, isLoading]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onNavigate && hasChildren && !isLoading && (
            <button
              onClick={() => onNavigate(viewAllView, viewAllParam)}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Navigation Arrows */}
          {hasChildren && !isLoading && (
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 flex items-center justify-center transition shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 flex items-center justify-center transition shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="flex gap-4 sm:gap-6 overflow-hidden py-3 px-1.5 -mx-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${itemClassName} animate-pulse`}>
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Boundary State */}
      {!isLoading && error && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-rose-500/30 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-slate-300">
            Unable to load this section.
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasChildren && (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
        </div>
      )}

      {/* Active Carousel Content */}
      {!isLoading && !error && hasChildren && (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth py-3 px-1.5 -mx-1.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {React.Children.map(children, (child) => (
            <div className={itemClassName}>
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
