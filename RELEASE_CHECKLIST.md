# Professional Release Checklist

## Required before production

- [ ] `npm ci` succeeds on Node 24.x.
- [ ] `npm run build` succeeds on Node 24.x.
- [ ] `npm run lint` succeeds.
- [ ] `npm run audit`
- [ ] `npm run audit:i18n`
- [ ] `npm run audit:theme`
- [ ] `npm run audit:pwa`
- [ ] `npm run audit:professional`
- [ ] Supabase RLS tested with employee, supervisor, HR, payroll and super-admin accounts.
- [ ] Storage upload/download permissions tested.
- [ ] Password reset tested from a real email.
- [ ] Camera/GPS permissions tested on Android and iOS.
- [ ] Payroll and approval workflows tested in staging.
- [ ] PWA install/update tested on Android and iOS Safari.
- [ ] Signed Android/iOS builds tested on physical devices.
