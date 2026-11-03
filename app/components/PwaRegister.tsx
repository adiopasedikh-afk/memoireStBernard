'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Enregistrement du Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ PWA Service Worker enregistré:', registration.scope);
          })
          .catch((error) => {
            console.warn('⚠️ Échec enregistrement Service Worker:', error);
          });
      });
    }

    // 2. Écoute de l'événement d'installation PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('Application installée');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <aside aria-label="Installation de l'application" className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900/95 border border-amber-500/40 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
        🏛️
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-amber-400">Application St-Bernard</h4>
        <p className="text-[11px] text-slate-300 leading-tight">Installer pour un accès rapide et hors-ligne.</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow"
        >
          Installer
        </button>
        <button
          onClick={() => setShowInstallBanner(false)}
          className="p-1 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
