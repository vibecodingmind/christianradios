import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructionsModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install Christian Radios App"
        aria-label="Install Christian Radios App"
        className="fixed bottom-24 left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-500/50 text-amber-300 hover:text-amber-200 hover:border-amber-400 text-xs font-extrabold shadow-2xl shadow-amber-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer animate-float-slow group"
      >
        <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
          <Download className="w-3.5 h-3.5 animate-bounce" />
        </div>
        <span className="tracking-wide">Install App</span>
      </button>

      {/* Instructions Modal for browsers without direct prompt or iOS */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowInstructionsModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-sky-600 flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Install Christian Radios</h3>
                <p className="text-xs text-slate-400">Stream gospel radio seamlessly on your home screen</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="font-semibold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Instructions for Safari on iPhone / iPad:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-300">
                  <li>Tap the <strong>Share</strong> button (box with an arrow pointing up) at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>"Add"</strong> in the top right corner to enjoy fullscreen gospel audio!</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="font-semibold text-sky-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Instructions for Chrome / Edge / Android:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-300">
                  <li>Tap your browser menu (<strong>⋮</strong> three vertical dots in the top or bottom bar).</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Confirm installation to listen to live Christian radio offline and with lockscreen controls.</li>
                </ol>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
