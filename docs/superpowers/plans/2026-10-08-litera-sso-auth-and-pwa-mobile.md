# Implementasi: Litera SSO Terpadu, Hardening Otentikasi Web3 & PWA Mobile-Only

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native execution). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti alur login Litera di LMHY menjadi SSO terpadu langsung ke `https://literaa.xyz/widget-auth`, menambahkan validasi keamanan (anti-CSRF nonce, validasi regex EVM, sanitasi history address bar, origin check), membersihkan seluruh emotikon dari UI login, serta membatasi banner instalasi PWA hanya untuk browser mobile.

**Architecture:** 
1. Di `LiteraLoginModal.tsx`, tombol login diubah menjadi satu tombol resmi SSO ke Litera. Di desktop menggunakan popup dengan `postMessage`, di mobile langsung full-page redirect ke `https://literaa.xyz/widget-auth`. Nonce disimpan di `sessionStorage`.
2. Di `WebBuilderClient.tsx`, tangkap callback redirect mobile via query param `lite_addr` dan `lite_state`, verifikasi nonce anti-CSRF dan format EVM regex, lalu bersihkan address bar dengan `history.replaceState`.
3. Di `InstallAppBanner.tsx`, tambahkan deteksi mobile agar banner instalasi PWA tidak pernah muncul di peramban Desktop Chromium.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (Warm Sanctuary tokens).

**Spec:** `docs/superpowers/specs/2026-10-08-litera-sso-auth-hardening-design.md`

## Global Constraints
- Token warna Warm Sanctuary (`#F7ABC5`, `#3F3766`, `#F5E7C6`, slate).
- Tidak boleh ada emotikon/emoji di teks atau tombol UI (gunakan typography rapi dan styling border/badge elegan).
- Wajib zero-lint-error (`npm run lint`), typecheck bersih (`npx tsc --noEmit`), dan build sukses (`npm run build`).

## Review Focus
1. **Desktop vs Mobile UX di Modal:** Di HP harus redirect mulus, di Desktop harus popup window.
2. **Anti-CSRF Protection:** State/nonce acak wajib diverifikasi saat kembali dari redirect. Jika state tidak cocok atau hilang, login ditolak.
3. **EVM Address Regex:** Alamat dompet wajib valid 40 karakter hex (`^0x[a-fA-F0-9]{40}$`).
4. **URL Cleansing:** Parameter `lite_addr` & `lite_state` wajib segera hilang dari address bar setelah diverifikasi.
5. **PWA Mobile-Only:** Desktop Chrome/Edge tidak boleh menampilkan banner ajakan install aplikasi.

---

### Task 1: PWA Mobile-Only Guard di `InstallAppBanner.tsx`

**Files:**
- Modify: `src/components/pwa/InstallAppBanner.tsx`

- [ ] **Step 1: Tambahkan pemeriksaan perangkat mobile sebelum mengaktifkan prompt**
  - Periksa apakah browser berjalan di lingkungan mobile: `const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.matchMedia("(max-width: 768px)").matches;`
  - Jika bukan perangkat mobile (`!isMobileDevice`), abaikan event `beforeinstallprompt` dan jangan tampilkan prompt iOS.
- [ ] **Step 2: Jalankan verifikasi lint dan build**
  - Run: `npm run lint`

---

### Task 2: Litera SSO Dual-Transport & Pembersihan Emotikon di `LiteraLoginModal.tsx`

**Files:**
- Modify: `src/components/litera/LiteraLoginModal.tsx`

- [ ] **Step 1: Hapus tombol lokal MetaMask dan emotikon yang tidak profesional**
  - Bersihkan emotikon `💎`, `⚠️`, `🌐`, `🦊`, `🛡️`.
  - Ganti header dengan ikon SVG atau lencana bersih khas Warm Sanctuary.
- [ ] **Step 2: Implementasikan SSO Handler dengan Dual-Transport (Popup di Desktop, Redirect di Mobile)**
  - Buat state nonce acak via `crypto.randomUUID()`.
  - Simpan nonce ke `sessionStorage.setItem('litera_sso_nonce', nonce)`.
  - Buat URL: `https://literaa.xyz/widget-auth?article=${encodeURIComponent(callbackUrl)}&state=${nonce}`.
  - Jika mobile (`window.innerWidth < 640` atau user agent mobile), jalankan `window.location.href = ssoUrl`.
  - Jika desktop, jalankan `window.open(ssoUrl, ...)` dan pasang listener `postMessage` dengan validasi origin ketat (`literaa.xyz` / `localhost`) dan pencocokan nonce `event.data.state === nonce`.
  - Validasi regex alamat EVM: `^0x[a-fA-F0-9]{40}$`.

---

### Task 3: Tangani Callback SSO Mobile di `WebBuilderClient.tsx`

**Files:**
- Modify: `src/app/builder/WebBuilderClient.tsx`

- [ ] **Step 1: Pasang pendengar parameter URL saat mount**
  - Di `useEffect`, baca parameter `lite_addr` dan `lite_state` dari `window.location.search`.
  - Ambil nonce dari `sessionStorage.getItem('litera_sso_nonce')`.
  - Jika `lite_addr` dan `lite_state` ada:
    - Verifikasi `lite_state === savedNonce`.
    - Validasi regex `^0x[a-fA-F0-9]{40}$`.
    - Jika valid: panggil `handleLoginSuccess(lite_addr, "Litera SSO")`.
    - Hapus nonce dari `sessionStorage`.
    - Bersihkan parameter dari URL: `window.history.replaceState({}, document.title, window.location.pathname)`.
    - Jika tidak valid: tampilkan error keamanan di state dan bersihkan URL.

---

### Task 4: Verifikasi Kualitas Akhir (Quality Gate) & Commit

- [ ] **Step 1: Jalankan `npm run lint`**
- [ ] **Step 2: Jalankan `npx tsc --noEmit`**
- [ ] **Step 3: Jalankan `npm run build`**
- [ ] **Step 4: Commit perubahan dengan pesan konvensional**
- [ ] **Step 5: Minta konfirmasi push branch target (`main`, `develop`, atau `cancel`)**
