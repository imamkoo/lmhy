# Prosedur Rollback: Mitra Intake & Admin Verification Queue

Panduan darurat untuk membatalkan perubahan sistem dan mengembalikan database serta penyimpanan ke kondisi stabil apabila terjadi kegagalan kritis pada peluncuran SP-1.

---

## 1. Urutan Penurunan & Pembersihan (Rollback Steps)

Bila terjadi insiden kritis di produksi:

1. **Matikan Akses Frontend (Immediate Kill-switch):**
   Ubah environment variable di Vercel:
   ```bash
   NEXT_PUBLIC_MITRA_INTAKE_ENABLED=false
   NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED=false
   NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED=false
   ```
   Lakukan Redeploy cepat (*Instant Rollback Deployment*).

2. **Bersihkan Penyimpanan Berkas Kredensial:**
   Hapus seluruh objek di dalam bucket privat sebelum bucket dihapus:
   ```sql
   DELETE FROM storage.objects WHERE bucket_id = 'provider-credentials';
   DELETE FROM storage.buckets WHERE id = 'provider-credentials';
   ```

3. **Batalkan Perubahan Skema Database:**
   Eksekusi skrip SQL rollback pada Supabase SQL Editor (lihat Bagian 2).

4. **Kembalikan Role Profil Pengguna (Bila ada data uji coba):**
   Kembalikan pengguna yang sempat disetujui selama pengujian:
   ```sql
   UPDATE public.profiles
   SET creator_role = 'PENULIS',
       service_track = NULL,
       verification_status = 'NONE'
   WHERE verification_status IN ('PENDING', 'APPROVED', 'REJECTED');
   ```

---

## 2. Skrip SQL Rollback Komprehensif

Simpan atau jalankan skrip berikut untuk mencabut seluruh tabel, fungsi, trigger, dan bucket yang dibuat pada migrasi `20261020000000_provider_intake_admin.sql` dan `20261020010000_admin_audit_document_purged.sql`:

```sql
-- 1. Hapus Storage Bucket & Objek
DELETE FROM storage.objects WHERE bucket_id = 'provider-credentials';
DELETE FROM storage.buckets WHERE id = 'provider-credentials';

-- 2. Hapus Trigger & Fungsi Database
DROP TRIGGER IF EXISTS tr_provider_applications_updated_at ON public.provider_applications;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.release_mitra_username(uuid);

-- 3. Hapus Tabel-tabel Kemitraan (Deny-All RLS)
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.provider_documents CASCADE;
DROP TABLE IF EXISTS public.provider_applications CASCADE;

-- 4. Kembalikan Kolom Tambahan pada Tabel Profiles (Opsional bila ingin bersih penuh)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS verified_at,
  DROP COLUMN IF EXISTS verified_by,
  DROP COLUMN IF EXISTS verification_note;
```

---

## 3. Checklist Verifikasi Pasca Rollback

- [ ] Route `/mitra` dan `/mitra/psikolog` menampilkan status tidak aktif atau redirect aman.
- [ ] Route `/admin/verifikasi` tidak dapat diakses atau diarahkan kembali ke `/admin`.
- [ ] Tidak ada error unhandled exception pada log runtime Vercel.
- [ ] Database query `SELECT count(*) FROM public.profiles` berjalan normal tanpa foreign key orphaning.
