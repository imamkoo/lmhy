# Handoff QA — Mitra Intake & Antrean Verifikasi Admin (SP-1)

Dokumen ini berisi pesan **siap-salin** untuk meneruskan pengujian ke tim QA / tester.

> ⚠️ **Dokumen ini ada di dalam repo (git-tracked).** Jangan pernah menuliskan password atau token apa pun di dalamnya. Semua kredensial di bawah hanya disebut **lokasinya** di komputer owner.

---

## 📋 Versi 1 — Chat (WhatsApp / Slack / Telegram)

Salin blok ini apa adanya:

---

> **Permintaan QA — Jalur Pengajuan Mitra & Antrean Verifikasi Admin (LMHY)**
>
> Halo tim, kami butuh bantuan menguji fitur baru di Let Me Hear You: alur pendaftaran mitra (psikolog & pendamping sebaya) plus dashboard verifikasi admin. Kode sudah live di **Fase 2 (shadow mode)** — artinya formnya bisa diisi, tapi approve/reject masih dimatikan, jadi **aman dan tidak ada data yang berubah**.
>
> **🌐 URL**
> - Pendaftaran psikolog → https://www.letmehearyou.id/mitra/psikolog
> - Pendaftaran pendamping → https://www.letmehearyou.id/mitra/pendamping
> - Halaman mitra → https://www.letmehearyou.id/mitra
> - Area akun saya → https://www.letmehearyou.id/akun
> - Dashboard admin → https://www.letmehearyou.id/admin
> - Antrean verifikasi → https://www.letmehearyou.id/admin/verifikasi
>
> **🔑 Akun (pakai email yang ada di daftar putih, jangan email lain)**
> - Pelamar pendamping → `qa.pendamping.pending@gmail.com`
> - Klien biasa → `qa.klien.01@gmail.com`
> - Admin → `admin@letmehearyou.id`
> - Pelamar psikolog → **akun kosong baru** (misal `qa.praktisi.99@gmail.com`) — akan dikirim terpisah ke owner untuk dimasukkan ke whitelist. Akun `qa.praktisi.01` sudah terdaftar, jadi tidak bisa dipakai untuk uji form guest.
> - Password semua akun di atas: **diteruskan terpisah** (tidak di pesan ini, demi keamanan)
>
> **✅ Yang perlu dicek (10 menit, bisa di HP)**
> 1. Buka `/mitra` → harus muncul 2 kartu: **Pendamping Sebaya** & **Psikolog Klinis**
> 2. Buka `/mitra/psikolog` → form 3 langkah harus muncul (kolom nama, email, WhatsApp, username)
> 3. Ketik username yang **sudah dipakai** → harus muncul pesan "username sudah dipakai"
> 4. Lanjut ke langkah 2 → isi **motivasi minimal 200 karakter**. Coba kurang dari 200 → harus ditolak
> 5. Lanjut ke langkah 3 → harus ada **komitmen etika** + tombol kirim yang **ter-countdown 5 detik**
> 6. Kirim pengajuan → harus muncul halaman "cek email untuk verifikasi"
> 7. Login sebagai **klien biasa** → buka `/akun` → tab **Pengajuan** → lihat timeline status
> 8. Login sebagai **admin** → buka `/admin` → harus muncul kartu metrik + grafik "Distribusi Status Verifikasi"
> 9. Buka `/admin/verifikasi` → pengajuan tadi harus **muncul di antrean**. Klik barisnya → panel detail kanan harus terisi. Coba klik **"Setujui Mitra"** → **harus muncul pesan "Shadow mode aktif: keputusan dinonaktifkan"** (ini yang kami pastikan benar)
> 10. Cek juga di HP (375px) — tidak boleh ada yang meluber keluar layar
>
> **📌 Penting**
> - Gunakan **email QA di atas saja**. Email lain akan ditolak dengan pesan "Pendaftaran saat ini terbatas…"
> - Jangan pakai data pribadi asli. Data uji/fiktif saja.
> - Untuk file STR, pakai **PDF dummy** (1–2 halaman, ada tulisan clearly fake, misal "DOKUMEN UJI COBA — BUKAN STR ASLI").Ukuran < 5 MB.
> - **Jangan** isi data yang tidak ada artinya.
>
> **📝 Laporkan hasil**
> Balas pesan ini dengan format: nomor skenario → **LULUS / GAGAL** → catatan singkat (kalau GAGAL, sertakan screenshot + langkah yang dilakukan). Skenario 1–10 di atas = skenario 1,2,3,4,7,8,11,13,18 di dokumen QA.
>
> Kalau ada yang error, langsung balas ya. Terima kasih! 🙏

---

## 📧 Versi 2 — Email (lebih formal)

> **Subject:** Permintaan Uji Manual — Jalur Pengajuan Mitra & Antrean Verifikasi Admin (LMHY)
>
> Halo Tim QA,
>
> Kami baru saja menyelesaikan membangun fitur **Jalur Pengajuan Mitra & Antrean Verifikasi Admin** di platform Let Me Hear You, dan sekarang berada pada **Fase 2 dari 5 fase rollout (shadow mode)**. Mohon bantu menjalankan pengujian manual.
>
> **Latar belakang singkat**
> Fitur ini menambah jalur pendaftaran mitra: psikolog (form 3 langkah, guest-first — akun dibuat saat submit) dan pendamping sebaya (form 2 langkah, untuk member yang sudah punya akun). Semua pengajuan masuk ke antrean verifikasi `/admin/verifikasi` untuk ditinjau admin sebelum role dan hak akses diberikan.
>
> Pada fase ini, **formulir sudah terbuka** tetapi **keputusan approve/reject sengaja dimatikan** (shadow mode). Tujuannya: memastikan alur pengajuan, validasi, dan tampilan sudah benar **sebelum** membuka pendaftaran ke publik. Tidak ada data pengguna nyata yang berubah, dan pengajuan yang terkirim tidak akan memberikan role apa pun.
>
> **1. URL yang perlu diuji**
> | Keterangan | URL |
> |---|---|
> | Halaman mitra (hub) | https://www.letmehearyou.id/mitra |
> | Form psikolog (3 langkah) | https://www.letmehearyou.id/mitra/psikolog |
> | Form pendamping (2 langkah) | https://www.letmehearyou.id/mitra/pendamping |
> | Area akun | https://www.letmehearyou.id/akun |
> | Dashboard admin | https://www.letmehearyou.id/admin |
> | Antrean verifikasi | https://www.letmehearyou.id/admin/verifikasi |
>
> **2. Akun pengujian**
> | Peran | Email | Keterangan |
> |---|---|---|
> | Pelamar psikolog | `qa.praktisi.01@gmail.com` | Guest, akun dibuat saat submit |
> | Pelamar pendamping | `qa.pendamping.pending@gmail.com` | Sudah login sebagai role Penulis |
> | Klien biasa | `qa.klien.01@gmail.com` | Untuk uji guard admin |
> | Admin | `admin@letmehearyou.id` | Akses `/admin` |
>
> Password untuk seluruh akun di atas akan dikirim **terpisah** (di kanal terpisah, misal DM pribadi) — tidak disertakan di email ini, supaya tidak ikut ter-forward.
>
> **3. Daftar skenario (versi ringkas)**
> Rincian 26 skenario ada di `docs/qa/mitra-intake-admin-qa.md`. Fokus awal (10 skenario, ±15 menit):
>
> | # | Skenario | Yang diharapkan |
> |---|---|---|
> | 1 | Buka `/mitra` sebagai tamu | 2 kartu: Pendamping Sebaya & Psikolog Klinis |
> | 2 | Form psikolog langkah 1 | Cek username live; format tervalidasi |
> | 3 | Form psikolog langkah 2 | Motivasi <200 karakter ditolak, ≥200 lolos |
> | 4 | Form psikolog langkah 3 | Komitmen etika + countdown 5 detik |
> | 7 | Selesai submit | Halaman "cek email untuk verifikasi" |
> | 8 | `/mitra/pendamping` sebagai tamu | Diarahkan ke login/daftar |
> | 11 | `/akun` tab Pengajuan | Timeline status + tanggal |
> | 13 | `/admin` | 5 kartu metrik, grafik distribusi status, feed audit |
> | 14 | Filter antrean | Filter jalur & status bekerja |
> | 18 | Approve di shadow mode | Pesan "Shadow mode aktif: keputusan dinonaktifkan" |
>
> Skenario sisanya (6, 9, 10, 12, 15–17, 19–21) bisa menyusul — silakan kabari kalau mau semuanya dikerjakan sekalian.
>
> **4. Aturan pengujian**
> - **Hanya email di tabel atas** yang diizinkan. Email lain otomatis ditolak (whitelist) — itu perilaku yang diharapkan, bukan bug.
> - **Jangan gunakan data pribadi asli.** Untuk berkas STR/lisensi, pakai **PDF dummy** bertuliskan jelas "DOKUMEN UJI COBA — BUKAN DOKUMEN ASLI", maksimal 5 MB.
> - Mohon jangan mencoba approve/reject di luar shadow mode, dan jangan mengubah environment variable.
>
> **5. Pelaporan**
> Mohon isi kolom **Status** di `docs/qa/mitra-intake-admin-qa.md` (ubah `⏳ TODO` → `✅ PASS` / `❌ FAIL` + catatan), atau balas email ini dengan daftar: nomor skenario → LULUS/GAGAL → catatan. Untuk GAGAL mohon sertakan screenshot.
>
> **6. Timeline**
>|_Target|_Fase_|Keterangan_|
> |---|---|---|
> | 1 minggu | Shadow mode (fase ini) | Validasi alur & bug form |
> | +1 minggu | Fase 4 | Jalur psikolog dibuka publik bertahap |
> | +1 minggu | Fase 5 | Semua jalur dibuka, whitelist dihapus |
>
> Jika ada temuan yang terasa kritis (misal kebocoran data atau akses tanpa otorisasi), mohon langsung hubungi saya dan **jangan** lanjutkan skenario lain sampai ada instruksi.
>
> Terima kasih,
> [Nama Anda]
> [Kontak]

---

## 🔐 Di mana kredensialnya (untuk owner, BUKAN untuk dikirim di pesan)

| Kredensial | Lokasi di komputer owner | Cara dibaca |
|---|---|---|
| Password admin | `~/.config/lmhy-admin-password` | `cat ~/.config/lmhy-admin-password` |
| Password 3 akun QA | `~/.config/lmhy-qa-accounts.txt` | `cat ~/.config/lmhy-qa-accounts.txt` |
| Token Supabase (PAT) | `~/.config/lmhy-supabase-pat` | `cat ~/.config/lmhy-supabase-pat` |
| Token Vercel | `~/.config/lmhy-vercel-token` | `cat ~/.config/lmhy-vercel-token` |

> **Selalu kirim kredensial lewat kanal terpisah** (DM, pesan pribadi, atau password manager), **jangan** di dalam email/chat grup yang akan di-forward.

### ⚠️ Peran akun QA (sudah ter-set, jangan diubah tester)

| Akun | `creator_role` | `verification_status` | Untuk menguji |
|---|---|---|---|
| `qa.praktisi.01@gmail.com` | `PRAKTISI` | `APPROVED` | Alur **psikolog** — akun sudah pernah terverifikasi, jadi **jangan** pakai ini untuk uji form guest (email sudah terdaftar → submit ditolak). |
| `qa.pendamping.pending@gmail.com` | `PENDAMPING` | `PENDING` | Alur **pendamping** (member) — form in-app akan memprefill data yang read-only. |
| `qa.klien.01@gmail.com` | `PENULIS` | `NONE` | Guard admin (Skenario 12) & area akun. |

> **Untuk uji form psikolog sebagai tamu**, pakai akun **kosong** yang baru dibuat tester (misal `qa.praktisi.99@gmail.com`) dan minta owner menambahkan email itu ke whitelist lebih dulu. Form psikolog bersifat *guest-first*: akun baru dibuat saat submit, dan emailnya **wajib diverifikasi** sebelum bisa disetujui admin.

### 📬 Status email (supaya tester tidak salah lapor)

| Jenis email | Status | Sumber |
|---|---|---|
| Konfirmasi pendaftaran (Supabase Auth) | ✅ **Sudah bisa terkirim** | Supabase sudah dikonfigurasi pakai Resend SMTP (`smtp.resend.com`) |
| Reset password Supabase | ✅ Bisa | Supabase Auth (Resend SMTP) |
| Notifikasi approve/reject dari aplikasi | ⚠️ **Belum terkirim** | Provider email aplikasi (`RESEND_API_KEY`) belum terpasang — email dilewati diam-diam, pengajuan tetap masuk antrean. **Ini bukan bug.** |

---

## 📌 Catatan Fase 2 untuk Tester (tempel di akhir pesan kalau perlu)

Karena shadow mode aktif:

- Pengajuan **berhasil** masuk antrean → itu **berhasil**, bukan gagal
- Tombol **"Setujui Mitra"** / **"Tolak Pengajuan"** akan menampilkan *"Shadow mode aktif: keputusan dinonaktifkan."* → itu **perilaku yang benar**, bukan bug
- Role pengguna **tidak** berubah ke PRAKTISI/PENDAMPING → **d_expect**
- Skenario 19 (reject → ajukan ulang) dan 20 (double approve) **belum bisa** diuji di fase ini — baru bisa saat shadow mode dimatikan
- Email notifikasi **belum** terkirim (provider email belum dikonfigurasi) → pengajuan tetap masuk antrean, hanya tidak ada email. **Bukan bug.**

---

## 🔗 Referensi

| Dokumen | Isi |
|---|---|
| `docs/qa/mitra-intake-admin-qa.md` | 26 skenario lengkap + matriks rollout Fase 0–5 |
| `docs/qa/mitra-admin-sop.md` | SOP review admin, kapan approve vs reject |
| `docs/qa/mitra-intake-rollout-runbook.md` | Runbook rollout 8 langkah |
| `docs/qa/mitra-intake-rollback.md` | Prosedur rollback darurat |
