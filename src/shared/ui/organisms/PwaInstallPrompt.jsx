import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Smartphone, X } from 'lucide-react';
import { activateServiceWorkerUpdate, isStandaloneMode, PWA_UPDATE_EVENT } from '@/shared/lib/pwa';
import { Button } from '@/shared/ui/atoms/Button';
import { useToast } from '@/shared/ui/providers/useToast';

const INSTALL_DISMISS_KEY = 'skillswap:pwa-install-dismissed-at';
const INSTALL_REMINDER_DELAY_MS = 1000 * 60 * 60 * 24 * 3;

const getDismissedAt = () => {
  if (typeof window === 'undefined') return 0;
  return Number(window.localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
};

const shouldShowInstallPrompt = () => {
  const dismissedAt = getDismissedAt();
  return !dismissedAt || Date.now() - dismissedAt > INSTALL_REMINDER_DELAY_MS;
};

export const PwaInstallPrompt = () => {
  const toast = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandaloneMode()) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (shouldShowInstallPrompt()) {
        setShowInstallPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      window.localStorage.removeItem(INSTALL_DISMISS_KEY);
      toast.success("Ilova qurilmangizga o'rnatildi.");
    };

    const handleUpdateReady = () => {
      setUpdateReady(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener(PWA_UPDATE_EVENT, handleUpdateReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener(PWA_UPDATE_EVENT, handleUpdateReady);
    };
  }, [toast]);

  const dismissInstallPrompt = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    }
    setShowInstallPrompt(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsBusy(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
    } finally {
      setDeferredPrompt(null);
      setIsBusy(false);
    }
  };

  const handleUpdate = async () => {
    setIsBusy(true);
    try {
      const activated = await activateServiceWorkerUpdate();
      if (!activated) {
        window.location.reload();
      }
    } finally {
      setIsBusy(false);
    }
  };

  if (updateReady) {
    return (
      <div className="fixed inset-x-4 bottom-24 z-[110] md:bottom-6 md:left-auto md:right-6 md:w-full md:max-w-md">
        <div className="glass-card border border-blue-500/20 p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                Update Ready
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">Yangi versiya tayyor</h3>
              <p className="mt-1 text-sm text-slate-400">
                So&apos;nggi frontend fayllar yuklandi. Bir marta yangilasak, yangi release ishga tushadi.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => window.location.reload()}
              disabled={isBusy}
            >
              Keyinroq
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleUpdate}
              loading={isBusy}
            >
              Yangilash
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-[110] md:bottom-6 md:left-auto md:right-6 md:w-full md:max-w-md">
      <div className="glass-card border border-emerald-500/20 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Web App
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">Telefoningizga o&apos;rnating</h3>
            <p className="mt-1 text-sm text-slate-400">
              SkillSwap AI ni ikonka bilan home screen&apos;ga tushirib, oddiy app kabi ochishingiz mumkin.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissInstallPrompt}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Install promptni yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={dismissInstallPrompt}
            disabled={isBusy}
          >
            Hozir emas
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleInstall}
            loading={isBusy}
            leftIcon={Download}
          >
            O&apos;rnatish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
