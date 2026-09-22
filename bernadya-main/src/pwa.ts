let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function registerPwa() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' });
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    deferredPrompt = promptEvent;
    window.dispatchEvent(new Event('pwa-install-available'));
  });
}

export function canInstallPwa() {
  return deferredPrompt !== null;
}

export async function installPwa() {
  if (!deferredPrompt) return false;
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  await promptEvent.prompt();
  const result = await promptEvent.userChoice;
  window.dispatchEvent(new Event('pwa-install-finished'));
  return result.outcome === 'accepted';
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
