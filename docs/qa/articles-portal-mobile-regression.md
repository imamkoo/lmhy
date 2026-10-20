# QA — Portal Artikel `/articles` (Mobile Layout & Adaptive Thumbnail)

Status: **PASS** (terverifikasi otomatis 2026-10-20, build produksi + Chrome headless)

Cakupan: `/articles` pada viewport mobile (320–430 px) dan desktop (768–1280 px).
Metode: audit geometri DOM via Chrome DevTools Protocol (Playwright) pada build produksi.

---

## 1. Temuan awal (sebelum perbaikan) & root cause

| # | Gejala | Root cause terverifikasi |
|---|---|---|
| 1 | Logo `LET ME HEAR YOU` menabrak tombol `Tulis Karya` / `Masuk` | Logo PNG 4500×476 dirender hanya dari tinggi (`h-8 w-auto` → 303 px) di dalam container `flex-1` tanpa batas lebar → `scrollWidth 303` vs `clientWidth 123` |
| 2 | Tombol carousel `next` keluar dari kartu Featured | Overlay `flex items-end justify-between` memaksa blok teks (251 px) + panah (100 px) melebihi lebar kartu 358 px → `scrollWidth 375` vs `clientWidth 356`, panah keluar 18 px dari kartu |
| 3 | Foto potret terpotong di tengah (wajah terpotong) | Semua thumbnail memakai `<img>` polos `object-cover` tanpa `applyAdaptiveFocal` (belum Applying PR #147) |
| 4 | Scrollbar horizontal muncul di bar kategori | Kelas `no-scrollbar` & `custom-scrollbar` dipakai di markup tapi tidak pernah didefinisikan di CSS |

## 2. Perbaikan

| Area | Perubahan |
|---|---|
| Header | Logo dibatasi `max-h-7 sm:max-h-9 max-w-[min(52vw,100%)]`, container `min-w-0`; CTA mobile `px-2 py-1.5 text-xs whitespace-nowrap`; `gap-2 sm:gap-3` |
| Featured | Overlay jadi `flex-col justify-end` (mobile) → `sm:flex-row sm:items-end sm:justify-between`; tinggi kartu `420px` (mobile); panah `self-end`; meta row `flex-wrap` |
| Section header | `flex-col sm:flex-row` + `self-start` untuk badge & link Eksplorasi |
| Thumbnail | Semua gambar artikel memakai `ArticleThumbnailImage` (adaptive focal + `fallbackSrc` + `loading/eager`) |
| Scrollbar | `@utility no-scrollbar` + `.custom-scrollbar` ditambahkan ke `src/app/globals.css` |

## 3. Regresi adaptive focal pada cache

`onLoad` tidak pernah fire bila gambar sudah ter-cache sebelum hydration → focal 38% terlewat.
Diperbaiki: `useEffect` memeriksa `img.complete && naturalWidth > 0` lalu menjalankan `applyAdaptiveFocal`.

Berkas: `src/components/articles/ArticleThumbnailImage.tsx` (dipindah dari `src/app/tenant/[username]/components/`).

## 4. Hasil verifikasi (build produksi, `npm run build` + `npm start`)

| Viewport | Overflow dokumen | Elemen terpotong | Overlap logo/CTA | Panah keluar kartu | Focal terpasang |
|---|---|---|---|---|---|
| 320 px | 0 | 0 | tidak | tidak | 5/5 gambar artikel |
| 360 px | 0 | 0 | tidak | tidak | 5/5 |
| 390 px | 0 | 0 | tidak | tidak | 5/5 |
| 430 px | 0 | 0 | tidak | tidak | 5/5 |
| 768 px | 0 | 0 | tidak | tidak | 5/5 |
| 1280 px | 0 | 0 | tidak | tidak | 5/5 |

Pemeriksaan tambahan: `/tenant/[username]` (thumbnail profil) tetap menerapkan focal `50% 38%` pada gambar potret 768×1408 baik pada cold load maupun warm cache.

Quality gate: `npm run lint` (0 error), `npx tsc --noEmit` (0 error), `npm run test:unit` (62/62 pass), `npm run build` (sukses).

## 5. Screenshot bukti

- `/tmp/lmhy-articles-mobile-fold.png` — viewport 390×844 (2× DPR), fold pertama
- `/tmp/lmhy-articles-mobile.png` — halaman penuh 390 px
