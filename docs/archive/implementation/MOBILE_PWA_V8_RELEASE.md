# Mobile / PWA Release v8

Added a mobile delivery layer without caching sensitive HRIS data.

## Included
- Web App Manifest
- Android/iOS PWA metadata
- 192/512/1024 app icons
- Production service worker with safe asset caching
- Supabase/auth/API cache exclusions
- PWA registration
- Capacitor configuration and helper scripts
- Mobile setup documentation
- Automated `npm run audit:pwa`

## Important
PWA installation works from a deployed HTTPS site. Native Play Store/App Store packages still require generating Android/iOS platform projects with Capacitor and performing platform-specific signing/release steps.
