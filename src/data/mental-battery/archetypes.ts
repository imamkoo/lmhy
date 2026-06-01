/**
 * 8 LMHY Archetype Definitions
 *
 * Catatan untuk Psikolog:
 * - Silakan edit `tagline`, `description`, dan `signals` agar sesuai
 *   dengan framing klinis yang diinginkan.
 * - `triggerNote` menjelaskan logika assignment di scoring engine
 *   (lihat src/lib/mental-battery.ts)
 */

export type ArchetypeId =
  | "silent_burnout"
  | "anxious_achiever"
  | "people_pleaser"
  | "lost_navigator"
  | "numb_wanderer"
  | "overwhelmed_caregiver"
  | "recovering_warrior"
  | "flourisher";

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  signals: string[];
  /** Internal note — kapan archetype ini di-assign */
  triggerNote: string;
  /** Visual */
  gradient: string;
  accentColor: string;
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  silent_burnout: {
    id: "silent_burnout",
    name: "The Silent Burnout",
    emoji: "🌫️",
    tagline: "Di luar terlihat baik-baik saja. Di dalam sudah hampir habis.",
    description:
      "Kamu terus berfungsi — pergi kerja, kuliah, merespons chat — tapi setiap hari rasanya makin berat. Kamu tidak mengeluh karena tidak ingin jadi beban. Tapi lelah itu nyata.",
    signals: [
      "Capek tanpa sebab jelas",
      "Tidak semangat meski aktivitas normal",
      "Senyum di luar, kosong di dalam",
    ],
    triggerNote: "Default untuk battery rendah tanpa pattern spesifik lainnya",
    gradient: "from-slate-700 via-slate-600 to-slate-500",
    accentColor: "#94a3b8",
  },

  anxious_achiever: {
    id: "anxious_achiever",
    name: "The Anxious Achiever",
    emoji: "⚡",
    tagline: "Selalu produktif di luar, selalu khawatir di dalam.",
    description:
      "Prestasimu tidak kurang, tapi kecemasanmu juga tidak. Kamu tidak bisa berhenti, karena berhenti terasa berbahaya. Dan di balik setiap pencapaian, ada suara kecil yang bilang 'belum cukup'.",
    signals: [
      "Overthinking di malam hari",
      "Takut gagal meski sudah usaha keras",
      "Tidak bisa istirahat tanpa rasa bersalah",
    ],
    triggerNote: "GAD-7 tinggi, depresi rendah, kecemasan dominan",
    gradient: "from-blue-700 via-indigo-600 to-violet-600",
    accentColor: "#818cf8",
  },

  people_pleaser: {
    id: "people_pleaser",
    name: "The People Pleaser",
    emoji: "🌸",
    tagline: "Selalu bilang iya, bahkan ketika hatinya bilang tidak.",
    description:
      "Bukan karena kamu tidak punya pendapat. Tapi karena mengecewakan orang terasa jauh lebih sakit dari memendam perasaanmu sendiri. Kamu capek — bukan karena terlalu banyak kerja, tapi karena terlalu sedikit menjadi dirimu sendiri.",
    signals: [
      "Susah menolak permintaan orang",
      "Prioritaskan kebutuhan orang lain dulu",
      "Takut dianggap egois kalau jujur",
    ],
    triggerNote:
      "Stress tinggi + indikator kesulitan assertiveness (PHQ item 'merasa menjadi beban')",
    gradient: "from-rose-600 via-pink-500 to-fuchsia-500",
    accentColor: "#f472b6",
  },

  lost_navigator: {
    id: "lost_navigator",
    name: "The Lost Navigator",
    emoji: "🧭",
    tagline: "Semua orang tampak tahu tujuan mereka. Hanya aku yang tidak.",
    description:
      "Kamu bukan malas. Kamu bukan tidak punya potensi. Kamu hanya belum menemukan kompasmu. Dan melihat orang-orang seusiamu seperti sudah tahu arah, membuat rasa bingungmu terasa seperti kegagalan.",
    signals: [
      "Bingung soal karir atau masa depan",
      "Merasa tertinggal dari teman sebaya",
      "Sering gonta-ganti tujuan",
    ],
    triggerNote:
      "Battery 30–60%, GAD moderate, PHQ moderate — pattern general distress tanpa dominan",
    gradient: "from-amber-600 via-orange-500 to-yellow-500",
    accentColor: "#fb923c",
  },

  numb_wanderer: {
    id: "numb_wanderer",
    name: "The Numb Wanderer",
    emoji: "🌊",
    tagline: "Tidak sedih. Tidak bahagia. Hanya... kosong.",
    description:
      "Kamu tidak bisa menjelaskan kenapa kamu merasa seperti ini, karena tidak ada yang terasa seperti apapun. Hal-hal yang dulu menyenangkan, sekarang flat. Dan itu justru terasa lebih membingungkan daripada kalau kamu sedih.",
    signals: [
      "Merasa hampa tanpa alasan jelas",
      "Kehilangan minat pada hal yang dulu disukai",
      "Susah merasakan emosi yang kuat",
    ],
    triggerNote:
      "PHQ-9 tinggi dengan anhedonia dominan (item 1+2 tinggi), profil flat",
    gradient: "from-cyan-700 via-teal-600 to-sky-500",
    accentColor: "#67e8f9",
  },

  overwhelmed_caregiver: {
    id: "overwhelmed_caregiver",
    name: "The Overwhelmed Caregiver",
    emoji: "🌿",
    tagline: "Selalu ada untuk orang lain, tapi lupa ada untuk diri sendiri.",
    description:
      "Kamu adalah orang yang diandalkan — oleh keluarga, teman, atau rekan. Dan kamu tidak keberatan. Tapi entah sejak kapan, tidak ada yang menanyakan kabarmu. Dan kamu sudah lupa kapan terakhir kali jujur tentang kondisimu.",
    signals: [
      "Selalu jadi tempat curhat orang lain",
      "Susah minta tolong atau mengakui kelemahan",
      "Capek tapi merasa tidak boleh berhenti",
    ],
    triggerNote:
      "Stress sangat tinggi (DASS-S >= 18) + GAD tinggi, emotional load berat",
    gradient: "from-emerald-700 via-teal-600 to-green-500",
    accentColor: "#34d399",
  },

  recovering_warrior: {
    id: "recovering_warrior",
    name: "The Recovering Warrior",
    emoji: "🔥",
    tagline:
      "Pernah jatuh sangat dalam. Sekarang sedang berjuang naik kembali.",
    description:
      "Kamu tahu rasanya berada di titik terbawah. Dan kamu memilih untuk tidak tinggal di sana. Prosesnya tidak linear — ada hari buruk di tengah kemajuan. Tapi kamu masih berjalan. Itu bukan hal kecil.",
    signals: [
      "Sedang dalam proses pemulihan",
      "Hari ini lebih baik dari beberapa waktu lalu",
      "Masih ada momen berat, tapi mulai ada harapan",
    ],
    triggerNote:
      "Skor membaik dari assessment sebelumnya (battery naik >= 10 poin)",
    gradient: "from-red-600 via-orange-500 to-amber-400",
    accentColor: "#fb923c",
  },

  flourisher: {
    id: "flourisher",
    name: "The Flourisher",
    emoji: "🌱",
    tagline:
      "Mental battery cukup sehat — tapi tumbuh tidak pernah berhenti.",
    description:
      "Secara umum kamu baik-baik saja. Tapi 'baik' bukan akhir dari perjalanan. Kamu di sini karena ingin memahami dirimu lebih dalam, dan terus bertumbuh — bukan menunggu krisis untuk mulai peduli pada kondisi mentalmu.",
    signals: [
      "Kondisi secara umum stabil",
      "Ingin terus berkembang",
      "Proaktif menjaga kesehatan mental",
    ],
    triggerNote: "Battery >= 78%, semua subscale low-mild",
    gradient: "from-green-600 via-emerald-500 to-teal-400",
    accentColor: "#4ade80",
  },
};

/** List in display order */
export const ARCHETYPE_LIST = Object.values(ARCHETYPES);
