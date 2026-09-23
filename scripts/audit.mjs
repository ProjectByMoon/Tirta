import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'index.html','package.json','netlify.toml','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json',
  'src/App.tsx','src/main.tsx','src/lib/supabase/client.ts','src/lib/security.ts',
  'supabase/BOOTSTRAP_FRESH_DATABASE.sql','supabase/README_DATABASE_SETUP.md','supabase/migration/045_v48_attendance_security.sql','PROFESSIONAL_RELEASE.md'
];
const failures = [];
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required file: ${rel}`);

const src = path.join(root, 'src');
const importRe = /(?:from|import)\s*\(?\s*['\"](\.[^'\"]+)['\"]/g;
function candidates(p, spec) {
  const base = path.resolve(path.dirname(p), spec);
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base,'index.ts'), path.join(base,'index.tsx'), `${base}.css`, `${base}.svg`, `${base}.png`];
}
function walk(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
}
for (const file of walk(src).filter(f=>/\.tsx?$/.test(f))) {
  const text=fs.readFileSync(file,'utf8'); let m;
  while ((m=importRe.exec(text))) if (!candidates(file,m[1]).some(fs.existsSync)) failures.push(`Missing relative import: ${path.relative(root,file)} -> ${m[1]}`);
}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

function walkDirs(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? [path.join(dir,e.name), ...walkDirs(path.join(dir,e.name))] : []); }
const emptyDirs = walkDirs(src).filter(p => fs.readdirSync(p).length === 0);
for (const dir of emptyDirs) failures.push(`Empty source directory: ${path.relative(root, dir)}`);

const legacyUnused = [
  'src/components/common/LandingPage.tsx',
  'src/components/common/Navbar.tsx',
];
for (const rel of legacyUnused) if (fs.existsSync(path.join(root, rel))) failures.push(`Legacy unused source file: ${rel}`);
if (!pkg.dependencies?.['@supabase/supabase-js']) failures.push('Supabase JS dependency missing from package.json');
const clientSource = fs.readFileSync(path.join(root,'src/lib/supabase/client.ts'),'utf8');
if (/https:\/\/[^'\"]+supabase\.co|sb_publishable_[A-Za-z0-9_]+/.test(clientSource)) failures.push('Hardcoded Supabase project URL or publishable key found in client source.');
if (fs.existsSync(path.join(root,'netlify/functions/create-super-admin.ts'))) failures.push('Public create-super-admin function must not be shipped.');
for (const rel of ['src/components/admin/payroll/ModulPayroll.tsx','src/features/enterprise/EnterpriseExperience.tsx']) if (fs.existsSync(path.join(root,rel))) failures.push(`Unused legacy source file present: ${rel}`);
const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const lockRoot = lock.packages?.[''] || {};
    const normalize = (v) => JSON.stringify(v || {}, Object.keys(v || {}).sort());
    if (lockRoot.name !== pkg.name || lockRoot.version !== pkg.version) failures.push('package-lock.json root package metadata does not match package.json.');
    if (normalize(lockRoot.dependencies) !== normalize(pkg.dependencies)) failures.push('package-lock.json dependencies do not match package.json.');
    if (normalize(lockRoot.devDependencies) !== normalize(pkg.devDependencies)) failures.push('package-lock.json devDependencies do not match package.json.');
  } catch (e) {
    failures.push(`Invalid package-lock.json: ${e.message}`);
  }
}
if (failures.length) { console.error(failures.join('\\n')); process.exit(1); }
console.log(`Bernadya static audit passed: ${required.length} required files + relative import scan.`);
