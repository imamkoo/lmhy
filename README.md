# Let Me Hear You

Platform kesehatan mental berbasis AI, telehealth, dan ekosistem publikasi refleksi kreator terdesentralisasi (**Creator Subdomain Publishing & Reflection Hub**).

---

## Halaman & Arsitektur Routing

Aplikasi mendukung arsitektur multi-tenant berbasis subdomain (`[username].letmehearyou.id`):

### 1. Root Domain (`letmehearyou.id` / `localhost:3000`)
- `/` — Landing page utama (marketing, brand Warm Sanctuary)
- `/blog` — Daftar artikel editorial (SSG dari MDX)
- `/blog/[slug]` — Detail artikel editorial + widget Litera (universal embed)
- `/login` — Halaman autentikasi kreator (Google OAuth, Facebook OAuth, Email/Password)
- `/onboarding` — Gate pemilihan subdomain username unik (`[username].letmehearyou.id`)
- `/builder` — Studio Web Builder terautentikasi untuk menulis refleksi & publikasi instan ke subdomain + Litera Web3 NFT
- `/admin/litera` — Admin dashboard & sinkronisasi domain Litera

### 2. Creator Subdomain (`[username].letmehearyou.id`)
Di-rewrite secara transparan oleh Next.js Edge Middleware (`src/middleware.ts`):
- `/` → `/tenant/[username]` — Profil kreator ala Medium (Cover banner, circular avatar, bio, follower system, tab tulisan, sertifikat Litera NFT)
- `/[slug]` → `/tenant/[username]/[slug]` — Reader view artikel refleksi dengan author card, floating social share bar (Facebook, WhatsApp, X, Copy Link), sertifikat Litera NFT, dan kolom komentar refleksi komunitas.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.3 (App Router, SSR & SSG) |
| Runtime & React | React 19.2 + TypeScript 5 |
| Styling | Tailwind CSS v4 + design tokens Warm Sanctuary |
| Auth & Database | Supabase (PostgreSQL, Auth SSR via `@supabase/ssr`, Row Level Security) |
| Web3 Certification | Litera Protocol (Universal S2S REST API & Content-NFT) |
| Konten Editorial | MDX (`content/blog/`) + `gray-matter` + `next-mdx-remote` |
| CI / CD | GitHub Actions (`ci.yml`: lint + tsc + build @ Node 22) + Netlify |
| Domain | `letmehearyou.id` (Wildcard DNS `*.letmehearyou.id`) |

---

## Konfigurasi Supabase & Environment Variables

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

### Variabel Supabase Wajib:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Catatan:** cukup 2 variabel di atas. Seluruh kode di `src/` tidak merujuk
> `SUPABASE_SERVICE_ROLE_KEY`, dan migrasi database dijalankan manual lewat
> Supabase SQL Editor — bukan lewat kode. Service-role key adalah kunci admin
> yang menembus Row Level Security; jangan simpan di `.env.local` / Vercel
> tanpa kebutuhan nyata.

### Langkah Setup Database Supabase:
1. Buat project baru di [Supabase Dashboard](https://supabase.com).
2. Jalankan migrasi SQL dari file `supabase/migrations/20261005000000_initial_schema.sql` via SQL Editor Supabase.
   - Membuat tabel `profiles`, `articles`, `follows`, dan `comments`.
   - Mengaktifkan Row Level Security (RLS) untuk keamanan akses data.
3. Konfigurasikan OAuth Providers di **Supabase Dashboard -> Authentication -> Providers**:
   - **Google**: Masukkan Client ID & Client Secret dari Google Cloud Console.
   - **Facebook**: Masukkan App ID & App Secret dari Meta for Developers.
   - Atur Redirect URL ke `https://<your-project>.supabase.co/auth/v1/callback` dan tambahkan domain callback aplikasi Anda.

---

## Pengembangan Lokal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Untuk menguji subdomain secara lokal (misalnya `axaa.localhost:3000`), Anda dapat menambahkan entri ke `/etc/hosts` atau menggunakan browser test tool.

---

## Quality Check & Testing

```bash
# Linting & code standards
npm run lint

# TypeScript static type check
npx tsc --noEmit

# Production build test
npm run build

# Middleware routing blackbox test suite (25+ routing & redirect assertions)
BASE=http://localhost:3000 ./scripts/test-middleware.sh
```

---

## Dokumentasi & Referensi

| Dokumen | Isi |
|---|---|
| [docs/superpowers/specs/2026-10-05-creator-auth-profile-design.md](docs/superpowers/specs/2026-10-05-creator-auth-profile-design.md) | Architectural Design Spec untuk Creator Auth, Subdomain Profile & Community |
| [docs/superpowers/plans/2026-10-05-creator-auth-profile-plan.md](docs/superpowers/plans/2026-10-05-creator-auth-profile-plan.md) | Step-by-step implementation plan |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Panduan kontribusi developer (branching, PR, konvensi commit) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Visi produk: 9 fitur, 4 milestone |
| [docs/design/warm-sanctuary-tokens.md](docs/design/warm-sanctuary-tokens.md) | Design tokens Warm Sanctuary (warna, tipografi) |
| [AGENTS.md](AGENTS.md) | Panduan integrasi AI assistant dan boundary workspace |

---

## Milestone Status

| # | Nama | Status |
|---|---|---|
| M1 | Content & Web3 (Blog + Litera Embed) | ✅ Selesai |
| M1.5 | Creator Subdomains, Supabase Auth & Community Engagement | ✅ Selesai |
| M2 | Data & Context Layer (Check-in, Journaling, Psychometric) | ⏳ On Deck |
| M3 | AI Counseling Engine (Chatbot RAG, Crisis Detection) | ⏳ Planned |
| M4 | Telehealth & Services (Coaching, Video, Events) | ⏳ Planned |
