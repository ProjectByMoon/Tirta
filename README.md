# Project by Tirta — Bernadya HRIS

Current professional hardening baseline: **57.0.0**.

Bernadya is a React/TypeScript HRIS platform backed by Supabase, with Admin Dashboard, Employee Self Service, payroll, attendance, talent/recruitment modules, PWA delivery and Capacitor readiness.

## Quick setup

1. Use **Node 24.x** (`.nvmrc` is set to `24`).
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `npm ci`.
5. Run the release gates:

```bash
npm run audit
npm run audit:i18n
npm run audit:theme
npm run audit:pwa
npm run audit:professional
npm run build
```

## Environment security

- The browser never contains a Supabase service-role key.
- Missing Supabase browser variables fail closed; no real fallback project is embedded.
- Service-role credentials belong only in server-side/Netlify environment variables.
- RLS and backend authorization are the security boundary for privileged HRIS operations.

## Mobile

The project supports PWA installation and is prepared for Capacitor Android/iOS builds. The service worker caches application assets only; HRIS/API traffic and sensitive employee/payroll data are not intentionally cached.

## Languages

- Indonesia (`id`) — primary
- English (`en`)
- 日本語 (`ja`)
- 한국어 (`ko`)
- 中文 (`zh`)

## Themes

Six built-in themes plus a validated custom theme are supported by the Admin Theme Engine.

## Release documentation

- `PROFESSIONAL_RELEASE.md` — current release gate and engineering principles.
- `RELEASE_CHECKLIST.md` — production checklist.
- `docs/archive/` — historical implementation and release notes.
