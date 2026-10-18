# Spec — Skeleton Loading + Scroll-Reveal Animation

Tanggal: 2026-10-07 · Status: Approved (user)

## Konteks / Masalah

1. User melaporkan "flash tampilan berantakan" saat pindah page (mis. ke beranda LMHY). Diagnosa terukur (client nav `/builder → /`, PerformanceObserver + MutationObserver): landing.css di-insert ke HEAD di ms yang sama dengan konten (render-blocking, CLS **0**), tetapi:
   - **Preloader landing tampil full-screen + fade 2 detik di SETIAP mount** → terasa sebagai flash/dua-transisi (skeleton → preloader → konten).
   - Di koneksi lambat: paint ditahan sampai CSS siap → blank-hold lalu konten muncul serempak.
   - Gambar (LMHY.png, sapiens-2, 1–4.jpg) load setelah commit → pop-in.
   - Belum ada satu pun `loading.tsx` di seluruh app.
2. Landing belum punya animasi masuk-viewport (scroll-reveal) ala industri.

## Keputusan (user memilih)

- **Skeleton**: setiap pindah page (semua route), shimmer halus token Warm Sanctuary.
- **Animasi**: **Framer Motion (`motion`)** — semua section + kartu.
- Aturan AGENTS "landing kanonik jangan diubah" **ditimpa** instruksi eksplisit user ini; isi/struktur section, teks, token, dan efek yang ada tetap dipertahankan.

## Scope

### A. Skeleton & transisi page
- `src/components/ui/skeleton.tsx` — primitive `Skeleton` (div + `animate-pulse` + radius token).
- `app/loading.tsx` — fallback generik untuk route tanpa skeleton sendiri.
- Tailored loading:
  - `src/app/(marketing)/loading.tsx` — header bar + hero blocks + baris kartu (gaya landing).
  - `src/app/builder/loading.tsx` — toolbar + area canvas.
  - `src/app/blog/loading.tsx` dan `src/app/blog/[slug]/loading.tsx` — judul + baris teks + grid kartu.
- **Preloader landing first-visit-only**: flag `sessionStorage` (`lmhy_preloader_seen`). Kunjungan pertama = perilaku lama (fade 2s). Mount berikutnya (client nav) → `display:none` instan, tanpa fade → skeleton `loading.tsx` menjadi satu-satunya transisi.

### B. Scroll-reveal (Framer Motion)
- Install dependency: `motion` (paket resmi framer-motion; import dari `motion/react`).
- `src/components/landing/motion-variants.ts`:
  - `fadeUp` (y 24→0, opacity 0→1), `blurIn` (blur 12px→0 + opacity), `slideRight` (x −32→0), `fadeDown` untuk nav.
  - `staggerParent` / `staggerChild` (delayChildren, staggerChildren ~0.08s).
  - Konfigurasi viewport bersama: `{ once: true, margin: "0px 0px -10% 0px" }`; easing: easeOut ~0.55s (spring ringan opsional).
- Terapkan di `LandingPage.tsx` (hanya pembungkus `motion.div`, atribut `className` section tetap):
  - `header/nav`: `fadeDown` saat mount.
  - `home/hero`: `fadeUp` + `blurIn`.
  - `about`, `services`, `fun-fact`, `article`, `contact`: reveal saat masuk viewport (campur `fadeUp`/`blurIn`/`slideRight` agar tidak monoton).
  - Kartu (`cards-wrapper` dan item layanan): `staggerParent` + `staggerChild`.
- `<MotionConfig reducedMotion="user">` di `src/app/(marketing)/layout.tsx` → animasi nonaktif otomatis untuk `prefers-reduced-motion`.

## Di luar scope

- Optimasi ukuran/dimensi gambar (pop-in gambar dibiarkan, task terpisah).
- Parallax, counter animasi, hover micro-interaction.
- Perubahan token desain/warna/font baru.
- `src/styles/landing.css` diusahakan TIDAK diubah.

## Success criteria

- `npm run lint`, `npx tsc --noEmit`, `npm run build` hijau.
- Navigasi antar-route menampilkan skeleton branded (khususnya ke `/`).
- Preloader tidak muncul lagi pada client nav (hanya kunjungan pertama per session).
- Section & kartu landing reveal saat di-scroll; konten tetap tampil penuh bila JS lambat (hydrate) dan saat reduced-motion.
- Console 0 error; verifikasi device via Vercel preview.
