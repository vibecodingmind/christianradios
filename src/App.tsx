import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ListYourRadioPage } from './pages/ListYourRadioPage';
import { HelpContactPage } from './pages/HelpContactPage';
import { LegalPage } from './pages/LegalPage';

import { OwnerOnboardingModal } from './components/auth/OwnerOnboardingModal';
import { AIChatDrawer, AIAssistantButton } from './components/ai/AIChatDrawer';

function MainAppContent() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  
  const [pendingIntent, setPendingIntent] = useState<{
    intent: 'ADD_RADIO' | 'CLAIM_STATION';
    stationId?: string;
  } | null>(null);
  const [ownerOnboardingOpen, setOwnerOnboardingOpen] = useState(false);

  const { user } = useAuth();
  const { isPlaying, togglePlay, toggleMute, volume, setVolume } = useAudioPlayer();

  const isEmbedRoute = window.location.pathname.startsWith('/embed') || currentView === 'embed';

  const parseUrlRoute = () => {
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
      return;
    }
    if (receiptId) {
      setCurrentView('receipt');
      setViewParam(receiptId);
      return;
    }
    if (catSlug) {
      setCurrentView('category');
      setViewParam(catSlug);
      return;
    }
    if (countryCode) {
      setCurrentView('country');
      setViewParam(countryCode);
      return;
    }

    const path = pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (path === '/radios' || path === '/directory') {
      setCurrentView('directory');
      setViewParam(undefined);
    } else if (path === '/categories') {
      setCurrentView('categories');
      setViewParam(undefined);
    } else if (path === '/countries') {
      setCurrentView('countries');
      setViewParam(undefined);
    } else if (path === '/pricing') {
      setCurrentView('pricing');
      setViewParam(undefined);
    } else if (path === '/giving') {
      setCurrentView('giving');
      setViewParam(undefined);
    } else if (path === '/prayer-wall') {
      setCurrentView('prayer-wall');
      setViewParam(undefined);
    } else if (path === '/owner' || path === '/dashboard') {
      setCurrentView('owner');
      setViewParam(undefined);
    } else if (path === '/admin') {
      setCurrentView('admin');
      setViewParam(undefined);
    } else if (path === '/about') {
      setCurrentView('about');
      setViewParam(undefined);
    } else if (path === '/how-it-works') {
      setCurrentView('how-it-works');
      setViewParam(undefined);
    } else if (path === '/list-your-radio') {
      setCurrentView('list-your-radio');
      setViewParam(undefined);
    } else if (path === '/help' || path === '/contact') {
      setCurrentView('help');
      setViewParam(undefined);
    } else if (path === '/legal') {
      setCurrentView('legal');
      setViewParam(undefined);
    } else if (path === '/profile') {
      setCurrentView('profile');
      setViewParam(undefined);
    } else if (path === '/favorites') {
      setCurrentView('favorites');
      setViewParam(undefined);
    } else if (path === '/following') {
      setCurrentView('following');
      setViewParam(undefined);
    } else if (path.startsWith('/station/')) {
      const slug = path.replace('/station/', '');
      if (slug) {
        setCurrentView('station');
        setViewParam(slug);
      } else {
        setCurrentView('directory');
        setViewParam(undefined);
      }
    } else if (path.startsWith('/category/')) {
      const cat = path.replace('/category/', '');
      setCurrentView('category');
      setViewParam(cat);
    } else if (path.startsWith('/country/')) {
      const cnt = path.replace('/country/', '');
      setCurrentView('country');
      setViewParam(cnt);
    } else {
      setCurrentView('home');
      setViewParam(undefined);
    }
  };

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const url = new URL(window.location.href);
    url.searchParams.delete('station');
    url.searchParams.delete('category');
    url.searchParams.delete('country');
    url.searchParams.delete('receipt');

    let targetPath = '/';
    if (view === 'directory' || view === 'radios') targetPath = '/radios';
    else if (view === 'categories') targetPath = '/categories';
    else if (view === 'countries') targetPath = '/countries';
    else if (view === 'pricing') targetPath = '/pricing';
    else if (view === 'giving') targetPath = '/giving';
    else if (view === 'prayer-wall') targetPath = '/prayer-wall';
    else if (view === 'owner') targetPath = '/owner';
    else if (view === 'admin') targetPath = '/admin';
    else if (view === 'about') targetPath = '/about';
    else if (view === 'how-it-works') targetPath = '/how-it-works';
    else if (view === 'list-your-radio') targetPath = '/list-your-radio';
    else if (view === 'help' || view === 'contact') targetPath = '/help';
    else if (view === 'legal') targetPath = '/legal';
    else if (view === 'profile') targetPath = '/profile';
    else if (view === 'favorites') targetPath = '/favorites';
    else if (view === 'following') targetPath = '/following';
    else if (view === 'station' && param) {
      targetPath = `/station/${param}`;
      url.searchParams.set('station', param);
    } else if (view === 'category' && param) {
      targetPath = `/category/${param}`;
      url.searchParams.set('category', param);
    } else if (view === 'country' && param) {
      targetPath = `/country/${param}`;
      url.searchParams.set('country', param);
    } else if (view === 'receipt' && param) {
      targetPath = '/receipt';
      url.searchParams.set('receipt', param);
    }

    url.pathname = targetPath;
    window.history.pushState({}, '', url.toString());
  };

  const handlePublicAction = (
    intent: 'ADD_RADIO' | 'CLAIM_STATION',
    options?: { stationId?: string }
  ) => {
    if (!user) {
      setPendingIntent({ intent, stationId: options?.stationId });
      setAuthDefaultTab('register');
      setAuthModalOpen(true);
      return;
    }

    if (user.role === 'SUPER_ADMIN') {
      if (intent === 'ADD_RADIO') {
        handleNavigate('admin', 'create-station');
      } else if (intent === 'CLAIM_STATION') {
        handleNavigate('admin', `claim-station:${options?.stationId || ''}`);
      }
    } else if (user.role === 'RADIO_OWNER') {
      if (intent === 'ADD_RADIO') {
        handleNavigate('owner', 'add-station');
      } else if (intent === 'CLAIM_STATION') {
        handleNavigate('owner', `claim-station:${options?.stationId || ''}`);
      }
    } else if (user.role === 'LISTENER') {
      setPendingIntent({ intent, stationId: options?.stationId });
      setOwnerOnboardingOpen(true);
    }
  };

  useEffect(() => {
    if (user && pendingIntent && !authModalOpen) {
      if (user.role === 'SUPER_ADMIN') {
        const { intent, stationId } = pendingIntent;
        setPendingIntent(null);
        if (intent === 'ADD_RADIO') {
          handleNavigate('admin', 'create-station');
        } else if (intent === 'CLAIM_STATION') {
          handleNavigate('admin', `claim-station:${stationId || ''}`);
        }
      } else if (user.role === 'RADIO_OWNER') {
        const { intent, stationId } = pendingIntent;
        setPendingIntent(null);
        if (intent === 'ADD_RADIO') {
          handleNavigate('owner', 'add-station');
        } else if (intent === 'CLAIM_STATION') {
          handleNavigate('owner', `claim-station:${stationId || ''}`);
        }
      } else if (user.role === 'LISTENER') {
        setOwnerOnboardingOpen(true);
      }
    }
  }, [user, pendingIntent, authModalOpen]);

  const handleOwnerOnboardingSuccess = () => {
    setOwnerOnboardingOpen(false);
    const currentPending = pendingIntent;
    setPendingIntent(null);
    if (currentPending?.intent === 'CLAIM_STATION') {
      handleNavigate('owner', `claim-station:${currentPending.stationId || ''}`);
    } else {
      handleNavigate('owner', 'add-station');
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const refParam = searchParams.get('ref');
    if (refParam) {
      localStorage.setItem('cr_referral_code', refParam.trim());
    }

    parseUrlRoute();
    window.addEventListener('popstate', parseUrlRoute);
    return () => window.removeEventListener('popstate', parseUrlRoute);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
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
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        handleNavigate('admin');
      } else {
        handleNavigate('owner');
      }
      return;
    }
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
        onPublicAction={handlePublicAction}
      />

      {/* Main Page Router */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onPublicAction={handlePublicAction}
          />
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
          <StationDetailPage
            slug={viewParam}
            onNavigate={handleNavigate}
            onPublicAction={handlePublicAction}
          />
        )}

        {currentView === 'favorites' && (
          <FavoritesPage onNavigate={handleNavigate} />
        )}

        {currentView === 'following' && (
          <FollowingPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'giving' && (
          <GivingPage onNavigate={handleNavigate} />
        )}

        {currentView === 'prayer-wall' && (
          <PrayerWallPage onNavigate={handleNavigate} />
        )}

        {currentView === 'receipt' && viewParam && (
          <DonationReceiptPage receiptId={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'profile' && (
          <ProfileSettingsPage onNavigate={handleNavigate} />
        )}

        {currentView === 'owner' && (
          <OwnerDashboard onNavigate={handleNavigate} initialParam={viewParam} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} initialParam={viewParam} />
        )}

        {currentView === 'pricing' && (
          <PricingPage
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onPublicAction={handlePublicAction}
          />
        )}

        {currentView === 'about' && (
          <AboutPage
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onPublicAction={handlePublicAction}
          />
        )}

        {currentView === 'how-it-works' && (
          <HowItWorksPage
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onPublicAction={handlePublicAction}
          />
        )}

        {currentView === 'list-your-radio' && (
          <ListYourRadioPage
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onPublicAction={handlePublicAction}
          />
        )}

        {(currentView === 'help' || currentView === 'contact') && (
          <HelpContactPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}

        {currentView === 'legal' && (
          <LegalPage initialTab={(viewParam as any) || 'terms'} onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onPublicAction={handlePublicAction}
      />

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

      {/* Broadcaster Onboarding Modal for Listeners */}
      <OwnerOnboardingModal
        isOpen={ownerOnboardingOpen}
        onClose={() => setOwnerOnboardingOpen(false)}
        onSuccess={handleOwnerOnboardingSuccess}
        intent={pendingIntent?.intent}
      />

      {/* Floating AI Guide Button & Drawer */}
      {!isEmbedRoute && (
        <>
          <AIAssistantButton onClick={() => setAiDrawerOpen(true)} />
          <AIChatDrawer
            isOpen={aiDrawerOpen}
            onClose={() => setAiDrawerOpen(false)}
            onNavigate={handleNavigate}
          />
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioPlayerProvider>
          <MainAppContent />
        </AudioPlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
