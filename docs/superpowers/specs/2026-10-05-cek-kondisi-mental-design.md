# Cek Kondisi Mental — Design Spec (from-scratch revamp)

Tanggal: 2026-10-05
Status: draft menunggu review pengguna
Jalur: architectural (brainstorming) — Pendekatan A disetujui

## 1. Tujuan dan nilai

Pintu masuk dan pendorong awareness kesehatan mental LMHY: skrining awal gratis
yang membawa empat nilai sekaligus — tipe shareable ala MBTI, skor plus
rekomendasi aksi, triase ke konselor, edukasi plus jurnal refleksi.

Yang disepakati pengguna: keempat nilai dipakai semua, basis hybrid,
gangguan krisis memakai interupsi plus rujukan, blockchain dipakai dengan
model vault terenkripsi plus NFT suportif (Pendekatan A).

Asumsi yang dikunci: hasil bukan diagnosis medis dalam bentuk apa pun.
Bahasa hasil memakai istilah kenyamanan awam, bukan label klinis.

## 2. Batasan keras

- Landing kanonik tidak diubah: `src/components/landing/`,
  `src/styles/landing.css`, `src/app/(marketing)/` tetap apa adanya.
  Tautan `/mental-battery` yang 404 dibiarkan; fitur baru hidup di rute
  `/cek-kondisi/*`.
- Token Warm Sanctuary saja (`docs/design/warm-sanctuary-tokens.md`).
  Tanpa warna, radius, atau font baru.
- Disclaimer non-diagnosis tampil di intro dan hasil privat.
- Satu jawaban red-flag krisis menghentikan kuis: tampilkan nomor darurat
  dan opsi hubungi konselor. Tidak lanjut ke hasil.
- Skor mentah, band, dan jawaban tidak pernah masuk ledger publik atau
  metadata NFT.
- Quality gate sebelum klaim selesai: `npm run lint`, `npx tsc --noEmit`,
  `npm run build`.

## 3. Formula dan algoritma (Bagian 1, disetujui)

### 3.1 Bank item: 20 butir hybrid

- 5 butir kesejahteraan (adaptasi gaya WHO-5): mood, ketenangan, energi,
  tidur, minat. Skala 0–5.
- 4 butir distres ultra-singkat (adaptasi gaya PHQ-4): cemas, murung,
  lelah berlebih, sulit fokus. Skala 0–3.
- 4 butir stres (adaptasi gaya PSS-4): kendali, tumpukan masalah,
  kepercayaan diri, kemarahan. Skala 0–4, 2 butir reverse.
- 7 butir dimensi custom LMHY: 2 energi, 2 beban, 2 koneksi, 1 harapan
  terbuka (tidak diskor, dipakai untuk prompt jurnal). Skala 0–4.

Adaptasi ditulis ulang dengan bahasa LMHY, bukan salinan verbatim skala
berlisensi. Validasi psikometrik (uji coba, konsistensi internal,
korelasi terhadap skala tervalidasi) masuk roadmap sebelum klaim
setara benchmark.

### 3.2 Dimensi dan normalisasi

Empat dimensi 0–100, masing-masing dari subset butirnya:

- Energi = persen dari butir energi plus energi WHO-5.
- Beban = 100 minus persen butir stres plus distres (semakin tinggi
  semakin ringan).
- Koneksi = persen butir koneksi plus minat WHO-5.
- Ketenangan = 100 minus persen butir cemas plus murung.

Rumus umum per dimensi: `100 * (sum - min) / (max - min)`,
pembulatan ke bilangan bulat. Butir reverse dibalik sebelum dijumlah.

### 3.3 Band non-diagnosis

Per dimensi dan agregat rata-rata empat dimensi:

- 75–100: Stabil — rutinitas mandiri plus edukasi.
- 50–74: Perlu Jeda — anjuran istirahat, relaksasi, jurnal.
- 25–49: Perlu Dukungan — rujukan mentor komunitas.
- 0–24: Perlu Bantuan Segera — rujukan konselor profesional
  (bukan darurat krisis; jalur krisis ditangani red-flag).

### 3.4 Red-flag krisis

Satu butir ide menyakiti diri (skala 0–3). Nilai >= 1 menghentikan kuis,
rute ke `/cek-kondisi/jeda`: nomor darurat, tombol hubungi konselor,
pesan suportif. Sesi itu tidak menghasilkan skor atau NFT.

### 3.5 Arketipe shareable: 16 tipe

Tiap dimensi dibinerkan di ambang 50 (misal Energi: Pulih/Lelah,
Beban: Ringan/Berat, Koneksi: Terhubung/Menyendiri,
Ketenangan: Tenang/Gelisah). Kombinasi 2^4 menghasilkan 16 tipe
pendamping suportif dengan nama hangat non-klinis (contoh pola:
"Penjaga Senja", "Perambat Pagi"). Nama final 16 tipe ditentukan
saat implementasi bersama pengguna.

## 4. Arsitektur dan aliran data (Bagian 2, disetujui)

Rute baru di App Router: `/cek-kondisi` (intro, persetujuan,
disclaimer), `/cek-kondisi/kuis`, `/cek-kondisi/jeda`,
`/cek-kondisi/hasil` (privat), `/cek-kondisi/kartu/[code]`
(kartu publik).

Alur: jawab lokal per layar dengan autosave `localStorage`
(`lmhy_cek_kondisi_draft_v1`) → evaluasi red-flag tiap submit →
skor dihitung di klien → hasil privat dirender → opsional
enkripsi vault plus mint NFT.

Vault: kunci AES-GCM diturunkan dari passphrase pengguna via PBKDF2
di browser. Kunci tidak pernah dikirim ke server. Ciphertext
disimpan lokal; salinan terenkripsi opsional ke IPFS via Litera.
On-chain hanya hash komitmen plus token NFT. Kunci hilang berarti
vault tidak bisa dibuka; dinyatakan eksplisit sebelum enkripsi.

NFT suportif (integrasi `src/lib/litera.ts`, alur
`src/app/actions/admin-nft.ts`): soulbound default (non-transfer),
metadata publik hanya berisi arketipe, kalimat suportif, artwork,
dan CTA coba gratis. Tanpa skor, band, atau jawaban. Gagal mint
tidak merusak hasil; hasil privat tetap utuh dan bisa coba lagi.

## 5. Komponen UI dan hasil berlapis (Bagian 3, disetujui)

Hasil privat: 4 bar dimensi, band, daftar aksi per band, pemetaan
triase (mandiri, mentor komunitas, konselor profesional, darurat),
prompt jurnal yang mengarah ke `/builder` dengan draf terisi.

Kartu publik dan NFT: nama arketipe, satu kalimat suportif, artwork
pendamping, CTA "Coba cek gratis". Tanpa data klinis dalam bentuk
apa pun, termasuk di OpenGraph dan alt-text.

Aksesibilitas: navigasi keyboard penuh, focus-visible, kontras teks
sesuai token, `prefers-reduced-motion` menonaktifkan efek gerak,
satu pertanyaan per layar dengan tombol kembali.

## 6. Penanganan galat

- Kunci vault hilang: tampilkan penjelasan permanen, tawarkan ulangi
  cek; tidak ada pemulihan teknisi.
- Mint NFT gagal: hasil privat tersimpan, tombol coba lagi, log
  galat tanpa data kesehatan.
- Offline: kuis tetap jalan lokal; mint ditunda sampai online.
- Double submit: idempotensi via ID sesi klien.

## 7. Pengujian

- Unit skoring: fixture semua-min, semua-maks, batas band 24/25,
  49/50, 74/75, tiap red-flag >= 1 memicu interupsi.
- E2E: jalur normal sampai kartu publik, jalur krisis berhenti di
  `/cek-kondisi/jeda`, jalur gagal mint tetap menampilkan hasil.
- Audit konten: tidak ada kata diagnosis di hasil dan metadata.
- Gate: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## 8. Di luar cakupan

Penamaan final 16 arketipe dan artwork, daftar nomor darurat resmi,
integrasi penjadwalan konselor, riwayat lintas perangkat berbasis
akun, studi validasi psikometrik. Ditangani sebagai tindak lanjut
setelah spec ini disetujui.
