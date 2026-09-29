import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function MobileAppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(inStandalone);

    if (inStandalone) return;

    // 2. Check dismiss cooldown (7 days)
    const dismissedUntil = localStorage.getItem('cr_pwa_banner_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
      return;
    }

    setIsDismissed(false);

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleMobile);

    // 4. Capture native install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Suppress for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('cr_pwa_banner_dismissed_until', String(nextWeek));
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Sleek App Banner on Mobile */}
      <aside
        aria-label="Install Christian Radios Mobile App"
        className="md:hidden fixed top-20 inset-x-3 z-30 animate-fadeIn"
      >
        <div className="bg-slate-900/95 border border-sky-500/40 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl flex items-center justify-between gap-3 ring-1 ring-sky-400/20">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shrink-0 shadow-md">
              <img
                src="/icon.svg"
                alt="App Icon"
                className="w-full h-full rounded-[10px] bg-slate-950 object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white truncate">Christian Radios App</h4>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Free
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Lock-screen streaming & background audio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isIos && (
              <a
                href="/downloads/ChristianRadios.apk"
                download="ChristianRadios.apk"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                title="Download Native Android APK"
              >
                <Download className="w-3.5 h-3.5" />
                <span>APK</span>
              </a>
            )}
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isIos ? 'iOS App' : 'Install'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile App (Android APK + iOS Home Screen) Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-1 flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Get the Mobile App</h3>
                <p className="text-xs text-slate-400">Available for Android, iPhone &amp; iPad</p>
              </div>
            </div>

            {/* Direct Android APK Download Box */}
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-300">Android Phone / Tablet / TV</div>
                <div className="text-[11px] text-slate-400">Direct official APK installer (v1.0.0)</div>
              </div>
              <a
                href="/downloads/ChristianRadios.apk"
                download="ChristianRadios.apk"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              iPhone &amp; iPad (iOS) Install Steps:
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Tap the <strong className="text-white">Share</strong> button{' '}
                  <Share className="w-3.5 h-3.5 inline text-sky-400" /> at the bottom or top of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Scroll down and select <strong className="text-white">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Tap <strong className="text-white">Add</strong> in the top-right corner for full background audio!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
