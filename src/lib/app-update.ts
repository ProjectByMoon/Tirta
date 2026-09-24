import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const GITHUB_API =
  'https://api.github.com/repos/ProjectByMoon/Tirta/releases/latest';

export async function checkForAppUpdate(): Promise<void> {
  // Hanya jalankan di Android
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    const current = await App.getInfo();
    const currentVersionCode = Number(current.build);

    const response = await fetch(GITHUB_API, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return;
    }

    const release = await response.json();

    const latestVersionCode = Number(
      release?.body?.match(/versionCode\s*:\s*(\d+)/i)?.[1] || 0
    );

    if (!latestVersionCode || latestVersionCode <= currentVersionCode) {
      return;
    }

    const apkAsset = release.assets?.find(
      (asset: { name?: string; browser_download_url?: string }) =>
        asset.name?.toLowerCase().endsWith('.apk')
    );

    if (!apkAsset?.browser_download_url) {
      return;
    }

    const update = window.confirm(
      `Versi baru ${release.tag_name || ''} tersedia.\n\n` +
      `Versi saat ini: ${current.version}\n` +
      `Versi terbaru tersedia.\n\n` +
      `Apakah kamu ingin membuka halaman download update?`
    );

    if (update) {
      window.open(apkAsset.browser_download_url, '_blank');
    }
  } catch (error) {
    console.warn('Pemeriksaan update gagal:', error);
  }
}
