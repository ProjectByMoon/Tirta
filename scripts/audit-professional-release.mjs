import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const walk = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
};

const files = walk('.');
const sourceFiles = files.filter((f) => /\.(ts|tsx|css|mjs|html|json|toml|webmanifest)$/.test(f));
const source = sourceFiles.map((f) => read(f)).join('\n');
const clientSource = files.filter((f) => f.startsWith('src/')).map((f) => read(f)).join('\n');

for (const required of [
  'package.json', 'package-lock.json', 'index.html', 'vite.config.ts',
  'public/manifest.webmanifest', 'public/sw.js', 'src/pwa.ts',
  'src/lib/supabase/client.ts', 'scripts/audit.mjs',
]) if (!exists(required)) failures.push(`Missing required file: ${required}`);

if (/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(clientSource)) failures.push('Service-role credential reference found in client-side project files.');
if (/createClient\(['"]https?:\/\/(?!invalid\.local)/.test(source)) warnings.push('Review any hardcoded Supabase client URL.');
if (/window\.(?:alert|confirm|prompt)\s*\(/.test(source)) warnings.push('Native alert/confirm/prompt remain in UI; replace with app dialogs/toasts in a future UX pass.');
if (/!important/.test(source)) warnings.push('CSS contains !important; keep it constrained to intentional accessibility/reduced-motion rules.');
if (files.some((f) => /(?:\.bak$|\.tmp$|\.orig$|~$)/.test(f))) failures.push('Backup/temp files are included in the release tree.');

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
if (lock.lockfileVersion !== 3) failures.push(`Unexpected lockfileVersion: ${lock.lockfileVersion}`);
if (lock.packages?.['']?.version !== pkg.version) failures.push('package.json version does not match package-lock root version.');
for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(pkg[section] ?? {})) {
    if (lock.packages?.['']?.[section]?.[name] !== range) failures.push(`Lockfile mismatch: ${section}.${name}`);
  }
}

const manifest = JSON.parse(read('public/manifest.webmanifest'));
if (!manifest.icons?.some((i) => i.sizes === '192x192')) failures.push('PWA 192px icon missing.');
if (!manifest.icons?.some((i) => i.sizes === '512x512')) failures.push('PWA 512px icon missing.');
for (const icon of manifest.icons ?? []) if (!exists(`public/${icon.src.replace(/^\//, '')}`)) failures.push(`Missing PWA icon: ${icon.src}`);

if (!/prefers-reduced-motion/.test(read('src/styles/global/index.css'))) warnings.push('Global reduced-motion support is missing.');
if (!/focus-visible/.test(read('src/styles/global/index.css'))) warnings.push('Global keyboard focus styling is missing.');

const staleRootDocs = fs.readdirSync(root).filter((f) => /^README_V\d+|^V\d+_RELEASE|^PRODUCTION_AUDIT_V\d+/.test(f));
if (staleRootDocs.length > 0) warnings.push(`${staleRootDocs.length} historical release documents remain in the project root.`);

if (failures.length) {
  console.error('Professional release audit FAILED');
  failures.forEach((x) => console.error(`FAIL: ${x}`));
  if (warnings.length) warnings.forEach((x) => console.warn(`WARN: ${x}`));
  process.exit(1);
}
console.log('Professional release audit passed.');
console.log(`Checked ${sourceFiles.length} source/config files.`);
if (warnings.length) {
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((x) => console.log(`WARN: ${x}`));
}
