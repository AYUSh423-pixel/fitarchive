'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(Boolean(standaloneMode));
    if (standaloneMode) return;

    // Check if dismissed previously within the past 7 days
    const dismissedAt = localStorage.getItem('nutrifit_pwa_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show subtle iOS instruction banner after 3 seconds on first visit
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chromium beforeinstallprompt handler
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('nutrifit_pwa_dismissed', String(Date.now()));
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="relative mb-3 animate-fade-in-up">
      <div className="card-minimal p-3.5 bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FED7AA]/60 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#B45309] text-white flex items-center justify-center shrink-0 shadow-xs">
            {isIos ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1C1917] flex items-center gap-1 truncate">
              <span>Install NutriFit App</span>
              <Sparkles className="w-3 h-3 text-[#B45309] shrink-0" />
            </p>
            <p className="text-[11px] text-[#78716C] truncate">
              {isIos
                ? 'Tap Share → "Add to Home Screen"'
                : 'Install for instant offline access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIos && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-[#B45309] text-white text-xs font-bold shadow-xs tactile-press-sm cursor-pointer"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="w-7 h-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-[#78716C] tactile-press-sm cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
