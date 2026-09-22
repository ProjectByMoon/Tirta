import fs from 'node:fs';
import path from 'node:path';

const required = [
  'src/pages/Home/Home.tsx',
  'src/styles/components/home.css',
  'src/components/karyawan/dashboard/PortalKaryawan.tsx',
  'src/styles/employee/portal.css',
  'src/App.tsx',
  'src/styles/global/index.css',
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing presentation file: ${file}`);
const home = fs.readFileSync('src/styles/components/home.css','utf8');
const portal = fs.readFileSync('src/styles/employee/portal.css','utf8');
const app = fs.readFileSync('src/App.tsx','utf8');
const employee = fs.readFileSync('src/components/karyawan/dashboard/PortalKaryawan.tsx','utf8');
const checks = [
  ['home motion', home.includes('@keyframes homeFadeUp')],
  ['reduced motion', home.includes('prefers-reduced-motion') && portal.includes('prefers-reduced-motion')],
  ['app loading screen', app.includes('AppLoadingScreen')],
  ['employee loading screen', employee.includes('PortalLoadingScreen')],
  ['loading bar', portal.includes('employee-loading-bar')],
  ['focus-visible', portal.includes('focus-visible')],
];
const failed = checks.filter(([,ok])=>!ok);
if (failed.length) throw new Error(`Presentation audit failed: ${failed.map(([n])=>n).join(', ')}`);
console.log(`Presentation audit passed: ${checks.length} checks.`);
