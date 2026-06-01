# Panduan Manajemen Instrumen "Mental Battery"

Panduan ini ditujukan untuk **Tim Klinis (Psikolog/Psikiater)** dan **Tim Teknis/Admin (Non-Psikolog)** dalam mengelola instrumen tes di platform Let Me Hear You.

---

## 1. Konsep Dasar Instrumen

Platform ini menggunakan sistem **Dynamic Instruments**. Artinya, seluruh pertanyaan, skala jawaban, dan pembagian *subscale* (kategori gejala) dapat disesuaikan langsung dari Dashboard Admin tanpa perlu menyentuh kode pemograman.

Setiap instrumen (misalnya PHQ-9 atau GAD-7) terdiri dari:
- **ID Instrumen**: Kode unik sistem (misal: `phq9`). Tidak disarankan untuk diubah.
- **Instruksi**: Panduan pengisian untuk responden (misal: *"Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh masalah berikut?"*).
- **Pertanyaan (Items)**: Daftar butir soal. Setiap soal bisa dikaitkan dengan *Subscale* tertentu jika instrumen tersebut mengukur lebih dari satu hal (misalnya DASS-21 mengukur *Depression*, *Anxiety*, dan *Stress*).
- **Skala Jawaban**: Pilihan ganda berbobot yang diberikan kepada responden (contoh: *Tidak Pernah, Beberapa Hari, Lebih dari Separuh Waktu, Hampir Setiap Hari*). Nilainya secara otomatis dihitung mulai dari 0, 1, 2, dst.

> [!IMPORTANT]
> **Untuk Tim Psikolog:** Pastikan skala jawaban dan urutannya sama persis dengan manual instrumen alat ukur asli agar hasil skoring valid dan dapat dipertanggungjawabkan secara klinis.



---

## 2. Sistem Keamanan "Locked vs Unlocked"

Untuk mencegah perubahan tak sengaja pada instrumen yang sedang digunakan oleh publik (yang dapat merusak perhitungan skor "Mental Battery" secara keseluruhan), sistem menerapkan mekanisme **Gembok (Lock)**.

### Mengapa Instrumen Digembok (Locked)?
Jika sebuah pertanyaan diubah maknanya (misalnya dari *"Saya merasa sedih"* menjadi *"Saya ingin menangis"*), bobot psikometrinya bisa berubah. Jika pengguna A mengambil tes sebelum diubah, dan pengguna B mengambil tes setelah diubah, sistem tidak lagi membandingkan apel dengan apel.

### Kapan Harus Membuka Gembok (Unlock)?
Tombol **"Unlock"** (berwarna merah) sebaiknya HANYA digunakan jika:
1. Anda menemukan *typo* (salah ketik) kecil yang tidak mengubah makna kalimat.
2. Aplikasi belum dirilis ke publik secara resmi (masih fase *testing*).
3. Anda mendapat instruksi langsung dari Psikolog Kepala untuk merevisi terjemahan.

> [!WARNING]
> **Bagi Admin Non-Psikolog:** Jangan pernah menambahkan, mengurangi, atau mengubah makna pertanyaan serta skala jawaban pada instrumen tanpa izin tertulis dari tim Psikolog. Hal ini sangat fatal terhadap akurasi diagnosis awal sistem.

---

## 3. Panduan Edit (Langkah-langkah)

Jika Anda perlu mengedit sebuah instrumen:
1. Buka halaman **Instruments (Locked)** di sidebar kiri.
2. Cari instrumen yang ingin diubah.
3. Klik tombol **🔒 Locked** untuk membuka kunci. Tombol akan berubah menjadi **🔓 Unlocked** dan berwarna merah (menandakan status rentan).
4. Tombol **Edit Konten** akan muncul. Klik tombol tersebut.
5. Anda sekarang bisa mengedit:
   - Teks instruksi
   - Teks pertanyaan individu
   - Mengganti *Subscale* pertanyaan
   - **Skala Jawaban**: Anda bisa mengganti teks opsi, menekan "+ Tambah" untuk menambah tingkat jawaban (misal dari skala Likert 4 menjadi 5), atau "- Kurangi".
6. Klik **Simpan**.
7. (Sangat Disarankan) Klik kembali tombol **🔓 Unlocked** agar berubah menjadi **🔒 Locked** untuk mengamankannya kembali.

---

## 4. Hubungan Skala Jawaban dengan Perhitungan "Mental Battery"

Sistem `MentalBatteryConfig` bekerja dengan cara mengkonversi setiap jawaban pengguna menjadi persentase tingkat keparahan (*severity percentage*).

Sistem akan mengambil **Nilai Maksimal Potensial** dari Skala Jawaban. 
Sebagai contoh, pada PHQ-9, terdapat 4 Skala Jawaban (0, 1, 2, 3). Nilai maksimal per soal adalah 3.
Jika terdapat 9 pertanyaan, maka Skor Maksimal instrumen adalah 27. 
Sistem akan membagi Skor Aktual pengguna dengan Skor Maksimal untuk menentukan "Tingkat Beban Mental" mereka, yang kemudian dibalik menjadi persentase "Sisa Baterai".

> [!TIP]
> Anda tidak perlu repot menghitung skor manual. Selama jumlah Skala Jawaban di-setting dengan benar (misal 4 skala untuk PHQ-9 Likert-type), algoritma aplikasi akan menyesuaikan pembaginya secara otomatis!
