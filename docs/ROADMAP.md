# Roadmap & Visi Produk — Let Me Hear You

Platform kesehatan mental berbasis AI + telehealth. Visi penuh 9 fitur dipecah
menjadi 4 milestone berurutan dengan prinsip **dekomposisi modul (sub-projects)** —
mengembangkan semua fitur bersamaan berisiko, lambat, dan membingungkan secara arsitektur.

Sumber kebenaran terdokumentasi di Notion: hub **Let Me Hear You** → sub-page
**Roadmap & Visi Produk — 9 Fitur, 4 Milestone**.

## Daftar 9 Fitur

1. Chatbot konseling terkoneksi dengan psikolog
2. Video edukasi psikologi
3. Bimbingan belajar
4. Blog / News — **selesai (Milestone 1)**
5. Personal coaching (certified) / soft skills
6. Peer counselor
7. Events / seminar
8. Journaling
9. Let Me Hear You Syariah (soon)

## Sumber Data → Fitur

Data yang dikumpulkan; menjadi memory/context bagi AI counseling engine (M3):

1. Journaling
2. Conversation history
3. Self-assessment / psychometric
4. Check-in harian
5. User profile & life context
6. Behavioral / contextual signals
7. Goals, preferences & coping
8. Professional / clinical data — hanya jika user memakai layanan psikolog resmi LMHY

## Peta Dekomposisi

```
[ Milestone 1: Content & Web3 ] ──► [ Milestone 2: Data & Context Layer ]
      (Blog + Litera Embed)              (Journaling, Check-in, Assessment)
                                                     │
[ Milestone 4: Telehealth & Services ] ◄────────────┴──► [ Milestone 3: AI Counseling Engine ]
(Video, Coaching, Seminars, Booking)                       (Chatbot RAG + Psychologist Handoff)
```

## Milestone 1 — Content & Web3 Entitlement (selesai)

- Fitur: Blog / News (`/blog`, `/blog/[slug]`)
- Integrasi Litera: Universal Embed Script (PaaS/SaaS) pada artikel blog
- Tujuan: pintu depan publikasi LMHY + demo direksi Litera (bukti berjalan di Next.js non-WordPress)
- Alasan didahulukan: demo direksi cepat (3–5 hari), fondasi SEO/trafik sebelum fitur AI,
  arsitektur ramping (MDX di repo, tanpa database)
- Status: implemented & pushed (`ac1f8fb`).
  Spec: `docs/superpowers/specs/2026-08-22-lmhy-blog-litera-embed-design.md`

## Milestone 2 — User Profile & Behavioral Data Layer

- Daily Check-in (mood & energy tracker)
- Journaling (ruang curhat terenkripsi)
- Self-Assessment / Psychometric (skrining awal PHQ-9 / GAD-7)
- User Profile & Life Context
- Tujuan: data terstruktur (konteks hidup, coping style, behavioral signals) sebagai memory AI M3
- Status: belum mulai. Referensi: implementasi Mental Battery (`23f0834`) yang di-drop saat rebrand

## Milestone 3 — AI Counseling Chatbot & Clinical Handoff

- AI Chatbot Konseling (RAG) — membaca memory user dari M2
- Safety Triage & Crisis Detection (self-harm / suicidal ideation)
- Handoff ke psikolog tersertifikasi / peer counselor
- Tujuan: core AI engineering — RAG, guardrails, prompt engineering, handoff manusia
- Status: belum mulai. Dependensi: data layer M2

## Milestone 4 — Telehealth & Ecosystem Services

- Personal Coaching & Soft Skills
- Video Edukasi Psikologi
- Events / Seminar
- Bimbingan Belajar & Integrasi Rekam Medis Klinis
- Tujuan: monetisasi B2C/B2B, registrasi event, video course, sinkronisasi rekam medis
- Status: belum mulai

## Lintas-milestone

- **Let Me Hear You Syariah (soon):** varian layanan, penempatan milestone belum ditentukan

## Prinsip

- Dekomposisi modul: kerjakan per-milestone, bukan 9 fitur sekaligus
- Data-first untuk AI: M2 mendahului M3 karena kualitas AI bergantung memory terstruktur
- Privasi: journaling terenkripsi, data klinis hanya via layanan resmi,
  skrining v1 tanpa diagnosis medis otomatis (disclaimer wajib)
