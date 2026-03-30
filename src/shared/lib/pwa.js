const PWA_UPDATE_EVENT = 'pwa:update-ready';

const canUseBrowser = () => typeof window !== 'undefined';

const dispatchWindowEvent = (eventName) => {
  if (!canUseBrowser()) return;
  window.dispatchEvent(new Event(eventName));
};

const watchForWaitingWorker = (registration) => {
  if (!registration) return;

  if (registration.waiting) {
    dispatchWindowEvent(PWA_UPDATE_EVENT);
  }

  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        dispatchWindowEvent(PWA_UPDATE_EVENT);
      }
    });
  });
};

export const isStandaloneMode = () => {
  if (!canUseBrowser()) return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

export const registerServiceWorker = async () => {
  if (!import.meta.env.PROD || !canUseBrowser() || !('serviceWorker' in navigator)) {
    return null;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      watchForWaitingWorker(registration);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  };

  if (document.readyState === 'complete') {
    return register();
  }

  return new Promise((resolve) => {
    window.addEventListener('load', () => {
      void register().then(resolve);
    }, { once: true });
  });
};

export const activateServiceWorkerUpdate = async () => {
  if (!canUseBrowser() || !('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.waiting) {
    return false;
  }

  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  return true;
};

export { PWA_UPDATE_EVENT };
