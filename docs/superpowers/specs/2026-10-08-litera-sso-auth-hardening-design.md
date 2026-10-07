# Spesifikasi Desain: Litera SSO Terpadu, Hardening Otentikasi Web3 & PWA Mobile-Only

## Status
- **Tanggal:** 2026-10-08
- **Status:** Menunggu Persetujuan
- **Terkait:** `src/components/litera/LiteraLoginModal.tsx`, `src/app/builder/WebBuilderClient.tsx`, `src/components/pwa/InstallAppBanner.tsx`

---

## 1. Latar Belakang & Masalah
1. **Login Litera Web3 di Mobile:** Dialog lama memisahkan opsi MetaMask lokal yang gagal di HP karena browser sistem tidak memiliki ekstensi terinjeksi.
2. **Copywriting & Emotikon:** Teks modal koneksi mengandung emotikon (`💎`, `⚠️`, `🌐`, `🦊`, `🛡️`) yang kurang profesional.
3. **PWA Install Banner di Desktop:** Komponen `InstallAppBanner` merespons event `beforeinstallprompt` Chromium desktop, menyebabkan banner ajakan install muncul pada layar desktop/laptop.

---

## 2. Sasaran & Desain Solusi

### A. Litera SSO Terpadu (Single Sign-On)
1. **Satu Alur Otentikasi Resmi:** Mengarahkan proses koneksi akun/dompet (Rabby, MetaMask, WalletConnect, Google/Email via Privy) ke portal resmi Litera `https://literaa.xyz/widget-auth`.
2. **Dual-Transport Adaptif:**
   - **Desktop:** Membuka jendela popup sembulan `window.open` dengan komunikasi aman via `postMessage`.
   - **Mobile / Fallback:** Langsung melakukan *full-page redirect* (`window.location.href`) untuk mencegah popup blocker di HP dan mendukung deep-link dompet secara mulus.
3. **Pembersihan Emotikon:** Seluruh emotikon dihapus dan diganti dengan ikon SVG minimalis atau badge teks bergaya *Warm Sanctuary*.

### B. Security Hardening pada Callback Otentikasi
1. **Anti-CSRF Nonce (`lite_state`):** Dibuat acak (`crypto.randomUUID()`) dan disimpan di `sessionStorage` sebelum redirect/popup. Dicocokkan secara wajib saat data diterima kembali.
2. **Validasi Format Alamat EVM:** Memverifikasi bahwa alamat dompet sesuai format `^0x[a-fA-F0-9]{40}$`.
3. **Sanitasi URL Address Bar:** Menggunakan `window.history.replaceState` untuk segera membersihkan parameter `lite_addr` dan `lite_state` dari address bar setelah diverifikasi.
4. **Validasi Origin `postMessage`:** Hanya menerima pesan dari origin resmi `https://literaa.xyz` (dan `localhost` pada mode pengembangan).

### C. PWA Install Banner Khusus Mobile
1. **Mobile-Only Guard:** Menambahkan verifikasi perangkat seluler (`/android|iphone|ipad|ipod|mobile/i.test(ua)` atau media query `(max-width: 768px)`) di `InstallAppBanner.tsx`.
2. **Desktop Suppression:** Jika dibuka di peramban Desktop (Chrome/Edge/Brave/Safari desktop), event `beforeinstallprompt` diabaikan dan banner tidak pernah dirender.

---

## 3. Rencana Pengujian
1. **Lint & Type Check:** `npm run lint` dan `npx tsc --noEmit` lolos 0 error.
2. **Build Test:** `npm run build` sukses.
3. **Pengujian Fungsional:**
   - Di Desktop: PWA banner tidak muncul; tombol SSO Litera membuka popup.
   - Di Mobile: PWA banner hanya muncul di mobile; tombol SSO Litera melakukan redirect mulus.
   - Keamanan: Nonce mismatch atau format alamat salah berhasil ditolak.
