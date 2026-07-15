import type { ArchetypeId } from "./archetypes";

export interface ArchetypeRecommendation {
  tips: string[];
  nextSteps: string[];
  resources: string[];
  affirmation: string;
}

export const ARCHETYPE_RECOMMENDATIONS: Record<ArchetypeId, ArchetypeRecommendation> = {
  silent_burnout: {
    tips: [
      "Mulai catat 3 hal yang membuatmu capek hari ini — sadari polanya",
      "Izinkan dirimu istirahat tanpa harus 'sakit dulu'",
      "Kurangi satu aktivitas yang sebenarnya bisa ditunda minggu ini",
      "Coba teknik grounding 5-4-3-2-1 saat merasa overwhelmed",
    ],
    nextSteps: [
      "Pertimbangkan untuk berbicara dengan konselor atau psikolog",
      "Mulai journaling sederhana — tulis perasaanmu 5 menit sebelum tidur",
      "Buat boundary kecil: satu hal yang kamu tolak minggu ini",
    ],
    resources: [
      "Into The Light Indonesia — layanan konseling gratis",
      "Sejiwa (119 ext 8) — hotline kesehatan jiwa",
      "Halodoc / Alodokter — konsultasi psikolog online",
    ],
    affirmation: "Kelelahan yang kamu rasakan itu nyata. Mengakuinya bukan berarti lemah — itu langkah pertama untuk pulih.",
  },

  anxious_achiever: {
    tips: [
      "Latih teknik napas 4-7-8 sebelum tidur untuk menenangkan pikiran",
      "Buat daftar 'cukup' — hal yang sudah kamu capai hari ini",
      "Batasi cek media sosial menjadi 2x sehari",
      "Jadwalkan 'worry time' 15 menit — di luar itu, tunda kekhawatiran",
    ],
    nextSteps: [
      "Coba CBT (Cognitive Behavioral Therapy) — efektif untuk kecemasan",
      "Buat rutinitas wind-down 30 menit sebelum tidur tanpa gadget",
      "Diskusikan dengan profesional tentang manajemen kecemasan",
    ],
    resources: [
      "Aplikasi Headspace/Calm untuk guided meditation",
      "Riliv — platform kesehatan mental Indonesia",
      "Buku: 'Dare' oleh Barry McDonagh",
    ],
    affirmation: "Produktivitasmu bukan satu-satunya hal yang menentukan nilaimu. Kamu boleh istirahat tanpa merasa bersalah.",
  },

  people_pleaser: {
    tips: [
      "Latih mengatakan 'aku pikir-pikir dulu ya' sebelum langsung bilang iya",
      "Tulis 3 kebutuhanmu yang sering kamu abaikan demi orang lain",
      "Luangkan 30 menit 'me time' setiap hari tanpa ganggu-mengganggu",
      "Ingat: menolak permintaan bukan berarti menolak orangnya",
    ],
    nextSteps: [
      "Pelajari teknik assertiveness — mengungkapkan kebutuhan tanpa agresif",
      "Pertimbangkan terapi untuk memahami akar kebiasaan people-pleasing",
      "Mulai dengan boundary kecil dan tingkatkan secara bertahap",
    ],
    resources: [
      "Buku: 'Boundaries' oleh Henry Cloud",
      "Workshop assertiveness training online",
      "Konseling individu untuk self-worth",
    ],
    affirmation: "Menjaga dirimu sendiri bukan egois. Kamu tidak bisa menuangkan dari gelas yang kosong.",
  },

  lost_navigator: {
    tips: [
      "Berhenti membandingkan timeline hidupmu dengan orang lain",
      "Coba satu hal baru kecil minggu ini — apapun yang membuatmu penasaran",
      "Tulis 5 hal yang pernah membuatmu excited, meski sudah lama",
      "Bicara dengan seseorang yang kamu kagumi tentang perjalanan mereka",
    ],
    nextSteps: [
      "Ikuti tes minat/kepribadian (MBTI, StrengthsFinder) untuk eksplorasi",
      "Cari mentor atau career counselor",
      "Mulai project kecil tanpa tekanan — hanya untuk eksplorasi",
    ],
    resources: [
      "Platform Glints/LinkedIn Learning untuk eksplorasi karir",
      "Buku: 'Designing Your Life' oleh Bill Burnett",
      "Komunitas online untuk quarter-life crisis support",
    ],
    affirmation: "Tidak tahu arah bukan berarti kamu gagal. Kadang, bingung adalah tanda bahwa kamu sedang tumbuh.",
  },

  numb_wanderer: {
    tips: [
      "Coba aktivitas sensorik: masak, berkebun, atau jalan di alam",
      "Dengarkan musik yang dulu pernah membuatmu merasakan sesuatu",
      "Tulis perasaanmu meski hanya 'aku tidak merasakan apa-apa' — itu valid",
      "Gerakkan tubuhmu 10 menit sehari — jalan kaki sudah cukup",
    ],
    nextSteps: [
      "Pertimbangkan konsultasi psikolog — numbness bisa jadi tanda depresi",
      "Behavioral Activation: jadwalkan aktivitas yang dulu menyenangkan",
      "Cek kondisi fisik — kadang kelelahan fisik menyebabkan mati rasa emosional",
    ],
    resources: [
      "Into The Light Indonesia — konseling gratis",
      "Sejiwa (119 ext 8) — jangan ragu menghubungi",
      "Buku: 'Lost Connections' oleh Johann Hari",
    ],
    affirmation: "Tidak merasakan apa-apa bukan berarti kamu rusak. Kadang, mati rasa adalah cara tubuhmu melindungimu dari rasa sakit yang terlalu besar.",
  },

  overwhelmed_caregiver: {
    tips: [
      "Izinkan seseorang membantu kamu — bahkan hal kecil",
      "Jadwalkan 'off duty' time dimana kamu tidak available untuk siapapun",
      "Belajar membedakan urgent vs important dalam permintaan orang lain",
      "Jangan lupa makan dan tidur cukup — basic self-care dulu",
    ],
    nextSteps: [
      "Delegasikan satu tanggung jawab yang bisa dikerjakan orang lain",
      "Pertimbangkan support group untuk caregivers",
      "Bicara dengan profesional tentang compassion fatigue",
    ],
    resources: [
      "Buku: 'The Art of Extreme Self-Care' oleh Cheryl Richardson",
      "Support group caregivers di media sosial",
      "Layanan respite care jika tersedia di kotamu",
    ],
    affirmation: "Merawat dirimu sendiri bukan mengabaikan orang lain. Kamu layak dirawat juga.",
  },

  recovering_warrior: {
    tips: [
      "Rayakan setiap progress kecil — kamu sudah melewati banyak hal",
      "Jangan bandingkan hari burukmu dengan hari terbaik orang lain",
      "Buat 'emergency plan' untuk hari-hari berat — siapa yang bisa kamu hubungi?",
      "Terus lakukan hal-hal yang membantumu pulih, meski terasa lambat",
    ],
    nextSteps: [
      "Pertahankan rutinitas yang sudah membantumu membaik",
      "Pertimbangkan maintenance therapy untuk mencegah relapse",
      "Bangun support system — beri tahu orang terdekat tentang perjalananmu",
    ],
    resources: [
      "Komunitas peer support untuk pemulihan",
      "Aplikasi mood tracker untuk memantau progress",
      "Follow-up konseling secara berkala",
    ],
    affirmation: "Pemulihan bukan garis lurus. Hari buruk di tengah kemajuan bukan berarti kamu kembali ke nol.",
  },

  flourisher: {
    tips: [
      "Pertahankan rutinitas sehat yang sudah kamu bangun",
      "Gunakan energi positifmu untuk membantu orang di sekitarmu",
      "Terus belajar tentang dirimu — pertumbuhan tidak pernah berhenti",
      "Buat gratitude journal — 3 hal yang kamu syukuri setiap hari",
    ],
    nextSteps: [
      "Tetap lakukan self-check secara berkala",
      "Pertimbangkan menjadi peer support untuk orang lain",
      "Eksplorasi area pertumbuhan baru — skill, hobi, atau relasi",
    ],
    resources: [
      "Buku: 'Atomic Habits' oleh James Clear",
      "Platform volunteer untuk community impact",
      "Workshop personal development",
    ],
    affirmation: "Kondisimu baik bukan berarti perjalananmu selesai. Terus tumbuh, dan ajak orang lain tumbuh bersamamu.",
  },
};
