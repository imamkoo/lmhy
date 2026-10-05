# QA Manual Test Plan — LMHY Creator Auth & Community Engagement

> **Target PR:** [#31](https://github.com/imamkoo/lmhy/pull/31)  
> **Branch:** `feat/creator-auth`  
> **Tanggal:** 2026-10-05  

---

## 📋 Ringkasan Prasyarat Pengujian

1. Salin credential Supabase ke `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
2. Jalankan migrasi schema di Supabase SQL Editor:
   - `supabase/migrations/20261005000000_initial_schema.sql`
3. Konfigurasi OAuth Providers (Google & Facebook) di Supabase Dashboard dengan callback:
   - `http://localhost:3000/auth/callback` (Dev)
   - `https://letmehearyou.id/auth/callback` (Prod)
4. Jalankan dev server pada port **3000**:
   ```bash
   npm run dev
   ```

---

## 1. Routing & Subdomain Middleware (`src/middleware.ts`)

| ID | Skenario | Langkah Uji | Hasil yang Diharapkan |
|---|---|---|---|
| **R-01** | Subdomain root profile | Buka `http://axaa.localhost:3000/` | Profil @axaa tampil (internal rewrite ke `/tenant/axaa`), URL browser tetap `axaa.localhost:3000` |
| **R-02** | Subdomain article | Buka `http://axaa.localhost:3000/mengenali-tanda-burnout` | Halaman artikel "Mengenali Tanda Burnout Sebelum Terlambat" |
| **R-03** | Root route di subdomain | Buka `http://axaa.localhost:3000/builder` | **Studio Canvas** tampil langsung, bukan artikel placeholder |
| **R-04** | Root routes lain di subdomain | Buka `/blog`, `/creator`, `/admin`, `/login`, `/onboarding`, `/auth` di subdomain | Mengakses route asli aplikasi tanpa di-rewrite ke `/tenant/...` |
| **R-05** | Subdomain legacy write redirect | Buka `http://axaa.localhost:3000/write` | **308 Permanent Redirect** ke `/builder?username=axaa` |
| **R-06** | Root domain tenant canonical | Buka `http://localhost:3000/tenant/axaa` | **308 Permanent Redirect** ke `http://axaa.localhost:3000/` (di prod: `https://axaa.letmehearyou.id/`) |
| **R-07** | Root domain tenant article canonical | Buka `http://localhost:3000/tenant/axaa/mengenali-tanda-burnout` | **308 Permanent Redirect** ke `http://axaa.localhost:3000/mengenali-tanda-burnout` |
| **R-08** | Root domain legacy write | Buka `http://localhost:3000/write` | **308 Permanent Redirect** ke `/builder` |
| **R-09** | Username berbahaya | Buka `http://localhost:3000/tenant/ax%3Aaa` | Tidak diarahkan ke hostname cacat; dilayani aman via safe regex guard |
| **R-10** | Assets & API Passthrough | Akses `/_next/...`, `/assets/...`, `/favicon.ico`, `/api/...` | Langsung disajikan tanpa intervensi rewrite middleware |

---

## 2. Autentikasi Kreator (`src/app/(auth)/login/page.tsx`)

| ID | Skenario | Langkah Uji | Hasil yang Diharapkan |
|---|---|---|---|
| **A-01** | Daftar Akun Email Baru | Pilih tab "Daftar Baru", isi Nama, Email, Password (≥6 karakter) → submit | Notifikasi tautan konfirmasi dikirim / otomatis redirect ke `/onboarding` |
| **A-02** | Validasi Password Pendek | Masukkan password < 6 karakter saat daftar | Pesan validasi "Kata sandi minimal 6 karakter." |
| **A-03** | Masuk Akun yang Sudah Lengkap | Pilih tab "Masuk Akun", masukkan kredensial user yang sudah memilih username | Masuk dan redirect ke halaman tujuan (`/builder` atau `nextUrl`) |
| **A-04** | Masuk Akun Belum Onboarding | Masuk menggunakan user baru yang belum memiliki profil `username` | Diarahkan otomatis ke `/onboarding` |
| **A-05** | Password Salah | Masukkan password yang salah | Banner peringatan merah dengan pesan kesalahan dari Supabase |
| **A-06** | Masuk dengan Google | Klik tombol "Lanjutkan dengan Google" | Dialihkan ke Google OAuth consent screen, lalu kembali ke `/auth/callback` → `/onboarding` / `/builder` |
| **A-07** | Masuk dengan Facebook | Klik tombol "Lanjutkan dengan Facebook" | Dialihkan ke Facebook OAuth dialog dengan izin `public_profile,email` |
| **A-08** | Pembatalan OAuth | Batalkan persetujuan di provider Google / Facebook | Dialihkan kembali ke `/login?error=...` dengan pesan informasi pembatalan |
| **A-09** | Keluar Sesi (Sign Out) | Klik tombol "Keluar" di Landing Header, Studio Web Builder, Profil, atau Onboarding | Sesi terhapus dan kembali ke tampilan anonim |

---

## 3. Gerbang Onboarding Subdomain (`src/app/(auth)/onboarding/page.tsx`)

| ID | Skenario | Langkah Uji | Hasil yang Diharapkan |
|---|---|---|---|
| **O-01** | Enforce Onboarding Gate | Login user baru tanpa username, coba buka `/builder` atau `/` | Otomatis di-redirect kembali ke `/onboarding` oleh middleware |
| **O-02** | Prefill Identitas | Login via Google dengan akun "Budi Santoso" (`budi@example.com`) | Field "Nama Tampilan" terisi otomatis "Budi Santoso", field username terisi "budi" |
| **O-03** | Live Subdomain Preview | Ketik `kreator-tenang` di kolom username | Banner preview menampilkan `https://kreator-tenang.letmehearyou.id` |
| **O-04** | Validasi Panjang Karakter | Masukkan `< 3` karakter atau `> 30` karakter | Pesan error validasi panjang karakter muncul dan tombol submit disabled |
| **O-05** | Validasi Karakter Terlarang | Masukkan huruf kapital, spasi, simbol (`@`, `!`, `_`) | Pesan error karakter subdomain muncul |
| **O-06** | Validasi Tanda Hubung | Masukkan `-kreator`, `kreator-`, atau `krea--tor` | Ditolak dengan pesan aturan penempatan tanda hubung |
| **O-07** | Reserved Subdomain Words | Masukkan `admin`, `builder`, `login`, `api`, `static`, dll. | Ditolak: "merupakan kata cadangan sistem" |
| **O-08** | Cek Ketersediaan Duplikat | Masukkan username yang sudah terdaftar (mis: `axaa`) | Debounce ~350ms menghasilkan pesan "Username ini sudah digunakan oleh kreator lain" |
| **O-09** | Konfirmasi Berhasil | Masukkan nama & username valid yang tersedia → Klik "Konfirmasi & Mulai Menulis" | Data profil tersimpan di `profiles`, redirect ke `/builder?username=<baru>` |
| **O-10** | Bypass Guard | Akses `/onboarding` saat sudah punya username | Otomatis dialihkan langsung ke `/builder?username=<miliknya>` |

---

## 4. Profil Kreator Medium-Style (`src/app/tenant/[username]/page.tsx`)

| ID | Skenario | Langkah Uji | Hasil yang Diharapkan |
|---|---|---|---|
| **P-01** | Cover Banner & Avatar Fallback | Buka profil user tanpa custom banner dan avatar | Cover gradient terracotta + pattern titik, avatar inisial nama |
| **P-02** | Verified Creator Badge | Periksa header profil | Pill badge `@username` dengan icon verified centang dan teks subdomain |
| **P-03** | Counter Statistik | Periksa counter di bawah nama | Angka jumlah Refleksi, Pengikut (Followers), dan Mengikuti (Following) akurat |
| **P-04** | Tab 1: Refleksi & Tulisan | Klik tab "Refleksi & Tulisan" | Daftar kartu artikel gaya Medium dengan tag, estimasi waktu baca, tanggal, dan badge Web3 |
| **P-05** | Tab 2: Sertifikat Litera NFT | Klik tab "Sertifikat Digital Litera NFT" | Banner Polygon Mainnet (Chain ID 137), kartu artikel dengan sertifikat Web3 terdaftar |
| **P-06** | Tab 3: Tentang Penulis | Klik tab "Tentang Penulis" | Bio lengkap, subdomain resmi, tanggal bergabung, dan tautan sosial media |
| **P-07** | Mode Tamu (Pengunjung) | Buka profil user lain saat login | Tombol "+ Ikuti" dan "Bagikan" muncul di pojok kanan banner |
| **P-08** | Mode Pemilik (Author Own) | Buka profil diri sendiri saat login | Tombol "Edit Profil", "Tulis di Web Builder", dan "Keluar" muncul |
| **P-09** | Modal Edit Profil | Klik "Edit Profil", ubah Bio, Avatar URL, Banner URL, Website, Facebook | Form tervalidasi, preview gambar muncul, simpan memperbarui data seketika |
| **P-10** | Bagikan Profil | Klik tombol "Bagikan" pada banner profil | Tautan profil tersalin ke clipboard dan tombol berubah menjadi "✓ Tersalin!" |

---

## 5. Fitur Komunitas: Follow, Komentar, & Share

| ID | Skenario | Langkah Uji | Hasil yang Diharapkan |
|---|---|---|---|
| **C-01** | Follow Tanpa Login | Klik "+ Ikuti" saat belum login | Status berubah secara optimistic lalu rollback dan memunculkan dialog ajakan login |
| **C-02** | Follow & Unfollow Kreator | Login sebagai User A, klik "+ Ikuti" pada profil User B | Tombol berubah menjadi "✓ Mengikuti", counter follower bertambah 1, tersimpan di DB |
| **C-03** | Kirim Komentar Refleksi | Buka artikel, ketik refleksi di kolom komentar → kirim | Komentar langsung muncul di daftar respon, counter resonansi bertambah |
| **C-04** | Badge Penulis Artikel | Penulis artikel mengirim komentar pada tulisannya sendiri | Komentar diberi badge terracotta khusus "Penulis" |
| **C-05** | Hapus Komentar Sendiri | Klik tombol "Hapus" pada komentar milik sendiri | Dialog konfirmasi muncul, komentar terhapus dari daftar dan database |
| **C-06** | Izin Hapus Komentar Orang Lain | Periksa komentar yang ditulis pengguna lain | Tombol "Hapus" tidak tersedia untuk komentar milik orang lain |
| **C-07** | Social Share Facebook | Klik icon Facebook di Social Share Bar artikel | Muncul pop-up window share dialog Facebook resmi |
| **C-08** | Social Share WhatsApp & X | Klik icon WhatsApp dan X | Membuka tab baru dengan format teks pesan dan tautan artikel |
| **C-09** | Salin Tautan Artikel | Klik icon Salin Tautan pada artikel | Toast "Tautan berhasil disalin ke papan klip! 📋" muncul selama 2.8 detik |

---

## 6. Studio Web Builder & Publikasi (`src/app/builder/WebBuilderClient.tsx`)

| ID | Skenario | Langkah Uji | Hasil yang Diharapkan |
|---|---|---|---|
| **B-01** | Auth Gate Studio | Buka `/builder` saat belum login | Modal "Masuk untuk Mulai Menulis" tampil tunggal tanpa tertimpa modal subdomain |
| **B-02** | Auto-lock Subdomain Kreator | Buka `/builder` setelah login | Subdomain otomatis terkunci sesuai profil akun kreator |
| **B-03** | Publikasi Standar (Web3 Non-aktif) | Matikan switch Litera Web3, isi judul & konten, klik "Terbitkan Blog" | Artikel tersimpan di DB `articles`, revalidasi path sukses |
| **B-04** | Publikasi Web3 Wajib Wallet | Aktifkan switch Litera Web3 tanpa wallet terhubung | Tombol terbitkan memunculkan instruksi keamanan dan modal koneksi Litera |
| **B-05** | Modal Selebrasi Pasca-Publikasi | Selesaikan penerbitan artikel | Modal selebrasi tampil (tidak auto-redirect paksa), menampilkan link live artikel & profil |
| **B-06** | Share Facebook Pasca-Publikasi | Klik tombol "Bagikan ke Facebook" pada modal selebrasi | Pop-up Facebook sharer terbuka dengan target URL artikel baru |
| **B-07** | Otorisasi Antar-Tenant (Security) | Coba terbitkan tulisan ke subdomain milik user lain | Ditolak oleh server action: "Akses ditolak: Anda tidak memiliki izin..." |
