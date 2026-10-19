# SOP Verifikasi Mitra & Tata Kelola Antrean Admin

Dokumen Standar Operasional Prosedur (SOP) untuk tim operasional dan administrator Let Me Hear You dalam meninjau, memvalidasi kredensial, dan mengambil keputusan atas pengajuan mitra.

---

## 1. Prinsip Utama & Aturan Keras

1. **Integritas Peninjau:** Admin DILARANG menyetujui (`approve`) atau menolak (`reject`) pengajuannya sendiri. Sistem menerapkan gate programatik yang memblokir aksi ini.
2. **Kerahasiaan Dokumen Kredensial:** Dokumen STR, ijazah, dan sertifikat PFA adalah data sensitif. Dokumen hanya diakses melalui signed URL privat berumur pendek (60 detik) dan setiap akses tercatat di `admin_audit_log`.
3. **Keputusan Pasti (Race-Safe):** Keputusan hanya dapat diambil satu kali untuk status `PENDING`. Jika pengajuan telah diproses admin lain, status akan terkunci secara otomatis.
4. **SLA Review:** Batas waktu peninjauan pengajuan adalah maksimal **3 hari (72 jam)** sejak pendaftaran. Pengajuan yang melewati batas waktu akan ditandai dengan lencana merah `Peringatan SLA` di tab Ringkasan.

---

## 2. Alur Review Harian

```
1. Buka /admin/page.tsx (Tab Ringkasan)
   └── Periksa Peringatan SLA & jumlah pengajuan menunggu (PENDING).

2. Masuk ke /admin/verifikasi (Antrean Verifikasi)
   ├── Filter default: status=PENDING, urutan=oldest (proses dari yang terlama).
   └── Perhatikan label "Butuh Tindakan" (>7 hari belum verifikasi email) & Red Flags.

3. Pilih salah satu pengajuan untuk membuka panel detail di sisi kanan:
   ├── Verifikasi Alamat Email (Wajib sudah terverifikasi).
   ├── Periksa Kelengkapan Dokumen (Buka dan telaah keabsahan STR / berkas).
   ├── Lakukan kontak WhatsApp konfirmasi (gunakan tombol "Salin Pesan WA" / "Buka WA").
   └── Perbarui Checklist Admin sesuai hasil verifikasi.

4. Eksekusi Keputusan:
   ├── Klik "Setujui Mitra" bila seluruh syarat terpenuhi.
   └── Klik "Tolak Pengajuan" dan ketik alasan jelas bila tidak memenuhi syarat.
```

---

## 3. Checklist Kriteria per Jalur Layanan

### Jalur Praktisi Klinis (`KLINIS`)
- [ ] **Alamat Email:** Wajib terverifikasi (`email_verified_at` terisi).
- [ ] **Nomor STR / Izin Praktik:** Aktif dan terdaftar resmi di Kemenkes / HIMPSI.
- [ ] **Dokumen STR / Ijazah:** Minimal 1 berkas terunggah, dapat dibuka, tidak rusak, dan terbaca jelas.
- [ ] **Modalitas Layanan:** Telah memilih minimal 1 modalitas (Chat, Voice, atau Video).
- [ ] **Komitmen Etika:** Telah menandatangani naskah etika klinis saat submit.

### Jalur Pendamping Sebaya (`SEBAYA`)
- [ ] **Alamat Email:** Wajib terverifikasi.
- [ ] **Komunitas WhatsApp:** Pelamar sudah diverifikasi bergabung ke grup komunitas mitra LMHY (centang checklist `Bergabung Grup Komunitas WA`).
- [ ] **Pelatihan PFA (Psychological First Aid):** Telah menyelesaikan modul dasar PFA (pilih status `Selesai` pada dropdown checklist).
- [ ] **Latar Belakang & Motivasi:** Minimal 200 karakter penjelasan motivasi ruang aman yang selaras dengan nilai empati LMHY.
- [ ] **Komitmen Etika:** Telah menyetujui pakta integritas pendamping sebaya.

---

## 4. Kapan Harus Menolak (`REJECT`) Pengajuan?

Penolakan harus disertai catatan konstruktif (minimal 10 karakter) agar pelamar memahami kekurangan dan dapat mengajukan ulang (`resubmit`):

| Kondisi | Rekomendasi Tindakan | Contoh Catatan Penolakan |
|---|---|---|
| **STR Kedaluwarsa / Tidak Aktif** | Tolak | *"Masa berlaku STR Anda telah berakhir. Silakan perpanjang STR Anda dan ajukan permohonan kembali."* |
| **Berkas Rusak / Tidak Terbaca** | Tolak | *"File pindaian STR buram dan tidak terbaca. Mohon unggah dokumen scan PDF/JPEG resolusi tinggi."* |
| **Bukan Lulusan Profesi Psikologi** | Tolak | *"Jalur Praktisi Klinis saat ini khusus bagi Psikolog berizin profesi. Anda dipersilakan mendaftar di jalur Pendamping Sebaya."* |
| **Tidak Responsif di WhatsApp** | Tunggu 7 hari, lalu Tolak | *"Konfirmasi kehadiran grup komunitas WhatsApp tidak direspons dalam batas waktu toleransi."* |

---

## 5. Template Pesan WhatsApp Peninjau

Gunakan tombol **"Salin Pesan WA"** di panel detail untuk menyalin format baku berikut:

> *"Halo [Nama Pelamar], terima kasih telah mengajukan diri sebagai mitra [Praktisi Klinis / Pendamping Sebaya] di Let Me Hear You. Berkas Anda saat ini sedang dalam proses verifikasi tim kami."*

---

## 6. Prosedur Eskalasi Kasus Khusus

1. **Indikasi Krisis / Self-Harm dalam Motivasi Pelamar:**
   - Jangan proses sebagai mitra.
   - Segera hubungi Tim Lead Medis / Safeguarding Officer untuk tindak lanjut rujukan darurat sesuai SOP Crisis Guard.
2. **Sengketa Identitas / Pemalsuan Kredensial STR:**
   - Tandai akun pelamar.
   - Laporkan ke legal platform untuk pemblokiran permanen (`blacklist`).
