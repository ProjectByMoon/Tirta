import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'src/pwa.ts',
  'capacitor.config.ts',
  'MOBILE_APP_SETUP.md',
];

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing PWA/mobile file: ${file}`);
}

const manifest = JSON.parse(readFileSync(join('public', 'manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') throw new Error('Manifest display must be standalone.');
if (!manifest.start_url || !manifest.scope) throw new Error('Manifest start_url/scope missing.');
if (!manifest.icons?.some((icon) => icon.sizes === '192x192')) throw new Error('192px icon missing.');
if (!manifest.icons?.some((icon) => icon.sizes === '512x512')) throw new Error('512px icon missing.');

const sw = readFileSync(join('public', 'sw.js'), 'utf8');
if (!sw.includes("url.pathname.startsWith('/auth/')") || !sw.includes("url.pathname.startsWith('/rest/')")) {
  throw new Error('Service worker must exclude Supabase/auth traffic from cache.');
}

const main = readFileSync(join('src', 'main.tsx'), 'utf8');
if (!main.includes('registerPwa')) throw new Error('PWA registration is not wired into main.tsx.');

console.log('PWA/mobile audit passed: manifest + icons + service worker + registration + Capacitor config.');
