# Let Me Hear You — Jalur Pengajuan Mitra & Antrean Verifikasi Admin (SP-1)

**Dokumen ID:** `SPEC-LMHY-2026-10-20-MITRA-INTAKE-ADMIN-QUEUE`
**Status:** Menunggu review user
**Tanggal:** 20 Oktober 2026
**Basis:** Sesi brainstorming 2026-10-20 (Bagian A–E disetujui user) · nightlife `SPEC-LMHY-2026-10-13-SANCTUARY-STUDIO-UNIFIED` (taksonomi peran, take rate, paket) · `SPEC-LMHY-2026-10-12-SANCTUARY-STUDIO-SAAS` (arsitektur dasar)
**Referensi produk:** Ceritakan.id `/daftar-psikolog` (revenue model agensi) — **dibalik**: LMHY adalah SaaS creator platform, bukan agensi.

---

## 1. Ringkasan Eksekutif

SP-1 membangun **loop nilai pertama** LMHY sebagai platform:

```
Orang mau jadi mitra → stranger/anggota melihat /mitra → mengisi form (tanpa akun)
  → masuk antrean verifikasi → admin review → APPROVED → role naik + badge tampil
  → (SP-2) buka sesi berbayar → (SP-3) monetize langganan
```

Cakupan SP-1:

1. **Jalur pengajuan publik** (`/mitra` hub + `/mitra/psikolog` + `/mitra/pendamping`) dengan model *guest-first* (akun dibuat otomatis saat submit).
2. **Area akun minimal** (`/akun`) sebagai pusat status pengajuan & entry pengajuan accompanying.
3. **Dashboard admin terpadu** (`/admin`) — 3 tab: Ringkasan, Verifikasi Mitra, Litera — menggantikan PIN hardcoded `123456` dengan auth nyata.
4. **Model data, storage privat, RLS deny-all, audit trail**, dan 8 lapisan proteksi.

Yang **tidak** termasuk: ruang kerja provider (`/praktik`), langganan paket berbayar, pencairan dana, kredit rujukan. Semua itu SP-2 dan SP-3 (lihat §16).

---

## 2. Keputusan yang Dikunci (hasil brainstorming)

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Ruang kerja provider bernama **`/praktik`** (bukan `/studio`) | Faras administratif; "studio" terlalu dekat dengan `/builder` (ruang menulis) |
| D2 | **Paket terpisah per peran**: Sebaya (Sapa 0 / Cerita 25rb / Dengar 49rb) vs Klinis (Sapa 0 / Cerita 59rb / Dengar 129rb) | SKU klinis ≠ SKU sebaya; menggabungkan benefit klinis ke non-profesional = malpraktik etis |
| D3 | **Custom domain & white-label dibuang** | Tidak bernilai di Indonesia; menghapus branding LMHY justru menurunkan trust |
| D4 | Value proposition = **akuisisi klien + pengembangan karier + toolkit**, bukan fitur software | Psykolog/lulusan baru tidak membayar untuk "slot tanpa batas" |
| D5 | Pendamping Sebaya **wajib** masuk komunitas WhatsApp + pelatihan First Aid Counseling (PFA) | PFA + komunitas = moat & batasan etis terstruktur |
| D6 | **Kedaulatan penuh provider**: tarif, kalender, modalitas, catatan klien 100% milik provider. Satu-satunya guardrail = Crisis Guard | LMHY ≠ agensi; provider bukan "karyawan" |
| D7 | Take rate **flat 10%**, provider 90% | Bebas kanibalisasi; platform tetap memiliki recurring revenue dari langganan |
| D8 | Intake psikolog = **guest-first** (akun dibuat otomatis) | Psikolog sibuk & resisten terhadap friksi signup; drop-off tinggi bila login-first |
| D9 | Intake pendamping = **dari area akun** (member existing) | Sudah login; data & username sudah ada |
| D10 | Route publik = **hub `/mitra` + sub-route `/mitra/psikolog` & `/mitra/pendamping`** | 1 pintu masuk, URL dalam & dapat di-track |
| D11 | **Status hanya via login** (`/akun/pengajuan`) | Pelamar selalu punya akun → tidak ada endpoint lookup publik → anti-enumerasi stronger (P5) |
| D12 | **Username dipilih pelamar** (bukan acak) + validasi + reserved list | Subdomain adalah identitas; pelamar berhak menamainya |
| D13 | Auth admin = **`app_metadata.is_admin`**; PIN `123456` dihapus | Tidak bisa dibaca/diubah user; tidak perlu tabel baru |
| D14 | Verifikasi WA & PFA = **klaim + verifikasi admin manual**, field terstruktur | Realistis di skala awal; field dirancang agar migrasi ke cohort tanpa ubah skema |
| D15 | Admin v1 = **3 tab: Ringkasan, Verifikasi Mitra, Litera** | Hanya metrik yang datanya benar-benar ada |
| D16 | **8 proteksi** (P1–P8) wajib ada sebelum live | Form publik = permukaan spam & PII |
| D17 | Notifikasi email **otomatis** via adapter provider (Resend/Brevo) di v1 | Persetujuan user; kegagalan email tidak boleh membatalkan approve |
| D18 | Testing 3 lapis + **T1–T6**; rollout 5 fase + **R7–R11** | Persetujuan user |

---

## 3. Peta Route

```
PUBLIK (tanpa login)
└── /mitra                          Hub: 2 jalur kemitraan, benefit, syarat, ethos, FAQ
    ├── /mitra/psikolog             Form pengajuan psikolog (guest-first, 3 langkah)
    ├── /mitra/pendamping           Form pengajuan pendamping (2 langkah)
    └── /mitra/status               Penjelas + shortcut login (cek status butuh login → /akun/pengajuan)

AKUN MEMBER (login)
├── /akun                           Area akun: tab Ringkasan | Pengajuan
└── /praktik                        [SP-2 — belum ada di SP-1; akses dibuka setelah approve]

ADMIN (butuh app_metadata.is_admin)
└── /admin                          Shell unified
    ├── /admin                      Tab Ringkasan
    ├── /admin/verifikasi           Tab Antrean Verifikasi Mitra
    └── /admin/litera               Tab Litera (route lama tetap hidup, kini terproteksi)
```

Perubahan route existing:

| Route | Perubahan |
|---|---|
| `/admin/litera` | Tetap ada; kini me-render shell `/admin` dengan tab Litera aktif. PIN gate dihapus. |
| `/admin` (baru) | Shell + guard admin. |
| `/akun` (baru) | Area akun minimal. |
| `/mitra/*` (baru) | Jalur pengajuan publik. |
| `src/middleware.ts` | Tambah `/mitra`, `/akun`, `/praktik` ke `ROOT_ROUTES`; tambah guard admin; subdomain `/mitra` & `/akun` di-redirect ke root kanonik (seperti `/builder`). |

---

## 4. Autentikasi & Otorisasi

### 4.1 Admin

```
Request /admin/*
  ├─ middleware.ts ──► session ada?
  │     ├─ tidak  → redirect /login?next=<path>
  │     └─ ya     → user.app_metadata.is_admin === true ?
  │           ├─ tidak → redirect / + pesan "Akses khusus tim LMHY"
  │           └─ ya   → lanjut
  └─ page + Server Action ──► re-check is_admin (defense in depth) → 403 bila gagal
```

- Flag di `app_metadata` (bukan `user_metadata`) → hanya bisa disetel server/service-role, tidak bisa dibaca atau diubah user.
- **Tidak ada tabel `admin_users`** (D13). Jejak audit memakai `profiles.verified_by` (approval terakhir) + `admin_audit_log` (semua aksi).
- Bootstrap: skrip sekali jalan (service-role) untuk set `app_metadata.is_admin` pada email admin.
- PIN `123456` di `AdminLiteraClient.tsx` **dihapus**.

### 4.2 Pelamar

- **Guest** → submit form → akun Supabase dibuat (email + password, min 8 karakter) → Supabase mengirim email konfirmasi (template dashboard yang sudah ada) → setelah konfirmasi, pelamar bisa login.
- **Member existing** (jalur Pendamping) → tidak ada akun baru; profil yang ada di-update.
- Email yang sudah terdaftar → pesan ramah + CTA "Masuk & lanjutkan dari akun Anda"; form di-prefill dari profil, input tidak hilang.

---

## 5. Model Data

### 5.1 `provider_applications`

| Kolom | Tipe | Constraint / Keterangan |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | FK → `auth.users(id)`, NOT NULL |
| `track` | text | CHECK `SEBAYA` \| `KLINIS` |
| `status` | text | CHECK `PENDING` \| `APPROVED` \| `REJECTED` \| `EXPIRED` \| `SUPERSEDED`; default `PENDING` |
| `username` | text | Username subdomain yang diklaim. **Tidak UNIQUE di tabel ini** — keunikan dijamin `profiles.username` (release lewat tombstone, §6) |
| `applicant_name` | text | NOT NULL |
| `applicant_email` | text | NOT NULL |
| `whatsapp` | text | PII — hanya tampil di admin |
| `domicile_province`, `domicile_city` | text | PII — hanya tampil di admin |
| `motivation` | text | Teks bebas (motivasi / ringkasan pengalaman), min 200 karakter |
| `background_track` | text | CHECK `PENYINTAS` \| `PEMERHATI` \| `MAHASISWA` \| `LAINNYA` (SEBAYA) |
| `pfa_status` | text | CHECK `BELUM` \| `SEDANG` \| `SELESAI`; default `BELUM` |
| `pfa_evidence_doc_id` | uuid | FK → `provider_documents.id` (opsional) |
| `wa_joined_confirmed_at` | timestamptz | Diisi admin setelah verifikasi manual |
| `ethics_pledge_at` | timestamptz | NOT NULL — bukti persetujuan kode etik |
| `pledge_version` | text | Versi naskah yang disetujui |
| `email_verified_at` | timestamptz | P1 — wajib terisi sebelum approve |
| `applied_at` | timestamptz | default now() |
| `decided_at` | timestamptz | |
| `decided_by` | uuid | FK → `auth.users(id)` |
| `decision_note` | text | Wajib saat REJECTED |
| `supersedes` / `superseded_by` | uuid | Self-FK — riwayat pengajuan ulang |
| `details` | jsonb | Payload spesifik track (§5.2) |
| `created_at`, `updated_at` | timestamptz | |

Index: `(status, track, applied_at DESC)`, `(user_id)`. **Tidak** ada UNIQUE di tabel ini: username yang sama bisa muncul pada pengajuan lama (EXPIRED/REJECTED/SUPERSEDED) — keunikan username dijamin tabel `profiles`.

### 5.2 `details` jsonb per track

Column inti tetap typed (untuk filter, sort, laporan); isi form yang tidak beririsan disimpan di jsonb, **divalidasi di level DB**:

```sql
CHECK (
  (track = 'KLINIS' AND details ?& array[
      'academic_title','s2_campus','s2_graduation_year','specialization',
      'str_number','sip_status','current_practice','years_experience',
      'flight_hours','modalities'])
  OR
  (track = 'SEBAYA' AND details ?& array[
      'background_track','personal_experience','availability'])
)
```

Isi `details`:

| Track | Keys |
|---|---|
| `KLINIS` | `academic_title` (S.Psi/M.Psi/Psikolog), `s2_campus`, `s2_graduation_year` (int), `specialization` (Klinis Dewasa / Anak-Remaja / Keluarga / Industri-Organisasi / Pendidikan / Umum), `str_number`, `sip_status` (`AKTIF`/`TIDAK_AKTIF`), `current_practice`, `years_experience` (`<1`/`1-2`/`2-4`/`4-7`/`>7`), `flight_hours` (`<100`/`100-300`/`301-700`/`701-1500`/`>1500`), `modalities` (array: `VIDEO`/`VOICE`/`CHAT`) |
| `SEBAYA` | `background_track`, `personal_experience`, `availability`, `wa_group_confirmed` (bool), `pfa_commitment` (bool) |

### 5.3 `provider_documents`

`id` (uuid PK), `application_id` (FK), `user_id` (FK), `doc_type` (CHECK `STR`/`SIPP`/`CV`/`TRAINING_CERT`/`PFA_CERT`/`OTHER`), `storage_path`, `original_filename`, `mime_type`, `size_bytes`, `uploaded_at`, `purge_after` (P7).

### 5.4 `admin_audit_log`

`id` (uuid PK), `actor_id` (FK auth.users, NOT NULL), `action` (CHECK: `APPLICATION_APPROVED`/`APPLICATION_REJECTED`/`APPLICATION_EXPIRED`/`APPLICATION_RESUBMITTED`/`DOCUMENT_VIEWED`/`CHECKLIST_UPDATED`/`LITERA_CONFIG_UPDATED`/`EMAIL_RESENT`/`SWEEP_FAILED`), `target_type`, `target_id`, `note`, `metadata` jsonb, `created_at`.

Index: `(actor_id, created_at DESC)`, `(target_type, target_id)`, `(created_at DESC)`.

### 5.5 `profiles` — tanpa kolom baru

Kolom yang dipakai sudah ada: `creator_role`, `service_track`, `verification_status`, `verified_at`, `verified_by`, `verification_note`, `username`.

### 5.6 Storage

| Aspek | Ketentuan |
|---|---|
| Bucket | `provider-credentials`, `public = false` |
| Path | `applications/{application_id}/{doc_type}-{uuid}.{ext}` |
| Upload | Server Action membuat *signed upload URL* (5 menit) → client PUT ke Supabase |
| Akses | *Signed download URL* 60 detik, dibuat server-side **setelah** cek `is_admin`; setiap pembuatan dicatat `DOCUMENT_VIEWED` |
| Batas | PDF/JPEG/PNG, ≤5MB/file, ≤4 berkas/pelamar; nama file disanitasi; **EXIF dibuang server-side** (re-encode gambar dengan `sharp` — dependency sudah ada) sebelum disimpan |

### 5.7 RLS — deny-all by design

Tiga tabel baru: `ENABLE ROW LEVEL SECURITY` **tanpa** policy untuk `anon`/`authenticated` → mustahil dibaca langsung dari browser.

Semua akses lewat Server Action:

```
verify session → tentukan scope (pelamar: user_id = auth.uid() | admin: app_metadata.is_admin)
              → baca/tulis via service-role client
              → catat admin_audit_log (untuk aksi admin)
```

### 5.8 Migrasi

`supabase/migrations/20261020000000_provider_intake_admin.sql` — idempoten (`IF NOT EXISTS`), plus:
- `scripts/bootstrap-admin.ts` — set `app_metadata.is_admin` (sekali jalan, service-role).
- `docs/qa/mitra-intake-rollback.md` — prosedur rollback (drop 3 tabel, hapus bucket + policy, kembalikan flag).

---

## 6. Alur Pengajuan Psikolog (`/mitra/psikolog`)

3 langkah, guest-first.

### L1 — Identitas

| Field | Wajib | Validasi |
|---|---|---|
| Nama lengkap + gelar (S.Psi/M.Psi/Psikolog) | ✔ | min 3 karakter |
| Email | ✔ | format email; blokir domain disposable |
| Nomor WhatsApp aktif | ✔ | format Indonesia (08xx / +62xx) |
| Kota + Provinsi domisili | ✔ | daftar 38 provinsi |
| Username subdomain | ✔ | `a-z0-9-`, 3–30, unik, bukan reserved list, live check (debounce 400ms) + 3 saran alternatif |
| Kata sandi akun | ✔ (di L3) | min 8 karakter |

### L2 — Kredensial

| Field | Wajib | Catatan |
|---|---|---|
| Kampus S2 Profesi | ✔ | |
| Tahun lulus S2 | ✔ | 1980–tahun berjalan |
| Peminatan | ✔ | sesuai SIP |
| Nomor STR/SIPP | ✔ | |
| Status STR/SIPP aktif | ✔ | `AKTIF`/`TIDAK_AKTIF`. **Tidak di-drop otomatis** — diberi red flag di antrean admin; keputusan akhir di tangan manusia |
| Tempat praktik saat ini | ✔ | |
| **Ringkasan pengalaman & motivasi** (textarea, min 200 karakter) | ✔ | Untuk psikolog: ringkasan pengalaman praktik klinis & alasan ingin bergabung. WAJIB — validator klinis mewajibkan `motivation` ≥ 200 karakter |
| Lama pengalaman praktik | ✔ | `<1`/`1-2`/`2-4`/`4-7`/`>7` |
| Estimasi jam terbang sesi | ○ | sinyal komitmen |
| Modalitas yang bisa melayani | ✔ | `VIDEO`/`VOICE`/`CHAT`, min 1 |

### L3 — Berkas & Komitmen

| Field | Wajib | Catatan |
|---|---|---|
| Upload STR (PDF/JPG/PNG ≤5MB) | ✔ | |
| Upload CV (PDF ≤5MB) | ○ | |
| Persetujuan "data benar" | ✔ | checkbox + timestamp |
| Persetujuan Kode Etik Praktik Psikologi & Batas Telemedisin | ✔ | checkbox + `pledge_version` |
| Sertifikat pelatihan (opsional) | ○ | |

**Yang sengaja tidak ditanyakan:** jenis kelamin & tanggal lahir (dipakai Ceritakan.id) — tidak ada kebutuhan bisnis/legal di LMHY; minimizing PII = proteksi (P7).

### Setelah submit

1. Validasi server (schema per track).
2. `createUser` (email + password) via service-role. Bila email sudah terdaftar → arahkan ke login (input dipertahankan).
3. `createProfile` (username, display_name, `creator_role=PENULIS`, `verification_status=PENDING`).
4. `createApplication` (track `KLINIS`).
5. Upload dokumen via signed URL.
6. Kirim email "pengajuan diterima" (C.6) + email konfirmasi Supabase.
7. Halaman sukses: "Cek email untuk verifikasi" + link ke `/akun/pengajuan`.

**Upload setelah submit tanpa session:** akun baru dibuat dengan `email_confirm: false`, jadi pelamar **belum punya session** ketika ingin mengunggah berkas. Karena itu aksi submit mengembalikan **upload token** (HMAC-SHA256, TTL 24 jam, memuat `applicationId` + `userId`, rahasia dari env `MITRA_UPLOAD_SECRET` dengan fallback `SUPABASE_SERVICE_ROLE_KEY`). Aksi unggah & finale menerima token tersebut sebagai pengganti session — token diverifikasi server-side (perbandingan constant-time) dan terikat ke aplikasi milik pelamar itu. Fallback: setelah email terverifikasi, pelamar login dan memakai session biasa.

**Perilaku subdomain sebelum approve:** halaman tenant menampilkan state netral "Menunggu verifikasi mitra" — tanpa konten, tanpa dokumen, `noindex`, tidak masuk sitemap.

**Release username:** saat pengajuan `EXPIRED` (P1/P2) atau `REJECTED`, username profil **dilepas** dengan me-rename profil menjadi tombstone `akun-<8 hex>` sehingga username asli kembali tersedia. Akun tetap `PENULIS` dan pelamar dapat mengklaim username baru kapan saja. Tombstone tidak terindeks dan tidak tampil di direktori.

**Verifikasi email (P1):** link konfirmasi Supabase. Bila belum terverifikasi dalam **7 hari** → pengajuan `EXPIRED` + username dilepas.

---

## 7. Alur Pengajuan Pendamping Sebaya (`/mitra/pendamping`)

2 langkah. Entry utama dari `/akun` (member); route publik tersedia untuk yang belum punya akun.

### L1 — Identitas & Latar Belakang

| Field | Wajib |
|---|---|
| Nama, email, WhatsApp, kota/provinsi, username (prefill bila member) | ✔ |
| Latar belakang: `PENYINTAS` / `PEMERHATI` / `MAHASISWA S1 PSIKOLOGI` / `LAINNYA` | ✔ |
| Motivasi (textarea, min 200 karakter) | ✔ |
| Pengalaman mendengarkan/merawat (textarea) | ✔ |
| Ketersediaan waktu untuk sesi | ✔ |

### L2 — Komitmen Etis & Komunitas

| Field | Wajib | Catatan |
|---|---|---|
| Checkbox kode etik non-klinis | ✔ | "Hanya Sesi Dengar empati. Tidak mendiagnosis, tidak memberi resep, wajib merujuk ke profesional bila klien menunjukkan risiko bunuh diri." |
| Nomor WhatsApp + link grup WhatsApp LMHY | ✔ | |
| Checkbox "sudah bergabung ke grup WhatsApp LMHY" | ✔ | Diverifikasi admin manual → mengisi `wa_joined_confirmed_at` |
| Checkbox kesediaan mengikuti pelatihan First Aid Counseling | ✔ | → `pfa_status` awal `BELUM`, admin yang meng-upgrade ke `SELESAI` |
| Upload sertifikat pelatihan/pendampingan | ○ | opsional |

Setelah submit: bila member → update profil + buat application. Bila guest → alur pembuatan akun identik dengan §6.

---

## 8. Area Akun (`/akun`)

Satu route, dua tab.

| Tab | Isi |
|---|---|
| **Ringkasan** | Nama, username (+ link ke subdomain), role & badge verifikasi, status pengajuan aktif, CTA "Ajukan Jadi Pendamping Sebaya" (bila role masih `PENULIS`) |
| **Pengajuan** | Riwayat pengajuan (track, tanggal, status), detail + **alasan penolakan**, aksi "Perbaiki & Ajukan Ulang" |

**Ajukan ulang:** membuat row baru (status `PENDING`), row lama → `SUPERSEDED`, kedua arah di-link (`supersedes`/`superseded_by`).

Entry point tambahan: banner ajakan di halaman profil tenant, hanya untuk akun non-provider. Tidak menyentuh `/builder`.

---

## 9. Notifikasi Email (C.6)

| Komponen | Isi |
|---|---|
| `src/lib/email.ts` | `sendEmail({to, subject, html, text})`. Urutan provider: `RESEND_API_KEY` → `BREVO_API_KEY` → **no-op + log** (tidak crash). Timeout + retry 1×. **Kegagalan email tidak membatalkan approve.** |
| `src/lib/email-templates.ts` | Fungsi TS murni: `received`, `approved`, `rejected`, `expired`, `resubmitGuide`, `verificationReminder`. Memakai token Warm Sanctuary (Poppins, `#FBF8F5`, `#3C3163`, `#F7ABC5`) — konsisten dengan template email konfirmasi yang sudah ada |
| Env | `RESEND_API_KEY` (atau `BREVO_API_KEY`), `EMAIL_FROM` (default `noreply@letmehearyou.id`) |
| Test | Stub provider (tidak kirim sungguhan) + smoke test manual ke provider asli di staging |

Momen pengiriman: pengajuan diterima · verifikasi ulang · approve · reject (dengan cara memperbaiki) · expiry · pengingat SLA.

---

## 10. Dashboard `/admin`

### 10.1 Shell

3 tab sebagai path segment (`/admin`, `/admin/verifikasi`, `/admin/litera`) → URL dapat di-bookmark & dibagikan antar-admin. Header menampilkan nama admin + logout.

### 10.2 Tab Ringkasan

| Metrik | Sumber |
|---|---|
| Mitra terverifikasi: PENDAMPING / PRAKTISI | `profiles` |
| Sebaran `verification_status` seluruh profil | `profiles` |
| Pengajuan menunggu: total + per track | `provider_applications` (PENDING) |
| Diproses 30 hari: approved / rejected / expired | `provider_applications` |
| Median waktu review | query — median `(decided_at - applied_at)` untuk pengajuan diputuskan dalam 30 hari terakhir |
| 10 aktivitas admin terakhir | `admin_audit_log` |

Visualisasi: CSS/Tailwind saja (bar & persentase) — tanpa dependensi chart baru.

### 10.3 Tab Verifikasi Mitra

**Kiri — Antrean**

- Filter: track · status (default `PENDING`) · pencarian (nama/email/username) · urutan terlama/terbaru
- Baris: nama · badge track · username · umur pengajuan · **red flag**: `EMAIL BELUM TERVERIFIKASI` · `WA BELUM DIVERIFIKASI` · `PFA BELUM SELESAI` · `STR TIDAK AKTIF` · `BERKAS KURANG`
- Badge "Butuh Tindakan" bila >7 hari tanpa verifikasi email → tombol kirim ulang

**Kanan — Detail**

- Data pelamar (PII, hanya di admin): nama, email, WhatsApp, domisili, username, track, tanggal apply
- **Checklist verifikasi admin** (tersimpan): WA dikonfirmasi · PFA selesai · berkas STR lengkap · etika disetujui. Email **tidak** dicentang manual — statusnya read-only dari `email_verified_at` (derived by system)
- Detail track dari `details` jsonb
- Dokumen: tombol "Lihat" → signed URL 60 detik + catat `DOCUMENT_VIEWED`
- Aksi: **[Setujui]** · **[Tolak]** (catatan wajib) · [Kirim ulang verifikasi] · [Salin pesan ke WA]

### 10.4 Aksi Setujui — satu Server Action

```
1. Validasi : status masih PENDING · email_verified_at terisi
             · (SEBAYA) wa_joined_confirmed_at terisi & pfa_status = 'SELESAI'
             · berkas wajib ada · admin ≠ pelamar (P6)
2. UPDATE provider_applications SET status='APPROVED', decided_at, decided_by, decision_note
     WHERE id = ? AND status = 'PENDING'          ← optimistic concurrency
3. UPDATE profiles SET creator_role, service_track, verification_status='APPROVED',
                      verified_at, verified_by, verification_note
4. INSERT admin_audit_log (APPLICATION_APPROVED)
5. Matikan pengajuan PENDING lain milik user yang sama (1 akun = 1 aktif)
6. Kirim email approval (gagal ≠ batalkan approve)
7. Toast + refresh
```

**Race condition 2 admin approve bersamaan:** `WHERE status='PENDING'` + assert jumlah baris ter-update = 1. Jika 0 → "Pengajuan ini sudah diproses admin lain."

### 10.5 Aksi Tolak

`status='REJECTED'` + `profiles.verification_status='REJECTED'` + `verification_note` (wajib). **Akun tetap `PENULIS`** (tidak dihapus). Email penolakan berisi cara memperbaiki. Audit log `APPLICATION_REJECTED`.

### 10.6 Tab Litera

- Memuat `AdminLiteraClient` yang ada; PIN gate dihapus; guard pindah ke shell admin.
- Aksi ubah tokenomics/daftar publisher → `LITERA_CONFIG_UPDATED` di audit log.
- **Catatan implementasi:** saat implementasi, audit apakah penyimpanan konfigurasi Litera masih client-side; bila ya, pindahkan ke Server Action yang Termin dengan audit log.

---

## 11. Mekanisme Keamanan (P1–P8)

| # | Proteksi | Implementasi | Verifikasi |
|---|---|---|---|
| P1 | Verifikasi email dulu | `email_verified_at` wajib terisi sebelum approve; sweep 7 hari → `EXPIRED` + username dilepas | Test approve tanpa verifikasi → ditolak |
| P2 | TTL pengajuan 30 hari | Sweep harian: `PENDING` & `applied_at` > 30 hari → `EXPIRED` + username dilepas + email expiry | Test dengan `applied_at` dimanipulasi |
| P3 | Anti-spam berlapis | Honeypot + syarat form terisi ≥5 detik + Turnstile (opsional bila key absen) + rate limit (IP 3/hari, email 2 pengajuan aktif) + blokir email disposable | Test rate limit, honeypot & time-to-submit |
| P4 | Validasi & sanitasi berkas | Signed upload URL + cek MIME/ukuran + sanitasi nama + buang EXIF + kuota 4 berkas | Test file >5MB & MIME salah |
| P5 | Anti-enumerasi status | Status **wajib login** (`/akun/pengajuan`); tidak ada endpoint lookup publik | Grep endpoint publik → nihil |
| P6 | Anti-konflik kepentingan | Tombol Setujui nonaktif bila `application.user_id = admin.uid`; catatan wajib saat reject | Test approve pengajuan sendiri |
| P7 | Data minimization + retensi | PII tidak tampil di halaman publik; `purge_after = decided_at + 90 hari` → job purge menghapus berkas | Test purge |
| P8 | Audit trail admin | `admin_audit_log` untuk SEMUA aksi admin (termasuk membuka dokumen) | Test setiap aksi menghasilkan 1 baris |

---

## 12. Error Handling & Failure Modes

| Failure | Perilaku |
|---|---|
| Validasi field gagal | Error inline per field; input tidak hilang |
| Username bentrok | Live check + pesan + 3 saran alternatif |
| Email sudah punya akun | Pesan ramah + CTA login; input dipertahankan |
| Upload berkas wajib gagal | Submit diblokir **per berkas**; berkas lain tetap tersimpan |
| Turnstile gagal / tidak tersedia | Widget dilewati bila key kosong; rate limit tetap aktif |
| Rate limit kena | 429 + pesan + countdown |
| Email notifikasi gagal | Approve tetap sukses; ditandai "email gagal" + tombol resend |
| 2 admin approve bersamaan | Optimistic concurrency → "sudah diproses admin lain" |
| Signed URL kedaluwarsa | Di-regenerate otomatis saat diklik |
| Admin tanpa login | Redirect `/login?next=/admin` |
| Admin tanpa flag | Redirect `/` + pesan "Akses khusus tim LMHY" |
| `SUPABASE_SERVICE_ROLE_KEY` absen | Pesan jelas "Server belum dikonfigurasi", bukan crash |
| Sweep expiry gagal | Retry + log + `SWEEP_FAILED` di audit log |

---

## 13. Strategi Testing

### 13.1 Unit test (`node:test` + `tsx`)

| Modul | Yang diuji |
|---|---|
| `src/lib/mitra/application-schema.ts` | Validator per track: field wajib, min length, format, enum, konsistensi track ↔ details |
| `src/lib/mitra/username-rules.ts` | Regex, panjang, reserved list (**+ baru**: articles, mitra, praktik, akun, pengaturan, terms, images, media, upload, cdn) |
| `src/lib/mitra/application-state.ts` | Transisi status & guard (hanya PENDING→X; 1 aktif per user; admin ≠ pelamar) |
| `src/lib/mitra/expiry.ts` | TTL 7/30 hari & retensi 90 hari, termasuk boundary |
| `src/lib/mitra/rate-limit.ts` | Batas per IP/email + jendela waktu |
| `src/lib/email-templates.ts` | Konten wajib tiap template + mode no-op |

### 13.2 Integration test (SQL / CI)

- Migrasi idempoten: jalankan 2× → aman (T4).
- **RLS deny-all terverifikasi otomatis**: query dengan `anon`, `authenticated`, `service_role` ke 3 tabel baru + bucket storage; assert penolakan sesuai (T4).
- Service-role bisa read/write.

### 13.3 E2E browser (Playwright) — T1, T2, T3

- **Alur inti**: guest psikolog submit → verifikasi → login → lihat status → admin approve → role naik & badge tampil di profil.
- **Race**: dua approve paralel → hanya 1 sukses.
- **A11y (axe-core)**: form 3 langkah, area akun, antrean admin → label, focus, kontras, error announcement.
- **Visual regression**: screenshot pada 390px & 768px (form multi-step + antrean admin) → mendeteksi regresi layout otomatis.

### 13.4 Uji beban — T5

50 submit guest paralel → rate limit menahan, tidak ada duplikasi akun, tidak ada race pembuatan profil. Dijalankan manual pra-launch.

### 13.5 Email — T6

Stub provider (tidak kirim sungguhan) untuk unit test; smoke test manual ke provider asli di staging; **approve tetap sukses saat email down**.

### 13.6 Manual QA

Dokumentasikan di `docs/qa/mitra-intake-admin-qa.md`: alur guest end-to-end, alur companion dari member existing, reject → ajukan ulang, guard admin, race approve, berkas & signed URL, TTL expiry, retensi purge, shadow mode.

---

## 14. Rollout

| Fase | Isi | Gate keluar |
|---|---|---|
| **0 — Fondasi** | Migrasi DB (idempoten) · bootstrap admin · env email provider + Turnstile (opsional) | Migrasi lolos 2×, RLS terverifikasi (T4) |
| **1 — Merge tersembunyi** | Merge kode dengan flag `NEXT_PUBLIC_MITRA_INTAKE_ENABLED=false`; admin queue tetap bisa diakses | Build + CI hijau |
| **2 — Smoke test** | Alur end-to-end di produksi memakai akun QA (`qa.praktisi.01@gmail.com`) | Approve/reject lolos |
| **3 — Shadow mode (R8)** | 1 minggu: pengajuan masuk antrean, **tidak ada keputusan**; hanya uji kualitas data & bug validasi | Tidak ada data corrupt & bug validasi tertangkap |
| **4 — Pelan-pelan (R7, R9)** | Buka per track (`MITRA_INTAKE_PSIKOLOG_ENABLED` / `MITRA_INTAKE_PENDAMPING_ENABLED`) + whitelist email batch (10 → 30 → 100%) | Median waktu review terkendali; SLA alert aktif |
| **5 — Normal** | Buka penuh, hapus whitelist | — |

Operasional:
- **SLA**: pengajuan >3 hari belum direview → alert ke admin (via email, R7).
- **Rollback (R11)**: snapshot DB sebelum migrasi + prosedur tertulis (`docs/qa/mitra-intake-rollback.md`).
- **SOP admin (R10)**: checklist review, kapan approve vs reject, template pesan, alur eskalasi — ditulis sebelum live.

---

## 15. Peta File

```
supabase/migrations/20261020000000_provider_intake_admin.sql
scripts/bootstrap-admin.ts
src/lib/mitra/{application-schema,username-rules,application-state,expiry,rate-limit}.ts (+ .test.ts)
src/lib/email.ts
src/lib/email-templates.ts (+ .test.ts)
src/app/actions/mitra.ts           → submit, resubmit, signed-upload-url, status
src/app/actions/admin-mitra.ts     → approve, reject, checklist, sweep, resend-email
src/app/mitra/page.tsx
src/app/mitra/psikolog/page.tsx
src/app/mitra/pendamping/page.tsx
src/app/mitra/status/page.tsx
src/app/akun/page.tsx
src/app/admin/page.tsx              → shell + tab Ringkasan
src/app/admin/verifikasi/page.tsx
src/app/admin/litera/page.tsx      → shell + tab Litera
src/components/mitra/*              → form multi-step, field, upload
src/components/admin/*              → queue, detail, checklist, overview
src/middleware.ts                   → guard admin + root routes
src/lib/supabase/types.ts           → 3 tabel baru
tests/e2e/mitra-intake.spec.ts      → T1, T2, T3
docs/qa/mitra-intake-admin-qa.md    → SOP + checklist manual QA
docs/qa/mitra-intake-rollback.md    → R11
```

---

## 16. Di Luar Scope (YAGNI) & Sub-proyek Lanjutan

| Item | Alasan | Pindah ke |
|---|---|---|
| `provider_settings` (tarif, kalender, modalitas, buffer time) — kedaulatan penuh | Butuh UI `/praktik` | **SP-2** |
| `provider_client_notes` (catatan klien privat) | Butuh `/praktik` + model lanjutan | **SP-2** |
| `payout_requests` + pencairan | Butuh rekening & pembayaran | **SP-3** |
| `referral_credits` | Butuh atribusi artikel → sesi | **SP-3** |
| Langganan paket (Cerita/Dengar) & checkout | Semua provider baru default **Sapa (gratis)** sampai SP-3 | **SP-3** |
| Cohort pelatihan PFA | `pfa_status` + `pfa_evidence` dirancang agar migrasi tanpa ubah skema | **SP-3/4** |
| Integrasi WhatsApp Business API | Butuh biaya & persetujuan nomor | **SP-4** |

**SP-2 — Ruang Praktik `/praktik`:** dashboard operasional provider (jadwal slot, sesi masuk, catatan klien privat, pendapatan, pengaturan tarif & kalender).
**SP-3 — Monetisasi:** langganan paket (dua tangga harga per role), pencairan dana, kredit rujukan penulis.

---

## 17. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Spam/penyalahgunaan form publik | Antrean penuh & biaya review membengkak | P3 (honeypot, Turnstile, rate limit, blok email disposable) + flag rollout bertahap |
| Pelamar mendaftar tapi tidak pernah verifikasi email | Username/subdomain dikuasai sia-sia | P1 (verifikasi sebelum approve) + P2 (release username saat expire) |
| Admin salah approve (STR/SIPP tidak aktif) | Risiko etis & hukum | Red flag wajib terlihat + checklist admin + P6 + audit log P8 |
| Dokumen kredensial bocor |privasi & reputasi | Bucket privat, signed URL 60 detik, deny-all RLS, audit `DOCUMENT_VIEWED`, retensi 90 hari (P7) |
| Gagal bayar gateway / email down | Kehilangan notifikasi | Approve tidak bergantung pada email; tombol resend; status "email gagal" |
| Penyimpanan bukti STR/SIPP disalahgunakan | Pelanggaran etika & hukum | Kode etik ditegakkan tegas; P1 (verifikasi wajib) sebelum data diproses; P7 mengunci retensi 90 hari; P8 mencatat siapa yang membuka berkas |
| Scope creep ke SP-2/SP-3 | Proyek melebar | YAGNI list di §16 + spec terpisah |

---

## 18. Increment untuk Implementation Plan

Spesifikasi ini diimplementasikan dalam 4 increment (satu plan, 4 fase-commit):

| Increment | Isi | Gate |
|---|---|---|
| **I1 — Fondasi admin** | Migrasi DB + 3 tabel + bucket + RLS deny-all · bootstrap admin · guard `is_admin` di middleware + Server Action · shell `/admin` 3 tab · PIN gate Litera dihapus · `admin_audit_log` aktif | Migrasi idempoten, RLS terverifikasi, `/admin` terkunci tanpa flag |
| **I2 — Intake psikolog** | `/mitra` hub + `/mitra/psikolog` (3 langkah) · guest-first createUser + profil · signed upload · validasi schema + username rules + rate limit + honeypot · email konfirmasi (Supabase) · `/mitra/status` | E2E alur inti lolos |
| **I3 — Pendamping + area akun** | `/mitra/pendamping` (2 langkah) · entry dari `/akun` · area akun 2 tab · ajukan ulang (SUPERSEDED) · checklist admin · approve/reject atomik + race guard · red flags | E2E companion & approve/reject lolos |
| **I4 — Polish & rekaman** | Adapter email (Resend/Brevo) + 6 template · sweep TTL + release username · purge retensi 90 hari · Overview metrics · audit trail UI · E2E a11y + visual regression + RLS CI | Semua checklist §13 hijau |

Setiap increment adalah PR tersendiri ke `main` (dengan PR + review), mengikuti strategi branch repo.

---

## 19. Open Questions

Tidak ada pertanyaan terbuka yang menghalangi implementasi. Keputusan yang masih dapat ditinjau saat implementasi (tidak mengubah arsitektur): nama label UI persis untuk status (`Menunggu verifikasi mitra`), urutan field di form, dan copy email.
