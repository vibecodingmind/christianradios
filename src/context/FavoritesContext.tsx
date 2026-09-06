import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Station } from '../types';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';
import { useRealtime, useLiveSyncListener } from './RealtimeContext';

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  favoriteStations: Station[];
  favoritesCount: number;
  isLoading: boolean;
  isFavorite: (stationId: string) => boolean;
  toggleFavorite: (station: Station) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const STORAGE_KEY_FAV_IDS = 'christian_radios_favorites';
const STORAGE_KEY_FAV_STATIONS = 'christian_radios_favorite_stations';
const LEGACY_GUEST_KEY = 'cr_guest_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { emitLocalSync } = useRealtime();

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      // Migrate legacy guest key if present
      const legacy = JSON.parse(localStorage.getItem(LEGACY_GUEST_KEY) || '[]');
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV_IDS) || '[]');
      const merged = Array.from(new Set([...current, ...legacy]));
      if (legacy.length > 0) {
        localStorage.removeItem(LEGACY_GUEST_KEY);
        localStorage.setItem(STORAGE_KEY_FAV_IDS, JSON.stringify(merged));
      }
      return new Set<string>(merged);
    } catch {
      return new Set<string>();
    }
  });

  const [favoriteStations, setFavoriteStations] = useState<Station[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_FAV_STATIONS) || '[]');
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Helper to persist to localStorage
  const persistLocally = useCallback((ids: Set<string>, stations: Station[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_FAV_IDS, JSON.stringify(Array.from(ids)));
      localStorage.setItem(STORAGE_KEY_FAV_STATIONS, JSON.stringify(stations));
    } catch {}
  }, []);

  // Fetch favorites from server (if authenticated) or local cache
  const refreshFavorites = useCallback(async () => {
    if (user) {
      try {
        setIsLoading(true);
        // First sync any existing local favorites to account
        const localIds = Array.from(favoriteIds);
        if (localIds.length > 0) {
          try {
            await apiFetch('/api/listener/favorites/sync', {
              method: 'POST',
              body: JSON.stringify({ stationIds: localIds }),
            });
          } catch {}
        }

        const res = await apiFetch('/api/listener/favorites');
        if (res.ok) {
          const data = await res.json();
          const serverStations: Station[] = data.stations || [];
          const newIds = new Set(serverStations.map((s) => s.id));
          setFavoriteIds(newIds);
          setFavoriteStations(serverStations);
          persistLocally(newIds, serverStations);
        }
      } catch (err) {
        console.error('Failed to refresh favorites from server:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest: re-read from localStorage
      try {
        const ids = new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY_FAV_IDS) || '[]'));
        const stations: Station[] = JSON.parse(localStorage.getItem(STORAGE_KEY_FAV_STATIONS) || '[]');
        setFavoriteIds(ids);
        setFavoriteStations(stations.filter((s) => ids.has(s.id)));
      } catch {}
    }
  }, [user, persistLocally]);

  // Load on mount and when user auth state changes
  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  // Listen for realtime live sync events (from other tabs or SSE)
  useLiveSyncListener('FAVORITE_TOGGLED', (event) => {
    if (!event.data || !event.data.stationId) return;
    const targetId = event.data.stationId;
    const shouldBeFav = !!event.data.isFavorite;

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (shouldBeFav) {
        next.add(targetId);
      } else {
        next.delete(targetId);
      }
      return next;
    });
  });

  const isFavorite = useCallback(
    (stationId: string): boolean => {
      return favoriteIds.has(stationId);
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (station: Station): Promise<boolean> => {
      const stationId = station.id;
      const currentlyFav = favoriteIds.has(stationId);
      const nextFav = !currentlyFav;

      // 1. Optimistic Local State Update (0ms delay)
      const nextIds = new Set(favoriteIds);
      let nextStations = [...favoriteStations];

      if (nextFav) {
        nextIds.add(stationId);
        if (!nextStations.some((s) => s.id === stationId)) {
          nextStations = [station, ...nextStations];
        }
      } else {
        nextIds.delete(stationId);
        nextStations = nextStations.filter((s) => s.id !== stationId);
      }

      setFavoriteIds(nextIds);
      setFavoriteStations(nextStations);
      persistLocally(nextIds, nextStations);

      // 2. Broadcast to other tabs & components immediately
      emitLocalSync('FAVORITE_TOGGLED', { stationId, isFavorite: nextFav });

      // 3. If authenticated, persist to server
      if (user) {
        try {
          const res = await apiFetch('/api/listener/favorites/toggle', {
            method: 'POST',
            body: JSON.stringify({ stationId }),
          });
          if (!res.ok) {
            console.warn('Server favorites toggle failed, keeping local state.');
          }
        } catch (err) {
          console.error('Failed to sync favorite with server:', err);
        }
      }

      return nextFav;
    },
    [favoriteIds, favoriteStations, persistLocally, emitLocalSync, user]
  );

  const favoritesCount = useMemo(() => favoriteIds.size, [favoriteIds]);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteStations,
        favoritesCount,
        isLoading,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
