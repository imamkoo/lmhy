# Runbook Rollout: Mitra Intake & Antrean Verifikasi Admin (SP-1)

Panduan eksekusi end-to-end dari nol ke produksi. Ikuti **berurutan** — setiap langkah mengasumsikan langkah sebelumnya sudah selesai.

Estimasi total waktu: **45–60 menit** (terutama menunggu redeploy Vercel).

---

## 🚀 Jalur Otomatis (disarankan)

Langkah 1–4 bisa dijalankan **satu perintah** lewat `scripts/rollout-mitra-intake.mjs`:

```bash
export SUPABASE_PAT="sbp_xxx"     # https://supabase.com/dashboard/account/tokens
export VERCEL_TOKEN="xxx"         # https://vercel.com/account/tokens

npm run rollout:mitra -- --dry-run   # 1. lihat rencananya tanpa mengubah apa pun
npm run rollout:mitra                # 2. eksekusi
```

Yang dilakukan skrip, berurutan:

| # | Langkah | Verifikasi di output |
|---|---|---|
| 1 | Terapkan 2 migrasi via Supabase Management API (multi-statement, fallback per statement) | `✓ …sql diterapkan` |
| 2 | Verifikasi: 3 tabel, bucket private, 0 policy RLS, fungsi `release_mitra_username` | `✓ 3 tabel mitra ada` · `✓ RLS deny-all terverifikasi` |
| 3 | Resolve project Vercel + ambil `SUPABASE_SERVICE_ROLE_KEY` | `✓ project: lmhy (…)` |
| 4 | Buat/flag akun admin (`email_confirm: true` + `app_metadata.is_admin`) | `✓ app_metadata.is_admin = true` |
| 5 | Set env var di Vercel (create/update, skip yang tidak berubah) | `✓ total: N dibuat · N diperbarui` |
| 6 | Trigger redeploy production + tunggu sampai `READY` | `✓ deployment production READY` |
| 7 | Simpan semua secret ke `.env.local` (gitignored) | `✓ .env.local diperbarui` |

**Opsi:**
```bash
--dry-run            # hanya menampilkan rencana
--phase=1|2|3|4|5    # fase rollout (default 1 = semua flag false)
--admin-email=...    # default admin@letmehearyou.id
--skip-migrations    # lewati langkah 1–2
--skip-admin         # lewati langkah 4
--skip-vercel        # lewati langkah 3, 5, 6
```

> ⚠️ Skrip **tidak menghapus** env var Vercel yang tidak lagi dipakai — hanya memberi tahu. Hapus manual bila perlu.
> ⚠️ Secret (`MITRA_UPLOAD_SECRET`, `SWEEP_SECRET`, `CRON_SECRET`) di-generate otomatis bila env lokal kosong. **Nilai berbeda = endpoint cron tidak sinkron** — pakai yang tertulis di `.env.local` untuk pemanggilan manual.
---

## 👤 Jalur Manual (kalau tidak mau/token tidak bisa dibagikan)

### TL;DR — 8 Langkah

```
□ 1. Terapkan 2 migrasi SQL di Supabase        (10 menit)
□ 2. Isi 7 env var di Vercel + REDEPLOY        (15 menit)
□ 3. Bootstrap akun admin + login ulang        (5 menit)
□ 4. Verifikasi RLS + endpoint cron             (5 menit)
□ 5. Jalankan 21 skenario QA manual             (30 menit)
□ 6. Naikkan flag ke Fase 2 (whitelist QA)      (5 menit)
□ 7. Naikkan ke Fase 3 (shadow mode) → Fase 4  (1 minggu)
□ 8. Isi env Midtrans + REDEPLOY → lanjut QA A5 (terpisah)
```

---

## Langkah 1 — Terapkan Migrasi DB di Supabase

**Menuju:** Supabase Dashboard → project **Let Me Hear You** → menu **SQL Editor** → **New query**

### 1.1 Migration 1 (wajib)

Copy **seluruh isi** file berikut dan paste ke SQL Editor, lalu klik **Run**:

```
supabase/migrations/20261020000000_provider_intake_admin.sql
```

**Harus:** `Success. No rows returned` (tidak ada error).
File ini **idempoten** — aman dijalankan 2×.

### 1.2 Migration 2 (wajib)

Buat query baru, paste, **Run**:

```
supabase/migrations/20261020010000_admin_audit_document_purged.sql
```

**Harus:** `Success. No rows returned`.

### 1.3 Cek cepat (SQL Editor)

```sql
-- harus mengembalikan 3
SELECT count(*) AS tabel_mitra
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('provider_applications','provider_documents','admin_audit_log');

-- harus mengembalikan 1, public = false
SELECT id, public FROM storage.buckets WHERE id = 'provider-credentials';

-- harus 0 baris (deny-all)
SELECT count(*) FROM pg_policies
WHERE tablename IN ('provider_applications','provider_documents','admin_audit_log');
```

**Kalau `tabel_mitra` ≠ 3** → migration belum lengkap, ulangi Langkah 1.1.

---

## Langkah 2 — Isi Env Var di Vercel

**Menuju:** Vercel Dashboard → project **lmhy** → **Settings** → **Environment Variables**

> ⚠️ Pilih tab **Production** (dan opsional **Preview** bila ingin preview ikut berfungsi).
> ⚠️ `NEXT_PUBLIC_*` di-bake saat **build time** — wajib **Redeploy** setelah mengubah env, jangan hanya simpan.

| # | Env Var | Contoh / Cara Dapat | Wajib |
|---|---|---|:---:|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` → `sb_secret_...` | 🔴 |
| 2 | `MITRA_UPLOAD_SECRET` | `openssl rand -hex 32` | 🔴 |
| 3 | `SWEEP_SECRET` | `openssl rand -hex 32` | 🔴 |
| 4 | `CRON_SECRET` | `openssl rand -hex 32` (Vercel Cron — **boleh nilai sama dengan `SWEEP_SECRET`**) | 🟡 |
| 5 | `RESEND_API_KEY` | resend.com → API Keys (`re_...`) | 🟡 |
| 6 | `BREVO_API_KEY` | brevo.com → SMTP & API → API Keys (`xkeysib-...`) — opsional bila #5 terisi | 🟢 |
| 7 | `EMAIL_FROM` | `Let Me Hear You <halo@letmehearyou.com>` | 🟡 |
| 8 | `ADMIN_SYSTEM_ACTOR_ID` | UUID akun admin (dari Langkah 3) — boleh dikosongkan | 🟢 |
| 9 | `APP_URL` | `https://letmehearyou.id` | 🟡 |
| 10 | `NEXT_PUBLIC_MITRA_INTAKE_ENABLED` | `false` (Fase 1) | 🟡 |
| 11 | `NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED` | `false` (Fase 1) | 🟡 |
| 12 | `NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED` | `false` (Fase 1) | 🟡 |
| 13 | `MITRA_INTAKE_SHADOW_MODE` | `false` (Fase 1) | 🟡 |
| 14 | `MITRA_INTAKE_WHITELIST_EMAILS` | kosong (Fase 1) | 🟢 |
| 15 | `MIDTRANS_SERVER_KEY` | Midtrans Dashboard → Access Keys | 🟠 (Langkah 8) |
| 16 | `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Midtrans Dashboard → Access Keys | 🟠 (Langkah 8) |

**Generate secret dengan aman:**
```bash
openssl rand -hex 32
```

### Redeploy (WAJIB)

Vercel → tab **Deployments** → klik `⋮` pada deployment terbaru → **Redeploy** → confirm.

> Cek: `curl -sI https://letmehearyou.id/mitra/psikolog | head -1` → harus `200`. Halaman menampilkan "Segera hadir" selama flag masih `false` — itu **benar** untuk Fase 1.

---

## Langkah 3 — Bootstrap Akun Admin

### 3.1 Pastikan akun sudah ada di Supabase Auth

Supabase → **Authentication** → **Users** → **Add user** (atau pakai email konfirmasi) dengan email admin, misal `admin@letmehearyou.id`. Centang **Auto Confirm User**.

### 3.2 Pasang flag admin

```bash
# Dari root repo
export SUPABASE_SERVICE_ROLE_KEY="sb_secret_xxx"
export NEXT_PUBLIC_SUPABASE_URL="https://wzywhjsxrbkgoxaingar.supabase.co"

node scripts/bootstrap-admin.mjs admin@letmehearyou.id
# → "Admin access granted to admin@letmehearyou.id"
```

### 3.3 Ambil UUID untuk `ADMIN_SYSTEM_ACTOR_ID`

```bash
node -e "
import('@supabase/supabase-js').then(async ({createClient}) => {
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await s.auth.admin.listUsers();
  const u = data.users.find(x => x.email === 'admin@letmehearyou.id');
  console.log(u.id);
});
"
```

Salin UUID-nya ke env var `ADMIN_SYSTEM_ACTOR_ID` di Vercel, lalu **Redeploy** lagi.

### 3.4 Login ulang

Buka `https://letmehearyou.id/login`, login sebagai admin, lalu buka `/admin`.
Harus masuk ke dashboard "Kontrol LMHY" (bukan redirect).

---

## Langkah 4 — Verifikasi RLS & Endpoint Cron

### 4.1 Verifikasi RLS

```bash
export SUPABASE_SERVICE_ROLE_KEY="sb_secret_xxx"
export NEXT_PUBLIC_SUPABASE_URL="https://wzywhjsxrbkgoxaingar.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
node scripts/verify-rls.mjs
```

**Harus keluar persis:**
```
PASS anon ditolak pada 3 tabel
PASS service role dapat membaca
PASS anon ditolak pada bucket
```

### 4.2 Uji endpoint sweep (tanpa secret → 404)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://letmehearyou.id/api/internal/sweep
# → 404 (endpoint tersembunyi saat secret belum set) ATAU 401 (secret set, tanpa header)
```

### 4.3 Uji endpoint sweep (dengan secret)

```bash
export APP_URL="https://letmehearyou.id"
export SWEEP_SECRET="<isi dengan nilai yang sama di Vercel>"

node scripts/sweep-expired-applications.mjs
# → "Sweep completed successfully: Expired emails (>7d): 0, ..."
```

### 4.4 Uji endpoint purge dokumen

```bash
node scripts/sweep-expired-applications.mjs purge-documents
# → "Purge dokumen kredensial lewat 90 hari completed successfully: Purged documents: 0, Errors: 0"
```

### 4.5 Pastikan cron terdaftar

Vercel → **Settings** → **Cron Jobs**. Harus terlihat 2 entri:

| Path | Schedule | Arti |
|---|---|---|
| `/api/internal/sweep` | `0 20 * * *` (03:00 WIB) | Sweep kedaluwarsa harian |
| `/api/internal/purge-documents` | `30 3 * * 1` (10:30 WIB) | Purge dokumen 90 hari (minggu) |

> ⚠️ **Paket Hobby**: cron hanya bisa jalan **sekali per hari** dan jadwalnya bisa dieksekusi kapan saja dalam jam tersebut. Ekspresi seperti `*/5 * * * *` akan **gagal deploy** dengan pesan *"Hobby accounts are limited to daily cron jobs."* Jadwal di atas aman.
> ⚠️ **Format cron 5 field: `menit jam hari-bulan bulan hari-minggu`.** Field `jam` maksimal **23**, `menit` maksimal **59**. Kesalahan ini **menggagalkan seluruh deploy**, bukan cuma cron-nya:
> ```
> Error while validating your Cron Jobs expressions:
>   - Number 30 of hours field is bigger than upper limit '23' (Input cron: '0 30 3 * *')
> ```
> Cron `0 30 3 * *` bermaksud "menit 0, jam 30" — bukan "jam 3 menit 30". Yang benar untuk **03:30** adalah `30 3 * * *` (menit 30, jam 3). `0 20 20 * *` = tanggal 20 tiap bulan, bukan setiap hari — untuk **setiap hari jam 20:00** yang benar `0 20 * * *`.
> ⚠️ **Vercel tidak me-retry** cron yang gagal → cek **View Logs** di halaman Cron Jobs secara berkala.

---

## Langkah 5 — Jalankan 21 Skenario QA Manual

Buka `docs/qa/mitra-intake-admin-qa.md` → Section 2. Ganti `⏳ TODO` dengan `✅ PASS` / `❌ FAIL` + catatan.

**Akun yang dipakai:**

| Peran | Email | Prasyarat |
|---|---|---|
| Admin | `admin@letmehearyou.id` | Sudah di-bootstrap (Langkah 3) |
| Pelamar psikolog (guest) | email baru, mis. `qa.praktisi.01@gmail.com` | Diverifikasi email-nya (buka link konfirmasi) |
| Pelamar pendamping (member) | `qa.pendamping.pending@gmail.com` | Login sebagai `PENULIS` |
| Klien biasa | `qa.klien.01@gmail.com` | Untuk uji guard admin (Skenario 12) |

**Catatan penting per skenario:**

- **Skenario 6 (unggah berkas):** siapkan file PDF dummy ber-STR aktif & nomor STR valid untuk Skenario 15/18.
- **Skenario 20 (double approve):** butuh **2 browser/sesi** berbeda. Cara tercepat: 1 tab normal + 1 **Incognito** (login admin di keduanya), atau dua profil browser.
- **Skenario 16 (signed URL):** setelah membuka dokumen, verifikasi audit log:
  ```sql
  SELECT action, actor_id, target_id, created_at
  FROM admin_audit_log ORDER BY created_at DESC LIMIT 5;
  ```
  Harus ada baris `DOCUMENT_VIEWED`.

---

## Langkah 6 — Flag Fase 2 (Smoke Test Internal)

1. Vercel → Environment Variables → set:
   ```
   NEXT_PUBLIC_MITRA_INTAKE_ENABLED=true
   NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED=true
   NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED=true
   MITRA_INTAKE_WHITELIST_EMAILS=qa.praktisi.01@gmail.com,qa.pendamping.pending@gmail.com
   MITRA_INTAKE_SHADOW_MODE=true
   ```
2. **Redeploy**.
3. Cek: `https://letmehearyou.id/mitra/psikolog` → form tampil (bukan "Segera hadir").
4. Jalankan ulang skenario QA 1–11 dengan email whitelisted.

> 💡 `MITRA_INTAKE_SHADOW_MODE=true` → pengajuan **masuk antrean**, tapi approve/reject membalas *"Shadow mode aktif: keputusan dinonaktifkan."* Ini safety net: Anda bisa menguji alur penuh tanpa memberi role ke siapa pun.

---

## Langkah 7 — Naik ke Fase 4 & 5

| Fase | Action | Kapan |
|---|---|---|
| **Fase 3** (shadow) | Biarkan 1 minggu. Pantau `/admin` → bar "Peringatan SLA" & feed aktivitas. Perbaiki bug validasi yang ketahuan. | 7 hari |
| **Fase 4** (bertahap) | `MITRA_INTAKE_SHADOW_MODE=false`, `NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED=false`, whitelist email dibuka bertahap (10 → 30 → 100%). Redeploy. | Setelah shadow mode bersih |
| **Fase 5** (normal) | `MITRA_INTAKE_PENDAMPING_ENABLED=true`, `MITRA_INTAKE_WHITELIST_EMAILS` dikosongkan. Redeploy. | Setelah beban review terkendali |

**Pantau median waktu review** di `/admin` — target ≤ 3 hari (batas SLA).

---

## Langkah 8 — Midtrans (terpisah dari SP-1)

1. Midtrans Dashboard → **Settings** → **Access Keys** → salin **Server Key** & **Client Key**.
2. Vercel → Environment Variables → `MIDTRANS_SERVER_KEY` & `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
3. `MIDTRANS_ENV`: `sandbox` untuk testing, `production` saat live.
4. **Redeploy**.
5. Lanjut QA **A5** di `docs/qa/sanctuary-studio-and-litera-manual-qa.md` §A5 (A5.2 Booking, A5.4 Webhook).

---

## 🛟 Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `/api/internal/sweep` balas **404** | `SWEEP_SECRET` & `CRON_SECRET` belum di-set di Vercel | Set keduanya, redeploy |
| `/api/internal/sweep` balas **401** | Header tidak cocok | `x-sweep-secret: $SWEEP_SECRET` atau `Authorization: Bearer $CRON_SECRET` |
| `/admin` redirect ke `/` | `app_metadata.is_admin` belum di-set / session lama | Jalankan `bootstrap-admin.mjs`, lalu **login ulang** |
| `/mitra/psikolog` masih "Segera datang" | Flag belum di-set / belum redeploy | Set flag, redeploy |
| Submit gagal "Token unggah belum dikonfigurasi" | `MITRA_UPLOAD_SECRET` kosong | Set di Vercel, redeploy |
| "Pendaftaran saat ini terbatas..." | Email tidak ada di whitelist | Tambahkan email ke `MITRA_INTAKE_WHITELIST_EMAILS` |
| "Shadow mode aktif: keputusan dinonaktifkan" | `MITRA_INTAKE_SHADOW_MODE=true` | Expected di Fase 3. Set `false` untuk Fase 4+ |
| Tabel tidak ditemukan saat submit | Migrasi belum diterapkan | Ulangi Langkah 1 |
| Error `PGRST205` / `Bucket not found` | Migrasi/bucket belum ada | Ulangi Langkah 1, lalu `verify-rls.mjs` |

---

## 📎 Referensi

| Dokumen | Isi |
|---|---|
| `docs/qa/mitra-admin-sop.md` | SOP review harian, kapan approve vs reject, template pesan WA |
| `docs/qa/mitra-intake-admin-qa.md` | 21 skenario QA manual + matriks rollout Fase 0–5 |
| `docs/qa/mitra-intake-rollback.md` | Prosedur darurat rollback + skrip SQL |
| `docs/qa/sanctuary-studio-and-litera-manual-qa.md` | QA A1–A6, B0–B3 (termasuk A5 Midtrans) |
| `docs/superpowers/specs/2026-10-20-lmhy-mitra-intake-admin-queue-design.md` | Spesifikasi desain lengkap SP-1 |
| `docs/superpowers/plans/2026-10-20-lmhy-mitra-intake-admin-queue.md` | Rencana implementasi 34 task |
