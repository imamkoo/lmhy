# Let Me Hear You

Situs komunitas kesehatan mental dengan **landing marketing** dan **aplikasi wellness** (skrining mandiri, mood tracker, aktivitas, dasbor, mini-games relaksasi).

## Struktur

- `/` — Landing (konten dari situs statis asli, styling [`src/styles/landing.css`](src/styles/landing.css))
- `/login`, `/register` — Autentikasi
- `/dashboard`, `/mood`, `/activities`, `/screening`, `/games`, `/emergency` — Aplikasi wellness
- `/assets/*` — Asset gambar brand (dari folder [`public/assets/`](public/assets/))

## Stack

- Next.js 16 (App Router, Route Handlers)
- MongoDB + Mongoose
- Tailwind CSS v4 + token brand dari desain asli
- JWT httpOnly cookie

## Pengembangan lokal

```bash
npm install
cp .env.example .env.local
# Set MONGODB_URI dan JWT_SECRET
npm run dev
```

Buka http://localhost:3000

## Environment

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `MONGODB_URI` | Ya | MongoDB lokal atau Atlas |
| `JWT_SECRET` | Ya (prod) | Min. 16 karakter |
| `NEXT_PUBLIC_FOREST_AUDIO_URL` | Tidak | Audio Mindful Forest |

## Deploy

- **Disarankan:** [Vercel](https://vercel.com) + [MongoDB Atlas](https://www.mongodb.com/atlas)
- GitHub Pages **tidak** mendukung API Route + auth tanpa backend terpisah.

## Privasi

Data skrining dan mood disimpan per akun. Skrining v1 **tidak** memberikan interpretasi diagnosis otomatis.

## Audio testing

Lihat [AUDIO_SOURCES.md](AUDIO_SOURCES.md).

## Legacy

File HTML/CSS/JS statis lama ada di [`_legacy/`](_legacy/) untuk referensi.
