# Mitra Intake & Admin Verification Queue (SP-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun jalur pengajuan mitra publik (psikolog guest-first & pendamping in-app), area akun untuk pelacak status, dan dashboard `/admin` terpadu dengan autentikasi nyata — termasuk menutup celah PIN `123456` yang ada hari ini.

**Architecture:** Tiga tabel baru dengan RLS *deny-all* (seluruh akses lewat Server Action), bucket privat untuk dokumen kredensial yang dilayani via signed URL berumur pendek, dan flag admin `app_metadata.is_admin` yang ditegakkan di middleware **dan** di-ulang di setiap Server Action. Aturan bisnis (validasi form, transisi status, expiry, rate limit) ditulis sebagai modul murni di `src/lib/mitra/` yang dipakai bersama oleh form klien dan Server Action, sehingga tidak ada drift antara validasi klien dan server.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Supabase (Auth/Postgres/Storage), TypeScript strict, Tailwind CSS v4 + token Warm Sanctuary, `node:test` + `tsx` untuk unit test, Playwright (opt-in) untuk E2E/a11y/visual.

**Spec:** `docs/superpowers/specs/2026-10-20-lmhy-mitra-intake-admin-queue-design.md`

---

## Global Constraints

- **Token desain:** hanya token Warm Sanctuary yang sudah ada di `src/app/globals.css` (`#FBF8F5`, `#3C3163`, `#F7ABC5`, `hsl(257,68%,73%)`, `hsl(42,73%,74%)`, `hsl(344,81%,87%)`, font Poppins/Heebo/JetBrains Mono). **Tidak boleh** menambah warna, radius, atau font baru.
- **Landing page kanonik:** `src/components/landing/`, `src/styles/landing.css`, `src/app/(marketing)/` tidak boleh disentuh.
- **Role & enum** (dari `src/lib/supabase/types.ts`): `creator_role` = `PENULIS` | `PENDAMPING` | `PRAKTISI`; `service_track` = `SEBAYA` | `KLINIS` | null; `verification_status` = `NONE` | `PENDING` | `APPROVED` | `REJECTED`.
- **Track pengajuan** = `SEBAYA` (pendamping) | `KLINIS` (psikolog). Track ≠ `service_track` provider, tetapi track `SEBAYA` → `service_track='SEBAYA'`, track `KLINIS` → `service_track='KLINIS'`.
- **Take rate** flat 10% (1000 bps) — tidak berubah di SP-1.
- **Bahasa UI & dokumen:** Indonesia. Copy email memakai token Warm Sanctuary.
- **Tanpa komentar yang tidak diminta** di kode (klausul repo).
- **Setiap task berakhir dengan commit.** Quality gate sebelum push: `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build`.
- **Branch:** `feat/mitra-intake-admin-queue` (sudah dibuat, base `origin/develop` @ `ad3e9a6`). Satu PR per increment (§ Increment & PR Boundary).
- **Tidak boleh** menambahkan dependensi runtime baru. Dependensi dev baru hanya `playwright` (Task 32).

---

## Review Focus

Lima kelas input/kondisi yang paling mungkin menggigit pengguna nyata, dan perilaku yang mestinya terjadi. Masing-masing sudah dipin dengan test di task pemiliknya:

1. **Email sudah terdaftar** — pelamar yang salah mengira belum punya akun tetap harus bisa_apply tanpa kehilangan input. → Task 13 (test `submitPsikologApplication` dengan email existing → `code: 'EMAIL_EXISTS'`, input dipertahankan).
2. **Username bentrok / sudah dipakai** — form harus memberi alternatif, bukan dead-end. → Task 2 & 18 (test `suggestUsernames` + aksi check).
3. **Dua admin menyetujui pengajuan yang sama** — hanya satu yang boleh menang; yang lain tidak boleh menimpa. → Task 25 (test concurrency: `UPDATE ... WHERE status='PENDING'` mengembalikan 0 baris → `{ ok:false, code:'ALREADY_DECIDED' }`).
4. **Berkas rusak / salah tipe / terlalu besar / URL kedaluwarsa** — pelamar tidak boleh kehilangan data form, dan admin tidak boleh melihat file berbahaya. → Task 14 & 24.
5. **Sesi admin hilang di tengah review** — admin yang tidak lagi punya flag `is_admin` tidak boleh bisa approve lewat halaman yang sudah terbuka. → Task 7 & 8 (guard di Server Action, bukan hanya middleware).

---

## File Structure

### Yang dibuat

| Path | Tanggung jawab (satu fokus) |
|---|---|
| `src/lib/mitra/username-rules.ts` | Validasi username mitra + reserved list + saran alternatif (murni) |
| `src/lib/mitra/application-schema.ts` | Validator payload pengajuan per track (murni) — kontrak bersama klien & server |
| `src/lib/mitra/application-state.ts` | Transisi status & gate approve/reject (murni) |
| `src/lib/mitra/expiry.ts` | TTL email-verifikasi, TTL pengajuan, retensi dokumen, tombstone username (murni) |
| `src/lib/mitra/rate-limit.ts` | Rate limit sliding-window per IP & per email (murni, in-memory) |
| `src/lib/mitra/audit.ts` | Penulis baris `admin_audit_log` (satu-satunya pintu tulis audit) |
| `src/lib/mitra/documents.ts` | Validasi berkas + sanitasi nama + buang EXIF (server-only, `sharp`) |
| `src/lib/admin-auth.ts` | `isAdminUser` (murni) + `requireAdmin` (server) |
| `src/lib/email.ts` | Adapter pengiriman email (Resend → Brevo → no-op) |
| `src/lib/email-templates.ts` | Template email sebagai fungsi TS murni |
| `src/app/actions/mitra.ts` | Aksi pengajuan & status (publik & pelamar) |
| `src/app/actions/admin-mitra.ts` | Aksi admin (approve/reject/checklist/sweep/resend) |
| `src/app/mitra/page.tsx` | Hub kemitraan publik |
| `src/app/mitra/psikolog/page.tsx` | Form psikolog 3 langkah |
| `src/app/mitra/pendamping/page.tsx` | Form pendamping 2 langkah |
| `src/app/mitra/status/page.tsx` | Penjelas pelacak status |
| `src/app/akun/page.tsx` | Area akun (Ringkasan \| Pengajuan) |
| `src/app/admin/layout.tsx` | Shell admin (tab + guard) |
| `src/app/admin/page.tsx` | Tab Ringkasan |
| `src/app/admin/verifikasi/page.tsx` | Tab Antrean Verifikasi |
| `src/app/admin/litera/page.tsx` | Tab Litera (menggantikan route lama) |
| `src/components/mitra/*` | Komponen form (langkah, field, upload, timeline status) |
| `src/components/admin/*` | Komponen admin (antrean, detail, checklist, metrik) |
| `supabase/migrations/20261020000000_provider_intake_admin.sql` | 3 tabel + indexes + RLS + bucket |
| `scripts/bootstrap-admin.mjs` | Set `app_metadata.is_admin` (sekali jalan) |
| `scripts/verify-rls.mjs` | Verifikasi RLS deny-all (3 role) |
| `scripts/purge-expired-documents.mjs` | Retensi 90 hari |
| `tests/e2e/*.spec.ts` | E2E + a11y + visual (opt-in) |

### Yang dimodifikasi

| Path | Perubahan |
|---|---|
| `src/lib/auth-constants.ts` | Tambah reserved username mitra |
| `src/lib/supabase/types.ts` | Tipe 3 tabel baru |
| `src/middleware.ts` | Root route `/mitra`, `/akun`, `/praktik`; guard admin; redirect subdomain → root |
| `src/app/admin/litera/AdminLiteraClient.tsx` | Hapus PIN gate; aksi lewat Server Action ter-audit |
| `src/app/actions/admin-nft.ts` | Hapus `verifyAdminPin`; guard admin di setiap aksi |
| `src/app/tenant/[username]/page.tsx` | Banner ajakan become Pendamping (khusus akun non-provider) |
| `package.json` | Script `test:e2e`, `test:unit` (glob quoted) |
| `.github/workflows/ci.yml` | Tambah step unit test + RLS verify (skip bila secret absen) |

---

## Increment & PR Boundary

| Increment | Isi | Task | PR |
|---|---|---|---|
| **I1** | Fondasi admin: migrasi, guard, shell, audit, overview | 1–11 | PR #1 |
| **I2** | Intake psikolog: form publik, guest-first, upload | 12–19 | PR #2 |
| **I3** | Pendamping, area akun, approve/reject, sweep | 20–27 | PR #3 |
| **I4** | Email, retensi, polish, E2E, QA, rollout | 28–34 | PR #4 |

---

## INCREMENT I1 — Fondasi Admin

### Task 1: Test runner & CI

**Files:**
- Modify: `package.json` (script `test:unit`)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: —
- Produces: `npm run test:unit` menjalankan **semua** `src/**/*.test.ts` (termasuk subdirektori baru seperti `src/lib/mitra/`), dan CI menjalankan unit test sebelum build.

- [ ] **Step 1: Pastikan glob test saat ini rapuh**

Jalankan: `npm run test:unit 2>&1 | tail -3` → expect 62 test PASS.
Lalu buktikan kerapuhan: buat file uji sementara di `src/a/b/c/__globcheck.test.ts`, jalankan `npm run test:unit 2>&1 | grep -E "^# tests"`, dan catat jumlah test. **Diberi tahu:** `npm run` memakai `sh`, yang tidak memperlakukan `**` sebagai recursive — pola `src/**/*.test.ts` hanya mencapai 2 level dan `src/**/**/*.test.ts` hanya 3 level, sehingga file di 4+ level **tidak pernah dijalankan**. Ini yang membuat task ini ada.

- [ ] **Step 2: Ubah script jadi penemuan file yang depth-independent**

`package.json`:
```json
"test:unit": "find src -name '*.test.ts' -print0 | xargs -0 tsx --test"
```
> **Jangan pakai glob yang di-kutip** (`tsx --test "src/**/*.test.ts"`): dukungan glob pada `--test` hanya ada di Node 21+, sedangkan Node lokal repo ini v20 → script itu gagal dengan "Could not find". `find | xargs` deterministik di semua shell & versi Node, dan menjangkau kedalaman berapa pun.

- [ ] **Step 3: Verifikasi script baru menjangkau file nested**

Buat dua file sementara:
- `src/lib/mitra/__globcheck.test.ts` (3 level — tempat test_task nanti berada)
- `src/a/b/c/__globcheck.test.ts` (5 level — pembuktian depth-independent)

Keduanya berisi `import test from "node:test"; test("glob check", () => {});`

Jalankan: `npm run test:unit 2>&1 | grep -E "^# tests"` → expect **64** (62 + 2).
Lalu hake both file sementara (`rm -rf src/lib/mitra src/a`) dan konfirmasi `git status --short` tidak menampilkan file apa pun di `src/`.

- [ ] **Step 4: Tambahkan step unit test ke CI**

`.github/workflows/ci.yml`, sisipkan setelah step "Typecheck":
```yaml
      - name: Unit tests
        run: npm run test:unit
```

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "chore(ci): run unit tests in CI and make test glob recursive"
```

---

### Task 2: Aturan username mitra

**Files:**
- Create: `src/lib/mitra/username-rules.ts`
- Test: `src/lib/mitra/username-rules.test.ts`
- Modify: `src/lib/auth-constants.ts`

**Interfaces:**
- Consumes: `USERNAME_REGEX`, `MIN_USERNAME_LENGTH`, `MAX_USERNAME_LENGTH`, `RESERVED_USERNAMES` dari `@/lib/auth-constants`.
- Produces:
  ```ts
  export const MITRA_RESERVED_USERNAMES: Set<string>;
  export interface UsernameValidation { valid: boolean; error?: string }
  export function validateMitraUsername(raw: string): UsernameValidation;
  export function isReservedMitraUsername(raw: string): boolean;
  export function suggestUsernames(raw: string, isTaken: (candidate: string) => boolean): string[];
  ```

- [ ] **Step 1: Tulis test yang gagal**

`src/lib/mitra/username-rules.test.ts`:
```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  MITRA_RESERVED_USERNAMES,
  isReservedMitraUsername,
  suggestUsernames,
  validateMitraUsername,
} from "./username-rules";

test("valid username passes", () => {
  assert.equal(validateMitraUsername("budi_santoso").valid, false); // underscore ditolak
  assert.equal(validateMitraUsername("budi-santoso").valid, true);
});

test("username kosong / terlalu pendek / terlalu panjang ditolak", () => {
  assert.equal(validateMitraUsername("").valid, false);
  assert.equal(validateMitraUsername("ab").valid, false);
  assert.equal(validateMitraUsername("a".repeat(31)).valid, false);
});

test("huruf besar, spasi, dan tanda baca ditolak", () => {
  assert.equal(validateMitraUsername("Budi").valid, false);
  assert.equal(validateMitraUsername("budi santoso").valid, false);
  assert.equal(validateMitraUsername("budi.santoso").valid, false);
});

test("username reserved ditolak", () => {
  assert.equal(validateMitraUsername("admin").valid, false);
  assert.equal(validateMitraUsername("mitra").valid, false);
  assert.equal(validateMitraUsername("praktik").valid, false);
  assert.equal(isReservedMitraUsername("artikel"), true);
  assert.equal(MITRA_RESERVED_USERNAMES.has("articles"), true);
});

test("suggestUsernames mengembalikan 3 alternatif yang valid dan belum dipakai", () => {
  const taken = new Set(["budi-santoso", "budi-santoso-1"]);
  const out = suggestUsernames("Budi Santoso", (c) => taken.has(c));
  assert.equal(out.length, 3);
  for (const c of out) {
    assert.equal(validateMitraUsername(c).valid, true);
    assert.equal(taken.has(c), false);
  }
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep -E "username-rules|Cannot find module"`
Expected: FAIL — `Cannot find module './username-rules'`

- [ ] **Step 3: Implementasikan modul**

`src/lib/mitra/username-rules.ts`:
```ts
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  RESERVED_USERNAMES,
  USERNAME_REGEX,
} from "@/lib/auth-constants";

const MITRA_EXTRA_RESERVED = [
  "articles", "mitra", "praktik", "akun", "pengaturan", "pengajuan",
  "terms", "images", "media", "upload", "uploads", "cdn", "sapa",
  "cerita", "dengar", "status",
];

export const MITRA_RESERVED_USERNAMES = new Set([
  ...RESERVED_USERNAMES,
  ...MITRA_EXTRA_RESERVED,
]);

export interface UsernameValidation {
  valid: boolean;
  error?: string;
}

export function isReservedMitraUsername(raw: string): boolean {
  return MITRA_RESERVED_USERNAMES.has(raw.trim().toLowerCase());
}

export function validateMitraUsername(raw: string): UsernameValidation {
  const username = (raw || "").trim().toLowerCase();
  if (!username) return { valid: false, error: "Username wajib diisi." };
  if (username.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username minimal ${MIN_USERNAME_LENGTH} karakter.` };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username maksimal ${MAX_USERNAME_LENGTH} karakter.` };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: "Username hanya boleh memuat huruf kecil (a-z), angka (0-9), dan tanda hubung (-)." };
  }
  if (username.startsWith("-") || username.endsWith("-")) {
    return { valid: false, error: "Username tidak boleh diawali atau diakhiri tanda hubung (-)." };
  }
  if (username.includes("--")) {
    return { valid: false, error: "Username tidak boleh memuat tanda hubung ganda (--)." };
  }
  if (isReservedMitraUsername(username)) {
    return { valid: false, error: "Username ini dipakai oleh sistem. Silakan pilih yang lain." };
  }
  return { valid: true };
}

export function suggestUsernames(raw: string, isTaken: (candidate: string) => boolean): string[] {
  const base = (raw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
  if (!base) return [];
  const out: string[] = [];
  const candidates = [base, `${base}-1`, `${base}-2`, `${base}-3`, `${base}-psikolog`, `${base}-santoso`];
  for (const c of candidates) {
    if (out.length >= 3) break;
    if (validateMitraUsername(c).valid && !isTaken(c)) out.push(c);
  }
  return out;
}
```

- [ ] **Step 4: Jalankan test, harus lolos**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: PASS, total test count naik dari 62 menjadi ≥ 67.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mitra/username-rules.ts src/lib/mitra/username-rules.test.ts src/lib/auth-constants.ts
git commit -m "feat(mitra): add mitra username rules with reserved list and suggestions"
```

---

### Task 3: Validator pengajuan per track

**Files:**
- Create: `src/lib/mitra/application-schema.ts`
- Test: `src/lib/mitra/application-schema.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  ```ts
  export type MitraTrack = "SEBAYA" | "KLINIS";
  export interface ValidationIssue { field: string; message: string }
  export interface PsikologDraft {
    track: "KLINIS";
    applicantName: string; applicantEmail: string; whatsapp: string;
    domicileProvince: string; domicileCity: string; username: string; password: string;
    academicTitle: string; s2Campus: string; s2GraduationYear: number;
    specialization: string; strNumber: string; sipStatus: "AKTIF" | "TIDAK_AKTIF";
    currentPractice: string; yearsExperience: string; flightHours: string;
    modalities: string[]; motivation: string;
    ethicsAccepted: boolean; dataAccuracyAccepted: boolean;
    honeypot?: string; formElapsedMs?: number;
  }
  export interface PendampingDraft {
    track: "SEBAYA";
    applicantName: string; applicantEmail: string; whatsapp: string;
    domicileProvince: string; domicileCity: string; username: string; password: string;
    backgroundTrack: "PENYINTAS" | "PEMERHATI" | "MAHASISWA" | "LAINNYA";
    motivation: string; personalExperience: string; availability: string;
    ethicsAccepted: boolean; dataAccuracyAccepted: boolean;
    waGroupConfirmed: boolean; pfaCommitment: boolean;
    honeypot?: string; formElapsedMs?: number;
  }
  export type MitraDraft = PsikologDraft | PendampingDraft;
  export interface NormalizedApplication {
    track: MitraTrack;
    applicantName: string; applicantEmail: string; whatsapp: string;
    domicileProvince: string; domicileCity: string; username: string;
    backgroundTrack: string | null; motivation: string;
    details: Record<string, unknown>;
    ethicsAcceptedAt: string;
  }
  export function validateMitraDraft(draft: MitraDraft, now?: Date): { ok: boolean; issues: ValidationIssue[]; normalized?: NormalizedApplication };
  export function validatePsikologDraft(draft: PsikologDraft, now?: Date): ValidationIssue[];
  export function validatePendampingDraft(draft: PendampingDraft, now?: Date): ValidationIssue[];
  ```

- [ ] **Step 1: Tulis test yang gagal**

`src/lib/mitra/application-schema.test.ts` — cover minimal berikut:
```ts
test("psikolog: field wajib hilang menghasilkan issue per field", () => {
  const issues = validatePsikologDraft({ track: "KLINIS", applicantName: "", applicantEmail: "", whatsapp: "", domicileProvince: "", domicileCity: "", username: "", password: "", academicTitle: "", s2Campus: "", s2GraduationYear: 0, specialization: "", strNumber: "", sipStatus: "AKTIF", currentPractice: "", yearsExperience: "", flightHours: "", modalities: [], motivation: "", ethicsAccepted: false, dataAccuracyAccepted: false });
  const fields = issues.map((i) => i.field);
  for (const f of ["applicantName", "applicantEmail", "whatsapp", "domicileProvince", "domicileCity", "username", "password", "academicTitle", "s2Campus", "s2GraduationYear", "specialization", "strNumber", "currentPractice", "yearsExperience", "modalities", "motivation", "ethicsAccepted", "dataAccuracyAccepted"]) {
    assert.ok(fields.includes(f), `missing issue for ${f}`);
  }
});

test("psikolog: password minimal 8 karakter dan honeypot terisi ditolak", () => { /* dua assert */ });
test("psikolog: modalitas minimal satu dan harus dari VIDEO/VOICE/CHAT", () => { /* dua assert */ });
test("psikolog: tahun lulus di luar rentang ditolak", () => { /* assert */ });
test("pendamping: backgroundTrack wajib dan dari daftar tetap", () => { /* assert */ });
test("pendamping: WA group & PFA commitment wajib dicentang", () => { /* dua assert */ });
test("motivasi minimal 200 karakter untuk kedua track", () => { /* dua assert */ });
test("honeypot terisi menghasilkan issue honeypot", () => { /* assert */ });
test("formElapsedMs di bawah 5000 menghasilkan issue formElapsedMs", () => { /* assert */ });
test("normalize menghasilkan details sesuai track", () => {
  const r = validateMitraDraft(psikologValidFixture());
  assert.equal(r.ok, true);
  assert.equal(r.normalized?.details.academic_title, "S.Psi");
  assert.equal(r.normalized?.details.sip_status, "AKTIF");
  assert.ok(Array.isArray(r.normalized?.details.modalities));
});
```
Isi fixture `psikologValidFixture()` dengan data valid (email `budi@contoh.id`, password `rahasia123`, motivation 250 karakter, `formElapsedMs: 9000`, `honeypot: ""`).

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "application-schema"`
Expected: FAIL — `Cannot find module './application-schema'`

- [ ] **Step 3: Implementasikan modul**

`src/lib/mitra/application-schema.ts` — aturan wajib:

| Field | Aturan |
|---|---|
| `applicantName` | 3–80 karakter |
| `applicantEmail` | regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, panjang ≤ 120, domain disposable ditolak (`mailinator.com`, `tempmail.com`, `10minutemail.com`, `guerrillamail.com`, `yopmail.com`) |
| `whatsapp` | `/^(?:\+62|62|0)8[1-9][0-9]{6,10}$/` setelah normalisasi (spasi, tanda hubung, tanda plus dibuang) |
| `domicileProvince` | wajib, ≤ 60 |
| `domicileCity` | wajib, ≤ 60 |
| `username` | `validateMitraUsername(username).valid` |
| `password` | ≥ 8 karakter, mengandung huruf & angka |
| `motivation` | ≥ 200 karakter, ≤ 2000 |
| `honeypot` | bila non-kosong → issue `honeypot` |
| `formElapsedMs` | bila < 5000 → issue `formElapsedMs` |
| `ethicsAccepted` & `dataAccuracyAccepted` | harus `true` |
| KLINIS | `s2GraduationYear` 1980..tahun berjalan; `modalities` ⊆ {VIDEO,VOICE,CHAT} dan ≥ 1; `sipStatus` ∈ {AKTIF, TIDAK_AKTIF}; `specialization` ∈ {Klinis Dewasa, Klinis Anak & Remaja, Klinis Keluarga, Industri & Organisasi, Pendidikan, Umum} |
| SEBAYA | `backgroundTrack` ∈ {PENYINTAS, PEMERHATI, MAHASISWA, LAINNYA}; `waGroupConfirmed` true; `pfaCommitment` true; `personalExperience` ≥ 80 karakter; `availability` wajib |

`details` yang dihasilkan:
- KLINIS → `{ academic_title, s2_campus, s2_graduation_year, specialization, str_number, sip_status, current_practice, years_experience, flight_hours, modalities }`
- SEBAYA → `{ background_track, personal_experience, availability, wa_group_confirmed, pfa_commitment }`

`validateMitraDraft` = dispatcher yang memanggil validator sesuai `draft.track` dan mengembalikan `normalized` bila `issues.length === 0`.

- [ ] **Step 4: Jalankan test, harus lolos**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mitra/application-schema.ts src/lib/mitra/application-schema.test.ts
git commit -m "feat(mitra): add per-track application schema validation"
```

---

### Task 4: Transisi status & gate approve/reject

**Files:**
- Create: `src/lib/mitra/application-state.ts`
- Test: `src/lib/mitra/application-state.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  ```ts
  export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "SUPERSEDED";
  export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean;
  export interface ApprovalInput {
    status: ApplicationStatus;
    track: "SEBAYA" | "KLINIS";
    emailVerifiedAt: string | null;
    waJoinedConfirmedAt: string | null;
    pfaStatus: "BELUM" | "SEDANG" | "SELESAI";
    hasRequiredDocuments: boolean;
    adminUserId: string;
    applicantUserId: string;
    note?: string;
  }
  export interface GateResult { allowed: boolean; reasons: string[] }
  export function evaluateApproval(input: ApprovalInput): GateResult;
  export function evaluateRejection(input: { status: ApplicationStatus; note: string; adminUserId: string; applicantUserId: string }): GateResult;
  export function roleForTrack(track: "SEBAYA" | "KLINIS"): "PENDAMPING" | "PRAKTISI";
  export function serviceTrackForTrack(track: "SEBAYA" | "KLINIS"): "SEBAYA" | "KLINIS";
  ```

- [ ] **Step 1: Tulis test yang gagal**

`src/lib/mitra/application-state.test.ts`:
```ts
test("hanya PENDING yang bisa diputuskan", () => {
  assert.equal(canTransitionApplication("PENDING", "APPROVED"), true);
  assert.equal(canTransitionApplication("PENDING", "REJECTED"), true);
  assert.equal(canTransitionApplication("APPROVED", "REJECTED"), false);
  assert.equal(canTransitionApplication("REJECTED", "APPROVED"), false);
  assert.equal(canTransitionApplication("EXPIRED", "APPROVED"), false);
  assert.equal(canTransitionApplication("PENDING", "SUPERSEDED"), true);
});

test("approve ditolak bila email belum terverifikasi", () => {
  const r = evaluateApproval({ status: "PENDING", track: "KLINIS", emailVerifiedAt: null, waJoinedConfirmedAt: null, pfaStatus: "BELUM", hasRequiredDocuments: true, adminUserId: "admin-1", applicantUserId: "user-2" });
  assert.equal(r.allowed, false);
  assert.ok(r.reasons.some((x) => x.includes("email")));
});

test("approve SEBAYA butuh WA terverifikasi dan PFA selesai", () => {
  const base = { status: "PENDING" as const, track: "SEBAYA" as const, emailVerifiedAt: new Date().toISOString(), hasRequiredDocuments: true, adminUserId: "admin-1", applicantUserId: "user-2" };
  assert.equal(evaluateApproval({ ...base, waJoinedConfirmedAt: null, pfaStatus: "SELESAI" }).allowed, false);
  assert.equal(evaluateApproval({ ...base, waJoinedConfirmedAt: new Date().toISOString(), pfaStatus: "BELUM" }).allowed, false);
  assert.equal(evaluateApproval({ ...base, waJoinedConfirmedAt: new Date().toISOString(), pfaStatus: "SELESAI" }).allowed, true);
});

test("approve KLINIS tidak butuh WA/PFA tetapi butuh dokumen", () => {
  const base = { status: "PENDING" as const, track: "KLINIS" as const, emailVerifiedAt: new Date().toISOString(), waJoinedConfirmedAt: null, pfaStatus: "BELUM", adminUserId: "admin-1", applicantUserId: "user-2" };
  assert.equal(evaluateApproval({ ...base, hasRequiredDocuments: true }).allowed, true);
  assert.equal(evaluateApproval({ ...base, hasRequiredDocuments: false }).allowed, false);
});

test("admin tidak boleh approve pengajuannya sendiri", () => {
  const r = evaluateApproval({ status: "PENDING", track: "KLINIS", emailVerifiedAt: new Date().toISOString(), waJoinedConfirmedAt: null, pfaStatus: "BELUM", hasRequiredDocuments: true, adminUserId: "same-id", applicantUserId: "same-id" });
  assert.equal(r.allowed, false);
});

test("reject wajib menyertakan catatan dan tidak boleh oleh pelamar sendiri", () => {
  assert.equal(evaluateRejection({ status: "PENDING", note: "", adminUserId: "a", applicantUserId: "u" }).allowed, false);
  assert.equal(evaluateRejection({ status: "PENDING", note: "STR belum aktif", adminUserId: "u", applicantUserId: "u" }).allowed, false);
  assert.equal(evaluateRejection({ status: "PENDING", note: "STR belum aktif", adminUserId: "a", applicantUserId: "u" }).allowed, true);
  assert.equal(evaluateRejection({ status: "APPROVED", note: "x", adminUserId: "a", applicantUserId: "u" }).allowed, false);
});

test("pemetaan track ke role dan service track", () => {
  assert.equal(roleForTrack("SEBAYA"), "PENDAMPING");
  assert.equal(roleForTrack("KLINIS"), "PRAKTISI");
  assert.equal(serviceTrackForTrack("SEBAYA"), "SEBAYA");
  assert.equal(serviceTrackForTrack("KLINIS"), "KLINIS");
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "application-state"`
Expected: FAIL — `Cannot find module './application-state'`

- [ ] **Step 3: Implementasikan modul**

`src/lib/mitra/application-state.ts` — `canTransitionApplication` hanya mengizinkan `PENDING → {APPROVED, REJECTED, EXPIRED, SUPERSEDED}`; `evaluateApproval` mengembalikan `allowed: false` + array `reasons` (bahasa Indonesia) bila salah satu gate gagal; `evaluateRejection` mensyaratkan `note.trim().length >= 10` dan `adminUserId !== applicantUserId`.

- [ ] **Step 4: Jalankan test, harus lolos**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mitra/application-state.ts src/lib/mitra/application-state.test.ts
git commit -m "feat(mitra): add application status transitions and approval gates"
```

---

### Task 5: Aturan expiry, retensi, dan tombstone

**Files:**
- Create: `src/lib/mitra/expiry.ts`
- Test: `src/lib/mitra/expiry.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  ```ts
  export const EMAIL_VERIFICATION_TTL_DAYS = 7;
  export const APPLICATION_TTL_DAYS = 30;
  export const DOCUMENT_RETENTION_DAYS = 90;
  export function isEmailVerificationExpired(appliedAt: Date, now: Date): boolean;
  export function isApplicationExpired(appliedAt: Date, now: Date): boolean;
  export function documentPurgeAfter(decidedAt: Date): Date;
  export function tombstoneUsername(userId: string): string;
  export function isSlaOverdue(appliedAt: Date, now: Date, slaDays: number): boolean;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("verifikasi email kedaluwarsa setelah 7 hari", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isEmailVerificationExpired(applied, new Date("2026-10-07T23:59:59.000Z")), false);
  assert.equal(isEmailVerificationExpired(applied, new Date("2026-10-08T00:00:01.000Z")), true);
});

test("pengajuan kedaluwarsa setelah 30 hari", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isApplicationExpired(applied, new Date("2026-10-30T23:59:59.000Z")), false);
  assert.equal(isApplicationExpired(applied, new Date("2026-10-31T00:00:01.000Z")), true);
});

test("purge dokumen 90 hari setelah keputusan", () => {
  assert.equal(documentPurgeAfter(new Date("2026-10-01T00:00:00.000Z")).toISOString(), "2026-12-30T00:00:00.000Z");
});

test("tombstone username deterministik dan valid", () => {
  const t = tombstoneUsername("123e4567-e89b-12d3-a456-426614174000");
  assert.match(t, /^akun-[a-f0-9]{8}$/);
  assert.equal(tombstoneUsername("123e4567-e89b-12d3-a456-426614174000"), t);
});

test("SLA 3 hari terlewati terdeteksi", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isSlaOverdue(applied, new Date("2026-10-03T00:00:00.000Z"), 3), false);
  assert.equal(isSlaOverdue(applied, new Date("2026-10-05T00:00:00.000Z"), 3), true);
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "expiry"`
Expected: FAIL — `Cannot find module './expiry'`

- [ ] **Step 3: Implementasikan modul**

`src/lib/mitra/expiry.ts` — konstanta di atas; seluruh perhitungan berbasis selisih milidetik (`now.getTime() - appliedAt.getTime() > TTL_DAYS * 86400000`). `tombstoneUsername(userId)` = `"akun-" + userId.replace(/-/g, "").slice(0, 8).toLowerCase()`.

- [ ] **Step 4: Jalankan test, harus lolos**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mitra/expiry.ts src/lib/mitra/expiry.test.ts
git commit -m "feat(mitra): add expiry, retention and tombstone rules"
```

---

### Task 6: Migrasi database, bucket, dan RLS

**Files:**
- Create: `supabase/migrations/20261020000000_provider_intake_admin.sql`
- Create: `scripts/verify-rls.mjs`
- Modify: `src/lib/supabase/types.ts`

**Interfaces:**
- Consumes: `auth.users` (Supabase auth schema).
- Produces: tabel `public.provider_applications`, `public.provider_documents`, `public.admin_audit_log`; bucket `provider-credentials`; fungsi helper `public.release_mitra_username(user_id uuid)`.

- [ ] **Step 1: Tulis migration**

`supabase/migrations/20261020000000_provider_intake_admin.sql` — wajib idempoten. Isi:

1. `CREATE TABLE IF NOT EXISTS public.provider_applications (...)` dengan kolom & constraint sesuai spec §5.1:
   - `CHECK (track IN ('SEBAYA','KLINIS'))`
   - `CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED','SUPERSEDED'))`
   - `CHECK (background_track IS NULL OR background_track IN ('PENYINTAS','PEMERHATI','MAHASISWA','LAINNYA'))`
   - `CHECK (pfa_status IN ('BELUM','SEDANG','SELESAI'))`
   - `CHECK (ethics_pledge_at IS NOT NULL)`
   - CHECK `details` per track (verbatim dari spec §5.2)
   - FK: `user_id → auth.users(id) ON DELETE CASCADE`, `decided_by → auth.users(id) ON DELETE SET NULL`, `supersedes`/`superseded_by` self-FK `ON DELETE SET NULL`
2. `CREATE TABLE IF NOT EXISTS public.provider_documents (...)` dengan `CHECK (doc_type IN ('STR','SIPP','CV','TRAINING_CERT','PFA_CERT','OTHER'))`, `size_bytes > 0`, FK ke `provider_applications` (`ON DELETE CASCADE`) dan `auth.users` (`ON DELETE CASCADE`).
3. `CREATE TABLE IF NOT EXISTS public.admin_audit_log (...)` dengan `CHECK (action IN ('APPLICATION_APPROVED','APPLICATION_REJECTED','APPLICATION_EXPIRED','APPLICATION_RESUBMITTED','DOCUMENT_VIEWED','CHECKLIST_UPDATED','LITERA_CONFIG_UPDATED','EMAIL_RESENT','SWEEP_FAILED'))`.
4. Index: `provider_applications (status, track, applied_at DESC)`, `(user_id)`; `provider_documents (application_id)`, `(purge_after)`; `admin_audit_log (actor_id, created_at DESC)`, `(target_type, target_id)`, `(created_at DESC)`.
5. RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` untuk ketiga tabel **tanpa** membuat policy apa pun untuk `anon`/`authenticated`.
6. Bucket: `INSERT INTO storage.buckets (id, name, public) VALUES ('provider-credentials','provider-credentials', false) ON CONFLICT (id) DO NOTHING;` dan `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` (idempoten) tanpa policy baru — akses hanya via signed URL.
7. Fungsi pelepas username:
```sql
CREATE OR REPLACE FUNCTION public.release_mitra_username(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_username text;
BEGIN
  SELECT username INTO current_username FROM public.profiles WHERE id = target_user_id;
  IF current_username IS NOT NULL AND current_username LIKE 'akun-%' THEN
    RETURN;
  END IF;
  UPDATE public.profiles
     SET username = 'akun-' || substr(replace(target_user_id::text, '-', ''), 1, 8),
         updated_at = now()
   WHERE id = target_user_id;
END;
$$;
```
8. `updated_at` dikelola aplikasi (pola repo: `20261005000000_initial_schema.sql` **tidak** memakai trigger `updated_at`) → kolom `updated_at TIMESTAMPTZ DEFAULT NOW()` dan setiap update aplikasi mengeset `updated_at: new Date().toISOString()`.
9. Catatan: `pfa_evidence_doc_id` tetap nullable dan **tidak dipakai** di v1 — dokumen dicari lewat `provider_documents.application_id` + `doc_type`. Kolom disediakan agar migrasi cohort nanti tidak mengubah skema.

- [ ] **Step 2: Terapkan migration & uji idempotensi**

Jalankan (pilih salah satu):
```bash
npx supabase@latest db push --linked          # bila project sudah ter-link
# atau: psql "$SUPABASE_DB_URL" -f supabase/migrations/20261020000000_provider_intake_admin.sql
```
Lalu jalankan file **yang sama** sekali lagi.
Expected: tidak ada error pada kedua eksekusi (tidak ada "already exists" fatal).

- [ ] **Step 3: Tulis `scripts/verify-rls.mjs`**

Script membaca `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Assert:
1. `anon.select('*').from('provider_applications').limit(1)` → error ATAU `data.length === 0`.
2. Hal sama untuk `provider_documents` dan `admin_audit_log`.
3. `service_role.select('*').from('provider_applications').limit(1)` → **tidak** error (boleh 0 baris).
4. `storage.from('provider-credentials').list('applications')` dengan anon key → error ATAU data kosong.
Bila env kredensial service role tidak ada → script mencetak `SKIP: SUPABASE_SERVICE_ROLE_KEY belum diset` dan `process.exit(0)`.

- [ ] **Step 4: Jalankan script verifikasi**

Run: `node scripts/verify-rls.mjs`
Expected: `PASS anon ditolak pada 3 tabel` + `PASS service role dapat membaca` (atau `SKIP` bila service role belum diset — tetap exit 0).

- [ ] **Step 5: Tambahkan tipe TypeScript**

`src/lib/supabase/types.ts`: tambahkan entri `provider_applications`, `provider_documents`, `admin_audit_log` pada `Database['public']['Tables']` dengan `Row`/`Insert`/`Update` yang memetakan kolom di atas (`details: Json`, `metadata: Json | null`). Tanpa ini, `createAdminClient().from('provider_applications')` tidak akan ter-type dan `npx tsc --noEmit` gagal.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261020000000_provider_intake_admin.sql scripts/verify-rls.mjs src/lib/supabase/types.ts
git commit -m "feat(db): add provider intake tables, documents, audit log and RLS deny-all"
```

---

### Task 7: Helper autentikasi admin

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/lib/admin-auth-edge.ts`
- Test: `src/lib/admin-auth.test.ts`

**Interfaces:**
- Consumes: `createClient` dari `@/lib/supabase/server`.
- Produces:
  ```ts
  // src/lib/admin-auth-edge.ts (murni, aman untuk Edge runtime middleware)
  export function isAdminMetadata(meta: unknown): boolean;
  export function isAdminUser(user: { app_metadata?: Record<string, unknown> | null } | null | undefined): boolean;

  // src/lib/admin-auth.ts (server)
  export { isAdminMetadata, isAdminUser } from "@/lib/admin-auth-edge";
  export interface AdminIdentity { id: string; email: string | null }
  export async function requireAdmin(): Promise<AdminIdentity | null>;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("isAdminUser hanya true untuk app_metadata.is_admin === true", () => {
  assert.equal(isAdminUser({ app_metadata: { is_admin: true } }), true);
  assert.equal(isAdminUser({ app_metadata: { is_admin: "true" } }), false);
  assert.equal(isAdminUser({ app_metadata: { is_admin: false } }), false);
  assert.equal(isAdminUser({ app_metadata: {} }), false);
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser(undefined), false);
});

test("user_metadata tidak dihitung sebagai admin", () => {
  assert.equal(isAdminUser({ app_metadata: {}, user_metadata: { is_admin: true } } as never), false);
});
```
> Catatan: `isAdminUser` sengaja **tidak** membaca `user_metadata` — user bisa menyetelnya sendiri.

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "admin-auth"`
Expected: FAIL — `Cannot find module './admin-auth'`

- [ ] **Step 1: Implementasikan helper**

`src/lib/admin-auth-edge.ts` (tanpa import server-only):
```ts
export function isAdminMetadata(meta: unknown): boolean {
  return typeof meta === "object" && meta !== null && (meta as { is_admin?: unknown }).is_admin === true;
}
export function isAdminUser(user: { app_metadata?: Record<string, unknown> | null } | null | undefined): boolean {
  return !!user && isAdminMetadata(user.app_metadata);
}
```

`src/lib/admin-auth.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
export { isAdminMetadata, isAdminUser } from "@/lib/admin-auth-edge";
export interface AdminIdentity { id: string; email: string | null }
export async function requireAdmin(): Promise<AdminIdentity | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !isAdminUser(data.user)) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
```

- [ ] **Step 4: Jalankan test, harus lolos**

Run: `npm run test:unit 2>&1 | tail -5`
Expected: PASS

- [ ] **Step 5: Buat skrip bootstrap admin**

`scripts/bootstrap-admin.mjs` (dijalankan sekali, bukan bagian app):
- Baca `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` dari env.
- Ambil email dari argumen CLI: `node scripts/bootstrap-admin.mjs admin@letmehearyou.id`.
- `supabase.auth.admin.listUsers()` → cari user dengan email tersebut → `supabase.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, is_admin: true } })`.
- Bila email tidak ditemukan → keluar dengan pesan jelas & exit code 1.
- Tidak boleh menerima `--password` atau nilai sensitif apa pun lewat argumen.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin-auth.ts src/lib/admin-auth-edge.ts src/lib/admin-auth.test.ts scripts/bootstrap-admin.mjs
git commit -m "feat(admin): add is_admin identity helpers and admin bootstrap script"
```

---

### Task 8: Guard admin di middleware & root route baru

**Files:**
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `isAdminUser` dari `@/lib/admin-auth` (middleware berjalan di Edge runtime → **import hanya fungsi murni**, jangan import modul yang memanggil `next/headers`).
- Produces: guard `/admin/*`, root route `/mitra`, `/akun`, `/praktik`.

- [ ] **Step 1: Pecah helper agar aman untuk Edge**

(Sudah dilakukan di Task 7 — `src/lib/admin-auth-edge.ts` Holds the pure implementations, `src/lib/admin-auth.ts` mere-export.) Task 8 cukup meng-import dari `@/lib/admin-auth-edge`.

- [ ] **Step 2: Tambahkan root route & guard**

`src/middleware.ts`:
- Tambah ke `ROOT_ROUTES`: `"/mitra"`, `"/akun"`, `"/praktik"`.
- Import `isAdminUser` dari `@/lib/admin-auth-edge` (**bukan** `@/lib/admin-auth` — middleware berjalan di Edge runtime dan `@/lib/admin-auth` mengimpor `next/headers`).
- Pada blok yang sudah obtaining `user` dari Supabase (di dalam `if (user) { ... }`), tambahkan **sebelum** gate `/builder`:
```ts
const isAdminPath = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
if (isAdminPath) {
  if (!isAdminUser(user)) {
    const denied = NextResponse.redirect(new URL("/", req.url));
    sessionResponse.cookies.forEach((cookie) => denied.cookies.set(cookie.name, cookie.value, cookie));
    return denied;
  }
}
```
> Guard ini **tidak** menggantikan guard Server Action (Task 7) — keduanya wajib (defense in depth).

- [ ] **Step 3: Redirect subdomain ke root kanonik**

Pada blok subdomain routing, sebelum rewrite, tambahkan:
```ts
if (url.pathname === "/mitra" || url.pathname.startsWith("/mitra/") || url.pathname === "/akun" || url.pathname.startsWith("/akun/")) {
  return NextResponse.redirect(new URL(url.pathname + url.search, "https://www.letmehearyou.id"), 307);
}
```

- [ ] **Step 4: Verifikasi manual**

Jalankan `npm run dev`, lalu:
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin` → 200 (belum login → middleware tidak redirect tanpa user; halaman server yang akan menolak)
- Login dengan akun non-admin di browser → buka `/admin` → expect redirect ke `/`.
- Login dengan akun admin (butuh Task 9 untuk punya akun admin) → lanjut setelah Task 9.

- [ ] **Step 5: Jalankan quality gate**

Run: `npm run lint && npx tsc --noEmit && npm run test:unit`
Expected: semua lolos.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/lib/admin-auth.ts src/lib/admin-auth-edge.ts src/lib/admin-auth.test.ts
git commit -m "feat(admin): guard /admin routes and register mitra account root routes"
```

---

### Task 9: Shell admin, hapus PIN, dan guard Server Action

**Files:**
- Create: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/litera/page.tsx`
- Modify: `src/app/admin/litera/AdminLiteraClient.tsx`
- Modify: `src/app/actions/admin-nft.ts`
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin` dari `@/lib/admin-auth`; `isAdminUser`.
- Produces: layout admin dengan 3 tab; `verifyAdminPin` dihapus dari `@/app/actions/admin-nft`.

- [ ] **Step 1: Buat layout shell**

`src/app/admin/layout.tsx` (server component):
```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/verifikasi", label: "Verifikasi Mitra" },
  { href: "/admin/litera", label: "Litera" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  return (
    <div className="min-h-screen bg-[#FBF8F5] text-[#3C3163]">
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <nav className="max-w-[1130px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <span className="font-extrabold text-lg">Kontrol LMHY</span>
          <span className="text-xs opacity-70">{admin.email ?? admin.id}</span>
        </nav>
        <div className="max-w-[1130px] mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-full px-4 py-2 text-xs font-semibold border border-black/[0.06] whitespace-nowrap hover:ring-2 hover:ring-[hsl(257,68%,73%)]">
              {t.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="max-w-[1130px] mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Hapus PIN gate dari `AdminLiteraClient`**

`src/app/admin/litera/AdminLiteraClient.tsx`:
- Hapus state `isAuthenticated`, `inputPin`, `pinError`, `isCheckingPin`, handler `handleVerifyPin`, dan seluruh blok JSX "PIN GATE SECURITY MODAL".
- Hapus import `verifyAdminPin`.

`src/app/actions/admin-nft.ts`:
- Hapus fungsi `verifyAdminPin`.
- Tambahkan guard di **setiap** action yang sudah ada (`getAdminLiteraQuotaAction`, `getAdminLiteraTokenomicsAction`, `saveTokenomicsConfigAction`, dan action lain di file itu):
```ts
const admin = await requireAdmin();
if (!admin) return { success: false, message: "Akses admin diperlukan." };
```

- [ ] **Step 3: Ubah route `/admin/litera` agar memakai shell**

`src/app/admin/litera/page.tsx` tetap ada, tetapi **tanpa** wrapper admin sendiri (layout `/admin` yang memberi shell). Isi: metadata + `<AdminLiteraClient />`.

- [ ] **Step 4: Buat halaman placeholder Ringkasan**

`src/app/admin/page.tsx` sementara berisi heading "Ringkasan" + satu paragraf bahwa metrik menyusul (Task 11).

- [ ] **Step 5: Verifikasi guard manual**

Jalankan `npm run dev`. Tanpa login → `/admin` harus redirect ke `/` (bukan 404/500). Dengan akun admin → shell tampil.

- [ ] **Step 6: Quality gate + commit**

```bash
npm run lint && npx tsc --noEmit && npm run test:unit && npm run build
git add src/app/admin src/app/actions/admin-nft.ts
git commit -m "feat(admin): replace PIN gate with real admin auth and add admin shell"
```

---

### Task 10: Penulis audit log

**Files:**
- Create: `src/lib/mitra/audit.ts`
- Test: `src/lib/mitra/audit.test.ts`

**Interfaces:**
- Consumes: `createAdminClient` dari `@/lib/supabase/admin`.
- Produces:
  ```ts
  export type AuditAction = "APPLICATION_APPROVED" | "APPLICATION_REJECTED" | "APPLICATION_EXPIRED" | "APPLICATION_RESUBMITTED" | "DOCUMENT_VIEWED" | "CHECKLIST_UPDATED" | "LITERA_CONFIG_UPDATED" | "EMAIL_RESENT" | "SWEEP_FAILED";
  export interface AuditEntry { action: AuditAction; targetType: string; targetId: string; note?: string; metadata?: Record<string, unknown> }
  export function isAuditAction(value: string): value is AuditAction;
  export async function writeAuditLog(actorId: string, entry: AuditEntry): Promise<boolean>;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("isAuditAction hanya menerima aksi yang dikenal", () => {
  assert.equal(isAuditAction("APPLICATION_APPROVED"), true);
  assert.equal(isAuditAction("DROP_TABLE"), false);
});
```
(test murni; `writeAuditLog` diuji lewat E2E Task 32.)

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "mitra/audit"`
Expected: FAIL — module belum ada

- [ ] **Step 3: Implementasikan modul**

`src/lib/mitra/audit.ts`:
```ts
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction = /* ... */;
export const AUDIT_ACTIONS: AuditAction[] = [ /* ... */ ];
export function isAuditAction(value: string): value is AuditAction { return (AUDIT_ACTIONS as string[]).includes(value); }
export async function writeAuditLog(actorId: string, entry: AuditEntry): Promise<boolean> {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      note: entry.note ?? null,
      metadata: entry.metadata ?? null,
    });
    return !error;
  } catch { return false; }
}
```
`writeAuditLog` **tidak pernah melempar exception** — kegagalan audit tidak boleh membatalkan aksi admin (dicatat sebagai toast peringatan).

- [ ] **Step 4: Jalankan test + commit**

```bash
npm run test:unit 2>&1 | tail -5
git add src/lib/mitra/audit.ts src/lib/mitra/audit.test.ts
git commit -m "feat(admin): add audit log writer"
```

---

### Task 11: Metrik Ringkasan

**Files:**
- Create: `src/app/admin/page.tsx` (ubah dari placeholder)
- Create: `src/lib/mitra/metrics.ts`
- Test: `src/lib/mitra/metrics.test.ts`

**Interfaces:**
- Consumes: `createAdminClient`.
- Produces:
  ```ts
  export interface OverviewMetrics {
    totalPendamping: number; totalPraktisi: number;
    statusCounts: { NONE: number; PENDING: number; APPROVED: number; REJECTED: number };
    pendingTotal: number; pendingByTrack: { SEBAYA: number; KLINIS: number };
    decided30d: { approved: number; rejected: number; expired: number };
    medianReviewHours: number | null;
  }
  export function medianReviewHours(decided: Array<{ applied_at: string; decided_at: string | null }>): number | null;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("medianReviewHours mengembalikan null bila tidak ada data", () => {
  assert.equal(medianReviewHours([]), null);
});

test("medianReviewHours menghitung median selisih jam", () => {
  const rows = [
    { applied_at: "2026-10-01T00:00:00Z", decided_at: "2026-10-01T02:00:00Z" },
    { applied_at: "2026-10-01T00:00:00Z", decided_at: "2026-10-01T04:00:00Z" },
    { applied_at: "2026-10-01T00:00:00Z", decided_at: "2026-10-01T10:00:00Z" },
  ];
  assert.equal(medianReviewHours(rows), 4);
});

test("baris tanpa decided_at diabaikan", () => {
  assert.equal(medianReviewHours([{ applied_at: "2026-10-01T00:00:00Z", decided_at: null }]), null);
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "metrics"`
Expected: FAIL

- [ ] **Step 3: Implementasikan**

`src/lib/mitra/metrics.ts` berisi `medianReviewHours` (murni) + `fetchOverviewMetrics()` (server, pakai `createAdminClient`, 4 query: `profiles` count per role, `profiles` count per `verification_status`, `provider_applications` count pending per track, `provider_applications` decided 30 hari terakhir).

`src/app/admin/page.tsx` menampilkan 6 kartu metrik (§10.2 spec) dengan Tailwind saja (bar persentase untuk `statusCounts`).

- [ ] **Step 4: Jalankan test + quality gate + commit**

```bash
npm run test:unit && npm run lint && npx tsc --noEmit
git add src/app/admin/page.tsx src/lib/mitra/metrics.ts src/lib/mitra/metrics.test.ts
git commit -m "feat(admin): add overview metrics tab"
```

---

## INCREMENT I2 — Intake Psikolog

### Task 12: Rate limit pengajuan

**Files:**
- Create: `src/lib/mitra/rate-limit.ts`
- Test: `src/lib/mitra/rate-limit.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  ```ts
  export interface RateLimitDecision { allowed: boolean; retryAfterSeconds?: number; limit: number; remaining: number }
  export function checkSubmissionRateLimit(key: string, now?: number): RateLimitDecision;
  export function recordSubmission(key: string, now?: number): RateLimitDecision;
  export function resetSubmissionRateLimit(key: string): void;
  export const IP_SUBMISSION_LIMIT = 3;      // per jam
  export const EMAIL_SUBMISSION_LIMIT = 2;   // pengajuan aktif
  export const USERNAME_CHECK_LIMIT = 20;    // per menit per IP
  export function checkUsernameCheckLimit(ip: string, now?: number): RateLimitDecision;
  export function activeApplicationCountByEmail(email: string, applications: Array<{ applicant_email: string; status: string }>): number;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("IP diblokir setelah 3 percobaan dalam 1 jam", () => {
  resetSubmissionRateLimit("ip:1.2.3.4");
  const now = Date.now();
  recordSubmission("ip:1.2.3.4", now);
  recordSubmission("ip:1.2.3.4", now);
  const third = recordSubmission("ip:1.2.3.4", now);
  assert.equal(third.allowed, false);
  const blocked = checkSubmissionRateLimit("ip:1.2.3.4", now);
  assert.equal(blocked.allowed, false);
  assert.ok((blocked.retryAfterSeconds ?? 0) > 0);
});

test("jendela waktu berakhir => dibolehkan lagi", () => {
  resetSubmissionRateLimit("ip:5.6.7.8");
  const now = Date.now();
  recordSubmission("ip:5.6.7.8", now);
  recordSubmission("ip:5.6.7.8", now);
  recordSubmission("ip:5.6.7.8", now);
  const later = now + 61 * 60 * 1000;
  assert.equal(checkSubmissionRateLimit("ip:5.6.7.8", later).allowed, true);
});

test("email dibatasi 2 pengajuan aktif", () => {
  assert.equal(activeApplicationCountByEmail("a@b.id", [
    { applicant_email: "a@b.id", status: "PENDING" },
    { applicant_email: "a@b.id", status: "APPROVED" },
  ]), 1);
  assert.equal(activeApplicationCountByEmail("a@b.id", [
    { applicant_email: "a@b.id", status: "PENDING" },
    { applicant_email: "a@b.id", status: "REJECTED" },
  ]), 1);
});

test("cek username dibatasi 20 per menit per IP", () => {
  const now = Date.now();
  for (let i = 0; i < 20; i++) checkUsernameCheckLimit("9.9.9.9", now);
  assert.equal(checkUsernameCheckLimit("9.9.9.9", now).allowed, false);
  assert.equal(checkUsernameCheckLimit("9.9.9.9", now + 61_000).allowed, true);
});
```
> "Aktif" = status `PENDING` saja (sudah `APPROVED`/`REJECTED`/`EXPIRED` tidak membatasi).

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "mitra/rate-limit"`
Expected: FAIL

- [ ] **Step 3: Implementasikan**

Sliding window 1 jam per key, `Map<string, number[]>`; `recordSubmission` mengembalikan `allowed: false` bila jumlah entri dalam jendela sudah ≥ limit. `activeApplicationCountByEmail` menghitung hanya status `PENDING`.

- [ ] **Step 4: Jalankan test + commit**

```bash
npm run test:unit 2>&1 | tail -5
git add src/lib/mitra/rate-limit.ts src/lib/mitra/rate-limit.test.ts
git commit -m "feat(mitra): add submission rate limits"
```

---

### Task 13: Aksi submit pengajuan (guest-first)

**Files:**
- Create: `src/lib/mitra/submit.ts`
- Test: `src/lib/mitra/submit.test.ts`
- Create: `src/app/actions/mitra.ts`

**Interfaces:**
- Consumes: `validateMitraDraft` (`@/lib/mitra/application-schema`), `validateMitraUsername` (`@/lib/mitra/username-rules`), `checkSubmissionRateLimit`/`recordSubmission`/`activeApplicationCountByEmail` (`@/lib/mitra/rate-limit`), `createAdminClient` (`@/lib/supabase/admin`), `createClient` (`@/lib/supabase/server`).
- Produces:
  ```ts
  export type SubmitResultCode = "OK" | "VALIDATION_FAILED" | "EMAIL_EXISTS" | "RATE_LIMITED" | "USERNAME_TAKEN" | "SERVER_ERROR";
  export interface SubmitResult { ok: boolean; code: SubmitResultCode; message?: string; issues?: ValidationIssue[]; applicationId?: string; username?: string }
  export async function submitMitraApplication(draft: MitraDraft, context?: { ip?: string }): Promise<SubmitResult>;
  export async function checkMitraUsernameAction(username: string): Promise<{ available: boolean; error?: string; suggestions: string[] }>;
  ```

- [ ] **Step 1: Tulis test yang gagal**

`src/app/actions/mitra.test.ts` — karena modul ini mengimpor `next/headers` & Supabase, **pisahkan** logika murni ke `src/lib/mitra/submit.ts` yang diuji, dan `src/app/actions/mitra.ts` hanya adapter tipis. Uji `src/lib/mitra/submit.ts`:
```ts
test("email existing menghasilkan EMAIL_EXISTS", () => {
  const r = evaluateSubmission({ existingEmails: ["budi@contoh.id"], draft: validDraft(), existingUsernames: [], rateLimited: false, activeForEmail: 0 });
  assert.equal(r.ok, false);
  assert.equal(r.code, "EMAIL_EXISTS");
});

test("rate limit menghasilkan RATE_LIMITED", () => { /* assert */ });
test("username bentrok menghasilkan USERNAME_TAKEN + saran", () => { /* assert r.suggestions?.length === 3 */ });
test("validasi gagal menghasilkan VALIDATION_FAILED + issues", () => { /* assert */ });
test("draft valid lolos ke langkah pembuatan akun", () => { /* assert r.ok === true */ });
```
`src/lib/mitra/submit.ts` menghasilkan:
```ts
export function evaluateSubmission(input: {
  draft: MitraDraft; existingEmails: string[]; existingUsernames: string[];
  rateLimited: boolean; activeForEmail: number;
}): { ok: boolean; code: SubmitResultCode; message?: string; issues?: ValidationIssue[]; suggestions?: string[] };
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "mitra/submit"`
Expected: FAIL

- [ ] **Step 3: Implementasikan `evaluateSubmission`**

Urutan pemeriksaan: rate limit → validasi schema → email existing → email aktif ≥ 2 → username bentrok.

- [ ] **Step 4: Implementasikan `src/app/actions/mitra.ts`**

`submitMitraApplication(draft, context)`:
1. `checkSubmissionRateLimit(`ip:${context?.ip ?? "unknown"}`)` → bila `!allowed` return `{ ok:false, code:"RATE_LIMITED", message:..., }`.
2. Ambil `existingEmails` & `existingUsernames` via `createAdminClient()`: `auth.admin.listUsers()`? — **dilarang** ( mahal). Gunakan: `createAdminClient().from('profiles').select('username')` untuk username; untuk email existence, `createAdminClient().auth.admin.createUser({ email, email_confirm: false, password })` dan deteksi error `"User already registered"` dari Supabase.
   Urutan aman: **validasi dulu** → `createUser` (mendeteksi email existing dari error Supabase) → `createProfile` → `createApplication` → `recordSubmission`.
3. `createUser` via `createAdminClient().auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { display_name } })`. Bila error berisi "already registered"/"already been registered" → kembalikan `EMAIL_EXISTS` **tanpa** membuat profil.
4. `createProfile`: `createAdminClient().from('profiles').insert({ id: userId, username, display_name: applicantName, creator_role: 'PENULIS', service_track: null, verification_status: 'PENDING' })`. Bila unique violation username → `USERNAME_TAKEN` + `suggestUsernames`.
5. `createApplication`: insert dengan `track`, `details` dari `normalized`, `ethics_pledge_at: now`, `pledge_version: '2026-10-20'`, `status: 'PENDING'`, `applied_at: now`.
6. `recordSubmission(`ip:${ip}`)` dan `recordSubmission(`email:${email}`)`.
7. Return `{ ok: true, code: "OK", applicationId, username }`.

- [ ] **Step 5: Jalankan test + quality gate + commit**

```bash
npm run test:unit && npm run lint && npx tsc --noEmit
git add src/lib/mitra/submit.ts src/lib/mitra/submit.test.ts src/app/actions/mitra.ts
git commit -m "feat(mitra): add guest-first application submission action"
```

---

### Task 14: Unggah dokumen aman

**Files:**
- Create: `src/lib/mitra/documents.ts`
- Test: `src/lib/mitra/documents.test.ts`
- Modify: `src/app/actions/mitra.ts`

**Interfaces:**
- Consumes: `createAdminClient`, `sharp`.
- Produces:
  ```ts
  export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
  export const ALLOWED_DOCUMENT_MIME = ["application/pdf", "image/jpeg", "image/png"];
  export const MAX_DOCUMENTS_PER_APPLICATION = 4;
  export interface DocumentValidation { ok: boolean; error?: string }
  export function validateDocumentUpload(input: { mimeType: string; sizeBytes: number; filename: string }): DocumentValidation;
  export function sanitizeFilename(filename: string): string;
  export function buildDocumentPath(applicationId: string, docType: string, uuid: string): string;
  export async function stripImageMetadata(buffer: Buffer, mimeType: string): Promise<Buffer>;
  export async function createUploadTicket(input: { applicationId: string; userId: string; docType: string; mimeType: string; sizeBytes: number; filename: string }): Promise<{ ok: boolean; path?: string; token?: string; error?: string }>;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("MIME di luar daftar ditolak", () => {
  assert.equal(validateDocumentUpload({ mimeType: "text/html", sizeBytes: 1000, filename: "a.html" }).ok, false);
  assert.equal(validateDocumentUpload({ mimeType: "application/pdf", sizeBytes: 1000, filename: "a.pdf" }).ok, true);
});

test("ukuran melebihi 5MB ditolak", () => {
  assert.equal(validateDocumentUpload({ mimeType: "application/pdf", sizeBytes: 5 * 1024 * 1024 + 1, filename: "a.pdf" }).ok, false);
});

test("nama file disanitasi tanpa path traversal", () => {
  assert.equal(sanitizeFilename("../../etc/passwd"), "etcpasswd");
  assert.equal(sanitizeFilename("STR saya.pdf"), "str-saya.pdf");
});

test("path dokumen memakai applicationId dan uuid", () => {
  assert.equal(buildDocumentPath("app-1", "STR", "u-1"), "applications/app-1/STR-u-1");
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "mitra/documents"`
Expected: FAIL

- [ ] **Step 3: Implementasikan modul**

- `validateDocumentUpload`: cek MIME ∈ daftar, `sizeBytes > 0 && <= MAX_DOCUMENT_BYTES`.
- `sanitizeFilename`: basename → ganti non `[a-z0-9-]` dengan `-` → collapse `-` → trim `-` → fallback `"dokumen"`.
- `buildDocumentPath`: `applications/{applicationId}/{docType}-{uuid}` (ekstensi ditambahkan nanti dari MIME: `.pdf`/`.jpg`/`.png`).
- `stripImageMetadata`: bila MIME gambar → `sharp(buffer).rotate().withMetadata({})` → `.toBuffer()` (buang EXIF); bila PDF → buffer asli.
- `createUploadTicket`: validasi → cek jumlah dokumen existing < 4 → `createAdminClient().storage.from('provider-credentials').createSignedUploadUrl(path)` → kembalikan `{ ok: true, path, token }`.

- [ ] **Step 4: Tambahkan action `createDocumentUploadAction`**

`src/app/actions/mitra.ts`:
```ts
export async function createDocumentUploadAction(input: { applicationId: string; docType: string; mimeType: string; sizeBytes: number; filename: string }): Promise<{ ok: boolean; path?: string; token?: string; error?: string }>
```
Verifikasi kepemilikan: application `user_id` = session user (atau admin). Wajib memverifikasi `user` ada; bila tidak → `{ ok:false, error: "Sesi masuk tidak ditemukan." }`.

- [ ] **Step 5: Jalankan test + commit**

```bash
npm run test:unit && npx tsc --noEmit
git add src/lib/mitra/documents.ts src/lib/mitra/documents.test.ts src/app/actions/mitra.ts
git commit -m "feat(mitra): add secure credential document upload with signed URLs"
```

---

### Task 15: Halaman hub `/mitra`

**Files:**
- Create: `src/app/mitra/page.tsx`
- Create: `src/components/mitra/MitraHero.tsx`
- Create: `src/lib/mitra/flags.ts`

**Interfaces:**
- Consumes: token Warm Sanctuary; `Link` dari `next/link`.
- Produces: route publik `/mitra`.

- [ ] **Step 1: Buat halaman**

`src/app/mitra/page.tsx` (server component, `export const dynamic = "force-dynamic"`): hero "Bergabung sebagai Mitra Let Me Hear You", dua kartu jalur:
- **Praktisi Psikolog** → CTA `Link href="/mitra/psikolog"` — daftar syarat singkat (gelar S2, STR/SIPP, upload dokumen).
- **Pendamping Sebaya** → CTA `Link href="/mitra/pendamping"` — syarat (motivasi, grup WhatsApp, pelatihan First Aid).
Bagian bawah: tabel 2 kolom benefit **Sebaya** vs **Klinis** (harga Sapa/Cerita/Dengar sesuai spec §3 D2), blok ethos (kode etik, referensi krisis), FAQ 5 item, dan catatan "Paket berbayar & ruang praktik segera hadir".

**Feature flag:** bila `process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED !== "true"`, form (`/mitra/psikolog`, `/mitra/pendamping`) menampilkan halaman "Segera hadir" — implementasikan sebagai helper `src/lib/mitra/flags.ts`:
```ts
export function isMitraIntakeEnabled(): boolean { return process.env.NEXT_PUBLIC_MITRA_INTAKE_ENABLED === "true"; }
export function isTrackEnabled(track: "SEBAYA" | "KLINIS"): boolean {
  if (!isMitraIntakeEnabled()) return false;
  const env = track === "SEBAYA" ? process.env.NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED : process.env.NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED;
  return env !== "false";
}
```

- [ ] **Step 2: Verifikasi manual**

Run: `npm run dev` → buka `http://localhost:3000/mitra`.
Expected: dua kartu jalur + CTA; klik CTA saat flag `false` → "Segera hadir".

- [ ] **Step 3: Commit**

```bash
git add src/app/mitra src/components/mitra src/lib/mitra/flags.ts
git commit -m "feat(mitra): add public partner hub page"
```

---

### Task 16: Form psikolog 3 langkah

**Files:**
- Create: `src/app/mitra/psikolog/page.tsx`
- Create: `src/components/mitra/PsikologApplicationForm.tsx`
- Create: `src/components/mitra/MitraField.tsx`
- Create: `src/components/mitra/MitraStepper.tsx`
- Create: `src/components/mitra/DocumentUploader.tsx`

**Interfaces:**
- Consumes: `submitMitraApplication` & `checkMitraUsernameAction` (`@/app/actions/mitra`); `validateMitraDraft` (`@/lib/mitra/application-schema`); `validateMitraUsername` (`@/lib/mitra/username-rules`); `createDocumentUploadAction`.
- Produces: route `/mitra/psikolog`; komponen klien dengan props `{}` (tanpa props server).

- [ ] **Step 1: Bangun komponen dasar**

- `MitraField.tsx`: wrapper label + input + pesan error; props `{ label, name, error?, hint?, children }`; wiring `aria-invalid` & `aria-describedby` yang benar.
- `MitraStepper.tsx`: indikator 3 langkah; props `{ current: 1 | 2 | 3; labels: string[] }`.
- `DocumentUploader.tsx`: input file (accept `application/pdf,image/jpeg,image/png`), props `{ docType: string; applicationId?: string; onUploaded?: (path: string) => void; onError?: (message: string) => void }`; alur: `createDocumentUploadAction` → PUT ke `token` → sukses → `onUploaded(path)`.

- [ ] **Step 2: Bangun form 3 langkah**

`PsikologApplicationForm.tsx`:
- State: `step`, `draft` (semua field), `issues`, `suggests`, `isPending` (`useTransition`), `submitted`.
- **Langkah 1**: nama+gelar, email, WhatsApp, kota, provinsi (select 38 provinsi), username (live check debounce 400ms memakai `checkMitraUsernameAction` → tampilkan 3 saran bila bentrok), kata sandi.
- **Langkah 2**: kampus S2, tahun lulus, peminatan (select 6), nomor STR, status STR (radio AKTIF/TIDAK_AKTIF — bila TIDAK_AKTIF tampilkan catatan "Pengajuan tetap dapat diajukan; tim kami akan meninjaunya lebih ketat"), tempat praktik, lama pengalaman (select), jam terbang (select, opsional), modalitas (checkbox VIDEO/VOICE/CHAT, min 1).
- **Langkah 3**: upload STR (wajib) & CV (opsional), checkbox kebenaran data, checkbox kode etik (tautan ke naskah `/mitra/pakta-etika`), honeypot `<input name="website" className="hidden" tabIndex={-1} autoComplete="off">`, dan `formStartedAt` (timestamp saat mount) untuk(time-to-submit ≥5 detik).
- Submit: `validateMitraDraft` (klien) → bila issues, tampilkan inline; bila ok → `submitMitraApplication(draft, { ip })`; sukses → layar sukses "Cek email untuk verifikasi" + link `/akun/pengajuan` (login) + link `/mitra/status`.
- Honeypot terisi atau `Date.now() - formStartedAt < 5000` → jangan kirim (tampilkan pesan generik).

- [ ] **Step 3: Halaman server**

`src/app/mitra/psikolog/page.tsx`: metadata + guard flag (`isTrackEnabled("KLINIS")` → tampilkan "Segera datang" bila mati) + render `<PsikologApplicationForm />`.

- [ ] **Step 4: Verifikasi manual**

Run: `npm run dev` → buka `/mitra/psikolog`:
- L1: username "admin" → error reserved; username bentrok → 3 saran.
- L2: modalitas kosong → error; lanjut tanpa L2 → error.
- L3: submit kosong → error; isi semua → layar sukses.
- Ketik cepat (<5 detik) lalu submit → ditolak.

- [ ] **Step 5: Quality gate + commit**

```bash
npm run lint && npx tsc --noEmit && npm run build
git add src/app/mitra/psikolog src/components/mitra
git commit -m "feat(mitra): add three-step psychologist application form"
```

---

### Task 17: Halaman status & login redirect

**Files:**
- Create: `src/app/mitra/status/page.tsx`

**Interfaces:**
- Consumes: —
- Produces: route `/mitra/status`.

- [ ] **Step 1: Buat halaman**

Konten: penjelasan bahwa status pengajuanSeen setelah akun dibuat, tombol **"Masuk & lihat status"** → `/login?next=/akun/pengajuan`, tombol **"Belum punya akun?"** → `/mitra/psikolog`, dan catatan bahwa password dapat diatur ulang lewat halaman login. Tidak boleh menampilkan form lookup email (P5).

- [ ] **Step 2: Verifikasi + commit**

```bash
npm run dev  # buka /mitra/status
git add src/app/mitra/status
git commit -m "feat(mitra): add application status explainer page"
```

---

### Task 18: Cek username live

**Files:**
- Modify: `src/app/actions/mitra.ts`
- Test: `src/lib/mitra/username-rules.test.ts` (tambahan)

**Interfaces:**
- Consumes: `validateMitraUsername`, `suggestUsernames`.
- Produces: `checkMitraUsernameAction(username: string): Promise<{ available: boolean; error?: string; suggestions: string[] }>`.

- [ ] **Step 1: Tulis test tambahan**

Tambahkan ke test username-rules: `suggestUsernames` tidak menghasilkan nama yang melewati reserved list (mis. input "admin" → tidak boleh menghasilkan "admin-1").

- [ ] **Step 2: Implementasikan action**

`checkMitraUsernameAction`:
1. `validateMitraUsername(username)` → bila invalid → `{ available:false, error }`.
2. Query `profiles` via `createAdminClient()` → `select('username').eq('username', username).maybeSingle()` → bila ada → `{ available:false, error: "Username sudah dipakai.", suggestions: suggestUsernames(username, taken) }` dengan `taken` = username itu sendiri + 2 hasil suggest sebelumnya.
3. Rate limit ringan: `checkUsernameCheckLimit(ip)` — 20 pemeriksaan per menit per IP (bukan limit submit).

- [ ] **Step 3: Jalankan test + commit**

```bash
npm run test:unit && npx tsc --noEmit
git add src/app/actions/mitra.ts src/lib/mitra/username-rules.test.ts
git commit -m "feat(mitra): add live username availability check for intake forms"
```

---

### Task 19: Halaman naskah etika (dipakai form)

**Files:**
- Create: `src/app/mitra/pakta-etika/page.tsx`

**Interfaces:**
- Produces: route `/mitra/pakta-etika` (naskah kode etik untuk psikolog & pendamping).

- [ ] **Step 1: Tulis naskah**

Dua bagian:
- **Kode Etik Praktik Psikologi & Batas Telemedisin** (untuk track KLINIS):CASTegan;It requires legal references (UU Kesehatan 17/2023, Himpsi), batasan diagnosis & resep, kerahasiaan, rujukan, dan aturan berlisensi.
- **Pakta Batasan Etis Pendamping Sebaya** (track SEBAYA): "Sesi Dengar" empati non-klinis, larangan diagnosis/terapi/resep, kewajiban merujuk, protokol krisis (LISA 0811-3815-472, Kemenkes 119 ext 8), kewajiban pelatihan First Aid.

Sertakan `pledge_version` yang akan disimpan: `2026-10-20`.

- [ ] **Step 2: Link dari form + commit**

```bash
git add src/app/mitra/pakta-etika src/components/mitra/PsikologApplicationForm.tsx
git commit -m "feat(mitra): add ethical pledge pages for both tracks"
```

---

## INCREMENT I3 — Pendamping, Area Akun, Approve/Reject

### Task 20: Area akun `/akun`

**Files:**
- Create: `src/app/akun/page.tsx`
- Create: `src/components/mitra/AccountOverview.tsx`
- Create: `src/components/mitra/ApplicationTimeline.tsx`

**Interfaces:**
- Consumes: `createClient` (`@/lib/supabase/server`), `createAdminClient`.
- Produces: route `/akun` (query `?tab=ringkasan|pengajuan`).

- [ ] **Step 1: Buat server page**

`src/app/akun/page.tsx`:
- `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login?next=/akun');`
- Ambil `profiles` (id, username, display_name, creator_role, service_track, verification_status) via `createAdminClient()` (RLS deny-all ⇒ WAJIB service role di server).
- Ambil `provider_applications` milik user: `select('*').eq('user_id', user.id).order('applied_at', { ascending: false })`.
- Render `<AccountOverview />` (Ringkasan) atau `<ApplicationTimeline applications={...} />` (Pengajuan) sesuai `searchParams.tab`.

- [ ] **Step 2: Komponen**

- `AccountOverview`: nama, username (link ke `/{username}`), role + badge, status pengajuan aktif, CTA "Ajukan Jadi Pendamping Sebaya" → `/mitra/pendamping` (bila `creator_role === 'PENULIS'`).
- `ApplicationTimeline`: daftar pengajuan (track, tanggal, status badge, waktu review), detail alasan penolakan (`decision_note`), tombol "Perbaiki & Ajukan Ulang" (Task 26) bila status `REJECTED` atau `EXPIRED`.

- [ ] **Step 3: Verifikasi manual**

Login sebagai akun uji → `/akun` menampilkan ringkasan; `?tab=pengajuan` menampilkan timeline.

- [ ] **Step 4: Commit**

```bash
git add src/app/akun src/components/mitra
git commit -m "feat(account): add account area with application status timeline"
```

---

### Task 21: Form pendamping 2 langkah

**Files:**
- Create: `src/app/mitra/pendamping/page.tsx`
- Create: `src/components/mitra/PendampingApplicationForm.tsx`

**Interfaces:**
- Consumes: `submitMitraApplication`; `validateMitraDraft`; `validateMitraUsername`; `createDocumentUploadAction`.
- Produces: route `/mitra/pendamping`.

- [ ] **Step 1: Bangun form**

- **Langkah 1**: nama, email, WhatsApp, kota, provinsi, username (live check), kata sandi — **prefill** bila sudah login: server page membaca session & profil, meneruskan `initialValues` ke form (email/username/display_name terkunci, tetap bisa diubah email dengan konfirmasi).
- **Langkah 2**: latar belakang (select 4), motivasi (textarea min 200, dengan penghitung karakter), pengalaman mendengarkan (textarea min 80), ketersediaan waktu, checkbox kode etis (link `/mitra/pakta-etika`), nomor WhatsApp + tombol "Buka grup WhatsApp LMHY" (link grup, URL dari `NEXT_PUBLIC_WA_GROUP_URL`), checkbox "sudah bergabung ke grup", checkbox kesediaan mengikuti pelatihan First Aid Counseling, upload sertifikat pelatihan (opsional).
- Submit memakai `submitMitraApplication` dengan `track: "SEBAYA"`.

- [ ] **Step 2: Halaman server**

`src/app/mitra/pendamping/page.tsx`: guard `isTrackEnabled("SEBAYA")`; bila user sudah login, ambil profil & prefill.

- [ ] **Step 3: Verifikasi + commit**

```bash
npm run lint && npx tsc --noEmit && npm run build
git add src/app/mitra/pendamping src/components/mitra/PendampingApplicationForm.tsx
git commit -m "feat(mitra): add peer counselor application form"
```

---

### Task 22: Banner ajakan di halaman profil

**Files:**
- Modify: `src/app/tenant/[username]/page.tsx`

**Interfaces:**
- Consumes: session user + profil (server component).
- Produces: banner ajakan "Ajukan Jadi Pendamping Sebaya" yang hanya tampil untuk akun non-provider (`creator_role === 'PENULIS'`).

- [ ] **Step 1: Implementasikan banner**

Tambahkan blok di atas artikel/tab: bila `user && profile.creator_role === 'PENULIS'` → banner dengan `Link href="/mitra/pendamping"` (root domain, bukan subdomain — middleware mengarahkan ke root).
Tampilan: kartu kecil dengan token Warm Sanctuary, teks "Tertarik menjadi Pendamping Sebaya? Dapatkan pelatihan First Aid Counseling, komunitas, dan akses sesi dengar." + tombol.

- [ ] **Step 2: Verifikasi + commit**

```bash
npm run lint && npx tsc --noEmit
git add "src/app/tenant/[username]/page.tsx"
git commit -m "feat(profile): add peer counselor invitation banner for writers"
```

---

### Task 23: Antrean admin

**Files:**
- Create: `src/app/admin/verifikasi/page.tsx`
- Create: `src/components/admin/VerificationQueue.tsx`
- Create: `src/components/admin/QueueFilters.tsx`
- Create: `src/lib/mitra/queue.ts`
- Test: `src/lib/mitra/queue.test.ts`

**Interfaces:**
- Consumes: `createAdminClient`.
- Produces: route `/admin/verifikasi`; fungsi murni:
  ```ts
  export interface QueueItem {
    id: string; applicant_name: string; applicant_email: string; username: string;
    track: "SEBAYA" | "KLINIS"; status: ApplicationStatus; applied_at: string;
    email_verified_at: string | null; wa_joined_confirmed_at: string | null;
    pfa_status: "BELUM" | "SEDANG" | "SELESAI";
    details: Record<string, unknown>;
    redFlags: string[]; ageHours: number; needsAction: boolean;
  }
  export function computeRedFlags(item: Pick<QueueItem, "track"|"email_verified_at"|"wa_joined_confirmed_at"|"pfa_status"|"details">): string[];
  export function needsAction(item: Pick<QueueItem, "applied_at"|"email_verified_at">, now: Date): boolean;
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("red flag mendeteksi email, WA, PFA, dan STR tidak aktif", () => {
  const flags = computeRedFlags({
    track: "SEBAYA",
    email_verified_at: null,
    wa_joined_confirmed_at: null,
    pfa_status: "BELUM",
    details: {},
  });
  assert.ok(flags.includes("EMAIL BELUM TERVERIFIKASI"));
  assert.ok(flags.includes("WA BELUM DIVERIFIKASI"));
  assert.ok(flags.includes("PFA BELUM SELESAI"));

  const klinis = computeRedFlags({
    track: "KLINIS",
    email_verified_at: new Date().toISOString(),
    wa_joined_confirmed_at: null,
    pfa_status: "BELUM",
    details: { sip_status: "TIDAK_AKTIF" },
  });
  assert.ok(klinis.includes("STR TIDAK AKTIF"));
  assert.ok(!klinis.includes("WA BELUM DIVERIFIKASI"));
});

test("needsAction true bila belum verifikasi email lewat 7 hari", () => {
  const applied = new Date("2026-10-01T00:00:00Z");
  assert.equal(needsAction({ applied_at: applied.toISOString(), email_verified_at: null }, new Date("2026-10-05T00:00:00Z")), false);
  assert.equal(needsAction({ applied_at: applied.toISOString(), email_verified_at: null }, new Date("2026-10-09T00:00:00Z")), true);
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "mitra/queue"`
Expected: FAIL

- [ ] **Step 3: Implementasikan `src/lib/mitra/queue.ts`**

`computeRedFlags` mengembalikan array label persis: `EMAIL BELUM TERVERIFIKASI`, `WA BELUM DIVERIFIKASI`, `PFA BELUM SELESAI`, `STR TIDAK AKTIF`, `BERKAS KURANG` (hanya bila `details.document_count === 0` — field ini diisi server dari hitungan `provider_documents`).

- [ ] **Step 4: Bangun halaman & komponen**

`src/app/admin/verifikasi/page.tsx` (server): `requireAdmin()` (layout sudah menjaga, tapi tetap cek) → query `provider_applications` (status default `PENDING`) + hitung `document_count` per application → serialize ke `VerificationQueue`.
`VerificationQueue.tsx` (client): daftar kiri + panel detail kanan; state: `track`, `status`, `q`, `sort`; fetch ulang lewat `router.refresh()` setelah aksi.
`QueueFilters.tsx`: kontrol filter (link-based, bukan state) memakai `searchParams`.

- [ ] **Step 5: Jalankan test + commit**

```bash
npm run test:unit && npx tsc --noEmit
git add src/app/admin/verifikasi src/components/admin src/lib/mitra/queue.ts src/lib/mitra/queue.test.ts
git commit -m "feat(admin): add provider verification queue with red flags"
```

---

### Task 24: Detail panel, checklist, dan preview dokumen

**Files:**
- Create: `src/components/admin/VerificationDetail.tsx`
- Create: `src/components/admin/AdminChecklist.tsx`
- Create: `src/app/actions/admin-mitra.ts`
- Test: `src/lib/mitra/documents.test.ts` (tambahan)
**Interfaces:**
- Consumes: `requireAdmin`, `writeAuditLog`, `evaluateApproval`/`evaluateRejection`, `createAdminClient`.
- Produces (dari `src/app/actions/admin-mitra.ts`):
  ```ts
  export interface AdminActionResult { ok: boolean; code?: string; message?: string }
  export async function getApplicationDetailAction(applicationId: string): Promise<{ ok: boolean; application?: Record<string, unknown>; documents?: Array<{ id: string; doc_type: string; uploaded_at: string }>; error?: string }>;
  export async function getDocumentUrlAction(documentId: string): Promise<{ ok: boolean; url?: string; error?: string }>;
  export async function updateChecklistAction(applicationId: string, patch: { waJoinedConfirmed?: boolean; pfaStatus?: "BELUM" | "SEDANG" | "SELESAI" }): Promise<AdminActionResult>;
  ```

- [ ] **Step 1: Implementasikan action**

`getDocumentUrlAction(documentId)`:
1. `const admin = await requireAdmin(); if (!admin) return { ok: false, error: "Akses admin diperlukan." };`
2. Ambil `provider_documents` row (service role) → `storage.from('provider-credentials').createSignedUrl(path, 60)` (60 detik).
3. `writeAuditLog(admin.id, { action: "DOCUMENT_VIEWED", targetType: "provider_document", targetId: documentId })`.
4. Return `{ ok: true, url }`.
5. **Signed URL kedaluwarsa**: aksi menerima parameter `retry` (default `false`); bila pemanggil melaporkan 403/expired → panggil ulang tanpa `retry` untuk membuat URL baru. Di UI, `VerificationDetail` menangani error 403 dengan mengulang permintaan sekali lalu menampilkan pesan "Berkas tidak dapat dibuka, coba lagi."

`updateChecklistAction`:
1. `requireAdmin()` → update `wa_joined_confirmed_at` (bila `waJoinedConfirmed === true`) atau `pfa_status`; `writeAuditLog(... "CHECKLIST_UPDATED" ...)`.

- [ ] **Step 2: Bangun komponen**

- `AdminChecklist.tsx`: 4 item (WA dikonfirmasi, PFA selesai, Berkas STR lengkap, Etika disetujui) — toggle yang memanggil `updateChecklistAction`; state "email terverifikasi" read-only dari `email_verified_at`.
- `VerificationDetail.tsx`: header (nama, track badge, username, tanggal), kontak PII, detail per track (render dari `details` jsonb), daftar dokumen (tombol "Lihat" → `getDocumentUrlAction` → `window.open(url)`), checklist, dan area aksi (tombol Setujui/Tolak — Task 25).
- **Tombol "Salin pesan"** (WA): di header detail, tombol yang menyalin template pesan ke clipboard. Template berasal dari `src/lib/email-templates.ts` versi pendek (1–2 kalimat), bukan email lengkap — format: `Halo {nama}, pengajuan kemitraan Anda di LMHY sudah kami terima…`. Gunakan `navigator.clipboard.writeText` dengan fallback `document.execCommand('copy')`. Tidak mengirim WA otomatis (desain: admin mengirim manual, konsisten dengan model komunitas WA).

- [ ] **Step 3: Verifikasi manual**

Buka `/admin/verifikasi` → klik "Lihat" dokumen → signed URL terbuka, dan baris `DOCUMENT_VIEWED` muncul di `admin_audit_log` (verifikasi via SQL).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin src/app/actions/admin-mitra.ts src/lib/mitra/documents.test.ts
git commit -m "feat(admin): add verification detail panel with audited document preview"
```

---

### Task 25: Aksi approve & reject (atomik, race-safe)

**Files:**
- Modify: `src/app/actions/admin-mitra.ts`
- Test: `src/lib/mitra/application-state.test.ts` (tambahan)

**Interfaces:**
- Consumes: `requireAdmin`, `evaluateApproval`, `evaluateRejection`, `roleForTrack`, `serviceTrackForTrack`, `writeAuditLog`, `createAdminClient`.
- Produces:
  ```ts
  export async function approveApplicationAction(applicationId: string): Promise<AdminActionResult>;
  export async function rejectApplicationAction(applicationId: string, note: string): Promise<AdminActionResult>;
  ```

- [ ] **Step 1: Implementasikan approve (WAJIB optimistic concurrency)**

```
1. admin = await requireAdmin(); bila null → { ok:false, code:"FORBIDDEN" }
2. Muat application + documents (service role).
3. gate = evaluateApproval({...}); bila !gate.allowed → { ok:false, code:"GATE_FAILED", message: gate.reasons.join(" ") }
4. const { data, error } = await createAdminClient()
     .from('provider_applications')
     .update({ status:'APPROVED', decided_at: nowIso, decided_by: admin.id, decision_note: note ?? null })
     .eq('id', applicationId).eq('status','PENDING').select('id');
   bila error → { ok:false, code:"SERVER_ERROR" }
   bila data.length === 0 → { ok:false, code:"ALREADY_DECIDED", message:"Pengajuan ini sudah diproses admin lain." }
5. Update profiles: creator_role=roleForTrack(track), service_track=serviceTrackForTrack(track),
   verification_status='APPROVED', verified_at=nowIso, verified_by=admin.id, verification_note=note ?? null
   (WHERE id = application.user_id)
6. UPDATE provider_applications SET status='SUPERSEDED' WHERE user_id=application.user_id AND status='PENDING' AND id<>applicationId
7. writeAuditLog(admin.id, { action:'APPLICATION_APPROVED', targetType:'provider_application', targetId:applicationId, note })
8. Return { ok:true }
```

- [ ] **Step 2: Implementasikan reject**

Mirip approve, tetapi: `evaluateRejection` (catatan wajib ≥10 karakter), `status='REJECTED'`, `profiles.verification_status='REJECTED'` + `verification_note = note`, **tidak** mengubah `creator_role` (tetap `PENULIS`), `writeAuditLog('APPLICATION_REJECTED')`.

- [ ] **Step 3: Tulis test untuk gate (tambahan)**

Tambahkan ke `application-state.test.ts`:
```ts
test("gate approve menolak pengajuan yang sudah diputuskan", () => {
  const r = evaluateApproval({ status: "APPROVED", track: "KLINIS", emailVerifiedAt: new Date().toISOString(), waJoinedConfirmedAt: null, pfaStatus: "BELUM", hasRequiredDocuments: true, adminUserId: "a", applicantUserId: "u" });
  assert.equal(r.allowed, false);
});
```

- [ ] **Step 4: Verifikasi race manual**

Buka dua tab admin dengan pengajuan yang sama → klik Setujui di tab 1 (sukses) → tab 2 (harus tampil "sudah diproses admin lain", dan data tidak berubah).

- [ ] **Step 5: Commit**

```bash
npm run test:unit && npx tsc --noEmit
git add src/app/actions/admin-mitra.ts src/lib/mitra/application-state.test.ts
git commit -m "feat(admin): add atomic approve and reject actions with race guard"
```

---

### Task 26: Ajukan ulang & pelepasan username

**Files:**
- Modify: `src/app/actions/mitra.ts`
- Modify: `src/app/akun/page.tsx`

**Interfaces:**
- Consumes: `createAdminClient`, `validateMitraDraft`.
- Produces: `resubmitMitraApplicationAction(applicationId: string, draft: MitraDraft): Promise<SubmitResult>`.

- [ ] **Step 1: Implementasikan aksi**

1. `requireOwner(applicationId)` — session user harus pemilik (bukan admin).
2. `validateMitraDraft(draft)`.
3. Update row lama: `status = 'SUPERSEDED'`.
4. Insert row baru: track & details baru, `supersedes = applicationId`, `status='PENDING'`, `applied_at=now`, `ethics_pledge_at=now`.
5. Update `superseded_by` pada row lama.
6. `writeAuditLog(adminOrOwnerId, { action: 'APPLICATION_RESUBMITTED', ... })` — actor = user id pelamar (audit tetap mencatat).
7. Return `{ ok: true, applicationId: newId }`.

- [ ] **Step 2: Hubungkan dari UI**

`ApplicationTimeline.tsx`: tombol "Perbaiki & Ajukan Ulang" → buka form prefilled dengan `details` lama (route `/mitra/pendamping?resubmit=<id>` atau `/mitra/psikolog?resubmit=<id>`).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/mitra.ts src/app/akun src/components/mitra
git commit -m "feat(mitra): add resubmission flow that supersedes the previous application"
```

---

### Task 27: Sweep expiry & pelepasan username

**Files:**
- Create: `src/app/actions/admin-mitra.ts` (tambahan `runExpirySweepAction`)
- Create: `scripts/sweep-expired-applications.mjs`
- Test: `src/lib/mitra/expiry.test.ts` (tambahan)

**Interfaces:**
- Consumes: `isEmailVerificationExpired`, `isApplicationExpired`, `createAdminClient`, `writeAuditLog`.
- Produces: `runExpirySweepAction(): Promise<{ ok: boolean; expiredEmail: number; expiredApplication: number; releasedUsernames: number }>`.

- [ ] **Step 1: Implementasikan sweep**

1. Ambil `provider_applications` dengan `status='PENDING'`.
2. Untuk tiap row: bila `email_verified_at` null && `isEmailVerificationExpired(applied_at, now)` → `status='EXPIRED'`, `decided_at=now`, `decided_by=null`, `decision_note='Email tidak terverifikasi dalam 7 hari.'` → panggil SQL `release_mitra_username(user_id)` → catat audit.
3. Else bila `isApplicationExpired(applied_at, now)` → `status='EXPIRED'`, `decision_note='Pengajuan melewati batas 30 hari.'` → release username → audit.
4. `writeAuditLog` dengan actor = `null`-safe: gunakan `system` actor id dari env `ADMIN_SYSTEM_ACTOR_ID` bila ada, atau skip pencatatan actor (`actor_id` NOT NULL ⇒ gunakan id admin bootstrap pertama). Implementasikan: ambil id admin pertama dari `admin_audit_log` terbaru; bila tidak ada, lewati pencatatan.

- [ ] **Step 2: Tulis script harian**

`scripts/sweep-expired-applications.mjs` memanggil HTTP endpoint internal atau menduplikasi logika? **Pilih:** logika sweep tetap di `src/app/actions/admin-mitra.ts` (server-only), dan script memanggil route handler baru `src/app/api/internal/sweep/route.ts` yang memanggil `runExpirySweepAction` dengan header `x-sweep-secret` yang dicocokkan dengan env `SWEEP_SECRET`. Bila env belum diset → 404.

- [ ] **Step 3: Test**

Tambahkan ke `expiry.test.ts`:
```ts
test("ambang 7 hari dan 30 hari tepat di batasnya", () => {
  const applied = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(isEmailVerificationExpired(applied, new Date("2026-10-08T00:00:00.000Z")), true);
  assert.equal(isApplicationExpired(applied, new Date("2026-10-31T00:00:00.000Z")), true);
});
```
(nilai exact 7×86400000 dan 30×86400000 → `>` boundary)

- [ ] **Step 4: Commit**

```bash
npm run test:unit && npx tsc --noEmit
git add src/app/actions/admin-mitra.ts src/app/api/internal/sweep scripts/sweep-expired-applications.mjs src/lib/mitra/expiry.test.ts
git commit -m "feat(mitra): add expiry sweep that releases unclaimed usernames"
```

---

## INCREMENT I4 — Polish, Email, E2E, QA

### Task 28: Adapter email & template

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/email-templates.ts`
- Test: `src/lib/email-templates.test.ts`

**Interfaces:**
- Consumes: env `RESEND_API_KEY`, `BREVO_API_KEY`, `EMAIL_FROM`.
- Produces:
  ```ts
  export interface EmailMessage { to: string; subject: string; html: string; text: string }
  export interface EmailResult { ok: boolean; skipped: boolean; error?: string }
  export async function sendEmail(message: EmailMessage): Promise<EmailResult>;
  export function applicationReceivedTemplate(args: { applicantName: string; username: string }): { subject: string; html: string; text: string };
  export function applicationApprovedTemplate(args: { applicantName: string; roleLabel: string; username: string }): { subject: string; html: string; text: string };
  export function applicationRejectedTemplate(args: { applicantName: string; note: string; username: string }): { subject: string; html: string; text: string };
  export function applicationExpiredTemplate(args: { applicantName: string; username: string }): { subject: string; html: string; text: string };
  export function verificationReminderTemplate(args: { applicantName: string; username: string }): { subject: string; html: string; text: string };
  ```

- [ ] **Step 1: Tulis test yang gagal**

```ts
test("template approval memuat nama, role, dan username", () => {
  const t = applicationApprovedTemplate({ applicantName: "Budi", roleLabel: "Praktisi Terverifikasi", username: "budi" });
  assert.ok(t.subject.includes("Budi"));
  assert.ok(t.html.includes("Praktisi Terverifikasi"));
  assert.ok(t.html.includes("budi"));
  assert.ok(t.text.length > 0);
});

test("template penolakan memuat catatan perbaikan", () => { /* assert note muncul */ });
test("semua template memakai token Warm Sanctuary", () => {
  for (const t of [applicationReceivedTemplate({ applicantName: "A", username: "a" }), applicationApprovedTemplate({ applicantName: "A", roleLabel: "P", username: "a" }), applicationRejectedTemplate({ applicantName: "A", note: "x", username: "a" }), applicationExpiredTemplate({ applicantName: "A", username: "a" }), verificationReminderTemplate({ applicantName: "A", username: "a" })]) {
    assert.ok(t.html.includes("#FBF8F5"));
    assert.ok(t.html.includes("#3C3163"));
    assert.ok(t.html.includes("Poppins"));
  }
});
```

- [ ] **Step 2: Jalankan test, harus gagal**

Run: `npm run test:unit 2>&1 | grep "email-templates"`
Expected: FAIL

- [ ] **Step 3: Implementasikan template**

`src/lib/email-templates.ts` — fungsi murni; HTML memakai inline style (email client-safe), font `Poppins, Arial, sans-serif`, latar `#FBF8F5`, teks `#3C3163`, aksen `#F7ABC5`, tombol `background:#F7ABC5;color:#3C3163;border-radius:12px`.

`src/lib/email.ts`:
```ts
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  if (!resendKey && !brevoKey) return { ok: false, skipped: true, error: "Provider email belum dikonfigurasi." };
  try {
    // Resend: POST https://api.resend.com/emails  { from, to, subject, html, text }
    // Brevo: POST https://api.brevo.com/v3/smtp/email { sender:{email}, to:[{email}], subject, htmlContent, textContent }
    //   → pilih salah satu (Resend bila key tersedia), retry 1× dengan jeda 500ms
    return { ok: true, skipped: false };
  } catch (err) {
    return { ok: false, skipped: false, error: err instanceof Error ? err.message : "Gagal mengirim email." };
  }
}
```

- [ ] **Step 4: Jalankan test + commit**

```bash
npm run test:unit && npx tsc --noEmit
git add src/lib/email.ts src/lib/email-templates.ts src/lib/email-templates.test.ts
git commit -m "feat(email): add email provider adapter and notification templates"
```

---

### Task 29: Pasang email ke alur pengajuan

**Files:**
- Modify: `src/app/actions/mitra.ts`
- Modify: `src/app/actions/admin-mitra.ts`

**Interfaces:**
- Consumes: `sendEmail`, template dari Task 28, `writeAuditLog`.
- Produces: aksi `resendVerificationEmailAction(applicationId)`, `resendDecisionEmailAction(applicationId)`.

- [ ] **Step 1: Pasang email**

- Setelah submit sukses → `sendEmail(applicationReceivedTemplate(...))` (kegagalan **tidak** membatalkan submit; catat `EMAIL_RESENT`? tidak — catat di log server saja).
- Setelah approve → `sendEmail(applicationApprovedTemplate(...))`.
- Setelah reject → `sendEmail(applicationRejectedTemplate(...))`.
- Sweep expiry → `sendEmail(applicationExpiredTemplate(...))`.

- [ ] **Step 2: Aksi resend**

`resendVerificationEmailAction(applicationId)`: `requireAdmin()` → kirim ulang email konfirmasi Supabase (`admin.generateLink({ type: 'magiclink', email })` + `sendEmail(verificationReminderTemplate(...))`) → `writeAuditLog('EMAIL_RESENT')` → `{ ok:true }`.

- [ ] **Step 3: Verifikasi + commit**

```bash
npm run lint && npx tsc --noEmit && npm run test:unit
git add src/app/actions/mitra.ts src/app/actions/admin-mitra.ts
git commit -m "feat(email): wire notifications into intake and decision flows"
```

---

### Task 30: Retensi dokumen 90 hari

**Files:**
- Create: `src/lib/mitra/retention.ts`
- Create: `scripts/purge-expired-documents.mjs`
- Create: `supabase/migrations/20261020010000_admin_audit_document_purged.sql`
- Modify: `src/app/actions/admin-mitra.ts`

**Interfaces:**
- Consumes: `documentPurgeAfter`, `createAdminClient`.
- Produces: `purgeExpiredDocuments(): Promise<{ purged: number; errors: number }>`.

- [ ] **Step 1: Tambah action `DOCUMENT_PURGED`**

`supabase/migrations/20261020010000_admin_audit_document_purged.sql` (file **baru** — jangan mengubah `20261020000000` yang sudah diterapkan):
```sql
ALTER TABLE public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_action_check;
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_action_check
  CHECK (action IN ('APPLICATION_APPROVED','APPLICATION_REJECTED','APPLICATION_EXPIRED','APPLICATION_RESUBMITTED','DOCUMENT_VIEWED','CHECKLIST_UPDATED','LITERA_CONFIG_UPDATED','EMAIL_RESENT','SWEEP_FAILED','DOCUMENT_PURGED'));
```

- [ ] **Step 2: Implementasikan helper**

`src/lib/mitra/retention.ts` → `purgeExpiredDocuments()`:
1. Ambil `provider_documents` dengan `purge_after <= now`.
2. Hapus file dari bucket `provider-credentials` (`storage.from(...).remove([path])`), retry 3×; bila tetap gagal → geser `purge_after` +1 hari, tambahkan `errors`, dan **jangan** hapus row.
3. Bila file terhapus → hapus row → `writeAuditLog(adminId, { action: 'DOCUMENT_PURGED', targetType: 'provider_document', targetId: id })`.
4. `adminId`: ambil id admin terbaru dari `admin_audit_log`; bila tabel kosong, pakai `process.env.ADMIN_SYSTEM_ACTOR_ID`; bila tetap kosong → lewati pencatatan audit (tidak gagalkan purge).

- [ ] **Step 3: Script**

`scripts/purge-expired-documents.mjs` dijalankan via `tsx` (`"scripts": { "purge:documents": "tsx scripts/purge-expired-documents.mjs" }`) dan mengimpor `purgeExpiredDocuments` langsung dari `src/lib/mitra/retention.ts` (butuh `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`).

- [ ] **Step 4: Commit**

```bash
git add scripts src/lib/mitra/retention.ts src/app/actions/admin-mitra.ts supabase/migrations/20261020010000_admin_audit_document_purged.sql
git commit -m "feat(mitra): enforce 90-day credential document retention"
```

---

### Task 31: SLA alert & feed aktivitas admin

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/lib/mitra/activity.ts`

**Interfaces:**
- Consumes: `createAdminClient`, `isSlaOverdue`.
- Produces: `fetchRecentAdminActivity(limit = 10): Promise<ActivityEntry[]>`.

- [ ] **Step 1: Implementasikan feed**

Query `admin_audit_log` 10 baris terakhir (join `auth.users` untuk email actor via service role) → tampilkan di tab Ringkasan dengan format `relative time` (`Intl.RelativeTimeFormat('id')`).

- [ ] **Step 2: Badge SLA**

Di tab Ringkasan, tampilkan kartu "Menunggu review > 3 hari" berisi jumlah pengajuan yang `isSlaOverdue(applied_at, now, 3)` → klik → `/admin/verifikasi?status=PENDING&sort=oldest`.

- [ ] **Step 3: Commit**

```bash
npm run lint && npx tsc --noEmit
git add src/app/admin/page.tsx src/lib/mitra/activity.ts
git commit -m "feat(admin): add SLA badge and recent activity feed"
```

---

### Task 32: E2E, a11y, dan visual regression

**Files:**
- Create: `tests/e2e/mitra-intake.spec.ts`
- Create: `tests/e2e/admin-queue.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `playwright.config.ts`
- Modify: `package.json` (devDependencies `playwright` + `@axe-core/playwright`, script `test:e2e`)
- Modify: `.github/workflows/ci.yml` (step RLS verify)

**Interfaces:**
- Consumes: env `E2E_BASE_URL` (default `http://localhost:3100`), `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_APPLICANT_EMAIL`, `E2E_APPLICANT_PASSWORD`.
- Produces: `npm run test:e2e`.

- [ ] **Step 1: Tambah Playwright & config**

`package.json`: `"devDependencies": { ..., "playwright": "^1.64.1", "@axe-core/playwright": "^4.10.0" }`, `"scripts": { ..., "test:e2e": "playwright test" }`.
`playwright.config.ts`: `testDir: './tests/e2e'`, `use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100', viewport: { width: 390, height: 844 } }`, `projects: [{ name: 'mobile-390' }, { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } } }]`.

- [ ] **Step 2: Tulis test E2E alur inti**

`tests/e2e/mitra-intake.spec.ts`:
```ts
test("guest psikolog menyelesaikan form dan melihat status", async ({ page }) => {
  await page.goto("/mitra/psikolog");
  // isi langkah 1, 2, 3
  await expect(page.getByText("Cek email untuk verifikasi")).toBeVisible();
});

test("admin menyetujui pengajuan dan role naik", async ({ page }) => {
  // login admin → /admin/verifikasi → Setujui → badge muncul di /tenant/<username>
});

test("dua admin menyetujui pengajuan yang sama", async ({ browser }) => {
  // dua context paralel → hanya satu dapat tombol sukses
});
```

- [ ] **Step 3: Tulis test a11y & visual**

`tests/e2e/accessibility.spec.ts`: pakai `@axe-core/playwright` (`@axe-core/playwright` devDependency) → `new AxeBuilder({ page }).analyze()` → `expect(violations).toEqual([])` untuk `/mitra/psikolog` (step 1), `/akun`, `/admin/verifikasi`.
`tests/e2e/admin-queue.spec.ts`: `await expect(page).toHaveScreenshot("admin-queue-mobile.png", { maxDiffPixelRatio: 0.02 })` — baseline digenerate pertama kali lewat `npx playwright test --update-snapshots` dan disimpan di `tests/e2e/__screenshots__/`.

- [ ] **Step 4: Tambahkan step RLS ke CI**

`.github/workflows/ci.yml`, setelah unit test:
```yaml
      - name: Verify RLS deny-all
        run: node scripts/verify-rls.mjs
        continue-on-error: true
```
> `continue-on-error: true` karena secret Supabase belum tentu ada di CI; step tetap visible di report. Bila secret tersedia, jalankan tanpa `continue-on-error` (.catatan di PR).

- [ ] **Step 5: Verifikasi lokal**

Run: `npm run build && npx playwright test --project=mobile-390`
Expected: PASS (butuh dev/preview server + kredensial QA).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e .github/workflows/ci.yml
git commit -m "test(mitra): add e2e, accessibility and visual regression suites"
```

---

### Task 33: Dokumentasi QA, SOP, dan rollback

**Files:**
- Create: `docs/qa/mitra-intake-admin-qa.md`
- Create: `docs/qa/mitra-intake-rollback.md`
- Create: `docs/qa/mitra-admin-sop.md`

**Interfaces:**
- Produces: 3 dokumen.

- [ ] **Step 1: Tulis SOP admin**

`docs/qa/mitra-admin-sop.md`: alur review harian, checklist approve/reject per track, kapan reject (STR/SIPP tidak aktif, WA belum, PFA belum, dokumen tidak terbaca), template pesan WA (siap salin), eskalasi (krisis,$sengketa), dan aturan "jangan approve pengajuan sendiri".

- [ ] **Step 2: Tulis manual QA**

`docs/qa/mitra-intake-admin-qa.md`: daftar skenario (21 skenario dari §13.6 spec) dengan kolom Expected/Actual/Status.

- [ ] **Step 3: Tulis rollback**

`docs/qa/mitra-intake-rollback.md`: snapshot DB sebelum migrasi, urutan drop (bucket object → bucket → policies → tabel), pengembalian flag, dan skrip `supabase/migrations/` rollback.

- [ ] **Step 4: Commit**

```bash
git add docs/qa
git commit -m "docs(qa): add mitra intake QA checklist, admin SOP and rollback guide"
```

---

### Task 34: Rollout flags, shadow mode, dan whitelist

**Files:**
- Create: `scripts/set-mitra-flags.mjs`
- Modify: `src/lib/mitra/flags.ts`
- Modify: `docs/qa/mitra-intake-admin-qa.md`

**Interfaces:**
- Consumes: env `NEXT_PUBLIC_MITRA_INTAKE_ENABLED`, `NEXT_PUBLIC_MITRA_INTAKE_PSIKOLOG_ENABLED`, `NEXT_PUBLIC_MITRA_INTAKE_PENDAMPING_ENABLED`, `MITRA_INTAKE_WHITELIST_EMAILS`.
- Produces: `isMitraIntakeEnabled()`, `isTrackEnabled(track)`, `isEmailWhitelisted(email)`.

- [ ] **Step 1: Implementasikan whitelist & shadow mode**

`src/lib/mitra/flags.ts` tambahkan:
```ts
export function isEmailWhitelisted(email: string): boolean {
  const list = (process.env.MITRA_INTAKE_WHITELIST_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return true; // kosong = semua boleh
  return list.includes((email || "").trim().toLowerCase());
}
export function isShadowMode(): boolean { return process.env.MITRA_INTAKE_SHADOW_MODE === "true"; }
```
`isShadowMode()` dipakai di `approveApplicationAction` & `rejectApplicationAction`: bila shadow mode aktif → aksi **ditolak** dengan pesan "Shadow mode aktif: keputusan dinonaktifkan." (tapi antrean tetap terisi).

- [ ] **Step 2: Script flag**

`scripts/set-mitra-flags.mjs` menampilkan status flag saat ini (dari `.env.local`) dan memandu perubahan manual (Vercel env → redeploy).

- [ ] **Step 3: Update QA doc**

Tambahkan tabel urutan rollout Fase 0–5 beserta nilai env yang dipakai di tiap fase.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mitra/flags.ts scripts/set-mitra-flags.mjs docs/qa/mitra-intake-admin-qa.md
git commit -m "feat(mitra): add per-track rollout flags, whitelist and shadow mode"
```

---

## Verifikasi Akhir (setiap increment, sebelum push)

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run build
node scripts/verify-rls.mjs     # bila service role tersedia
```

Lalu: push branch → buka PR ke `main` (branch protection butuh 1 approval + status check `quality`).
