# Theme Engine V6

## Ringkasan
- Refactor Theme Engine Admin Dashboard menjadi token-based.
- Enam tema bawaan tetap tersedia: Navy Gold, Corporate Blue, Professional Green, Modern Purple, Dark Enterprise, Light Enterprise.
- Tema Kustom divalidasi sebagai hex `#RRGGBB` dan dapat disimpan ke `localStorage`.
- Tema aktif memiliki state visual + `aria-pressed`.
- Core theme tokens tidak lagi dikunci oleh `!important`.
- Legacy CSS variables (`--blue`, `--surface`, `--bg`, dll.) dipetakan ke token tema agar komponen lama tetap kompatibel.
- Panel, tabel, form, navigasi, tombol, tab, profile panel, status, dan komponen tema mengikuti token aktif.
- Ditambahkan `npm run audit:theme` untuk pemeriksaan otomatis.

## Validasi
- `npm run audit` — PASS
- `npm run audit:theme` — PASS
- `npx tsc --noEmit` — PASS pada environment pemeriksaan saat ini
- `npm run build` — belum PASS karena instalasi dependency environment terhenti/parsial; build gagal mencari `vite/client` dan `node` types. Project menetapkan Node 24.x.
