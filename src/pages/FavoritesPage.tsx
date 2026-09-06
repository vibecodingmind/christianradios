import React, { useState, useEffect } from 'react';
import {
  Heart,
  Radio,
  ArrowRight,
  Clock,
  ListMusic,
  Plus,
  Trash2,
  Play,
  Share2,
  FolderPlus,
  Sparkles,
  Music2,
} from 'lucide-react';
import { StationCard } from '../components/station/StationCard';
import { apiFetch } from '../lib/api';
import type { Station, Playlist } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useFavorites } from '../context/FavoritesContext';

interface FavoritesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const { user } = useAuth();
  const { playStation } = useAudioPlayer();
  const { favoriteStations, favoriteIds, isLoading: favLoading, refreshFavorites } = useFavorites();

  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'playlists'>('favorites');
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [extraStations, setExtraStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // New Playlist Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Load any missing stations if only IDs were cached
  useEffect(() => {
    const missingIds = Array.from(favoriteIds).filter(
      (id) => !favoriteStations.some((s) => s.id === id)
    );
    if (missingIds.length > 0) {
      apiFetch('/api/public/stations?limit=100')
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            const matched = (data.stations || []).filter((s: Station) => missingIds.includes(s.id));
            setExtraStations(matched);
          }
        })
        .catch(() => {});
    }
  }, [favoriteIds, favoriteStations]);

  // Combined reactive favorites list
  const favorites = React.useMemo(() => {
    const combined = [...favoriteStations];
    for (const extra of extraStations) {
      if (!combined.some((s) => s.id === extra.id) && favoriteIds.has(extra.id)) {
        combined.push(extra);
      }
    }
    return combined.filter((s) => favoriteIds.has(s.id));
  }, [favoriteStations, extraStations, favoriteIds]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (user) {
          // Load recently listened
          const histRes = await apiFetch('/api/listener/recently-listened');
          if (histRes.ok) {
            const data = await histRes.json();
            setRecentStations(data.stations || []);
          }

          // Load playlists
          const plRes = await apiFetch('/api/listener/playlists');
          if (plRes.ok) {
            const data = await plRes.json();
            setPlaylists(data.playlists || []);
          }
        }
      } catch (err) {
        console.error('Failed to load listener collection:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setIsCreatingPlaylist(true);
      const res = await apiFetch('/api/listener/playlists', {
        method: 'POST',
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDesc.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlaylists((prev) => [...prev, data.playlist]);
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistDesc('');
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const res = await apiFetch(`/api/listener/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const handlePlayEntirePlaylist = (pl: Playlist) => {
    if (pl.stations && pl.stations.length > 0) {
      playStation(pl.stations[0]);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Heart className="w-4 h-4 fill-current" />
              Listener Library & Playlists
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Saved Radios & Collections
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Curate your personalized Christian listening experience with favorites, history, and custom queues.
            </p>
          </div>

          {activeTab === 'playlists' && user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              New Playlist
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('favorites');
              setSelectedPlaylist(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            Favorite Stations ({favorites.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedPlaylist(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Recently Listened ({recentStations.length})
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'playlists'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Custom Playlists ({playlists.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'favorites' ? (
        favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favorites.map((station) => (
              <StationCard key={station.id} station={station} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
            <Heart className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No favorite stations yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the heart icon on any radio station card while exploring to bookmark it for instant access.
            </p>
            <button
              onClick={() => onNavigate('directory')}
              className="mt-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              Explore Directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      ) : activeTab === 'history' ? (
        recentStations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentStations.map((station) => (
              <StationCard key={station.id} station={station} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
            <Clock className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No listening history recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              As you tune into stations, your listening sessions will automatically appear here so you can re-listen anytime.
            </p>
          </div>
        )
      ) : (
        /* Playlists Tab */
        <div className="space-y-6">
          {selectedPlaylist ? (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    className="text-xs text-slate-400 hover:text-white mb-2 flex items-center gap-1"
                  >
                    ← Back to all playlists
                  </button>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-amber-400" />
                    {selectedPlaylist.name}
                  </h2>
                  {selectedPlaylist.description && (
                    <p className="text-xs text-slate-400 mt-1">{selectedPlaylist.description}</p>
                  )}
                  <span className="text-[11px] text-slate-500 mt-2 block">
                    {selectedPlaylist.stations?.length || selectedPlaylist.stationIds.length} stations in this playlist
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayEntirePlaylist(selectedPlaylist)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play Queue
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedPlaylist.stations && selectedPlaylist.stations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {selectedPlaylist.stations.map((station) => (
                    <StationCard key={station.id} station={station} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-2">
                  <Radio className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300 font-semibold">No stations in this playlist yet</p>
                  <p className="text-xs text-slate-400">
                    Browse the directory and click &apos;Add to Playlist&apos; on any station to add it here.
                  </p>
                </div>
              )}
            </div>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylist(pl)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <ListMusic className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                        {pl.stationIds?.length || 0} stations
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {pl.name}
                    </h3>
                    {pl.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pl.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500">
                      Updated {new Date(pl.updatedAt || pl.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View list <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
              <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No custom playlists created</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Organize your favorite Christian stations into tailored playlists for morning worship, Sunday praise, or evening devotion.
              </p>
              {user ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Your First Playlist
                </button>
              ) : (
                <p className="text-xs text-sky-400 font-semibold">
                  Sign in or create a free account to save custom playlists.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                Create New Playlist
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Name your collection to group stations by mood, language, or prayer time.
              </p>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Morning Worship & Devotion"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Stations I listen to during quiet time and morning prayers..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isCreatingPlaylist ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
