# Let Me Hear You — AI Assistant Guidelines

Komunitas & platform kesehatan mental. Repo ini kini **landing-page-only mode**.

## Environment saat ini

- **Framework:** Next.js 16 (App Router, Turbopack) — `next@16.3.0`
- **Styling:** Tailwind CSS v4 + design system **Warm Sanctuary** (token HSL di `src/app/globals.css`, dokumentasi di `docs/design/warm-sanctuary-tokens.md`)
- **Fonts:** Poppins (sans/body), Heebo (heading), JetBrains Mono (mono)
- **Routing aktif:** `/` (Landing Page static) + `/_not-found`
- **Tidak ada lagi:** app wellness (mental-battery, mood, screening, games), auth, admin, API routes, database. Semua dihapus pada rebranding ke landing-only.

## Aturan Penting

1. **Landing Page adalah kanonik — JANGAN UBAH.** `src/components/landing/`, `src/styles/landing.css`, dan `src/app/(marketing)/` diseptakan 100% apa adanya (markup, styling, konten, efek). Reverse-drop routes `/mental-battery` & `/login` memang sengaja dibiarkan 404.
2. **Gunakan design tokens Warm Sanctuary** yang sudah ada — jangan menambah warna/radius/font baru di luar token tersebut.
3. **Quality Gate:** sebelum klaim selesai, jalankan `npm run lint` (eslint), `npx tsc --noEmit`, `npm run build`.
4. **No unrequested comments** in code.
5. Jangan commit tanpa instruksi eksplisit.

## Design Skills (wajib dipakai untuk UI)

- `design-taste-frontend` (Taste Skill v2) — skill desain frontend utama.
- `design-system`, `ui-styling`, `brand`, `ui-ux-pro-max` — pendukung.
- Workflow: `superpowers:brainstorming` sebelum kreatif, `superpowers:writing-plans` setelah spesifikasi, Lalu eksekusi.

## Root workspace (imkollective)

Aturan lintas-project ada di `/Users/macbookair/Downloads/imkollective/AGENTS.md`. Baca `session.md` di root sebelum kerja; jangan commit `session.md`/`AGENTS.md` root.