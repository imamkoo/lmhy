# Manual QA Checklist: Mitra Intake & Admin Verification Queue (SP-1)

Panduan pengujian manual dan matriks verifikasi fitur pendaftaran mitra publik, peningkatan role member in-app, area akun, antrean verifikasi admin, dan retensi dokumen.

---

## 1. Lingkungan & Akun Pengujian

| Peran Akun | Email QA | Kredensial / Catatan |
|---|---|---|
| **Admin Penguji** | lihat `~/.config/lmhy-qa-accounts.txt` | `app_metadata.is_admin = true` |
| **Pelamar Klinis (Guest)** | `qa.praktisi.01@gmail.com` | Pendaftaran via `/mitra/psikolog` |
| **Pelamar Sebaya (Member)** | `qa.pendamping.pending@gmail.com` | Login sebagai `PENULIS` via `/mitra/pendamping` |
| **Klien Reguler** | `qa.klien.01@gmail.com` | User umum tanpa izin mitra |

---

## 2. Matriks Pengujian Skenario (24 Skenario)

> **Status awal semua skenario: `⏳ TODO`.** Skenario ini disusun dari spesifikasi, **belum dieksekusi manual** — belum ada tester yang menjalankan alurnya di environment produksi. Ganti `⏳ TODO` dengan `✅ PASS` / `❌ FAIL` + catatan hanya setelah benar-benar dijalankan.
> Prasyarat: migrasi DB sudah diterapkan, env Vercel terisi, akun admin sudah di-bootstrap, dan rollout flagminimal Fase 2 (lihat `docs/qa/mitra-intake-rollout-runbook.md`).

| No | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Status |
|:--:|---|---|---|:--:|
| **1** | Hub mitra menampilkan 2 opsi track | Akses `/mitra` dalam keadaan logged out | Menampilkan kartu Pendamping Sebaya dan Praktisi Klinis | ⏳ TODO |
| **2** | Guest form psikolog langkah 1 | Isi identitas & username valid di `/mitra/psikolog` | Username availability dicek live, validasi format aman | ⏳ TODO |
| **3** | Guest form psikolog langkah 2 | Pilih modalitas, nomor STR, tahun kelulusan, dan motivasi | Motivasi <200 karakter diblokir; ≥200 karakter lolos | ⏳ TODO |
| **4** | Guest form psikolog langkah 3 | Setujui komitmen etika, tunggu timer 5 detik | Countdown aktif; tombol "Kirim Pengajuan" aktif setelah 5 dtk | ⏳ TODO |
| **5** | Honeypot anti-bot form psikolog | Kirim form dengan field honeypot terisi string | Pengajuan ditolak dengan kode validasi spam | ⏳ TODO |
| **6** | Unggah berkas kredensial via token | Unggah file PDF STR pada form | File terunggah ke bucket privat dengan signed URL aman | ⏳ TODO |
| **7** | Halaman status guest & pengingat email | Selesaikan form psikolog | Halaman `/mitra/status` tampil dengan pesan cek email konfirmasi | ⏳ TODO |
| **7b** | Verifikasi email dari tautan | Buka tautan "Verifikasi Email Saya" di inbox pelamar | Masuk otomatis ke `/akun?tab=pengajuan`; `email_verified_at` terisi; tautan tidak bisa dipakai dua kali | ⏳ TODO |
| **8** | Akses in-app upgrade Sebaya oleh tamu | Tamu (logged out) akses `/mitra/pendamping` | Diarahkan ke form pendaftaran/login | ⏳ TODO |
| **9** | In-app upgrade Sebaya oleh Penulis | Login akun Penulis, akses `/mitra/pendamping` | Field identitas prefilled read-only, checklist WA & PFA tampil | ⏳ TODO |
| **10** | Banner ajakan di profil penulis | Login Penulis, buka profil akun sendiri | Tampil banner ajakan mitra menuju `/mitra/pendamping` | ⏳ TODO |
| **11** | Timeline pengajuan di `/akun` | Login pelamar, buka `/akun` tab Pengajuan | Timeline menampilkan status PENDING, tanggal, dan riwayat | ⏳ TODO |
| **12** | Guard akses admin di middleware | User biasa / tamu akses `/admin` atau `/admin/verifikasi` | Di-redirect ke root `/` (tidak ada akses tanpa `is_admin`) | ⏳ TODO |
| **13** | Tampilan metrik Ringkasan admin | Login admin, buka `/admin` | Tampil 5 kartu metrik, bar distribusi status, dan 10 audit log | ⏳ TODO |
| **14** | Filter antrean admin | Buka `/admin/verifikasi`, ubah filter jalur & status | Antrean terfilter secara instan sesuai parameter URL | ⏳ TODO |
| **15** | Deteksi Red Flags di baris antrean | Pengajuan tanpa email / STR tidak aktif | Muncul chip red flag `EMAIL BELUM TERVERIFIKASI` / `STR TIDAK AKTIF` | ⏳ TODO |
| **16** | Buka dokumen kredensial berizin | Klik tombol "Lihat" dokumen di detail verifikasi | Dokumen terbuka via signed URL 60s; audit `DOCUMENT_VIEWED` tercatat | ⏳ TODO |
| **17** | Update checklist admin interaktif | Toggle centang WA dan ubah status PFA | Checklist tersimpan di DB dan tercatat di audit log | ⏳ TODO |
| **18** | Persetujuan pengajuan mitra | Klik "Setujui Mitra" dengan checklist lengkap | Status pengajuan jadi `APPROVED`, profile role naik ke `PRAKTISI` / `PENDAMPING` | ⏳ TODO |
| **18b** | Approve ditolak bila email belum terverifikasi | Approve pengajuan yang `email_verified_at` masih null | Tombol approve gagal dengan alasan "Alamat email belum terverifikasi." | ⏳ TODO |
| **19** | Penolakan pengajuan & ajukan ulang | Admin tolak dengan catatan; pelamar buka `/akun` | Status jadi `REJECTED`, tombol "Perbaiki & Ajukan Ulang" aktif | ⏳ TODO |
| **20** | Race-condition pencegahan double approve | 2 admin klik approve pada pengajuan yang sama | Hanya 1 yang berhasil, admin ke-2 menerima notifikasi sudah diproses | ⏳ TODO |
| **21** | Sweep kedaluwarsa & pelepasan username | Jalankan `POST /api/internal/sweep` dengan token | Pengajuan >7 hr tanpa verifikasi email jadi EXPIRED, username dilepas | ⏳ TODO |
| **22** | Backfill verifikasi dari `auth.users` | Jalankan sweep untuk pengajuan yang user-nya sudah `email_confirmed_at` terisi | `email_verified_at` terisi otomatis dari `email_confirmed_at`; pengajuan tidak jadi EXPIRED | ⏳ TODO |

---

## 3. Matriks Rollout Flag Fase 0–5

| Fase Rollout | `NEXT_PUBLIC_MITRA_INTAKE_ENABLED` | `NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED` | `NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED` | `MITRA_INTAKE_SHADOW_MODE` | Keterangan Operasional |
|---|---|---|---|---|---|
| **Fase 0 (Fondasi)** | `false` | `false` | `false` | `false` | Migrasi skema DB & penyiapan bucket dokumen privat. |
| **Fase 1 (Merge Tersembunyi)** | `false` | `false` | `false` | `false` | Kode dimerge ke branch produksi, halaman mitra belum dibuka publik. |
| **Fase 2 (Smoke Test Internal)** | `false` | `false` | `false` | `false` | Tim QA menguji alur submit dan verifikasi admin menggunakan whitelist. |
| **Fase 3 (Shadow Mode)** | `true` | `true` | `true` | `true` | Form dibuka, pengajuan masuk antrean namun aksi keputusan dimatikan sementara. |
| **Fase 4 (Peluncuran Bertahap)** | `true` | `true` | `false` | `false` | Buka jalur Psikolog terlebih dahulu, evaluasi beban verifikasi tim admin. |
| **Fase 5 (Buka Penuh)** | `true` | `true` | `true` | `false` | Semua jalur kemitraan dibuka bebas untuk publik dan komunitas. |

> Panduan eksekusi langkah demi langkah (migrasi SQL, env Vercel, bootstrap admin, cron, urutan naik fase) ada di **`docs/qa/mitra-intake-rollout-runbook.md`**.
> Pesan siap-salin untuk meneruskan pengujian ke tim QA (versi chat + versi email) ada di **`docs/qa/mitra-intake-qa-handoff.md`**.
