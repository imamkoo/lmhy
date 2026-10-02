export interface ReflectionTemplate {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  defaultTitle: string;
  defaultExcerpt: string;
  defaultTags: string;
  content: string;
}

export const REFLECTION_TEMPLATES: ReflectionTemplate[] = [
  {
    id: "burnout-recovery",
    name: "Jurnal Pemulihan & Burnout",
    tagline: "Melepas lelah fisik & mental, memberi ruang untuk jeda dan pemulihan.",
    icon: "🌿",
    defaultTitle: "Mengenali Sinyal Tubuh: Catatan Pemulihan dari Kelelahan",
    defaultExcerpt: "Terkadang lelah bukan sekadar butuh tidur semalam, melainkan tanda bahwa jiwa kita menuntut jeda dari ritme yang terlalu cepat.",
    defaultTags: "Burnout, Pemulihan, Mindfulness, Self-Care",
    content: `Hari ini saya berhenti sejenak untuk mendengarkan apa yang selama ini coba dikatakan oleh tubuh dan pikiran saya.

Sering kali kita terus melangkah karena takut tertinggal, hingga lupa bahwa energi kita terbatas. Di ruang refleksi ini, saya ingin mengakui rasa lelah tanpa merasa bersalah.

Beberapa hal kecil yang ingin saya latih mulai hari ini:
1. Menurunkan standar perfeksionisme dan menerima bahwa "cukup" itu sudah baik.
2. Memberi jeda 10 menit tanpa layar gawai di tengah hari.
3. Menghargai proses istirahat sebagai bagian yang tak terpisahkan dari produktivitas.

Jika Anda yang membaca ini juga sedang merasa kewalahan, ingatlah: tidak apa-apa untuk melambat. Anda tidak sedang gagal; Anda hanya sedang menjadi manusia.`,
  },
  {
    id: "acceptance-self-love",
    name: "Seni Berdamai dengan Diri",
    tagline: "Melepaskan tuntutan perfeksionisme dan memeluk ketidaksempurnaan manusiawi.",
    icon: "🕊️",
    defaultTitle: "Berdamai dengan Kekurangan Diri: Perjalanan Menuju Penerimaan Penuh",
    defaultExcerpt: "Melepaskan beban untuk selalu tampak kuat dan sempurna di mata orang lain adalah langkah pertama mencintai diri sendiri.",
    defaultTags: "Self-Love, Acceptance, Kesehatan Mental, Mindfulness",
    content: `Kita hidup di dunia yang terus-menerus menuntut kita menjadi lebih: lebih cepat, lebih pintar, lebih sukses. Namun jarang sekali ada ruang yang menanyakan: "Apakah hatimu sedang baik-baik saja?"

Refleksi ini adalah surat kecil untuk diri saya sendiri:
- Saya memaafkan kesalahan dan keputusan kurang tepat di masa lalu.
- Saya mengizinkan diri saya merasa sedih, ragu, atau lelah ketika memang itu yang sedang dirasakan.
- Saya menyadari bahwa nilai diri saya tidak ditentukan oleh seberapa banyak hal yang berhasil saya selesaikan dalam sehari.

Semoga ruang tulisan ini menjadi pengingat hangat bahwa kita berharga apa adanya.`,
  },
  {
    id: "boundaries-peace",
    name: "Mengenali Batas Diri (Healthy Boundaries)",
    tagline: "Belajar berkata 'tidak' demi menjaga ruang aman dan ketenangan batin.",
    icon: "🛡️",
    defaultTitle: "Menjaga Ruang Aman: Membangun Batasan Sehat Tanpa Rasa Bersalah",
    defaultExcerpt: "Menjaga batas diri bukanlah tindakan egois, melainkan bentuk tanggung jawab menjaga kesehatan mental dan kualitas relasi kita.",
    defaultTags: "Boundaries, Ketenangan, Relasi, Self-Care",
    content: `Berapa kali kita mengiyakan permintaan orang lain padahal di dalam hati kita ingin sekali menolak?

Belajar menetapkan batas diri adalah salah satu pelajaran paling menantang sekaligus membebaskan dalam hidup saya. Menolak hal-hal yang menguras energi bukan berarti kita tidak peduli pada orang lain, melainkan memastikan kita memiliki cukup energi untuk hal-hal yang benar-benar esensial.

Refleksi saya tentang batasan sehat:
- Ketenangan batin saya adalah prioritas.
- Saya tidak bertanggung jawab atas emosi atau ekspektasi semua orang.
- Hubungan yang sehat selalu menghormati batasan masing-masing.`,
  },
  {
    id: "blank-canvas",
    name: "Kanvas Kosong (Mulai dari Nol)",
    tagline: "Tuliskan cerita, wawasan, atau gagasan reflektif bebas sesuai suara hati Anda.",
    icon: "✍️",
    defaultTitle: "",
    defaultExcerpt: "",
    defaultTags: "Refleksi, Jurnal, Kesehatan Mental",
    content: "",
  },
];
