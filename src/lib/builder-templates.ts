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
    id: "anxiety-future",
    name: "Menjinakkan Cemas akan Masa Depan",
    tagline: "Saat khawatir tentang esok mencuri tenang hari ini.",
    icon: "🌊",
    defaultTitle: "Cemas tentang Esok: Belajar Berlabuh di Hari Ini",
    defaultExcerpt: "Masa depan belum tiba, tapi kecemasan membuat kita hidup di sana duluan — lelah oleh bayangan yang belum tentu terjadi.",
    defaultTags: "Kecemasan, Mindfulness, Ketenangan, Refleksi",
    content: `Pikiran saya sering melompat jauh ke depan: bagaimana kalau gagal, bagaimana kalau mengecewakan, bagaimana kalau semua berantakan.

Padahal hari ini — detik ini — saya masih di sini, masih bernapas, masih bisa memilih satu hal kecil yang bisa saya lakukan.

Yang ingin saya latih hari ini:
1. Menamai cemas: "oh, ini pikiran cemas, bukan ramalan."
2. Kembali ke indera: apa yang saya lihat, dengar, dan rasakan sekarang.
3. Satu langkah kecil saja, bukan seluruh tangga.

Masa depan akan diurus oleh diri saya di masa depan. Hari ini, cukup jaga hari ini.`,
  },
  {
    id: "grief-loss",
    name: "Merawat Duka dengan Lembut",
    tagline: "Kehilangan tidak harus segera disembuhkan — ia perlu ditemani.",
    icon: "🍂",
    defaultTitle: "Saat Kehilangan Menyapa: Menemani Duka Tanpa Tergesa",
    defaultExcerpt: "Duka bukan tugas yang harus selesai cepat, melainkan musim yang perlu dilewati pelan-pelan.",
    defaultTags: "Duka, Kehilangan, Penerimaan, Penyembuhan",
    content: `Ada hari di mana rindu terasa lebih berat dari biasanya. Ada momen di mana air mata datang tanpa diundang.

Saya belajar bahwa duka tidak butuh diusir, ia butuh ditemani:
- Mengizinkan diri mengenang tanpa menghakimi.
- Menulis satu kenangan baik tentang yang telah pergi.
- Meminta ditemani orang terpercaya, bukan memikul sendirian.

Jika kamu sedang berduka, tidak ada jadwal baku untuk sembuh. Pelan tidak apa-apa. Menangis tidak apa-apa. Kamu tetap berjalan, dengan caramu.`,
  },
  {
    id: "relationship-distance",
    name: "Jarak dalam Hubungan",
    tagline: "Ketika dekat terasa jauh — belajar bicara jujur tanpa menyakiti.",
    icon: "💬",
    defaultTitle: "Dekat tapi Jauh: Merawat Percakapan yang Jujur",
    defaultExcerpt: "Hubungan tidak retak karena perbedaan, tapi karena percakapan jujur yang terus ditunda.",
    defaultTags: "Hubungan, Komunikasi, Batasan, Empati",
    content: `Akhir-akhir ini saya merasa ada jarak yang tak terucapkan. Kata-kata jadi hemat, asumsi jadi ramai.

Yang ingin saya coba perbaiki:
1. Mengganti "kamu selalu..." dengan "aku merasa... ketika..."
2. Mendengarkan untuk memahami, bukan untuk membalas.
3. Menyepakati waktu bicara yang aman untuk keduanya, bukan saat emosi di puncak.

Hubungan yang sehat bukan tanpa konflik, tapi punya cara pulang setelah konflik.`,
  },
  {
    id: "inner-child",
    name: "Menyapa Luka Lama",
    tagline: "Anak kecil di dalam diri masih menunggu didengarkan.",
    icon: "🧸",
    defaultTitle: "Menyapa Anak Kecil di Dalam Diri: Luka Lama yang Minta Didengar",
    defaultExcerpt: "Reaksi kita hari ini sering kali adalah gema dari kebutuhan kecil yang dulu tak terpenuhi.",
    defaultTags: "Inner Child, Penerimaan Diri, Penyembuhan, Refleksi",
    content: `Saya menyadari pola yang berulang: takut ditinggalkan, haus validasi, sulit berkata cukup.

Mungkin itu bukan salah saya yang sekarang, tapi suara lama yang belum ditemani.

Hari ini saya ingin berkata pada diri kecil itu:
- "Terima kasih sudah bertahan sejauh ini."
- "Kamu tidak harus sempurna untuk pantas dicintai."
- "Aku di sini sekarang, menemanimu."

Menyembuhkan luka lama bukan memutar waktu, tapi memberi diri apa yang dulu kurang: kehadiran dan kelembutan.`,
  },
  {
    id: "gentle-discipline",
    name: "Disiplin yang Lembut",
    tagline: "Konsisten tanpa menghukum diri — perubahan kecil yang bertahan.",
    icon: "🪴",
    defaultTitle: "Disiplin Tanpa Hukuman: Perubahan Kecil yang Bertahan Lama",
    defaultExcerpt: "Disiplin bukan cambuk, melainkan janji kecil yang kita tepati pada diri sendiri setiap hari.",
    defaultTags: "Kebiasaan, Disiplin, Self-Care, Produktivitas Lembut",
    content: `Saya lelah dengan target besar yang berakhir rasa bersalah. Kali ini saya ingin lebih lembut.

Bukan "harus 1 jam olahraga", tapi "pakai sepatu dan jalan 7 menit".
Bukan "harus baca 1 buku", tapi "buka 2 halaman sebelum tidur".

Aturan main baru saya:
1. Mulai sangat kecil hingga tidak ada alasan menolak.
2. Rayakan selesai, bukan sempurna.
3. Jika bolong sehari, lanjut esok — bukan mengulang dari nol.

Konsistensi lahir dari kebaikan, bukan kekerasan pada diri.`,
  },
  {
    id: "meaning-purpose",
    name: "Mencari Makna di Tengah Ragu",
    tagline: "Saat hidup terasa hampa — menenun makna dari hal yang masih bisa dipilih.",
    icon: "🔭",
    defaultTitle: "Ketika Hidup Terasa Hampa: Menenun Makna dari Hal Kecil",
    defaultExcerpt: "Makna tidak selalu ditemukan, kadang ia diciptakan — dari pilihan kecil yang selaras dengan nilai kita.",
    defaultTags: "Makna Hidup, Nilai, Refleksi, Penerimaan",
    content: `Ada fase di mana pertanyaan "untuk apa?" datang lebih sering. Semua terasa menjemukan, meski dari luar tampak baik-baik saja.

Saya mencoba tidak menunggu motivasi besar datang, tapi bertanya:
- Nilai apa yang ingin saya hidupi minggu ini — kejujuran, kepedulian, keingintahuan?
- Satu tindakan kecil apa yang selaras dengan nilai itu hari ini?
- Siapa yang akan ikut terbantu jika saya melakukannya?

Makna sering lahir bukan dari jawaban besar, tapi dari keberanian memilih hal kecil yang jujur.`,
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
