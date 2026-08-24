## 📝 Ringkasan Perubahan

<!-- 
Berikan ringkasan singkat tentang perubahan yang Anda buat di PR ini.
Kenapa perubahan ini dilakukan? Apa issue/fitur yang diselesaikan?
-->

- **Fitur/Fix:** 
- **Modul/Komponen yang disentuh:** 

---

## 🔍 Checklist

Sebelum meminta review, pastikan semua poin di bawah ini sudah terpenuhi:

### Code Quality
- [ ] `npm run lint` pass tanpa error/warning baru
- [ ] `npx tsc --noEmit` pass tanpa type error
- [ ] `npm run build` pass di local
- [ ] Tidak ada console.log atau commented-out code yang ketinggalan
- [ ] Tidak ada hardcoded secrets/API keys/credentials

### UX & Accessibility
- [ ] Semua tombol/link interaktif punya **focus-visible** ring yang jelas
- [ ] Animasi menghormati `prefers-reduced-motion` (tidak jalan kalau dienable di OS)
- [ ] Kontras warna teks/bg mencukupi (≥4.5:1)
- [ ] Sudah ditest di tampilan Mobile (375px) dan Desktop (>1024px)

### Flow & Staging
- [ ] Sudah ditest di environment preview/staging (Netlify / Vercel)
- [ ] PR ini mentargetkan branch `develop` atau `feat/*` — bukan `main` langsung tanpa review

---

## 🚨 Risk & Breaking Changes

- [ ] **Tidak ada risk** — perubahan UI/fix minor saja
- [ ] **Ada risk** — jelaskan:
  - **Risiko:** 
  - **Langkah Mitigasi:** 
  - **Rollback Plan:** 

---

## 📸 Screenshots / Recordings (kalau ada perubahan UI)

| Before | After | Focus State (Tab) |
|--------|-------|-------------------|
| [paste image] | [paste image] | [paste image] |

---

## 💬 Catatan Tambahan untuk Reviewer
