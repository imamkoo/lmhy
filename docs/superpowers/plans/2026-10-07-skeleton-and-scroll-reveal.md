# Skeleton Loading & Scroll-Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap transisi page menampilkan skeleton branded Warm Sanctuary (tanpa dobelan preloader), dan seluruh section + kartu landing ter-reveal saat di-scroll dengan Framer Motion.

**Architecture:** Task A menambahkan primitive `Skeleton` + `loading.tsx` per route segment (App Router streaming fallback) dan membatasi preloader landing ke kunjungan pertama per session. Task B memasang dependency `motion`, modul varian bersama, lalu mengonversi elemen section/header landing menjadi `motion.*` yang mempertahankan className/id yang sama — tanpa mengubah `landing.css`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (token shadcn di globals.css), `motion` (framer-motion) dari `motion/react`.

**Spec:** `docs/specs/skeleton-loading-and-scroll-reveal.md`

## Global Constraints

- **Tidak ada commit/push sampai user mengonfirmasi push** (aturan repo); semua perubahan dikumpulkan di working tree, commit logis dibuat saat konfirmasi.
- Quality gate wajib sebelum klaim selesai: `npm run lint`, `npx tsc --noEmit`, `npm run build` (semua exit 0).
- Tidak ada test runner di repo ini — "verifikasi" = gate + pemeriksaan browser (DOM/computed style). JANGAN menambah test framework.
- `src/styles/landing.css` **tidak diubah**; className/id section (`#home #about #services #article #contact`) **tidak berubah** agar anchor nav tetap jalan.
- Tidak menambah warna/radius/font baru di luar token yang ada (Skeleton memakai token shadcn `muted`).
- `prefers-reduced-motion` dihormati via `<MotionConfig reducedMotion="user">`.
- Nama flag preloader: `sessionStorage["lmhy_preloader_seen"]` — persis string ini.
- Dev server harus dimatikan setelah verifikasi.

## Review Focus

1. **Section tersangkut di opacity 0** (varian tidak ter-trigger) → Task 5 Step: `scrollIntoView()` pada `#about`, baca `getComputedStyle` → opacity harus `1`.
2. **Stagger tidak bekerja** karena nesting non-motion di antara motion components → Task 5 memakai pola: section trigger (`variants={triggerOnly}`) + `motion.div.row` (`staggerParent`) + item (`staggerChild`); verifikasi item pertama & terakhir punya `transform/opacity` berbeda saat reveal.
3. **Preloader regresi** (hilang sama sekali di kunjungan pertama) → Task 3 Step: hard-load `/` → `.js-preloader` TIDAK `display:none` dalam 200ms pertama; kunjungan kedua (client nav) → `display:none` instan.
4. **Konten landing hilang untuk no-JS/SEO** → Task 5 Step: HTML hasil `npm run build` (view page source / `.next` prerender) tetap memuat seluruh teks section (motion hanya menambah inline style, konten di-SSR).
5. **Skeleton muncul pada navigasi instan (cached)** → Task 2 Step: navigasi bolak-balik `/builder ↔ /` — skeleton hanya boleh muncul saat RSC pending; probe DOM `aria-busy` sesaat setelah klik dan setelah komit.
6. **Reduced-motion menampilkan konten utuh** → Task 6 Step: emulasi reduced-motion (bila tool tersedia) → semua section opacity 1 tanpa transform; fallback: review penempatan `MotionConfig`.

---

### Task 1: Skeleton primitive + loading generik root

**Files:**
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/app/loading.tsx`

**Interfaces:**
- Consumes: `cn` dari `@/lib/utils` (sudah ada; clsx + tailwind-merge).
- Produces: `export function Skeleton({ className }: { className?: string })` → `<div>` dengan `animate-pulse`, `bg-muted`, radius `rounded-lg`, `aria-hidden`, kelas tambahan digabung via `cn`. Dipakai semua loading screen (Task 2).

- [ ] **Step 1: Buat `src/components/ui/skeleton.tsx`** — fungsi tunggal sesuai signature di atas.
- [ ] **Step 2: Buat `src/app/loading.tsx`** — fallback generik: `min-h-screen` center, `Skeleton` logo (h-16 w-16 rounded-full) + dua bar (`h-4 w-48`, `h-4 w-32`) + wrapper `role="status"` `aria-label="Memuat"`.
- [ ] **Step 3: Verifikasi gate**
  Run: `npx tsc --noEmit && npm run lint`
  Expected: exit 0.

### Task 2: Loading screen tailored per route

**Files:**
- Create: `src/app/(marketing)/loading.tsx`
- Create: `src/app/builder/loading.tsx`
- Create: `src/app/blog/loading.tsx`
- Create: `src/app/blog/[slug]/loading.tsx`

**Interfaces:**
- Consumes: `Skeleton` dari Task 1.
- Produces: tidak ada — file `loading.tsx` di-eksplisit oleh App Router.

- [ ] **Step 1: `(marketing)/loading.tsx`** — komponen server, pola landing: bar header (`h-12 w-full`), hero (grid 2 kolom: blok teks `space-y-3` 3 bar + kotak gambar `aspect-square rounded-2xl`), baris 3 kartu (`grid sm:grid-cols-3 gap-4`, tiap kartu `aspect-[4/5]`), semua `Skeleton`; wrapper `role="status" aria-label="Memuat halaman"`.
- [ ] **Step 2: `builder/loading.tsx`** — bar toolbar (`h-14`) + area canvas (`h-[60vh] rounded-2xl`) + panel samping (`w-full h-40`).
- [ ] **Step 3: `blog/loading.tsx`** — judul (`h-8 w-2/3`) + 4 bar teks + grid 3 kartu. `blog/[slug]/loading.tsx` — judul (`h-10 w-3/4`) + 6 bar teks lebar penuh.
- [ ] **Step 4: Verifikasi gate + probe**
  Run: `npm run build`
  Expected: exit 0, keempat route ter-compile.
  Probe (opsional bila throttling tool tersedia): klik navigasi ke `/`, evaluate sesaat setelah klik → elemen `role="status"` dari loading boleh muncul hanya selama transisi; setelah komit, konten landing menggantikan (tidak ada skeleton tersisa).

### Task 3: Preloader first-visit-only

**Files:**
- Modify: `src/components/landing/LandingEffects.tsx:7-15` (efek pertama `useEffect`)

**Interfaces:**
- Consumes: elemen `.js-preloader` yang sudah dirender `LandingPage`.
- Produces: perilaku sessionStorage `lmhy_preloader_seen`; Task 5 TIDAK menyentuh preloader lagi.

- [ ] **Step 1: Ubah efek preloader** — logika persis:
  - `sessionStorage.getItem("lmhy_preloader_seen")` ada → `preloader.classList.add("fade-out")` + `(preloader as HTMLElement).style.display = "none"` **langsung** (tanpa `setTimeout`), return.
  - tidak ada → `sessionStorage.setItem("lmhy_preloader_seen", "1")`, lalu perilaku lama (fade-out + `display:none` setelah 2000ms).
- [ ] **Step 2: Verifikasi browser** (dev server on, tab ke `/`)
  - Hard load pertama: dalam 200ms setelah paint, `.js-preloader` komputed `display` ≠ `none` (masih tampil).
  - Client nav pergi ke `/builder` lalu kembali ke `/` (klik link `←`): sesaat setelah komit, `.js-preloader` `style.display === "none"` (instan).
- [ ] **Step 3: Verifikasi gate** — `npx tsc --noEmit && npm run lint` → exit 0.

### Task 4: Install `motion` + modul varian

**Files:**
- Modify: `package.json` (`npm i motion`)
- Create: `src/components/landing/motion-variants.ts`

**Interfaces:**
- Produces (dipakai Task 5, nama HARUS persis):
  - `EASE_OUT` — `Transition` `{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }`
  - `fadeUp: Variants` — hidden `{ opacity: 0, y: 24 }` → visible `{ opacity: 1, y: 0, transition: EASE_OUT }`
  - `fadeDown: Variants` — hidden `{ opacity: 0, y: -16 }` → visible `{ opacity: 1, y: 0, transition: EASE_OUT }`
  - `blurIn: Variants` — hidden `{ opacity: 0, filter: "blur(12px)" }` → visible `{ opacity: 1, filter: "blur(0px)", transition: EASE_OUT }`
  - `slideRight: Variants` — hidden `{ opacity: 0, x: -32 }` → visible `{ opacity: 1, x: 0, transition: EASE_OUT }`
  - `staggerParent: Variants` — `hidden: {}` → `visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }`
  - `staggerChild: Variants` — hidden `{ opacity: 0, y: 20 }` → visible `{ opacity: 1, y: 0, transition: EASE_OUT }`
  - `triggerOnly: Variants` — `hidden: {}` → `visible: {}` (pemicu tanpa animasi elemen)
  - `viewportOnce` — `{ once: true, margin: "0px 0px -10% 0px" }` (dipakai prop `viewport`)
- [ ] **Step 1:** `npm i motion` → import type dari `motion/react`.
- [ ] **Step 2:** Buat file sesuai ekspor di atas.
- [ ] **Step 3: Verifikasi** — `npx tsc --noEmit && npm run lint` → exit 0.

### Task 5: Terapkan motion di LandingPage + MotionConfig

**Files:**
- Modify: `src/components/landing/LandingPage.tsx` (konversi tag → `motion.*`, tambah import; teks/className/id TIDAK berubah)
- Modify: `src/app/(marketing)/layout.tsx` (bungkus children)

**Interfaces:**
- Consumes: semua ekspor `motion-variants.ts` (Task 4).
- Produces: tidak ada.

**Pola pemasangan (elemen → varian):**

| Elemen (tag asli → motion) | Varian / trigger |
|---|---|
| `<header className="header">` → `motion.header` | `initial="hidden" animate="visible" variants={fadeDown}` (mount, bukan scroll) |
| `<section className="home" id="home">` → `motion.section` | `whileInView="visible" initial="hidden" variants={staggerParent} viewport={viewportOnce}`; `.home-text` → `motion.div variants={fadeUp}`; `.home-img` → `motion.div variants={blurIn}` |
| `<section className="about section-padding" id="about">` → `motion.section` | `variants={slideRight}` + `whileInView`/`viewportOnce` (seluruh section) |
| `<section className="service ...">` | `variants={triggerOnly}` + `whileInView`; `.section-title` → `motion.div variants={fadeUp}`; `.row` → `motion.div variants={staggerParent}`; tiap `.services-item` → `motion.div variants={staggerChild}` |
| `<section className="fun-fact">` | `triggerOnly` + `whileInView`; `.row` → `motion.div staggerParent`; tiap `.fun-fact-item` → `motion.div staggerChild` |
| `<section className="article ...">` | `triggerOnly` + `whileInView`; `.section-title` → `motion.div blurIn`; `<section className="cards-wrapper">` → `motion.section staggerParent` + `whileInView`; tiap `.card-grid-space` → `motion.div staggerChild` |
| `<section className="contact ...">` → `motion.section` | `variants={fadeUp}` + `whileInView`/`viewportOnce` |

- [ ] **Step 1: Import** — `import { motion } from "motion/react"` + import varian di `LandingPage.tsx`.
- [ ] **Step 2: Konversi sesuai tabel** (tag diganti `motion.<tag>`; semua `className`/`id`/isi teks dipertahankan persis; sisa elemen — nav `<ul>`, footer, preloader — TIDAK disentuh).
- [ ] **Step 3: `layout.tsx`** — `return <MotionConfig reducedMotion="user">{children}</MotionConfig>;` (import `MotionConfig` dari `motion/react`).
- [ ] **Step 4: Verifikasi browser (reveals jalan)** — dev on, buka `/`:
  - Elemen `#about` sebelum masuk viewport: computed `opacity` = `0` (hidden).
  - `document.querySelector("#about").scrollIntoView()` → frame berikutnya computed `opacity` = `1` dan `transform` ≠ `none` lalu settle (transition selesai → opacity 1).
  - `#services` `.services-item` pertama & terakhir: setelah reveal, keduanya opacity 1 (stagger = sempat berbeda waktu; minimal keduanya berakhir visible).
  - Hero (di viewport awal) setelah hydrate: `.home-text` opacity 1.
  - Anchor nav tetap jalan: klik `#services` di nav → scroll ke section (id utuh).
- [ ] **Step 5: Verifikasi konten SSR** — grep HTML hasil build (atau view-source) → seluruh judul section ("About Us", "Services", "Contact Us", dst.) tetap ada di HTML.
- [ ] **Step 6: Verifikasi gate** — `npm run lint && npx tsc --noEmit && npm run build` → exit 0.

### Task 6: Verifikasi menyeluruh + cleanup

**Files:** tidak ada perubahan kode; hanya pemeriksaan.

- [ ] **Step 1: Gate lengkap** — `npm run lint && npx tsc --noEmit && npm run build` → semua exit 0.
- [ ] **Step 2: Alur transisi page** — dev on: navigasi `/builder → /` → skeleton muncul saat transisi (atau throttle bila tool tersedia), komit landing menampilkan preloader-instan-hidden + konten; ulangi bolak-balik 2× → tidak ada flash preloader.
- [ ] **Step 3: Reduced motion** — emulasi `prefers-reduced-motion: reduce` bila tool browser mendukung → buka `/`, seluruh section terlihat (opacity 1) tanpa animasi; bila tool tidak mendukung, review penempatan `<MotionConfig reducedMotion="user">` di layout sudah membungkus seluruh konten marketing.
- [ ] **Step 4: Console bersih** — kumpulkan console error → 0 error halaman (warning pre-existing diabaikan).
- [ ] **Step 5: Cleanup** — matikan dev server (port 3000 closed), hapus artefak uji di browser (iframe/localStorage draft bila ada), `git status` tinggal perubahan yang direncanakan.
- [ ] **Step 6: Minta konfirmasi push** (aturan repo) → commit logis (A: skeleton+preloader; B: motion) → PR → tunggu CI → merge → update `session.md`.
