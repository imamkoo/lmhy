# Profile Card Redesign & Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merapikan card profil kreator (banner kosong lebih hidup + tombol aksi tak pernah patah sebagian) dan mengganti input URL avatar/banner di dialog Edit Profil dengan upload file sungguhan via Supabase Storage.

**Architecture:** Perubahan UI murni di dua komponen client yang sudah ada (`ProfileBanner`, `EditProfileModal`) ditambah satu modul lib baru `profile-media.ts` berisi validasi/path/upload/cleanup. Upload langsung browser → Supabase Storage bucket `profile-media` (RLS membatasi ke folder `<uid>/`), URL publik disimpan lewat `updateProfileAction` yang **tidak berubah**. Verifikasi memakai probe Chrome headless (playwright-core, `channel:"chrome"`) terhadap build produksi lokal — termasuk halaman fixture sementara `dev-probe-card` yang dirender lokal (varian profil-milik-sendiri + dialog butuh DOM tanpa sesi login) dan **dihapus sebelum commit**.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, `@supabase/ssr` + `@supabase/supabase-js` (storage API sudah termuat), `playwright-core` (dev-dependency untuk probe, sudah terpasang).

**Spec:** `docs/superpowers/specs/2026-10-07-profile-card-upload-design.md`

## Global Constraints

- Token Warm Sanctuary saja: pink `#F7ABC5`, ungu `#3F3766`, krem `#F5E7C6`, gradasi banner `#fae8df → #f4d7c8 → #eed2c4`, plus skala `slate-*` yang sudah dipakai komponen. Tanpa warna/radius/font baru di luar itu.
- JANGAN menyentuh: `src/components/landing/`, `src/styles/landing.css`, `src/app/(marketing)/`.
- `updateProfileAction`, kolom DB, dan dependency `package.json` **tidak berubah** (nol dependency baru).
- Pesan error copy persis: `Format harus JPG, PNG, WebP, atau AVIF.` · `Ukuran maksimal 2MB.` · `Ukuran maksimal 5MB.` · `Gagal mengunggah gambar — coba lagi.`
- Tanpa komentar kode yang tidak diminta (ikuti gaya file yang ada).
- Halaman fixture `src/app/dev-probe-card/` adalah alat uji TEMPORERER — **wajib dihapus di Task 4, sebelum commit apa pun**.
- **Jangan commit / push tanpa konfirmasi eksplisit user** (AGENTS.md) — konfirmasi diminta di Task 5.
- DB = Supabase remote yang sama dengan produksi. Tenant probe: `http://axaalexxa.localhost:3000/` (subdomain dev `.localhost` terbukti jalan). Banner `axaalexxa` = null (kasus screenshot).
- Gate akhir: `npm run lint`, `npx tsc --noEmit`, `npm run build` = 0/0/0.
- Setiap probe dijalankan terhadap `npm run build && npm run start` (port 3000); matikan server setelah probe (`lsof -ti :3000 | xargs kill`).

## Review Focus

Lima input/kondisi yang paling mungkin merusak software ini, tiap baris punya test di task yang memiliki kodenya:

1. **Upload file valid saat sesi/bucket belum siap** → dialog harus tetap utuh, pesan `Gagal mengunggah gambar — coba lagi.`, preview & state URL lama tidak rusak, tombol Simpan kembali aktif. *(Test: Task 3 Step "GREEN error path" — upload nyata tanpa mock.)*
2. **File salah tipe / kelebihan ukuran** → pesan persis per jenis dan **tidak ada satu pun request keluar** ke Storage. *(Test: Task 3 validasi probes dengan `page.route` listener yang menghitung request `**/storage/v1/**` = 0.)*
3. **Wrap tombol parseial di rentang breakpoint 360–768px** → grup tombol harus atomik (semua anak satu `offsetTop`) dan tak pernah membuat horizontal overflow. *(Test: Task 2 multi-width probe: `[data-testid="profile-actions"]` children offsetTop + `document.scrollWidth <= innerWidth` di 1280/768/640/390/360; graceful wrap <360 diverifikasi 320 tanpa overflow.)*
4. **Banner: overlay gelap tertinggal / pola titik tak terlihat** → elemen overlay `bg-gradient-to-t` hilang, opacity titik ≥ 0.6, dua blob ada, fallback tampil sebagai gradasi+titik+blob. *(Test: Task 1 probe DOM + screenshot.)*
5. **URL external lama (googleusercontent dll)** → tetap tampil sebagai preview, tombol Hapus hanya mengosongkan state **tanpa** mengirim DELETE ke storage untuk URL external. *(Test: Task 3 legacy-URL probe + `page.route` DELETE listener = 0.)*

Catatan probe: semua probe memakai boilerplate berikut (sesi node, `setTimeout` Node bebas; `assert` = `require("node:assert/strict")`):

```js
const { chromium } = require("playwright-core");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: W, height: 900 } });
const page = await context.newPage();
// ... assertions via locator/evaluate; selalu await browser.close()
```

---

### Task 1: Banner fallback redesign

**Files:**
- Modify: `src/app/tenant/[username]/components/ProfileBanner.tsx:87-100` (blok banner)

**Interfaces:**
- Consumes: — (murni markup Tailwind, tanpa props/state baru)
- Produces: struktur DOM banner yang diassert Task lain: tidak ada `div.bg-gradient-to-t` di dalam banner; layer titik `[background-size:14px_14px]` dengan `opacity` computed ≥ 0.6; blob `data-testid="banner-blob-pink"` dan `data-testid="banner-blob-purple"`.

- [ ] **Step 1: Tulis probe RED** `$TMPDIR/lmhy-probes/banner.mjs` terhadap `http://axaalexxa.localhost:3000/` (bangun & jalankan server dulu). Assert:

```js
// banner = ancestor dari img[alt$="Cover Banner"] ATAU dari elemen bertitik
const banner = await page.locator('div.relative.h-44, div.relative[class*="h-44"]').first();
assert(await banner.locator('div.bg-gradient-to-t').count() === 0, "overlay gelap harus dihapus");
assert(await banner.locator('[class*="background-size:14px"]').count() === 1, "layer titik harus ada");
const op = await banner.locator('[class*="background-size:14px"]').evaluate(el => +getComputedStyle(el).opacity);
assert(op >= 0.6, `opacity titik >= 0.6, dapat ${op}`);
assert(await page.locator('[data-testid="banner-blob-pink"]').count() === 1, "blob pink ada");
assert(await page.locator('[data-testid="banner-blob-purple"]').count() === 1, "blob ungu ada");
assert(await page.locator('img[alt$="Cover Banner"]').count() === 0, "axaalexxa tidak punya banner (fallback branch)");
await page.screenshot({ path: out("banner-red.png") });
```

- [ ] **Step 2: Jalankan probe → expect FAIL (RED)**
  Run: `node $TMPDIR/lmhy-probes/banner.mjs` — Expected: gagal di assertion pertama (overlay masih ada), opacity `0.4`.

- [ ] **Step 3: Implement blok banner** di `ProfileBanner.tsx` — ganti container banner & hapus overlay, persis:

```tsx
<div className="relative h-44 w-full overflow-hidden bg-[linear-gradient(120deg,#fae8df_0%,#f4d7c8_55%,#eed2c4_100%)] sm:h-56 md:h-64">
  {profile.banner_url ? (
    <img src={profile.banner_url} alt={`${displayName} Cover Banner`} className="h-full w-full object-cover" />
  ) : (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(#F7ABC5_1.3px,transparent_1.3px)] opacity-[.65] [background-size:14px_14px]" />
      <div data-testid="banner-blob-pink" className="absolute -top-12 right-12 h-32 w-32 rounded-full bg-[rgba(247,171,197,0.5)]" />
      <div data-testid="banner-blob-purple" className="absolute -bottom-8 left-16 h-24 w-24 rounded-full bg-[rgba(63,55,102,0.10)]" />
    </>
  )}
</div>
```

Hapus `<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />` **sepenuhnya** (jangan sekadar pindah ke cabang image). Pertahankan `eslint-disable-next-line @next/next/no-img-element` pada `<img>`. Hapus juga pola titik lama (`opacity-40 mix-blend-overlay bg-[radial-gradient(#F7ABC5_1px,…)`) yang membuntuti cabang else.

- [ ] **Step 4: Bangun ulang + jalankan probe → expect PASS (GREEN)**
  Run: `npm run build && npm run start` (background), lalu `node $TMPDIR/lmhy-probes/banner.mjs` — Expected: semua assert PASS; `banner-green.png` tersimpan.

- [ ] **Step 5: Cek cepat**
  Run: `npx tsc --noEmit && npm run lint` — Expected: 0 error.

---

### Task 2: Grup tombol atomik + Keluar ikon (+ halaman fixture)

**Files:**
- Create: `src/app/dev-probe-card/page.tsx` (TEMPORERER — fixture probe, dihapus Task 4)
- Modify: `src/app/tenant/[username]/components/ProfileBanner.tsx:104-234` (blok identitas + CTA)

**Interfaces:**
- Consumes: `ProfileBanner` props yang sudah ada (`profile`, `stats`, `isOwnProfile`); `EditProfileModal` (dipakai fixture untuk Task 3).
- Produces:
  - `data-testid="profile-actions"` — kontainer atomik grup tombol (kedua varian: pemilik & pengunjung).
  - Halaman fixture `http://localhost:3000/dev-probe-card` yang merender `<ProfileBanner isOwnProfile>` (banner fallback, avatar legacy URL) + `<EditProfileModal>` tertutup; tombol "Edit Profil" pada fixture membuka dialog lewat event `open-edit-profile` yang sudah ada.

- [ ] **Step 1: Buat fixture page** `src/app/dev-probe-card/page.tsx`:

```tsx
"use client";

import { ProfileBanner } from "@/app/tenant/[username]/components/ProfileBanner";
import { EditProfileModal } from "@/app/tenant/[username]/components/EditProfileModal";
import type { Profile } from "@/lib/supabase/types";

const profile = {
  id: "11111111-2222-4333-8444-555555555555",
  username: "axaalexxa",
  display_name: "Axaalexxa",
  bio: null,
  avatar_url: "https://lh3.googleusercontent.com/test-avatar",
  banner_url: null,
  website: null,
  facebook_profile_url: null,
  facebook_access_token: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
} as Profile;

export default function DevProbeCardPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <ProfileBanner
        profile={profile}
        stats={{ followersCount: 0, followingCount: 0, articlesCount: 0 }}
        isOwnProfile
      />
      <EditProfileModal profile={profile} />
    </div>
  );
}
```

(Jika field `Profile` berbeda dari daftar di atas — baca `src/lib/supabase/types.ts` — sesuaikan fixture agar tipenya cocok tanpa `any` ekstra.)

- [ ] **Step 2: Tulis probe RED** `$TMPDIR/lmhy-probes/buttons.mjs` — jalur fixture, lebar `[1280, 768, 640, 390, 360]`:

```js
for (const width of [1280, 768, 640, 390, 360]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(FIXTURE, { waitUntil: "load" });
  const group = page.locator('[data-testid="profile-actions"]');
  assert(await group.count() === 1, `grup atomik ada (width ${width})`);          // RED: belum ada
  const tops = await group.locator("> *").evaluateAll(els => els.map(e => e.offsetTop));
  assert(new Set(tops).size === 1, `tak ada wrap parsial di ${width}: tops=${tops}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, `tanpa horizontal overflow di ${width}: ${overflow}px`);
  const keluar = page.locator('form[action] button[title="Keluar dari akun Anda"]');
  assert(await keluar.count() === 1, "tombol Keluar ada");
  assert((await keluar.innerText()).trim() === "", "Keluar = ikon saja, tanpa teks"); // RED: masih "Keluar"
  assert(await keluar.locator("svg").count() === 1, "Keluar punya svg ikon");
  assert(await keluar.getAttribute("aria-label") === "Keluar dari akun Anda", "aria-label tetap");
}
// varian pengunjung di halaman tenant nyata
await page.goto(TENANT, { waitUntil: "load" });
const vgroup = page.locator('[data-testid="profile-actions"]');
assert(await vgroup.count() === 1, "grup varian pengunjung ada");                 // RED: belum ada
```

- [ ] **Step 3: Jalankan probe → expect FAIL (RED)**
  Run: `node $TMPDIR/lmhy-probes/buttons.mjs` — Expected: gagal di `grup atomik ada` (count 0).

- [ ] **Step 4: Implement grup atomik + ikon Keluar** di `ProfileBanner.tsx`:

  a. Kontainer CTA (baris 153) dipertahankan: `className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-0 sm:pb-2"`.
  b. Di dalamnya, **kedua varian** dibungkus kontainer atomik baru (dengan testid):

```tsx
<div data-testid="profile-actions" className="ml-auto flex max-[359px]:flex-wrap flex-nowrap items-center gap-2.5">
```

  `ml-auto` menempelkan grup ke kanan baik saat sebaris dengan identitas maupun saat ter-drop ke baris sendiri; `max-[359px]:flex-wrap` memberi degradasi anggun (wrap utuh, tanpa overflow) di bawah 360px.
  c. Blok identitas (baris 106) diberi `min-w-0` pada kontainer kolom teksnya.
  d. Tombol **Keluar** — ganti isi tombol teks jadi ikon ghost (form & `signOutAction` tetap):

```tsx
<form action={signOutAction} className="inline-flex">
  <button
    type="submit"
    title="Keluar dari akun Anda"
    aria-label="Keluar dari akun Anda"
    className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
  >
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  </button>
</form>
```

  e. Micro-fit (lihat spec): tombol Edit Profil & Tulis — `px-4` → `px-3`, emoji `✏️` dihapus dari tombol Tulis (shadow 3D & warna tak berubah).
  f. Jika probe masih overflow di 360: turunkan sekali lagi ke `px-2.5` (keputusan tunggal, jangan ubah hal lain).

- [ ] **Step 5: Bangun ulang + jalankan probe → expect PASS (GREEN)**
  Run: `npm run build && npm run start`, lalu `node $TMPDIR/lmhy-probes/buttons.mjs` — Expected: PASS di semua lebar + varian pengunjung. Simpan screenshot tiap lebar: `buttons-{width}.png`.

- [ ] **Step 6: Cek cepat**
  Run: `npx tsc --noEmit && npm run lint` — Expected: 0 error.

---

### Task 3: Helper upload + widget dialog (TDD via fixture & route-mock)

**Files:**
- Create: `src/lib/profile-media.ts`
- Modify: `src/app/tenant/[username]/components/EditProfileModal.tsx:19-216` (state + ganti dua baris URL jadi widget upload)

**Interfaces:**
- Consumes: `createClient()` dari `src/lib/supabase/client.ts` (sudah ada); fixture Task 2 untuk pengujian.
- Produces (dipakai modal; nama & tipe persis):

```ts
export type ProfileImageKind = "avatar" | "banner";
export const ACCEPTED_IMAGE_TYPES: readonly string[];           // jpeg, png, webp, avif
export const PROFILE_IMAGE_MAX_BYTES: Record<ProfileImageKind, number>; // avatar 2*1024*1024, banner 5*1024*1024
export function validateProfileImage(kind: ProfileImageKind, file: File):
  { ok: true } | { ok: false; error: string };                  // copy persis Global Constraints
export function buildProfileImagePath(uid: string, kind: ProfileImageKind, ext: string): string;
  // `${uid}/${kind}-${Date.now()}.${ext}` — ext dari file.type (bukan nama file)
export async function uploadProfileImage(
  client: SupabaseClient, uid: string, kind: ProfileImageKind, file: File
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }>;
  // storage.from("profile-media").upload(path, file, { upsert: false }) → getPublicUrl(path)
  // kegagalan apa pun → { ok:false, error:"Gagal mengunggah gambar — coba lagi." } (detail di console.error)
export function isOwnProfileMediaUrl(url: string, uid: string): boolean;
  // true bila url mengandung `/storage/v1/object/public/profile-media/${uid}/`
export function extractOwnProfileMediaPath(url: string, uid: string): string | null;
export async function removeProfileMedia(client: SupabaseClient, path: string): Promise<void>;
  // best-effort: selalu swallow error (try/catch + console.warn)
```

`SupabaseClient` diimpor tipenya dari `@supabase/supabase-js`. State baru modal: `uploading: "avatar" | "banner" | null` dan `pendingUpload: { url: string; path: string } | null`.

- [ ] **Step 1: Tulis probe RED** `$TMPDIR/lmhy-probes/upload.mjs` (fixture; buka dialog via klik `Edit Profil`):

```js
await page.goto(FIXTURE); await page.getByRole("button", { name: /Edit Profil/ }).click();
await page.getByRole("dialog").waitFor();
assert(await page.getByRole("button", { name: "Pilih Gambar" }).count() === 2, "dua tombol Pilih Gambar"); // RED: 0
assert(await page.locator('input[type="url"]').count() === 0, "input URL avatar/banner hilang");          // RED: masih ada (website/facebook ikut terhitung — batasi selector ke field avatar/banner bila perlu)
await page.screenshot({ path: out("upload-red.png") });
```

- [ ] **Step 2: Jalankan probe → expect FAIL (RED)**
  Run: `node $TMPDIR/lmhy-probes/upload.mjs` — Expected: gagal `dua tombol Pilih Gambar`.

- [ ] **Step 3: Implement `src/lib/profile-media.ts`** persis menurut blok Interfaces di atas (validasi urutan: tipe dulu, lalu ukuran; ext = `file.type.split("/")[1]` yang di-sanitize ke `[a-z0-9]+`, fallback `png`).

- [ ] **Step 4: Implement widget di `EditProfileModal.tsx`** — ganti dua blok "URL Foto Profil" (baris 158-187) dan "URL Banner Sampul" (baris 189-216) dengan baris inline sesuai desain A:
  - **Avatar**: label `Foto Profil (Avatar)`; preview bulatan 44px (URL state → fallback inisial) + `<input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" data-testid="input-avatar">` dipicu tombol outline `Pilih Gambar` (label `Mengunggah…` + spinner saat `uploading==="avatar"`) + link `Hapus` (bila ada nilai) + hint `JPG/PNG/WebP · maks 2MB`.
  - **Banner**: label `Banner Sampul`; strip preview h-56px rounded `object-cover` + input `data-testid="input-banner"` + tombol/hint sama, hint `JPG/PNG/WebP · maks 5MB`.
  - `handleSubmit`: `disabled={loading || uploading !== null}`.
  - `onFileSelect(kind, file)`: `validateProfileImage` → gagal: `setError(msg)` tanpa request; sukses: `setUploading(kind)` → `uploadProfileImage` → sukses: set state URL + `setPendingUpload({url, path})`; gagal: `setError("Gagal mengunggah gambar — coba lagi.")`; selalu `setUploading(null)` di `finally`.
  - `handleRemove(kind)`: bila URL sekarang `isOwnProfileMediaUrl` → `removeProfileMedia` best-effort; kosongkan state URL (external tak pernah dikirim ke mana pun).
  - `handleClose` membungkus `onClose()`: bila `pendingUpload` ada → `removeProfileMedia(path)` dulu (fire-and-forget), lalu tutup.
  - Setelah `updateProfileAction` **sukses**: `pendingUpload` di-clear (object jadi permanen); URL lama `profile.avatar_url/banner_url` bila `isOwnProfileMediaUrl` → `removeProfileMedia` best-effort.
  - Error memakai banner merah yang sudah ada; label & copy field lain (nama, bio, website, facebook) tak berubah.

- [ ] **Step 5: Bangun ulang + jalankan probe hijau pertama**
  Run: `npm run build && npm run start`, lalu `node $TMPDIR/lmhy-probes/upload.mjs` — Expected: PASS (dua tombol, input URL avatar/banner hilang; `website`/`facebook` tetap `input[type=url]` — buktikan dengan assert sisa `input[type="url"]` === 2).

- [ ] **Step 6: Probe perilaku — validasi & error path (tanpa mock, tanpa sesi)**

```js
// (a) avatar kelebihan ukuran: File 2.1MB type image/png → teks "Ukuran maksimal 2MB."
// (b) banner kelebihan ukuran: File 5.1MB type image/png → teks "Ukuran maksimal 5MB."
// (c) tipe salah: File name "x.txt" type text/plain → "Format harus JPG, PNG, WebP, atau AVIF."
// selama (a)-(c): hitung request `**/storage/v1/**` lewat page.route → wajib 0
// (d) PNG valid kecil TANPA mock → request nyata gagal (tanpa sesi/bucket) →
//     banner merah "Gagal mengunggah gambar — coba lagi."; preview avatar URL legacy utuh;
//     tombol Simpan kembali enabled; form tidak reset
// (e) preview legacy: sebelum interaksi apa pun, src preview avatar === profile.avatar_url fixture
```

Run: `node $TMPDIR/lmhy-probes/upload-behavior.mjs` — Expected: PASS semua.

- [ ] **Step 7: Probe success-path via route-mock & disabled-during-upload**

```js
await page.route("**/storage/v1/object/**", async (route) => {
  if (route.request().method() === "POST") {
    await new Promise(r => setTimeout(r, 1200));                    // Node-side delay
    await route.fulfill({ status: 200, json: { Key: "profile-media/ok" } });
    return;
  }
  await route.fulfill({ status: 200, json: {} });                   // DELETE cleanup
});
// 1) pilih PNG valid → selama flight: tombol Simpan disabled, label "Mengunggah…"
// 2) selesai → preview avatar src berubah ke URL public mock (…/profile-media/<uid>/avatar-….png)
// 3) klik "Batal" → ter_capture request DELETE ke /storage/v1/object/profile-media/<uid>/… (cleanup pending)
// (jalur Simpan-sukses-dan-hapus-object-lama tak bisa ditest tanpa sesi — diverifikasi user di produksi)
```

Run: `node $TMPDIR/lmhy-probes/upload-success.mjs` — Expected: PASS (disabled saat flight, preview berganti, DELETE ter-capture).

- [ ] **Step 8: Probe DELETE tidak pernah dikirim untuk URL external**

```js
// set avatar fixture = URL legacy; klik "Hapus" →
// 1) preview kembali ke inisial, state kosong
// 2) listener request DELETE ke storage = 0
```

Run: `node $TMPDIR/lmhy-probes/upload-external.mjs` — Expected: PASS.

- [ ] **Step 9: Cek cepat**
  Run: `npx tsc --noEmit && npm run lint` — Expected: 0 error.

---

### Task 4: Hapus fixture + gate final + probe suite

**Files:**
- Delete: `src/app/dev-probe-card/page.tsx` (beserta folder kosongnya)

**Interfaces:**
- Consumes: semua hasil Task 1-3.
- Produces: state branch siap-PR (tanpa kode probe di repo).

- [ ] **Step 1: Hapus halaman fixture**
  Run: `rm -rf src/app/dev-probe-card` — Expected: folder hilang.

- [ ] **Step 2: Gate penuh**
  Run: `npm run lint && npx tsc --noEmit && npm run build` — Expected: 0/0/0.

- [ ] **Step 3: Pastikan route fixture tak ikut ter-build**
  Run: `grep -r "dev-probe-card" .next/server/app 2>/dev/null | wc -l` (setelah build ulang) — Expected: `0`.

- [ ] **Step 4: Suite probe final terhadap build bersih** (server nyala):
  - `banner.mjs` terhadap tenant → PASS + screenshot final.
  - `buttons.mjs` jalur varian pengunjung di tenant (lebar 1280/768/390) → PASS. (Jalur fixture dalam skrip ini dilewati/dihapus dari skrip karena fixture sudah tak ada — cukup assert varian pengunjung + catatan bahwa varian pemilik teruji di Task 2 & produksi.)
  - Ringkasan screenshot disimpan untuk review user.

- [ ] **Step 5: Audit diff**
  Run: `git status --short` — Expected: hanya `ProfileBanner.tsx`, `EditProfileModal.tsx`, `src/lib/profile-media.ts`, spec, plan. Tanpa sisa fixture/probe.

---

### Task 5: Konfirmasi commit & push → PR → checklist produksi

**Files:**
- Modify: (git state saja; tanpa perubahan kode)

**Interfaces:**
- Consumes: hasil Task 1-4 yang lolos gate.
- Produces: PR ter-review + langkah verifikasi produksi untuk user.

- [ ] **Step 1: Minta konfirmasi user** (AGENTS.md): target push `main` / `develop` / `cancel`, dan struktur commit. Usulan: 2 commit logis — (A) kode: `ProfileBanner` + `EditProfileModal` + `profile-media.ts`; (B) docs: spec + plan.

- [ ] **Step 2: Setelah konfirmasi** — branch `feat/profile-card-upload`, commit sesuai struktur, push, buat PR ke `imamkoo/lmhy`, tunggu CI `quality` hijau.

- [ ] **Step 3: Setelah konfirmasi merge** — merge PR, sync `main` lokal, hapus branch lokal & remote (pola PR #61–#63).

- [ ] **Step 4: Serahkan checklist verifikasi produksi ke user:**
  1. Jalankan snippet SQL bucket (ada di spec, bagian "Bucket & policy") di Supabase Dashboard → SQL Editor.
  2. Konfirmasi ke AI → AI verifikasi `GET /storage/v1/bucket` menampilkan `profile-media`.
  3. Login → buka profil sendiri → Edit Profil → upload avatar & banner dari perangkat → Simpan → gambar tampil di card.
  4. Cek: grup tombol tak patah (resize browser), tombol Keluar = ikon, banner kosong user lain tampil gradasi+titik+blob tanpa overlay gelap.
