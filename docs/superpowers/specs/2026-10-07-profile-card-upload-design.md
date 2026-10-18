# Desain: Card Profil & Upload Gambar Profil (Avatar + Banner)

Tanggal: 2026-10-07
Status: disetujui user (keputusan visual lewat visual companion: banner-A, tombol-A, widget-A; keputusan arsitektur: Supabase Storage)

## Konteks & Tujuan

Dua masalah yang dilaporkan user (screenshot produksi):

1. **Card profil kreator** (`ProfileBanner.tsx`) terasa belum selesai:
   - Banner kosong (fallback) berupa gradient beige kusam — pola titik tak terlihat (`mix-blend-overlay` + opacity rendah) dan overlay `from-black/25` membuat band bawah keruh.
   - Tiga tombol aksi (Edit Profil / Tulis di Web Builder / Keluar) wrap sebagian: "Keluar" jatuh ke baris sendiri menyisakan baris berantakan.
2. **Dialog Edit Profil Kreator** (`EditProfileModal.tsx`) meminta user menempel **URL** untuk avatar & banner — user awam tak punya URL gambar. Harus bisa upload file dari perangkat.

Keberhasilan: card tampil rapi di semua lebar (tombol tak pernah patah sebagian), banner kosong hidup sesuai identitas Warm Sanctuary, dan user bisa memilih gambar dari perangkat lalu melihatnya tampil di card setelah simpan.

## Keputusan

| Aspek | Keputusan |
|---|---|
| Banner kosong | **A — Pola titik + blob lembut** (gradasi hangat + titik pink terlihat + 2 blob; overlay gelap dihapus) |
| Susunan tombol | **A — Satu baris atomik, Keluar jadi ikon ghost** |
| Widget upload | **A — Ringkas inline** (preview + "Pilih Gambar" + "Hapus") |
| Penyimpanan | **Supabase Storage** bucket `profile-media` (public) |
| Batas file | avatar ≤ 2MB, banner ≤ 5MB; tipe JPEG/PNG/WebP/AVIF |
| Backend profil | **Tanpa perubahan** — `updateProfileAction` tetap menerima URL |

## Seksi 1 — Card profil (`src/app/tenant/[username]/components/ProfileBanner.tsx`)

### Banner

- Base gradient diganti: `bg-[linear-gradient(120deg,#fae8df_0%,#f4d7c8_55%,#eed2c4_100%)]`.
- Lapisan titik (fallback only): `bg-[radial-gradient(#F7ABC5_1.3px,transparent_1.3px)] [background-size:14px_14px] opacity-65` — **hapus** `mix-blend-overlay` (penyebab pola pudar tak terlihat).
- Dua blob absolut: lingkaran `~110px` pink `rgba(247,171,197,.5)` di kanan-atas (sebagian keluar tepi), lingkaran `~80px` ungu `rgba(63,55,102,.10)` di kiri-bawah.
- **Hapus sepenuhnya** `<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />` — penyebab band bawah kusam; tidak diperlukan karena tak ada teks di atas banner.
- Cabang banner ber-gambar tetap `<img object-cover>` tanpa overlay.

### Tombol aksi (blok `isOwnProfile`)

- Grup ketiga tombol dibungkus kontainer **atomik** `flex flex-nowrap items-center gap-2.5` — di dalam grup tak pernah terjadi wrap sebagian; pembungkus luar yang sudah `flex-wrap` membuat SELURUH grup pindah baris dengan rapi bila sempit.
- **Keluar** berubah dari tombol teks menjadi **ikon ghost**:
  - SVG ikon logout (path `M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1`, stroke 2.2), `rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400` + hover `border-rose-200 bg-rose-50 text-rose-600`.
  - `title="Keluar dari akun Anda"` dan `aria-label="Keluar dari akun Anda"` dipertahankan; tetap `type="submit"` dalam `form action={signOutAction}`.
- Gaya Edit Profil (outline) dan Tulis di Web Builder (3D pink `shadow-[0_3px_0_0_#3F3766]`) **tidak berubah**, kecuali penyesuaian lebar micro agar grup muat di layar 360–375px: emoji `✏️` pada tombol Tulis dilepas dan padding horizontal kedua tombol teks ditgetat satu langkah (`px-4` → `px-3`).
- Blok identitas diberi `min-w-0` agar tak mendesak grup tombol.
- Varian pengunjung (Ikuti/Bagikan) ikut memakai kontainer atomik yang sama; gaya tombol varian pengunjung tidak diubah.
- Bio, social links, stats row: **tidak disentuh**.

## Seksi 2 — Arsitektur upload (Supabase Storage)

### Bucket & policy (langkah manual user — 1x)

Jalankan di Supabase Dashboard → SQL Editor:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

create policy "public read profile-media"
on storage.objects for select
using (bucket_id = 'profile-media');

create policy "owner upload profile-media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner delete profile-media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

- `file_size_limit` + `allowed_mime_types` di-enforce **oleh layanan Storage**, bukan cuma UI. (Batas 5MB berlaku untuk semua file di bucket; batas avatar 2MB adalah aturan UI yang lebih ketat — cukup karena tujuan kompresi tampilan, tidak perlu policy terpisah.)
- Policy insert/delete membatasi path ke folder `<uid>/` milik pemohon.
- Klausa `to authenticated` + `auth.uid()` membuat policy error yang jelas saat sesi hilang.
- Verifikasi setelah user menjalankan: `GET /storage/v1/bucket` dengan anon key harus menampilkan `profile-media`.

### Alur upload

1. UI: `<input type="file" accept="image/jpeg,image/png,image/webp,image/avif">` tersembunyi; tombol "Pilih Gambar" memicunya.
2. Validasi cepat di klien: `file.type` termasuk yang diizinkan; ukuran ≤ 2MB (avatar) / ≤ 5MB (banner).
3. Upload **langsung browser → Storage** memakai `src/lib/supabase/client.ts` (createBrowserClient) — melewati limit body 4.5MB Vercel; RLS menjamin user hanya menulis ke folder sendiri.
4. Path: `<uid>/avatar-<Date.now()>.<ext>` dan `<uid>/banner-<Date.now()>.<ext>` — nama unik mencegah gambar CDN/HTTP basi (URL selalu berubah saat ganti gambar).
5. `upload(..., { upsert: false })` → `getPublicUrl` → URL publik dimasukkan ke state form.
6. Tombol **Simpan Perubahan** memanggil `updateProfileAction` yang sudah ada — kolom `avatar_url`/`banner_url` (TEXT) menerima URL apa pun; **nol perubahan backend profil**.

### Lifecycle object (best-effort, tak menggagalkan aksi utama)

| Aksi | Object |
|---|---|
| Ganti gambar lalu simpan | object baru tersimpan; object lama dihapus best-effort **hanya jika** URL lamanya cocok pola `…/storage/v1/object/public/profile-media/<uid>/…` (milik sendiri); URL external tak pernah disentuh |
| Tekan "Hapus" | state URL dikosongkan; object lama (milik sendiri) dihapus best-effort |
| Tutup/batal dialog dengan upload baru yang belum disimpan | object baru (pending) dihapus best-effort |
| URL lama external (googleusercontent, unsplash, …) | tetap tampil & valid; "Hapus" hanya mengosongkan state, tidak menyentuh URL external |

Helper logika (validasi, path, upload, cleanup) ditaruh di **`src/lib/profile-media.ts`** terpisah — modal tinggal memanggil, unit bisa dibaca/diuji sendiri.

## Seksi 3 — Widget dialog (`EditProfileModal.tsx`)

### Baris Avatar

- Preview bulatan 44px (URL state saat ini; fallback inisial) + tombol outline `Pilih Gambar` + link teks `Hapus` (hanya bila ada nilai) + hint `JPG/PNG/WebP · maks 2MB`.

### Baris Banner

- Strip preview tinggi ~56px (rounded, `object-cover`) + tombol & link yang sama + hint `JPG/PNG/WebP · maks 5MB`.

### Perilaku

- Saat mengunggah: tombol `Pilih Gambar` menampilkan label "Mengunggah…" + spinner; tombol **Simpan** ikut `disabled` sampai upload selesai (mencegah simpan tanpa URL final).
- Field URL diganti sepenuhnya — tidak ada input URL untuk avatar/banner (website & Facebook tetap input URL, memang URL).
- State baru: `uploading: "avatar" | "banner" | null` dan `pendingUpload: string | null` (URL baru yang belum disimpan).

### Error handling (memakai banner merah yang sudah ada)

- Salah tipe: `Format harus JPG, PNG, WebP, atau AVIF.`
- Kelebihan ukuran: `Ukuran maksimal 2MB.` / `Ukuran maksimal 5MB.`
- Gagal upload/storage belum terkonfigurasi: `Gagal mengunggah gambar — coba lagi.` (detail error di-log ke console)
- Semua kasus: state form tidak rusak (URL lama tetap utuh), tombol kembali aktif.

## Seksi 4 — Verifikasi

1. **Gate**: `npm run lint`, `npx tsc --noEmit`, `npm run build` = 0/0/0.
2. **Probe Chrome headless** (`playwright-core` + `channel:"chrome"`, terhadap `next build && next start` lokal — DB remote yang sama):
   - Kartu varian **pengunjung** `axaalexxa` (banner kosong = kasus screenshot) di lebar 1280 / 768 / 375: grup tombol tak pernah patah sebagian, banner fallback menampilkan gradasi + titik + blob, tak ada overlay gelap.
   - `EditProfileModal` dirender via halaman fixture lokal `dev-probe-card` (Task 2 pada plan; fixture dihapus sebelum commit) — dialog & widget teruji tanpa sesi login.
3. **E2E dengan sesi login** (upload nyata + kartu milik sendiri + tombol ikon Keluar): user test di **produksi setelah merge** — sesi login lokal tidak bisa dibuat (konfirmasi email aktif, tanpa service-role, anonymous disabled — temuan PR #63).
4. **Urutan**: merge → user jalankan SQL bucket → verifikasi upload di produksi.

## File yang Disentuh

- `src/app/tenant/[username]/components/ProfileBanner.tsx` — banner + grup tombol
- `src/app/tenant/[username]/components/EditProfileModal.tsx` — widget upload
- `src/lib/profile-media.ts` — **baru**: validasi, path, upload, cleanup
- `docs/superpowers/specs/2026-10-07-profile-card-upload-design.md` — spec ini

Tidak ada dependency baru (supabase-js sudah menyertakan storage API), tidak ada perubahan kolom DB, tidak ada perubahan `updateProfileAction`.

## Di Luar Cakupan

- Image cropping/resize otomatis (tampil `object-cover` sudah cukup)
- Upload gambar untuk konten artikel Web Builder (topik terpisah)
- Menghapus URL external yang sudah ada
- Perubahan bio/stats/social pada card
