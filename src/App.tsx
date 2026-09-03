import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PersistentPlayer } from './components/player/PersistentPlayer';
import { ExpandedPlayerModal } from './components/player/ExpandedPlayerModal';
import { AuthModal } from './components/auth/AuthModal';

import { HomePage } from './pages/HomePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CountriesPage } from './pages/CountriesPage';
import { StationDetailPage } from './pages/StationDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { FollowingPage } from './pages/FollowingPage';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PrayerWallPage } from './pages/PrayerWallPage';
import { EmbedPlayerPage } from './pages/EmbedPlayerPage';
import { DonationReceiptPage } from './pages/DonationReceiptPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { GivingPage } from './pages/GivingPage';

function MainAppContent() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');

  const { isPlaying, togglePlay, toggleMute, volume, setVolume } = useAudioPlayer();

  // Handle standalone embed URLs e.g. /embed/:slug
  const isEmbedRoute = window.location.pathname.startsWith('/embed') || currentView === 'embed';

  // Navigation helper
  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('station');
    url.searchParams.delete('category');
    url.searchParams.delete('country');
    url.searchParams.delete('receipt');

    if (view === 'station' && param) url.searchParams.set('station', param);
    if (view === 'category' && param) url.searchParams.set('category', param);
    if (view === 'country' && param) url.searchParams.set('country', param);
    if (view === 'receipt' && param) url.searchParams.set('receipt', param);

    window.history.pushState({}, '', url.toString());
  };

  // Sync initial URL search parameters
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/embed/')) {
      const slug = pathname.replace('/embed/', '').split('/')[0];
      setCurrentView('embed');
      setViewParam(slug);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const stationSlug = params.get('station');
    const catSlug = params.get('category');
    const countryCode = params.get('country');
    const receiptId = params.get('receipt');

    if (stationSlug) {
      setCurrentView('station');
      setViewParam(stationSlug);
    } else if (receiptId) {
      setCurrentView('receipt');
      setViewParam(receiptId);
    } else if (catSlug) {
      setCurrentView('directory');
      setViewParam(catSlug);
    } else if (countryCode) {
      setCurrentView('directory');
      setViewParam(countryCode);
    }
  }, []);

  // Global Keyboard shortcuts (Space = Play/Pause, M = Mute, Up/Down = Volume)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input or textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(volume + 0.05);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(volume - 0.05);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, volume, setVolume]);

  const handleOpenAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthDefaultTab(tab);
    setAuthModalOpen(true);
  };

  if (isEmbedRoute) {
    const embedSlug = viewParam || window.location.pathname.replace('/embed/', '');
    return <EmbedPlayerPage slug={embedSlug} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Header Navigation */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Page Router */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'home' && (
          <HomePage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'directory' && (
          <DirectoryPage
            initialSearch={viewParam}
            initialCategory={viewParam?.startsWith('cat') ? viewParam : undefined}
            initialCountry={viewParam?.length === 2 ? viewParam : undefined}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'categories' && (
          <CategoriesPage onNavigate={handleNavigate} />
        )}

        {currentView === 'category' && (
          <DirectoryPage
            initialCategory={viewParam}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'countries' && (
          <CountriesPage onNavigate={handleNavigate} />
        )}

        {currentView === 'country' && (
          <DirectoryPage
            initialCountry={viewParam}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'station' && viewParam && (
          <StationDetailPage slug={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'favorites' && (
          <FavoritesPage onNavigate={handleNavigate} />
        )}

        {currentView === 'following' && (
          <FollowingPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'prayer-wall' && (
          <PrayerWallPage onNavigate={handleNavigate} />
        )}

        {currentView === 'giving' && (
          <GivingPage onNavigate={handleNavigate} />
        )}

        {currentView === 'receipt' && (
          <DonationReceiptPage receiptId={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'profile' && (
          <ProfileSettingsPage onNavigate={handleNavigate} />
        )}

        {currentView === 'owner' && (
          <OwnerDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />

      {/* Docked Persistent Audio Player */}
      <PersistentPlayer />

      {/* Fullscreen Expanded Player */}
      <ExpandedPlayerModal />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        defaultTab={authDefaultTab}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <MainAppContent />
      </AudioPlayerProvider>
    </AuthProvider>
  );
}

export default App;
