import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/locales/translations.ts');
const source = fs.readFileSync(file, 'utf8');
const locales = ['id', 'en', 'ja', 'ko', 'zh'];
const blocks = Object.fromEntries(locales.map((locale, i) => {
  const start = source.indexOf(`  ${locale}: {`);
  const next = locales.slice(i + 1).map(x => source.indexOf(`  ${x}: {`)).find(x => x >= 0);
  const end = next >= 0 ? next : source.length;
  const block = source.slice(start, end);
  return [locale, new Set([...block.matchAll(/^    ([A-Za-z0-9_]+):/gm)].map(m => m[1]))];
}));
const base = blocks.id;
let failed = false;
for (const locale of locales) {
  const missing = [...base].filter(k => !blocks[locale].has(k));
  const extra = [...blocks[locale]].filter(k => !base.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${locale}: missing=${missing.join(',') || '-'} extra=${extra.join(',') || '-'}`);
  }
}
const srcRoot = path.resolve('src');
const used = new Set();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== 'translations.ts') {
      const text = fs.readFileSync(full, 'utf8');
      for (const m of text.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) used.add(m[1]);
    }
  }
}
walk(srcRoot);
const missingUsed = [...used].filter(k => !base.has(k));
if (missingUsed.length) {
  failed = true;
  console.error(`Translation keys used by source but missing: ${missingUsed.join(', ')}`);
}
if (failed) process.exit(1);
console.log(`Translation audit passed: ${locales.length} locales, ${base.size} shared keys.`);
