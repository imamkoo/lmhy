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
    id: "overthinking-quiet",
    name: "Melepaskan Beban Overthinking",
    tagline: "Menemukan keheningan saat kepala terlalu bising memikirkan hal yang belum terjadi.",
    icon: "🌧️",
    defaultTitle: "Ketika Pikiran Terlalu Bising: Seni Melepaskan Kekhawatiran Berlebih",
    defaultExcerpt: "Kekhawatiran tidak pernah mengosongkan hari esok dari kesedihan, ia hanya mengosongkan hari ini dari kekuatan dan ketenangan.",
    defaultTags: "Overthinking, Mindfulness, Ketenangan, Refleksi Diri",
    content: `Pernahkah Anda terjaga di larut malam hanya untuk memutar ulang percakapan yang sudah berlalu, atau mereka-reka kemungkinan buruk di masa depan?

Pikiran kita sering kali bertindak seperti narator yang cemas, mengarang skenario rumit dari ketakutan kecil. Namun kenyataannya, sebagian besar kekhawatiran yang menguras tenaga kita tidak pernah benar-benar terjadi.

Hari ini, saya memilih untuk:
1. Menyadari bahwa pikiran bukanlah fakta mutlak; pikiran hanyalah peristiwa mental yang datang dan pergi.
2. Mengembalikan fokus ke napas saat kepala mulai berlari terlalu jauh ke depan.
3. Mengikhlaskan hal-hal di luar kendali saya dan merawat hal kecil yang ada di depan mata.

Jika kepalamu terasa penuh hari ini, tarik napas perlahan. Kamu aman di saat ini.`,
  },
  {
    id: "gratitude-simple",
    name: "Menemukan Kebaikan dalam Keseharian",
    tagline: "Latihan bersyukur sederhana di tengah rutinitas yang monoton atau melelahkan.",
    icon: "✨",
    defaultTitle: "Hal-Hal Kecil yang Terlupakan: Catatan Bersyukur di Tengah Kesibukan",
    defaultExcerpt: "Kebahagiaan sering kali tidak bersembunyi dalam pencapaian megah, melainkan dalam kemampuan kita menyadari keindahan momen-momen biasa.",
    defaultTags: "Gratitude, Bersyukur, Ketenangan, Mindfulness",
    content: `Di tengah hari-hari yang sibuk dan menuntut, sangat mudah untuk hanya melihat apa yang kurang, apa yang belum tercapai, atau apa yang luput dari rencana.

Padahal di sekitar kita, selalu ada kebaikan sederhana yang luput dari perhatian:
- Secangkir teh hangat di pagi hari yang memberi ketenangan sebelum hari dimulai.
- Pesan singkat dari seorang teman yang menanyakan kabar.
- Udara sejuk dan kesempatan untuk bernapas satu hari lagi.

Bersyukur bukan berarti mengabaikan kesulitan hidup, melainkan memperluas pandangan kita agar tidak dibutakan oleh rasa lelah. Hari ini, saya bersyukur untuk hal-hal sederhana yang membuat jiwa saya merasa cukup.`,
  },
  {
    id: "emotional-rest",
    name: "Mengizinkan Diri untuk Rapuh",
    tagline: "Menerima bahwa kita tidak selalu harus kuat di hadapan semua orang.",
    icon: "🌱",
    defaultTitle: "Tidak Apa-Apa Tidak Baik-Baik Saja: Ruang Aman untuk Emosi yang Lelah",
    defaultExcerpt: "Menangis atau mengakui bahwa kita sedang rapuh bukanlah tanda kelemahan, melainkan bukti keberanian untuk jujur pada diri sendiri.",
    defaultTags: "Kerapuhan, Self-Care, Emosi, Kesehatan Mental",
    content: `Kita diajarkan untuk selalu tersenyum, selalu menjawab "baik-baik saja", dan tampak tangguh menghadapi setiap badai. Namun menekan emosi terus-menerus adalah beban yang sangat berat.

Refleksi hari ini adalah tentang memberi diri izin:
- Izin untuk merasa sedih tanpa harus segera mencari solusi instan.
- Izin untuk menangis ketika hati terasa sesak.
- Izin untuk meletakkan topeng "orang kuat" dan kembali menjadi manusia yang butuh jeda dan pelukan hangat.

Kerapuhan bukanlah kebalikan dari keberanian; itu adalah pintu masuk paling tulus menuju penyembuhan dan kedamaian batin.`,
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

export const RANDOM_REFLECTION_TEMPLATES: ReflectionTemplate[] = REFLECTION_TEMPLATES.filter(
  (t) => t.id !== "blank-canvas"
);

export const BLANK_CANVAS_TEMPLATE: ReflectionTemplate = REFLECTION_TEMPLATES.find(
  (t) => t.id === "blank-canvas"
)!;
