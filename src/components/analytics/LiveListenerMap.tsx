import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Radio,
  Users,
  Activity,
  Sparkles,
  RotateCw,
  MapPin,
  TrendingUp,
  Volume2,
  Maximize2,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { GlobalListenerPulse } from '../../types';

declare global {
  interface Window {
    L: any;
  }
}

interface LiveListenerMapProps {
  stationId?: string;
  stationName?: string;
  compact?: boolean;
}

export function LiveListenerMap({ stationId, stationName, compact = false }: LiveListenerMapProps) {
  const [pulse, setPulse] = useState<GlobalListenerPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<'osm_dark' | 'osm_standard'>('osm_dark');
  const [leafletReady, setLeafletReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 20000); // 20s live refresh
    return () => clearInterval(interval);
  }, [stationId]);

  const fetchPulse = async () => {
    try {
      const res = await apiFetch('/api/public/live-listeners-pulse');
      if (res.ok) {
        const data: GlobalListenerPulse = await res.json();
        setPulse(data);
      }
    } catch (err) {
      console.error('Failed to fetch live listener pulse:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if Leaflet is loaded on window
  useEffect(() => {
    const checkLeaflet = () => {
      if (typeof window !== 'undefined' && window.L) {
        setLeafletReady(true);
        return true;
      }
      return false;
    };

    if (checkLeaflet()) return;

    // Retry checking if script is still loading
    const interval = setInterval(() => {
      if (checkLeaflet()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Initialize and update Leaflet OpenStreetMap
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || !window.L) return;

    const L = window.L;

    if (!mapInstanceRef.current) {
      const initialZoom = compact ? 2 : 2.5;
      const map = L.map(mapContainerRef.current, {
        center: [15, 20],
        zoom: initialZoom,
        minZoom: 1.5,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      // Layer group for listener hotspot markers
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Set / Update Tile Layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      mapMode === 'osm_dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      mapMode === 'osm_dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Refresh markers if pulse data is available
    if (pulse && markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      pulse.countryBreakdown.forEach((node) => {
        const radius = Math.min(22, Math.max(10, Math.sqrt(node.count) * 2.2));
        const customIcon = L.divIcon({
          className: 'custom-live-listener-marker',
          html: `
            <div style="position: relative; width: ${radius * 2}px; height: ${radius * 2}px; display: flex; items-center: center; justify-content: center;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; inset: 2px; border-radius: 9999px; background: radial-gradient(circle, #10b981 0%, #0284c7 100%); border: 2px solid #ffffff; box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);"></div>
              <span style="position: relative; z-index: 10; font-size: 9px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8); line-height: ${radius * 2}px; text-align: center; width: 100%;">
                ${node.count > 999 ? `${(node.count / 1000).toFixed(1)}k` : node.count}
              </span>
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        const marker = L.marker([node.lat, node.lng], { icon: customIcon });

        const pct = pulse.totalActiveListeners > 0
          ? Math.round((node.count / pulse.totalActiveListeners) * 100)
          : 0;

        marker.bindPopup(`
          <div style="padding: 4px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; min-width: 150px;">
            <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span>📍 ${node.countryName}</span>
            </div>
            <div style="font-size: 11px; color: #059669; font-weight: 700; margin-bottom: 2px;">
              🔴 ${node.count.toLocaleString()} listening live
            </div>
            <div style="font-size: 10px; color: #64748b;">
              ${pct}% of global Christian radio audience
            </div>
          </div>
        `);

        markersLayerRef.current.addLayer(marker);
      });
    }

    return () => {
      // Clean up on component unmount
    };
  }, [leafletReady, mapMode, pulse, compact]);

  // Clean up Leaflet map instance on full component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([15, 20], compact ? 2 : 2.5);
    }
  };

  const handleFocusTanzania = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-6.369028, 34.888822], 5);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const totalListeners = pulse?.totalActiveListeners || 0;
  const activeCountries = pulse?.countryBreakdown.length || 0;
  const activeStations = pulse?.activeStationsCount || 0;

  return (
    <div
      className={`bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${
        compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
      } space-y-6`}
    >
      {/* Top Header & Real-time Live Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OpenStreetMap Live Telemetry
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-sky-400" />
            {stationName ? `${stationName} Live Listener Map` : 'Real-Time Global Listener Pulse'}
          </h3>
          <p className="text-xs text-slate-400">
            Powered by OpenStreetMap • Visualizing believers tuned in across nations in real-time
          </p>
        </div>

        {/* Counters Grid */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Listening Now</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{totalListeners.toLocaleString()}</p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nations Connected</p>
            <p className="text-xl font-extrabold text-sky-400 mt-0.5">{activeCountries}</p>
          </div>
          {!compact && (
            <div className="hidden sm:block px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Active Stations</p>
              <p className="text-xl font-extrabold text-amber-400 mt-0.5">{activeStations}</p>
            </div>
          )}
        </div>
      </div>

      {/* OpenStreetMap Interactive Container */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner">
        {/* Leaflet Map DOM Element */}
        <div
          ref={mapContainerRef}
          style={{ height: compact ? '320px' : '500px', width: '100%' }}
          className="z-0"
        />

        {/* Map Control Bar Overlays */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          {/* Zoom controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm flex flex-col">
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-[1px] bg-slate-800" />
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Camera Views */}
          <button
            onClick={handleResetView}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white shadow-lg backdrop-blur-sm transition cursor-pointer flex items-center justify-center"
            title="Reset Global View"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={handleFocusTanzania}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-sky-400 hover:text-sky-300 shadow-lg backdrop-blur-sm transition cursor-pointer"
            title="Focus East Africa"
          >
            🇹🇿 EA
          </button>
        </div>

        {/* Map Mode Switcher */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => setMapMode('osm_dark')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              mapMode === 'osm_dark'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Carto
          </button>
          <button
            onClick={() => setMapMode('osm_standard')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              mapMode === 'osm_standard'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Standard OSM
          </button>
        </div>
      </div>

      {/* Real-time Ticker of Recent Connections */}
      {pulse && pulse.recentPings && pulse.recentPings.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live Broadcast Pulse Ticker
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {pulse.recentPings.slice(0, 5).map((ping) => (
              <span
                key={ping.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300"
              >
                <Radio className="w-3 h-3 text-sky-400" />
                <strong className="text-white">
                  {ping.city}, {ping.countryName}
                </strong>
                <span className="text-slate-500">tuned into</span>
                <span className="text-emerald-400 font-medium">{ping.stationName}</span>
                <span className="text-[10px] text-slate-500">({ping.time})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
