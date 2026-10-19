# Manual QA — Sanctuary Studio dan Litera

Dokumen ini adalah panduan pengujian manual untuk LMHY Sanctuary Studio dan integrasi Litera.

## 📊 Status Board (diperbarui 2026-10-19)

| Section | Status | Keterangan |
|---|---|---|
| A1 — Role, verifikasi, copy sesi | ✅ PASS | Dikonfirmasi tester |
| A2 — Paket & take rate | ✅ PASS | Dikonfirmasi tester |
| A3 — Hirarki footer artikel | ✅ PASS | Dikonfirmasi tester |
| A4 — Follow tanpa login | ✅ PASS | Dikonfirmasi tester |
| A5 — Crisis Guard / Booking / Midtrans | ⛔ BLOCKED | Env Midtrans di Vercel production belum diisi (lihat Section 7) |
| A6.1 — Artikel tanpa Litera | ✅ PASS | Dikonfirmasi tester |
| A6.2 — Unlockable URL | ✅ PASS | Dikonfirmasi tester |
| A6.3 — Proof of Reading | ✅ PASS | Tester 2026-10-18 |
| A6.3.1 — Regresi quiz gate | ✅ PASS | Fix deployed + retest 7 langkah lulus (tester 2026-10-19) |
| A6.4 — Domain-Scoped Sponsor & CTA | 🧪 IN PROGRESS | Sedang diuji tester (mulai 2026-10-19) |
| B0 — Multi-Tenant Builder & Master Key | ⏳ PENDING | Belum PASS — menunggu pengujian |
| B1 — Writer V2 | ⏳ PENDING | Belum PASS — menunggu pengujian |
| B2 — CMS Auto-Mint | ⏳ PENDING | Belum PASS — menunggu pengujian |
| B3 — LMHY ↔ Litera | ⏳ PENDING | Belum PASS — menunggu pengujian |

## 1. Cakupan dan status fitur

### Dicakup

- Role dan status verifikasi creator.
- Pembuatan slot sesi.
- Copy Pendamping dan Praktisi.
- Paket subscription dan take rate platform.
- Hirarki footer artikel.
- Follow tanpa login.
- Crisis Guard.
- Booking dan alur Midtrans.
- Litera Widget, unlockable URL, instant unlock cache, dan Proof of Reading.
- Domain-Scoped Sponsor & CTA Link Manager (Web Integration).
- **[URGENT] Multi-Tenant Web Builder & Platform Master Key (PANDI/kubaca.id)**: Whitelist partner platform, Master API Key wildcard `*`, pendaftaran multi-domain/artikel lintas subdomain, penegakan Double-Gate security guard, dan layout baru `/ownertools`.
- Writer V2 dan CMS Auto-Mint Litera.

### Tidak dicakup

`Cek Kondisi Mental` / `/mental-battery` belum menjadi bagian dari artikel dan masih ditunda. Route tersebut tidak perlu dianggap sebagai bug dalam QA ini.

## 2. Environment pengujian

Gunakan URL produksi yang valid berikut:

| Kebutuhan | URL |
|---|---|
| Website LMHY | `https://www.letmehearyou.id` |
| URL alternatif Vercel | `https://lmhy-zeta.vercel.app` |
| Profil tenant | `https://www.letmehearyou.id/tenant/<username>` |
| Artikel tenant | `https://www.letmehearyou.id/tenant/<username>/<slug>` |
| Login/daftar | `https://www.letmehearyou.id/login` |
| Builder | `https://www.letmehearyou.id/builder` |
| Supabase | Project **Let Me Hear You** → SQL Editor/Table Editor |
| Litera admin | Route `/ownertools` pada aplikasi Litera |

> Jangan gunakan `axaalexxa.letmehearyou.id` sebagai URL utama QA. Wildcard `*.letmehearyou.id` masih invalid pada paket Vercel Hobby. Gunakan URL berbasis path `/tenant/<username>`.

## 3. Akun pengujian

Akun utama untuk tes kali ini adalah:

```text
imammm.kooo@gmail.com
```

Gunakan akun ini untuk A1.1 dan A1.2. Untuk pengujian role berbeda, akun yang sama dapat diubah melalui Supabase, tetapi logout-login ulang setelah setiap perubahan role. Cara yang lebih aman adalah memakai akun terpisah.

| Fungsi | Email | State awal/yang dibutuhkan |
|---|---|---|
| Akun utama Penulis | `imammm.kooo@gmail.com` | `PENULIS`, `NONE`, `NULL` |
| Pendamping | akun QA lain | `PENDAMPING`, `PENDING` atau `APPROVED`, `SEBAYA` |
| Praktisi | akun QA lain | `PRAKTISI`, `APPROVED`, `KLINIS` |
| Klien | akun QA lain | akun terautentikasi biasa |
| Admin | akun admin yang berwenang | Akses Supabase dan Litera |

> Jangan mengubah role akun produksi utama tanpa mencatat nilai awalnya. Setelah tes selesai, kembalikan role/state akun tersebut jika diperlukan.

## 4. Prasyarat database

Di Supabase → **SQL Editor**, jalankan query berikut.

### 4.1 Cek kolom role

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'creator_role',
    'service_track',
    'verification_status',
    'pro_until'
  );
```

Expected:

- `creator_role` memiliki default `PENULIS`.
- `verification_status` memiliki default `NONE`.
- `service_track` boleh `NULL`.
- `pro_until` boleh `NULL`.

### 4.2 Cek tabel Sanctuary Studio

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'creator_subscriptions',
    'listening_slots',
    'session_bookings',
    'guided_prompts'
  )
ORDER BY table_name;
```

Expected: muncul empat tabel.

Jika prasyarat gagal, tandai pengujian terkait sebagai **BLOCKED**, bukan FAIL aplikasi, sampai migration production diterapkan.

# A. QA LET ME HEAR YOU

## A1. Role, verifikasi, dan copy sesi

### A1.1 — Akun baru menjadi PENULIS

**Tujuan:** memastikan user baru tidak otomatis menjadi provider.

#### Langkah browser

1. Buka `/login`.
2. Pilih **Daftar Baru**.
3. Daftar menggunakan `imammm.kooo@gmail.com` jika email tersebut belum terdaftar.
4. Selesaikan onboarding.
5. Catat username yang dibuat.

#### Verifikasi SQL

```sql
SELECT
  id,
  username,
  creator_role,
  verification_status,
  service_track
FROM public.profiles
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'imammm.kooo@gmail.com'
);
```

#### Expected

| Kolom | Nilai |
|---|---|
| `creator_role` | `PENULIS` |
| `verification_status` | `NONE` |
| `service_track` | `NULL`/kosong |

**PASS:** satu baris muncul dan nilainya tepat.

**FAIL:** profile tidak ada, role bukan `PENULIS`, status bukan `NONE`, atau `service_track` terisi.

### A1.2 — PENULIS tidak dapat membuat slot

1. Login sebagai `imammm.kooo@gmail.com`.
2. Buka `/builder`.
3. Cari `Jadwal Sesi`, `Buat Slot`, atau `Tambah Jadwal`.
4. Jika ada form, coba isi tanggal besok, durasi 30 menit, dan harga Rp50.000.
5. Klik simpan.

#### Expected

- Tab/jadwal tidak tersedia, atau
- form disabled, atau
- muncul pesan setara:

```text
Hanya pendamping atau praktisi terverifikasi yang dapat membuat jadwal sesi.
```

Verifikasi bahwa tidak ada slot tersimpan:

```sql
SELECT id, start_time, duration_min, price_idr, status
FROM public.listening_slots
WHERE provider_id = (
  SELECT id FROM auth.users WHERE email = 'imammm.kooo@gmail.com'
)
ORDER BY created_at DESC;
```

**PASS:** tidak ada slot baru.

**FAIL:** user `PENULIS` berhasil menyimpan slot.

### A1.3 — PENDAMPING PENDING ditolak

Gunakan akun Pendamping yang terpisah jika tersedia. Untuk mengubah akun utama, jalankan:

```sql
UPDATE public.profiles
SET creator_role = 'PENDAMPING',
    verification_status = 'PENDING',
    service_track = 'SEBAYA'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'imammm.kooo@gmail.com'
);
```

Verifikasi:

```sql
SELECT username, creator_role, verification_status, service_track
FROM public.profiles
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'imammm.kooo@gmail.com'
);
```

Expected: `PENDAMPING`, `PENDING`, `SEBAYA`.

Lalu:

1. Logout dan login ulang.
2. Buka `/builder`.
3. Coba buat slot besok, 30 menit, Rp50.000.

Expected: aplikasi menolak penyimpanan dengan pesan verifikasi provider. Tidak ada record baru pada `listening_slots`.

**PASS:** ditolak dan database tidak berubah.

### A1.4 — PENDAMPING APPROVED dapat membuat slot

```sql
UPDATE public.profiles
SET creator_role = 'PENDAMPING',
    verification_status = 'APPROVED',
    service_track = 'SEBAYA',
    verified_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'imammm.kooo@gmail.com'
);
```

1. Logout-login ulang.
2. Buka `/builder`.
3. Buat slot:
   - waktu: besok, belum lewat;
   - durasi: `30` menit;
   - harga: `50000`.
4. Simpan.

Verifikasi:

```sql
SELECT ls.id, ls.start_time, ls.duration_min, ls.price_idr, ls.status,
       p.username, p.creator_role, p.verification_status, p.service_track
FROM public.listening_slots ls
JOIN public.profiles p ON p.id = ls.provider_id
WHERE p.id = (
  SELECT id FROM auth.users WHERE email = 'imammm.kooo@gmail.com'
)
ORDER BY ls.created_at DESC;
```

Expected: `duration_min=30`, `price_idr=50000`, `status=AVAILABLE`, role `PENDAMPING`, status `APPROVED`, track `SEBAYA`.

### A1.5 — PRAKTISI APPROVED menggunakan Sesi Konseling

Dengan akun Praktisi terpisah:

```sql
UPDATE public.profiles
SET creator_role = 'PRAKTISI',
    verification_status = 'APPROVED',
    service_track = 'KLINIS',
    verified_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = '<email-praktisi>'
);
```

1. Login sebagai Praktisi.
2. Buat satu slot.
3. Buka `/tenant/<username-praktisi>`.

Expected:

- label setara `Sesi Konseling bersama @<username>`;
- badge setara `Praktisi Terverifikasi`.

**FAIL** jika provider Praktisi tampil sebagai `Sesi Dengar` atau tidak dapat membuat slot.

### A1.6 — PENDAMPING tidak boleh mendapat copy konseling

1. Buka `/tenant/<username-pendamping>`.
2. Buka satu artikel Pendamping `/tenant/<username-pendamping>/<slug>`.
3. Periksa badge, DoorwayCard, SessionTabs, CTA, dan detail booking.

Expected:

- `Pendamping Sebaya Terverifikasi`;
- `Sesi Dengar`;
- tidak ada kata `konseling` pada halaman Pendamping.

**PASS:** tidak ada copy klinis.

## A2. Paket dan take rate

### A2.1 — Paket

| Paket | Bulanan | Tahunan |
|---|---:|---:|
| `SAPA` | Rp0 | Rp0 |
| `CERITA` | Rp39.000 | Rp390.000 |
| `DENGAR` | Rp99.000 | Rp990.000 |

Pastikan UI/database tidak lagi memakai nama paket lama `FREE` atau `PRO`.

```sql
SELECT provider_id, tier, status, current_period_end
FROM public.creator_subscriptions
ORDER BY created_at DESC;
```

### A2.2 — Flat take rate 10%

`1000` basis points = `10%`.

Contoh:

| Harga | Take platform |
|---:|---:|
| Rp50.000 | Rp5.000 |
| Rp100.000 | Rp10.000 |
| Rp250.000 | Rp25.000 |

```sql
SELECT id, amount_idr, take_rate_bps,
       ROUND((amount_idr * take_rate_bps / 10000.0), 0) AS platform_take_idr,
       status
FROM public.session_bookings
ORDER BY created_at DESC;
```

**PASS:** semua booking baru memiliki `take_rate_bps=1000`, tanpa membedakan role atau tier.

## A3. Urutan footer artikel

Pada `/tenant/<username>/<slug>`, scroll dari akhir konten sampai bawah.

Urutan wajib:

1. Konten artikel.
2. `DoorwayCard`.
3. `SocialShareBar`.
4. `LiteraWidget` jika artikel menggunakan Litera.
5. Comments.

`Cek Kondisi Mental` tidak boleh muncul di footer artikel.

**PASS:** urutan tepat dan tidak ada CTA mental-battery.

## A4. Follow tanpa login

1. Logout.
2. Buka `/tenant/<username>` milik user lain.
3. Klik `+ Ikuti`.

Expected: muncul prompt desain, bukan `alert()` browser, dengan:

- `Ikuti @<username>`;
- penjelasan perlu masuk/daftar;
- tombol `Masuk`;
- tombol `Daftar`;
- tombol `×`.

Klik `Masuk` atau `Daftar`. URL login seharusnya memiliki parameter `next`, contohnya:

```text
/login?next=%2Ftenant%2Fusername
```

**PASS:** prompt muncul dan user dapat kembali ke halaman asal setelah autentikasi.

## A5. Crisis Guard, booking, dan Midtrans

> **Status: ⛔ BLOCKED** (2026-10-19) — env Midtrans di Vercel production (`MIDTRANS_SERVER_KEY` & `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`) belum diisi. `A5.2` (Booking normal) & `A5.4` (Webhook) menunggu isi env + redeploy (lihat Section 7). `A5.1` (Crisis Guard) & `A5.3` (Return URL) dapat diuji tanpa Midtrans.

### A5.1 — Crisis Guard menghentikan booking

1. Siapkan slot `AVAILABLE`.
2. Login sebagai klien.
3. Isi catatan test dengan kalimat krisis internal, misalnya:
   `Saya sedang ingin mengakhiri hidup.`
4. Submit booking.

Expected:

- muncul arahan keselamatan;
- tidak diarahkan ke Midtrans;
- tidak dibuat order;
- slot tetap `AVAILABLE`;
- tidak ada booking valid baru.

```sql
SELECT id, status, reserved_until
FROM public.listening_slots
WHERE id = '<slot-id>';
```

Expected `status=AVAILABLE` dan `reserved_until=NULL`.

### A5.2 — Booking normal

1. Gunakan slot `AVAILABLE`.
2. Isi data normal, misalnya:
   - pseudonym: `QA Klien`;
   - kontak test;
   - catatan: `Saya ingin berbagi tentang stres pekerjaan.`
3. Setujui consent.
4. Lanjutkan pembayaran.

Expected sebelum pembayaran selesai:

- booking `PENDING`;
- slot `RESERVED`;
- `reserved_until` terisi;
- `order_id` terisi;
- `take_rate_bps=1000`.

```sql
SELECT sb.id AS booking_id, sb.order_id, sb.status AS booking_status,
       sb.amount_idr, sb.take_rate_bps,
       ls.id AS slot_id, ls.status AS slot_status, ls.reserved_until
FROM public.session_bookings sb
JOIN public.listening_slots ls ON ls.id = sb.slot_id
ORDER BY sb.created_at DESC
LIMIT 5;
```

### A5.3 — Return URL tidak boleh mengonfirmasi pembayaran

1. Hentikan pembayaran sebelum selesai.
2. Kembali ke LMHY atau buka return URL.
3. Refresh.

Expected: booking tetap `PENDING`, atau reservasi kembali `AVAILABLE` setelah timeout. Tidak boleh langsung `CONFIRMED`.

### A5.4 — Webhook valid mengonfirmasi pembayaran

Prasyarat: Midtrans Sandbox, webhook publik, environment key yang benar, dan `SUPABASE_SERVICE_ROLE_KEY` tersedia.

Setelah pembayaran sandbox sukses dan webhook diterima:

```sql
SELECT sb.id, sb.order_id, sb.midtrans_transaction_id, sb.status,
       ls.status AS slot_status
FROM public.session_bookings sb
JOIN public.listening_slots ls ON ls.id = sb.slot_id
WHERE sb.order_id = '<order-id>';
```

Expected:

- `midtrans_transaction_id` terisi;
- booking menjadi state sukses aplikasi (`PAID`/`CONFIRMED`);
- slot menjadi `BOOKED`;
- `take_rate_bps=1000`.

Webhook yang dianggap sukses hanya `settlement`, atau `capture` dengan `fraud_status=accept`.

Jika webhook publik atau sandbox belum tersedia, tandai **BLOCKED**, bukan FAIL.

## A6. Litera Widget pada artikel

### A6.1 — Artikel tanpa Litera

Widget Litera tidak boleh muncul pada artikel yang tidak dikonfigurasi menggunakan Litera.

### A6.2 — Unlockable URL

Pada artikel Litera, setelah Share dan sebelum Comments, cari:

```text
Tautan Materi Eksklusif
```

Klik tautan. Expected: materi terbuka sesuai konfigurasi. Ini soft-gating; URL tidak boleh diklaim sebagai DRM yang tidak dapat dibagikan.

### A6.3 — Proof of Reading

**Status: PASS** (Terverifikasi oleh tester pada 2026-10-18 dengan widget v1.4.80/v1.4.81: kuis muncul setelah login, flow kuis berjalan semestinya, jawaban benar memberikan kelulusan, dan NFT berhasil diclaim/minting menjadi "Milik Kamu").

1. Buka artikel dengan quiz.
2. Jawab salah.
3. Pastikan ada feedback gagal.
4. Jawab benar.
5. Pastikan ada feedback sukses/akses.

**FAIL** jika semua jawaban diterima, jawaban benar selalu ditolak, atau widget crash.

#### A6.3.1 — Regresi Ditemukan 2026-10-18: Quiz Gate Bisa Dilewati

**Status: PASS — retest 7 langkah selesai** (fix deployed: backend `cdf2d05`, widget `v1.4.80` / `526e703`; retest dilaporkan lulus oleh tester pada 2026-10-19).

**Bukti produksi:**
- `AdminMint` mencatat mint token #10 oleh `0x187df099A3c8a3389B946F374D57aBe4F4fa894c` pada `2026-10-17 17:52:35 UTC`, yaitu **1 jam 38 menit setelah** quiz token #10 dibuat (`16:14:34 UTC`).
- `quiz_attempts` dan `proofs_of_completion` **kosong** — quiz tidak pernah dikerjakan sama sekali.
- Penyebab 1 (client): state widget hanya di-reset saat `tokenId` berubah, bukan saat `address` berubah. Berganti akun MetaMask tanpa reload membuat wallet baru mewarisi state `mint_ready` dari wallet sebelumnya, sehingga tombol "Miliki Edisi Digital" langsung mint.
- Penyebab 2 (server): `POST /api/v1/relayer/widget-mint` tidak memeriksa kelulusan quiz. Gate hanya toggle widget, Origin, signature, rate limit, domain allowlist, dan `hasMinted` legacy.

**Perbaikan:**
- Widget v1.4.80: reset state pada perubahan `address`, verifikasi ulang status quiz sebelum signing (`verifyQuizGate`), dan routing balik ke alur quiz saat relayer menolak dengan `403` berisi pesan quiz.
- Backend: `widgetMint` menolak mint jika ada `Quiz` berstatus `ACTIVE` dengan pertanyaan, kecuali wallet punya `proofs_of_completion` valid atau `quiz_attempts` dengan `passed = true`.

**Bukti deploy (2026-10-18):**
- `https://cdn.literaa.xyz/manifest.json` → `version 1.4.80`, `file bundle.53db3013db78.js`, `commit 526e703`, `builtAt 2026-10-17T18:52:20Z`.
- Probe langsung `POST https://literaa.xyz/api/v1/relayer/widget-mint` dengan wallet acak bertanda tangan, token #10, Origin `https://axaalexxa.letmehearyou.id` → `403 {"message":"Quiz must be completed and passed before minting this article"}`. Tidak ada mint yang tercatat.

**Retest wajib setelah deploy:**
1. Buka artikel token #10 dengan wallet baru yang belum punya NFT.
2. **Expected**: muncul `quiz_intro`, bukan tombol mint.
3. Ganti akun MetaMask ke wallet baru lain **tanpa reload**.
4. **Expected**: state kembali ke awal dan tetap menampilkan quiz.
5. Panggil `POST /api/v1/relayer/widget-mint` langsung dengan signature wallet yang belum lulus quiz.
6. **Expected**: `403 Quiz must be completed and passed before minting this article`.
7. Jawab quiz sampai lulus ➔ mint berhasil ➔ `quiz_attempts` terisi 1 baris `passed = true` dan `proofs_of_completion` terisi.

**Catatan sisa:**
- Jalur mint berbayar V2 (`price > 0`, `Mint` on-chain di `handleBuy`) belum di-gate quiz. Belum jadi celah aktif karena semua artikel V2 gratis.
- Token #10 kini punya 3 mint, termasuk 1 mint hasil bypass (`0x187d…894c`). Dibiarkan sebagai artefak QA; tidak ada fungsi burn di kontrak.

### A6.4 — Domain-Scoped Sponsor & CTA Link

> **Status: 🧪 IN PROGRESS** — sedang diuji tester (mulai 2026-10-19).

1. Buka Litera Dashboard di `https://literaa.xyz/publisher/integration`.
2. Pada tabel **Domain Terdaftar (CORS)**, pilih domain target (misal: `letmehearyou.id` atau domain tertentu) dan klik **`+ Pasang Sponsor`**.
3. Masukkan:
   - **Tautan Sponsor (External URL CTA)**: `https://...` (contoh: link sponsor partner).
   - **Label Tombol**: Custom CTA (contoh: `Pelajari Program` atau `Daftar Beasiswa`).
4. Klik **Simpan Sponsor** dan verifikasi tanda tangan dompet EIP-191.
5. **Verifikasi di Halaman Artikel Domain Target**:
   - Buka artikel di bawah domain tersebut.
   - **Expected**: Widget Litera otomatis memunculkan tautan/tombol CTA sponsor sesuai URL & label yang diatur.
6. **Verifikasi Domain Tanpa Sponsor**:
   - Buka domain lain yang tidak diisi sponsor.
   - **Expected**: Widget tetap bersih, tombol sponsor tidak muncul.
7. **Verifikasi Penghapusan Sponsor**:
   - Di dashboard Litera, klik **`Ubah Sponsor`** ➔ **`Hapus Sponsor`**.
   - **Expected**: Tombol sponsor di artikel domain tersebut langsung hilang seketika.

**PASS:** Sponsor hanya muncul di domain yang diatur, link dan label sesuai konfigurasi, domain lain bersih, dan penghapusan sponsor langsung menonaktifkan tampilan CTA.

---

# [URGENT PRIORITAS TINGGI] B0. Multi-Tenant Web Builder & Platform Master Key (PANDI/kubaca.id)

> **Status: ⏳ PENDING** (2026-10-19) — belum PASS; menunggu pengujian tester.

> **Catatan:** Sesuai instruksi, pengujian ini memiliki prioritas tertinggi (**URGENT**) untuk diverifikasi terlebih dahulu sebelum melangkah ke Proof of Reading kuis (A6.3). Mengacu pada spesifikasi lengkap di `litera-backend-main/docs/qa/cms-platform-publishers-qa-test-cases.md`.

### B0.1 — Tata Letak & UI OwnerTools (`/ownertools`)
1. Login ke `https://literaa.xyz/ownertools` sebagai Admin Safe Owner.
2. Periksa kolom kiri:
   - **Bagian Atas**: Kartu *Permohonan Akun Publisher* dengan batas scroll `max-h-[360px]`.
   - **Bagian Bawah**: Kartu baru *Trusted Platform Publishers* dengan batas scroll `max-h-[280px]`.
   - **Kolom Kanan**: Tetap kartu *Whitelist Kreator On-Chain*.
3. Periksa form tambah partner: Input wallet baris 1, input label & tombol *Tambah* di baris 2 berdampingan.

### B0.2 — Tambah & Manajemen Platform Publisher
1. Masukkan format salah (misal: `0xinvalid123`) ➔ Toast error *Format Alamat Salah*.
2. Masukkan wallet partner valid (misal: `WALLET_PANDI`) dan label (misal: `PANDI kubaca.id`).
3. Klik **Tambah** dan tanda tangani pesan admin.
4. **Expected**: Wallet tersimpan, form kembali bersih, entri muncul di tabel roster aktif dengan badge wildcard `*`.
5. Uji tombol salin (ikon berubah centang + toast sukses) dan external link (membuka Polygonscan di tab baru).
6. Uji tombol cabut izin: Muncul konfirmasi ➔ Klik OK ➔ Izin dicabut dan hilang dari roster.

### B0.3 — Penerbitan & Upgrade Master API Key (Wildcard Scope `*`)
1. Buka `https://literaa.xyz/publisher/api-keys` menggunakan wallet partner (`WALLET_PANDI`).
2. Klik **Terbitkan API Key Baru**.
3. **Expected**: Key terbit otomatis dengan `scopeRoot: "*"`. Di UI kartu API Key tampil badge:
   ```text
   ✨ Multi-Domain (*)
   ```
4. **Auto-Upgrade Key Lama**: Jika wallet sudah punya key sebelum dijadikan platform partner, key aktif lama otomatis ter-upgrade ke `*`.
5. **Kontrol Publisher Biasa**: Uji terbitkan key dengan akun biasa (non-platform) ➔ Key tetap terikat 1 root domain (1-Key-1-Web), **tidak** mendapat badge `*`.

### B0.4 — Pendaftaran Multi-Domain via 1 Master Key
1. Jalankan `POST /api/v1/cms/domains/register` dengan header `x-api-key: [MASTER_KEY_PANDI]`:
   - Domain 1: `guru-budi.kubaca.id` ➔ HTTP 201 Created.
   - Domain 2: `guru-siti.kubaca.id` ➔ HTTP 201 Created (Key tidak ditolak karena beda subdomain).
   - Domain 3: `smkn1jakarta.sch.id` atau `belajarbersama.my.id` ➔ HTTP 201 Created (Beda TLD/root domain tetap diizinkan).
2. Verifikasi CORS: Request Preflight OPTIONS dari origin `guru-budi.kubaca.id` menghasilkan header `Access-Control-Allow-Origin`.

### B0.5 — Pendaftaran Artikel Lintas Domain dengan 1 Master Key
1. Jalankan `POST /api/v1/cms/articles/register` dengan header `x-api-key: [MASTER_KEY_PANDI]`:
   - Artikel 1: `{"articleUrl": "https://guru-budi.kubaca.id/cerpen-1", "title": "Cerpen", "autoMint": false}` ➔ HTTP 201.
   - Artikel 2: `{"articleUrl": "https://guru-siti.kubaca.id/puisi-1", "title": "Puisi", "autoMint": false}` ➔ HTTP 201.
2. Tidak ada error `Scope violation` atau `Key bound to another domain`.

### B0.6 — Keamanan Double-Gate Guard (Anti-Bypass)
1. **Blokir domain milik orang lain**: Coba daftarkan artikel dari domain yang sudah terikat ke publisher lain ➔ HTTP 403 Forbidden (*Domain is registered to another publisher*).
2. **Blokir artikel dari domain tanpa registrasi**: Coba daftarkan artikel dari domain yang belum pernah didaftarkan ke Litera ➔ HTTP 403 Forbidden (*Domain not verified*).
3. **Isolasi Publisher Biasa**: Publisher biasa yang mencoba register artikel dari domain beda langsung diblokir (*Scope violation*).

---

# B. QA LITERA

## B1. Writer V2

> **Status: ⏳ PENDING** (2026-10-19) — belum PASS; menunggu pengujian tester.

Pastikan konfigurasi writer/mint menggunakan Writer V2:

```text
0x5f9aFEb4…888C
```

Gunakan alamat lengkap dari konfigurasi resmi/Explorer saat membandingkan. Jangan melakukan write transaction ke kontrak legacy. Untuk QA legacy gunakan read-only atau simulasi/fork.

**PASS:** Writer aktif menunjuk ke V2, network benar, dan tidak ada Auto-Mint write ke kontrak legacy.

## B2. CMS Auto-Mint

> **Status: ⏳ PENDING** (2026-10-19) — belum PASS; menunggu pengujian tester.

1. Login admin Litera.
2. Buka `/ownertools`.
3. Periksa antrean Auto-Mint.
4. Uji/periksa state berikut jika tersedia:

| State | Expected |
|---|---|
| `PROCESSING` | sedang diproses, belum disebut berhasil |
| `MINTED` | token/transaction hash tersedia |
| `BLOCKED` | alasan blokir dan funding inspector tersedia |
| `FAILED` | error jelas, tidak disebut minted |

**PASS:** state tidak tertukar, item blocked tidak diam-diam retry, dan tidak ada transaksi write tanpa tindakan/otorisasi admin.

## B3. LMHY ↔ Litera

> **Status: ⏳ PENDING** (2026-10-19) — belum PASS; menunggu pengujian tester.

1. Buka artikel LMHY yang memakai Litera.
2. Catat title, author, slug, operation ID, hash, token ID, atau metadata yang tersedia.
3. Buka Litera CMS.
4. Cari berdasarkan title, slug, operation ID, atau hash.
5. Cocokkan metadata.

Expected:

- artikel dan item Litera mengarah ke konten yang sama;
- metadata author/title tidak tertukar;
- pembaca tidak diminta melakukan wallet transaction;
- widget menggunakan soft-gate.

# 5. Template laporan hasil

```md
## QA Result — [tanggal]

Environment:
- LMHY URL:
- Litera URL:
- Browser:
- Akun utama: imammm.kooo@gmail.com
- Supabase project:

### A1.1 — Default role
Status: PASS / FAIL / BLOCKED
Hasil query:
Screenshot:
Catatan:

### A1.2 — PENULIS tidak dapat membuat slot
Status: PASS / FAIL / BLOCKED
Hasil UI:
Hasil query:
Screenshot:
Catatan:

### A1.3 — PENDAMPING PENDING
Status: PASS / FAIL / BLOCKED
Hasil UI:
Hasil query:
Screenshot:
Catatan:

### A1.4 — PENDAMPING APPROVED
Status: PASS / FAIL / BLOCKED
Slot ID:
Hasil query:
Screenshot:
Catatan:

### A1.5 — PRAKTISI
Status: PASS / FAIL / BLOCKED
URL:
Copy yang muncul:
Screenshot:
Catatan:

### A1.6 — Copy Pendamping
Status: PASS / FAIL / BLOCKED
URL profil:
URL artikel:
Kata yang ditemukan:
Screenshot:
Catatan:

### A2 — Paket dan take rate
Status: PASS / FAIL / BLOCKED
Booking ID:
amount_idr:
take_rate_bps:
Screenshot/query:
Catatan:

### A3 — Hirarki artikel
Status: PASS / FAIL / BLOCKED
URL:
Urutan aktual:
Screenshot:
Catatan:

### A4 — Follow tanpa login
Status: PASS / FAIL / BLOCKED
URL:
Prompt muncul:
Navigasi Masuk/Daftar:
Screenshot:
Catatan:

### A5 — Booking/Midtrans
Status: PASS / FAIL / BLOCKED
Slot ID:
Booking ID:
Order ID:
Status sebelum bayar:
Status sesudah bayar:
Webhook tersedia:
Catatan:

### A6 — Litera Widget
Status: PASS / FAIL / BLOCKED / N/A
URL:
Unlockable URL:
Instant Unlock Cache:
Proof of Reading:
Domain-Scoped Sponsor & CTA:
Screenshot:
Catatan:

### B0 — Multi-Tenant Web Builder & Platform Master Key (PANDI/kubaca.id)
Status: PASS / FAIL / BLOCKED
OwnerTools UI & Layout:
Tambah & Cabut Platform Partner:
Badge & Wildcard Scope (*):
Multi-Domain Register (PANDI):
Artikel Lintas Subdomain:
Double-Gate Security Guard:
Catatan:

### B1 — Writer V2
Status: PASS / FAIL / BLOCKED
Kontrak aktif:
Network:
Bukti:
Catatan:

### B2 — CMS Auto-Mint
Status: PASS / FAIL / BLOCKED
State yang diuji:
Bukti:
Catatan:

### B3 — LMHY ↔ Litera
Status: PASS / FAIL / BLOCKED / N/A
Artikel:
Operation ID/hash:
Hasil:
Catatan:
```

## 6. Arti status

| Status | Arti |
|---|---|
| `PASS` | Actual result sama dengan expected result |
| `FAIL` | Actual result berbeda dari expected result |
| `BLOCKED` | Tidak dapat diuji karena prasyarat belum tersedia |
| `N/A` | Tidak berlaku pada data uji tersebut |

## 7. ⏰ REMINDER PASCA-QA (permintaan eksplisit user)

> **Setelah seluruh manual QA ini selesai** (termasuk Section B0 selesai, **A6.3 Proof of Reading** selesai), **INGATKAN USER** untuk **mengisi env key Midtrans di Vercel production**:
>
> - `MIDTRANS_SERVER_KEY`
> - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
>
> **PENTING:** env var di-bake saat **build time** — setelah diset di Vercel, wajib **Trigger Deploy ulang** (jangan hanya simpan env lalu menunggu). Tanpa ini, alur **A5.2** dan **A5.4** (Booking & halaman pembayaran Midtrans Snap QRIS) tetap **BLOCKED**.


