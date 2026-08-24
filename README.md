# Let Me Hear You

Platform kesehatan mental berbasis AI + telehealth — saat ini dalam mode **landing + blog** (Milestone 1 selesai).

## Halaman Aktif

- `/` — Landing page (marketing, brand Warm Sanctuary)
- `/blog` — Daftar artikel (SSG dari MDX)
- `/blog/[slug]` — Detail artikel + widget Litera (universal embed)

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.3 (App Router, SSG) |
| Styling | Tailwind CSS v4 + design tokens Warm Sanctuary |
| Konten | MDX (`content/blog/`) + `gray-matter` + `next-mdx-remote` |
| CI | GitHub Actions (`ci.yml`: lint + tsc + build @ Node 22) |
| Deploy | Netlify (auto-deploy dari GitHub) |
| Domain | `letmehearyou.id` |

## Pengembangan Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Quality Check

```bash
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript
npm run build      # Production build
```

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Panduan untuk developer baru (branching, PR, commit convention) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Visi produk: 9 fitur, 4 milestone |
| [docs/design/warm-sanctuary-tokens.md](docs/design/warm-sanctuary-tokens.md) | Design tokens (warna, tipografi) |
| [AGENTS.md](AGENTS.md) | Instruksi untuk AI assistant |

## Milestone

| # | Nama | Status |
|---|---|---|
| M1 | Content & Web3 (Blog + Litera Embed) | ✅ Selesai |
| M2 | Data & Context Layer (Check-in, Journaling, Psychometric) | ⏳ |
| M3 | AI Counseling Engine (Chatbot RAG, Crisis Detection) | ⏳ |
| M4 | Telehealth & Services (Coaching, Video, Events) | ⏳ |

Detail: lihat [docs/ROADMAP.md](docs/ROADMAP.md)
