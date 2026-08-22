# Spec Desain: LMHY Blog/News + Litera Universal Embed (Demo)

**Tanggal:** 2026-08-22
**Project:** Let Me Hear You (`imkollective/letmehearyou/`)
**Target:** Milestone 1 — Blog/News dengan SEO/GEO/AIO optimal + Integrasi Demo Litera Widget (Non-WordPress)
**Status:** Menunggu Review User

---

## 1. Latar Belakang & Tujuan

### 1.1 Latar Belakang
- **Kebutuhan LMHY:** Sebagai platform kesehatan mental, LMHY membutuhkan saluran publikasi (Blog/News) untuk mendatangkan trafik organik (SEO), menjadi referensi mesin pencari AI (GEO/AIO), serta membangun kepercayaan pembaca.
- **Kebutuhan Litera:** Direksi Litera ingin membuktikan bahwa **widget/plugin Litera dapat terpasang sempurna di website non-WordPress** (seperti Next.js), bukan hanya di WordPress.
- **Pendekatan:** Integrasi dilakukan tanpa CMS UI (Keystatic ditunda ke fase berikutnya). Artikel ditulis dalam format MDX di repositori.

### 1.2 Tujuan
1. Menghadirkan halaman `/blog` dan `/blog/[slug]` yang cepat, responsif, dan siap produksi di LMHY.
2. Menerapkan optimasi SEO, GEO (Generative Engine Optimization), dan AIO (AI Optimization) berbasis SSG + JSON-LD Schema.org `Article`.
3. Memasang widget Litera secara otomatis di setiap halaman artikel blog LMHY via skrip CDN existing (`cdn.literaa.xyz`).
4. Menjaga repositori LMHY tetap ringan (hanya menambah 2 dependency: `gray-matter` & `next-mdx-remote`).

---

## 2. Arsitektur & Struktur File

Seluruh kode ditempatkan di repositori `letmehearyou`:

```
letmehearyou/
├── content/blog/
│   ├── memahami-kesehatan-mental.mdx      # Contoh artikel 1
│   └── mengenali-tanda-burnout.mdx        # Contoh artikel 2
├── docs/superpowers/specs/
│   └── 2026-08-22-lmhy-blog-litera-embed-design.md # File spec ini
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx                 # Existing
│   │   │   └── page.tsx                   # Existing
│   │   ├── blog/
│   │   │   ├── page.tsx                   # Daftar artikel (/blog) — SSG
│   │   │   └── [slug]/
│   │   │       └── page.tsx               # Detail artikel (/blog/[slug]) — SSG
│   │   ├── globals.css                    # Existing
│   │   ├── layout.tsx                     # Root layout — tambah CSP header
│   │   ├── robots.ts                      # Dynamic robots.txt
│   │   └── sitemap.ts                     # Dynamic sitemap.xml
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx               # Kartu artikel untuk list & home
│   │   │   ├── BlogList.tsx               # Grid + filter tag
│   │   │   └── mdx-components.tsx         # Render kustom elemen MDX
│   │   └── litera/
│   │       └── LiteraWidget.tsx           # Wrapper injeksi widget Litera
│   └── lib/
│       ├── blog.ts                        # Parser & query MDX (getAllPosts, getPostBySlug, getTags)
│       └── utils.ts                       # Existing (cn utility)
├── next.config.ts                         # Tambah header CSP untuk domain Litera
└── package.json                           # Tambah gray-matter & next-mdx-remote
```

---

## 3. Komponen Utama & Alur Data

### 3.1 Skema Frontmatter Artikel MDX

Tiap file artikel `.mdx` di `content/blog/` wajib memiliki frontmatter:

```yaml
---
title: "Memahami Kesehatan Mental di Era Digital"
slug: "memahami-kesehatan-mental"
date: "2026-08-22"
excerpt: "Panduan praktis mengenali kondisi batin dan menjaga keseimbangan mental..."
coverImage: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800"
tags: ["Mental Health", "Self Care", "Edukasi"]
author: "Tim LMHY"
category: "mental-health"
seoTitle: "Memahami Kesehatan Mental — Panduan LMHY"
seoDescription: "Pelajari cara mengenali kondisi kesehatan mental dan tips praktis menjaga batin."
ogImage: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=1200"
---
```

### 3.2 Parser & Query Layer (`src/lib/blog.ts`)

- **`getAllPosts()`**: Membaca seluruh file `.mdx` di `content/blog/`, mengurai frontmatter via `gray-matter`, memvalidasi ketersediaan field wajib (`title`, `slug`, `date`, `excerpt`), mengurutkan berdasarkan tanggal terbaru.
- **`getPostBySlug(slug)`**: Membaca file `.mdx` spesifik berdasarkan slug, mengembalikan frontmatter + raw content MDX.
- **`getAllTags()`**: Mengumpulkan seluruh tag unik dan jumlah artikel per tag untuk filter di UI.
- **`getPostsByTag(tag)`**: Menyaring artikel berdasarkan tag tertentu.

Validasi dilakukan secara manual tanpa dependency `zod` untuk menjaga dependency minimal. Jika field wajib kosong, fungsi melempar error deskriptif saat build time.

### 3.3 Halaman & Routing (Next.js App Router)

#### Halaman Index `/blog` (`src/app/blog/page.tsx`)
- Static Site Generation (SSG).
- Menampilkan Header Blog LMHY + Filter Tag + Grid `BlogCard`.
- Menampilkan 6 artikel per halaman (jika > 6, pagination sederhana).
- `generateMetadata`: Metadata SEO statis untuk index blog.

#### Halaman Detail `/blog/[slug]` (`src/app/blog/[slug]/page.tsx`)
- Static Site Generation via `generateStaticParams()` (semua slug di-prerender saat build).
- Komposisi layout:
  1. Breadcrumb nav (`Home > Blog > [Title]`)
  2. Hero artikel: Judul, tanggal, author, tag, cover image
  3. Body artikel: Di-render via `next-mdx-remote` menggunakan `mdx-components.tsx`
  4. **Widget Litera** (komponen `<LiteraWidget />` di bawah artikel)
  5. Artikel terkait (2-3 artikel lain dengan tag serupa)
- **SEO/GEO/AIO:**
  - `generateMetadata`: Title, description, canonical URL, OpenGraph, Twitter card.
  - **JSON-LD Schema.org `Article`** disuntikkan via `<script type="application/ld+json">` (format standar yang dibaca bot Google, ChatGPT, Perplexity, Gemini).

---

## 4. Integrasi Widget Litera (`LiteraWidget.tsx`)

### 4.1 Cara Kerja
1. Komponen `LiteraWidget` adalah Client Component (`"use client"`).
2. Pada `useEffect` mount:
   - Membuat container `<div id="my-react-plugin-root">` jika belum ada.
   - Menyiapkan variabel global:
     ```js
     window.myReactPluginData = {
       permalink: window.location.href,
       title: articleTitle
     };
     ```
   - Menyuntik skrip loader CDN secara asinkron:
     `https://cdn.literaa.xyz/manifest.json` → memuat `bundle.<hash>.js`.
3. Widget Litera otomatis menginisialisasi diri, memanggil `GET /api/v1/articles/resolve?url=...`, dan merender UI Web3 (Mint, Login, Unlockable) di dalam container.

### 4.2 Konfigurasi CSP (`next.config.ts`)
Agar browser tidak memblokir skrip dan API Litera pada website Next.js ini, header `Content-Security-Policy` dikonfigurasi di `next.config.ts`:

```ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.literaa.xyz https://www.googletagmanager.com;
  connect-src 'self' https://literaa.xyz https://cdn.literaa.xyz https://polygon-bor-rpc.publicnode.com https://1rpc.io https://polygon.llamarpc.com https://*.alchemy.com https://*.infura.io https://www.google-analytics.com;
  img-src 'self' data: https: blob:;
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  font-src 'self' data: https://cdnjs.cloudflare.com;
  frame-src 'self' https://verify.walletconnect.com https://*.privy.io;
`;
```

---

## 5. Perubahan pada File Existing

1. **`LandingPage.tsx`**:
   - Section `#article` yang tadinya berisi 3 kartu hardcoded dengan link `#article` diubah untuk membaca data dari `getAllPosts().slice(0, 3)`.
   - Kartu mengarah ke `/blog/[slug]` nyata.
   - Tambahkan tombol **"Lihat Semua Artikel →"** yang mengarah ke `/blog`.
   - Hapus komentar mati `<!-- login -->`.
2. **`layout.tsx` (Root Layout)**:
   - Tambahkan meta tags global tambahan bila diperlukan.
3. **`package.json`**:
   - Tambahkan `gray-matter` dan `next-mdx-remote` di `dependencies`.

---

## 6. Rencana Verifikasi & Uji Coba

1. **Typecheck & Linting:**
   - `npx tsc --noEmit` wajib 0 error.
   - `npm run lint` wajib 0 error.
2. **Build Test:**
   - `npm run build` wajib berhasil (menghasilkan halaman SSG `/blog` dan `/blog/[slug]`).
3. **Visual & Behavior Check:**
   - Buka `/blog` → list artikel tampil dengan styling Warm Sanctuary yang konsisten.
   - Buka `/blog/memahami-kesehatan-mental` → detail artikel tampil, JSON-LD Schema.org ada di view-source.
   - Widget Litera ter-load di bawah artikel dan menampilkan state "Artikel belum diterbitkan sebagai NFT di Litera" (atau state tokenId jika URL sudah didaftarkan).
4. **Prasyarat Demo Direksi (Manual):**
   - Daftarkan URL artikel demo (misal `https://letmehearyou.com/blog/memahami-kesehatan-mental` atau URL staging) di dashboard Litera (`literaa.xyz`).
   - Tunjukkan ke direksi: widget Litera otomatis mengenali artikel tersebut, bisa mint NFT, dan bisa unlock konten — murni dari website Next.js non-WordPress.

---

## 7. Rencana Kerja (Checklist)

- [ ] Task 1: Pasang dependencies `gray-matter` & `next-mdx-remote`
- [ ] Task 2: Buat `content/blog/` + 2 artikel MDX contoh
- [ ] Task 3: Buat `src/lib/blog.ts` + `src/lib/mdx.ts`
- [ ] Task 4: Buat `src/components/blog/MDXComponents.tsx`, `BlogCard.tsx`, `BlogList.tsx`, `BlogPost.tsx`
- [ ] Task 5: Buat `src/components/litera/LiteraWidget.tsx`
- [ ] Task 6: Buat `src/app/blog/page.tsx` & `src/app/blog/[slug]/page.tsx`
- [ ] Task 7: Buat `src/app/sitemap.ts` & `src/app/robots.ts`
- [ ] Task 8: Update `next.config.ts` (CSP header) & `LandingPage.tsx`
- [ ] Task 9: Verifikasi `npm run build`, `npm run lint`, `npx tsc --noEmit`
