# Implementasi Studio BikinWeb × Litera Protocol (Kasus Nyata & Subdomain Gate)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan integrasi end-to-end kasus nyata BikinWeb × Litera Protocol:
1. Modal Wajib Subdomain Identitas (Hard Gate Onboarding) saat pengguna membuka `/builder` dengan tombol aksi 1 kata: **"Konfirmasi"** (user tidak dapat melewati langkah ini).
2. Peletakan Secret Key resmi server-side `process.env.LITERA_API_KEY` (Bearer Token) pada S2S actions di `src/app/actions/tenant.ts` dan `src/lib/litera.ts` dengan penanganan error otentikasi nyata (tanpa secret key yang valid, panggilan API ditolak).
3. Penghapusan total emoticon pada antarmuka Web Builder agar bersih, elegan, dan profesional.
4. Formulir lengkap Litera NFT Publishing (Collection, Creator Wallet, Unlockable Module Link, Kuis Refleksi Proof of Reading, dan Ringkasan Tokenomics Platform bawaan 0 LITE / 100 supply).

**Tech Stack:** Next.js 16 (Server Actions), React 19, Tailwind CSS v4, Litera S2S REST API (`/cms/domains/register`, `/cms/collections`, `/cms/articles/register`).

---

### Task 1: Update Server Action S2S & Litera Client untuk Real Case API Key Enforcement & Tokenomics
- Menambahkan parameter `quiz`, `unlockableUrl`, `maxMint`, `priceLite` pada `publishTenantArticle` di `src/app/actions/tenant.ts`.
- Memastikan `literaClient.registerArticle` mengirimkan seluruh payload lengkap ke endpoint Litera API `https://literaa.xyz/api/v1/cms/articles/register`.
- Menolak eksekusi registrasi dengan notifikasi error eksplisit jika `LITERA_API_KEY` tidak terpasang di server environment.

### Task 2: Implementasi Mandatory Subdomain Identity Modal & Penghapusan Emoticon di `WebBuilderClient.tsx`
- Menampilkan Onboarding Modal di awal yang memblokir interaksi editor hingga username subdomain diisi dan tombol **"Konfirmasi"** ditekan.
- Menghapus seluruh emoticon dari tombol, tab, badge, dan kartu template.
- Mengintegrasikan form Litera NFT Publishing lengkap:
  - Dropdown Koleksi + Input Koleksi Baru on-the-fly.
  - Tautan Materi Khusus (Unlockable Link).
  - Kuis Refleksi Pembaca (Proof of Reading).
  - Parameter Tokenomics Standar Platform (0 LITE / 100 supply) dan accordion kustom.
- Sinkronisasi instan ke Live Mockup Canvas di sebelah kanan.

### Task 3: Quality Gate, Visual Testing, & Commit
- Menjalankan `npm run lint`, `npx tsc --noEmit`, dan `npm run build`.
- Melakukan verifikasi interaksi modal dan switch via headless Playwright.
- Konfirmasi push git ke branch target sesuai panduan workspace.
