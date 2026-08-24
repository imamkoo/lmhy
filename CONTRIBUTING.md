# Contributing — Let Me Hear You

Terima kasih mau kontribusi! Panduan ini memastikan semua developer di LMHY bekerja dengan flow yang konsisten.

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, SSG) |
| Styling | Tailwind CSS v4 + design tokens Warm Sanctuary |
| Konten | MDX di `content/blog/` |
| CI | GitHub Actions (`ci.yml`: lint + tsc + build) |
| Deploy | Netlify (auto-deploy dari GitHub) |

## Branching Model

```
main ← produksi (branch terlindungi, butuh PR + review + CI pass)
 ├── develop ← staging / integrasi
 │    ├── feat/nama-fitur ← pengembangan fitur
 │    ├── fix/nama-bug ← perbaikan bug
 │    └── chore/nama-tugas ← tugas teknis
```

**Aturan:**
- **Jangan push langsung ke `main`.** Selalu lewat PR.
- Branch baru dibuat dari `develop` (atau `main` jika `develop` belum ada).
- Nama branch: `feat/`, `fix/`, `chore/`, `docs/` + deskripsi singkat kebab-case.

## Workflow Harian

```bash
# 1. Pastikan branch develop terbaru
git checkout develop
git pull origin develop

# 2. Buat branch baru
git checkout -b feat/nama-fitur

# 3. Kerjakan, commit kecil-kecil
git add .
git commit -m "feat(modul): deskripsi singkat"

# 4. Push
git push origin feat/nama-fitur

# 5. Buat PR di GitHub → target branch: develop atau main
```

## Sebelum Buat PR

Jalankan 3 perintah ini sampai lulus:

```bash
npm run lint       # ESLint — 0 error
npx tsc --noEmit   # TypeScript — 0 error
npm run build      # Next.js build — sukses
```

## Commit Convention

Format: `type(scope): deskripsi singkat`

| Type | Kapan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `chore` | Tugas teknis (deps, config, CI) |
| `docs` | Dokumentasi |
| `style` | Styling/formatting (bukan CSS) |
| `refactor` | Refaktor tanpa perubahan perilaku |

Contoh:
```
feat(blog): add tag filtering on blog index
fix(litera): resolve widget not mounting on SPA navigation
chore(deps): bump next to 16.3.1
```

## Struktur Folder

```
letmehearyou/
├── content/blog/         # Artikel MDX (frontmatter + konten)
├── docs/                 # Dokumentasi teknis (roadmap, specs, design tokens)
├── public/               # Asset statis
├── src/
│   ├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── components/       # Komponen React (blog/, landing/, litera/)
│   └── lib/              # Utility & logic (blog.ts, utils.ts)
├── .github/              # CI workflows + PR template
├── netlify.toml          # Konfigurasi Netlify
└── package.json
```

## Design Tokens (Warm Sanctuary)

| Token | Nilai | Kapan |
|---|---|---|
| Primary/Accent | `#d07954` (terracotta) | Tombol utama, link aktif |
| Primary Hover | `#b86644` | Hover tombol utama |
| Background | `#fbf8f5` | Halaman utama |
| Text | `#1e293b` (slate-900) | Body text |

Gunakan token, bukan hardcode warna di setiap komponen.

## Yang Tidak Boleh

- ❌ Commit secret/API key/credential langsung ke repo
- ❌ Push langsung ke `main` tanpa PR
- ❌ Menambah dependency baru tanpa diskusi (buka issue dulu)
- ❌ Menghapus/mengubah `netlify.toml` tanpa konfirmasi
- ❌ Mengubah konfigurasi Litera widget (`LiteraWidget.tsx`) tanpa koordinasi dengan tim Litera

## Environment Variables

Lihat `.env.example` untuk daftar env var. Copy ke `.env.local` untuk development:

```bash
cp .env.example .env.local
```

**Jangan pernah commit `.env` atau `.env.local`.**

## Bantuan

- Baca `docs/ROADMAP.md` untuk gambaran besar 9 fitur / 4 milestone
- Baca `AGENTS.md` untuk instruksi khusus AI assistant
- Tanya di issue GitHub atau langsung ke CTO (Axaa)
