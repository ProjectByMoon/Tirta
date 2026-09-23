import fs from 'node:fs';

const css = fs.readFileSync('src/styles/admin/admin.css','utf8');
const ts = fs.readFileSync('src/components/admin/dashboard/DashboardAdmin.tsx','utf8');
const errors = [];

if (!css.includes('THEME ENGINE V2 — AUTHORITATIVE ADMIN THEME LAYER')) errors.push('Theme Engine V2 layer missing.');
if (/--mx-(primary|accent|background|surface|text|border)\s*:[^;]+!important/i.test(css)) errors.push('A core theme token is still locked with !important.');
if (!/activeThemeId/.test(ts) || !/aria-pressed=\{activeThemeId===theme\.id\}/.test(ts)) errors.push('Theme selection state/ARIA indicator missing.');
const ids = [...ts.matchAll(/id:'([^']+)'/g)].map(m => m[1]);
const expected = ['moon','blue','green','purple','dark','light'];
for (const id of expected) if (!ids.includes(id)) errors.push(`Built-in theme missing: ${id}`);
if (!/id:'custom'/.test(ts)) errors.push('Custom theme flow missing.');
if (!/localStorage\.setItem\('moonx-theme'/.test(ts)) errors.push('Theme persistence missing.');
if (!/normalizeTheme/.test(ts)) errors.push('Theme normalization missing.');
if (!/isHexColor/.test(ts)) errors.push('Custom color validation missing.');

if (errors.length) {
  console.error('Theme audit FAILED');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}
console.log('Theme audit passed: 6 built-in themes + custom theme + token layer + persistence + validation.');
