/**
 * Pertanyaan Assessment dalam Bahasa Indonesia
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  CATATAN UNTUK PSIKOLOG:                                           │
 * │                                                                    │
 * │  Setiap pertanyaan di bawah adalah placeholder terjemahan dari     │
 * │  instrumen asli (PHQ-9, GAD-7, DASS-21).                          │
 * │                                                                    │
 * │  Silakan ganti teks `text` dengan terjemahan resmi atau            │
 * │  terjemahan adaptasi yang sudah divalidasi secara klinis.          │
 * │                                                                    │
 * │  Jangan ubah field `id` karena digunakan oleh scoring engine.      │
 * │                                                                    │
 * │  Field `subscale` pada DASS-21 menunjukkan subskala                │
 * │  (depression / anxiety / stress) — jangan diubah.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export interface QuestionItem {
  id: string;
  text: string;
  /** Hanya untuk DASS-21 */
  subscale?: "depression" | "anxiety" | "stress";
}

// ────────────────────────────────────────────────────────────────────────
// PHQ-9 — Patient Health Questionnaire
// Instruksi: "Dalam 2 minggu terakhir, seberapa sering kamu merasa..."
// Skala: 0 = Tidak sama sekali, 1 = Beberapa hari, 2 = Lebih dari separuh hari, 3 = Hampir setiap hari
// ────────────────────────────────────────────────────────────────────────

export const PHQ9_QUESTIONS_ID: QuestionItem[] = [
  { id: "phq1", text: "Kurang minat atau kesenangan dalam melakukan sesuatu" },
  { id: "phq2", text: "Merasa sedih, murung, atau putus asa" },
  {
    id: "phq3",
    text: "Sulit tidur, tidak bisa tidur nyenyak, atau justru tidur terlalu banyak",
  },
  { id: "phq4", text: "Merasa lelah atau tidak bertenaga" },
  { id: "phq5", text: "Nafsu makan berkurang atau makan berlebihan" },
  {
    id: "phq6",
    text: "Merasa buruk tentang diri sendiri — atau merasa gagal, atau merasa mengecewakan diri sendiri atau keluarga",
  },
  {
    id: "phq7",
    text: "Sulit berkonsentrasi pada sesuatu, seperti membaca atau menonton",
  },
  {
    id: "phq8",
    text: "Bergerak atau berbicara sangat lambat sehingga orang lain menyadarinya, atau sebaliknya — sangat gelisah sehingga banyak bergerak dari biasanya",
  },
  {
    id: "phq9",
    text: "Pikiran bahwa lebih baik mati atau ingin menyakiti diri sendiri",
  },
];

export const PHQ9_SCALE_LABELS_ID = [
  "Tidak sama sekali",
  "Beberapa hari",
  "Lebih dari separuh hari",
  "Hampir setiap hari",
];

export const PHQ9_INSTRUCTION_ID =
  "Dalam 2 minggu terakhir, seberapa sering kamu terganggu oleh masalah-masalah berikut?";

// ────────────────────────────────────────────────────────────────────────
// GAD-7 — Generalized Anxiety Disorder
// Instruksi: "Dalam 2 minggu terakhir, seberapa sering kamu merasa..."
// Skala sama dengan PHQ-9
// ────────────────────────────────────────────────────────────────────────

export const GAD7_QUESTIONS_ID: QuestionItem[] = [
  { id: "gad1", text: "Merasa gugup, cemas, atau tegang" },
  { id: "gad2", text: "Tidak bisa menghentikan atau mengendalikan kekhawatiran" },
  { id: "gad3", text: "Terlalu banyak khawatir tentang berbagai hal" },
  { id: "gad4", text: "Sulit untuk rileks" },
  { id: "gad5", text: "Sangat gelisah sehingga sulit untuk diam" },
  { id: "gad6", text: "Mudah merasa kesal atau tersinggung" },
  {
    id: "gad7",
    text: "Merasa takut, seolah-olah sesuatu yang buruk akan terjadi",
  },
];

export const GAD7_SCALE_LABELS_ID = [
  "Tidak sama sekali",
  "Beberapa hari",
  "Lebih dari separuh hari",
  "Hampir setiap hari",
];

export const GAD7_INSTRUCTION_ID =
  "Dalam 2 minggu terakhir, seberapa sering kamu terganggu oleh masalah-masalah berikut?";

// ────────────────────────────────────────────────────────────────────────
// DASS-21 — Depression Anxiety Stress Scales
// Instruksi: "Dalam 1 minggu terakhir, seberapa sesuai pernyataan ini denganmu?"
// Skala: 0 = Tidak sesuai, 1 = Agak sesuai, 2 = Cukup sesuai, 3 = Sangat sesuai
//
// Subscale mapping (JANGAN DIUBAH):
//   Depression: d3, d5, d10, d13, d16, d17, d21
//   Anxiety:    d2, d4, d7, d9, d15, d19, d20
//   Stress:     d1, d6, d8, d11, d12, d14, d18
// ────────────────────────────────────────────────────────────────────────

export const DASS21_QUESTIONS_ID: QuestionItem[] = [
  { id: "d1", text: "Saya merasa sulit untuk tenang", subscale: "stress" },
  {
    id: "d2",
    text: "Saya merasakan mulut kering",
    subscale: "anxiety",
  },
  {
    id: "d3",
    text: "Saya seperti tidak bisa merasakan perasaan positif sama sekali",
    subscale: "depression",
  },
  {
    id: "d4",
    text: "Saya mengalami kesulitan bernapas (misalnya napas cepat, sesak tanpa aktivitas fisik)",
    subscale: "anxiety",
  },
  {
    id: "d5",
    text: "Saya merasa sulit untuk memulai melakukan sesuatu",
    subscale: "depression",
  },
  {
    id: "d6",
    text: "Saya cenderung bereaksi berlebihan terhadap situasi",
    subscale: "stress",
  },
  {
    id: "d7",
    text: "Saya merasa gemetar (misalnya pada tangan)",
    subscale: "anxiety",
  },
  {
    id: "d8",
    text: "Saya merasa menggunakan banyak energi untuk cemas",
    subscale: "stress",
  },
  {
    id: "d9",
    text: "Saya khawatir tentang situasi di mana saya mungkin panik dan mempermalukan diri sendiri",
    subscale: "anxiety",
  },
  {
    id: "d10",
    text: "Saya merasa tidak ada yang bisa diharapkan",
    subscale: "depression",
  },
  {
    id: "d11",
    text: "Saya merasa diri saya mudah gelisah",
    subscale: "stress",
  },
  {
    id: "d12",
    text: "Saya merasa sulit untuk rileks",
    subscale: "stress",
  },
  {
    id: "d13",
    text: "Saya merasa sedih dan murung",
    subscale: "depression",
  },
  {
    id: "d14",
    text: "Saya tidak sabar terhadap hal-hal yang menghalangi yang sedang saya lakukan",
    subscale: "stress",
  },
  {
    id: "d15",
    text: "Saya merasa hampir panik",
    subscale: "anxiety",
  },
  {
    id: "d16",
    text: "Saya tidak bisa merasa antusias tentang apapun",
    subscale: "depression",
  },
  {
    id: "d17",
    text: "Saya merasa tidak berharga sebagai manusia",
    subscale: "depression",
  },
  {
    id: "d18",
    text: "Saya merasa mudah tersinggung",
    subscale: "stress",
  },
  {
    id: "d19",
    text: "Saya merasakan detak jantung tanpa melakukan aktivitas fisik (misalnya detak jantung meningkat, jantung terasa berhenti sejenak)",
    subscale: "anxiety",
  },
  {
    id: "d20",
    text: "Saya merasa takut tanpa alasan yang jelas",
    subscale: "anxiety",
  },
  {
    id: "d21",
    text: "Saya merasa hidup ini tidak berarti",
    subscale: "depression",
  },
];

export const DASS21_SCALE_LABELS_ID = [
  "Tidak sesuai sama sekali",
  "Agak sesuai, atau kadang-kadang",
  "Cukup sesuai, atau sering",
  "Sangat sesuai, atau hampir selalu",
];

export const DASS21_INSTRUCTION_ID =
  "Dalam 1 minggu terakhir, seberapa sesuai pernyataan-pernyataan berikut dengan kondisimu?";

// ────────────────────────────────────────────────────────────────────────
// Combined Assessment
// Urutan: PHQ-9 (9 soal) → GAD-7 (7 soal) → DASS-21 (21 soal) = 37 soal total
// ────────────────────────────────────────────────────────────────────────

export interface InstrumentSection {
  instrumentId: string;
  title: string;
  instruction: string;
  scaleLabels: string[];
  questions: QuestionItem[];
}

export const MENTAL_BATTERY_SECTIONS: InstrumentSection[] = [
  {
    instrumentId: "phq-9",
    title: "Bagian 1 — Kesejahteraan",
    instruction: PHQ9_INSTRUCTION_ID,
    scaleLabels: PHQ9_SCALE_LABELS_ID,
    questions: PHQ9_QUESTIONS_ID,
  },
  {
    instrumentId: "gad-7",
    title: "Bagian 2 — Kekhawatiran",
    instruction: GAD7_INSTRUCTION_ID,
    scaleLabels: GAD7_SCALE_LABELS_ID,
    questions: GAD7_QUESTIONS_ID,
  },
  {
    instrumentId: "dass-21",
    title: "Bagian 3 — Pengalaman Sehari-hari",
    instruction: DASS21_INSTRUCTION_ID,
    scaleLabels: DASS21_SCALE_LABELS_ID,
    questions: DASS21_QUESTIONS_ID,
  },
];

export const TOTAL_QUESTIONS =
  PHQ9_QUESTIONS_ID.length +
  GAD7_QUESTIONS_ID.length +
  DASS21_QUESTIONS_ID.length;
