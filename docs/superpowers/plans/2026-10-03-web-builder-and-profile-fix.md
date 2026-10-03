# Let Me Hear You Web Builder & Profile Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghilangkan widget Litera dari halaman profil tenant (`https://[username].letmehearyou.id`) dan membuat halaman Web Builder interaktif di `/builder` dengan preview subdomain live, template refleksi siap pakai, dan integrasi penerbitan 1-klik ke Litera Web3.

**Architecture:** 
1. **Fix Tenant Profile:** Pastikan `src/app/tenant/[username]/page.tsx` bersih dari artifact DOM `#litera` dan script Litera tidak dimount di halaman profil. Widget Litera hanya dimount di halaman baca artikel (`/[slug]`).
2. **Web Builder Suite (`src/app/builder/`):** Menyediakan antarmuka visual penulisan blog mandiri yang meminta username (dengan live URL preview `https://[username].letmehearyou.id`), pemilihan template refleksi siap pakai (Burnout/Mindfulness/Self-Love), editor markdown/teks, pengaturan Litera Web3, dan publikasi langsung ke subdomain tenant.
3. **Landing Page Integration:** Menambahkan tombol CTA 'Mulai Menulis di Web Builder' yang selaras dengan tema Warm Sanctuary pada Navbar dan Hero section tanpa merusak kanonisitas landing page.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (Warm Sanctuary tokens), React 19, TypeScript.

---

## Tasks

### Task 1: Fix Tenant Profile Page (Isolasi Widget Litera)
**Files:**
- Modify: `src/app/tenant/[username]/page.tsx`
- Modify: `src/components/litera/LiteraWidget.tsx`

- [ ] **Step 1:** Periksa dan pastikan `src/app/tenant/[username]/page.tsx` tidak me-render `<LiteraWidget />` ataupun elemen `#litera`.
- [ ] **Step 2:** Di `src/components/litera/LiteraWidget.tsx`, tambahkan cleanup saat unmount agar jika berpindah rute (SPA navigation) ke halaman profil, container widget lama dibersihkan dan listener dicopot sehingga tidak merender status artikel yang tertinggal di halaman profil.
- [ ] **Step 3:** Verifikasi build & typecheck: `npx tsc --noEmit`.

### Task 2: Implementasi Web Builder Page & Components (`/builder`)
**Files:**
- Create: `src/app/builder/page.tsx`
- Create: `src/app/builder/WebBuilderClient.tsx`
- Create: `src/lib/builder-templates.ts`

- [ ] **Step 1:** Buat `src/lib/builder-templates.ts` berisi daftar preset template refleksi:
  - *Jurnal Pemulihan Burnout*
  - *Seni Menerima Ketidaksempurnaan Diri*
  - *Mengenali Batas Diri (Healthy Boundaries)*
  - *Kanvas Kosong (Mulai dari Nol)*
- [ ] **Step 2:** Buat `src/app/builder/WebBuilderClient.tsx` dengan fitur:
  - Input `username` interaktif dengan auto-formatting (lowercase, alphanum, hyphens).
  - Live Domain Preview box: menampilkan badge `https://[username].letmehearyou.id` dan `https://[username].letmehearyou.id/[slug]`.
  - Selector Template Refleksi: 1-klik untuk populate judul, ringkasan, isi tulisan, dan tags.
  - Editor Form: Judul, Excerpt, Konten (textarea responsif yang nyaman), Tags.
  - Toggle Switch Litera Web3 (default: checked).
  - Submit Handler yang memanggil Server Action `publishTenantArticle` dan mengarahkan otomatis ke URL subdomain live: `https://[username].letmehearyou.id/[slug]`.
- [ ] **Step 3:** Buat Server Page `src/app/builder/page.tsx` dengan metadata title "Web Builder Refleksi & Subdomain — Let Me Hear You" dan membungkus `WebBuilderClient`.

### Task 3: Integrasi CTA Web Builder di Landing Page & Profil Tenant
**Files:**
- Modify: `src/components/landing/Header.tsx` (atau komponen navigasi landing)
- Modify: `src/components/landing/Hero.tsx` (atau CTA section)
- Modify: `src/app/tenant/[username]/page.tsx` (tombol "✏️ Tulis Refleksi Baru" mengarahkan ke builder dengan prefilled username)

- [ ] **Step 1:** Di `src/app/tenant/[username]/page.tsx`, perbarui link tombol tulis agar mengarah ke `/write` atau `/builder?username=${username}`.
- [ ] **Step 2:** Di landing page marketing, tambahkan link/button elegan "Mulai Menulis" / "Buka Web Builder" yang mengarah ke `/builder`.
- [ ] **Step 3:** Jalankan `npm run lint`, `npx tsc --noEmit`, dan `npm run build` untuk memvalidasi quality gate.
