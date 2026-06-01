/**
 * Mental Battery Scoring Engine
 *
 * Menerima raw answers dari PHQ-9, GAD-7, DASS-21
 * dan menghasilkan:
 *  - Mental Battery % (0–100)
 *  - 4 sub-metrics (Stress Level, Recovery Score, Focus Capacity, Emotional Load)
 *  - Archetype assignment
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  CATATAN UNTUK PSIKOLOG:                                           │
 * │                                                                    │
 * │  Bobot formula (WEIGHTS), threshold archetype, dan severity        │
 * │  cutoff bisa di-adjust sesuai kebutuhan klinis.                    │
 * │                                                                    │
 * │  Saat ini menggunakan normalisasi linear sederhana.                │
 * │  Scoring ini BUKAN diagnosis klinis.                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { MentalBatteryConfigModel } from "@/models/MentalBatteryConfig";
import { DynamicArchetypeModel } from "@/models/DynamicArchetype";
import { MentalBatteryInstrumentModel } from "@/models/MentalBatteryInstrument";
import type { ArchetypeId } from "@/data/mental-battery/archetypes";
import { type SeverityLevel } from "./mental-battery-constants";

// ── Types ──────────────────────────────────────────────────────────────

export interface SubMetrics {
  stressLevel: SeverityLevel;
  recoveryScore: SeverityLevel;
  focusCapacity: SeverityLevel;
  emotionalLoad: SeverityLevel;
}

export interface RawScores {
  phq9Total: number;
  gad7Total: number;
  dass21Depression: number;
  dass21Anxiety: number;
  dass21Stress: number;
}

export interface MentalBatteryResult {
  /** 0–100 — semakin tinggi semakin sehat */
  batteryPercentage: number;
  /** Label status battery */
  batteryStatus: "charged" | "stabil" | "draining" | "low_power" | "critical";
  /** 4 sub-metrics */
  subMetrics: SubMetrics;
  /** Archetype yang di-assign */
  archetypeId: string;
  /** Raw scores per instrument (disimpan untuk keperluan klinis) */
  rawScores: RawScores;
}

// ── Constants ──────────────────────────────────────────────────────────

/** Max possible score per instrument */
const PHQ9_MAX = 27; // 9 items × 3
const GAD7_MAX = 21; // 7 items × 3
const DASS21_SUBSCALE_MAX = 21; // 7 items × 3 per subscale

/** Get DASS-21 subscale totals from answers array */
function computeDASS21Subscales(
  answers: number[],
  questions: any[]
): { depression: number; anxiety: number; stress: number } {
  const result = { depression: 0, anxiety: 0, stress: 0 };
  for (let i = 0; i < questions.length; i++) {
    const subscale = questions[i].subscale;
    if (subscale && answers[i] != null) {
      if (subscale === "depression") result.depression += answers[i];
      if (subscale === "anxiety") result.anxiety += answers[i];
      if (subscale === "stress") result.stress += answers[i];
    }
  }
  return result;
}

// ── Main Scoring Function ──────────────────────────────────────────────

export async function calculateMentalBattery(
  phq9Answers: number[],
  gad7Answers: number[],
  dass21Answers: number[],
  /** Skor battery dari assessment sebelumnya (jika ada) — untuk Recovering Warrior */
  previousBattery?: number
): Promise<MentalBatteryResult> {
  // Fetch config from DB
  const config = await MentalBatteryConfigModel.findOne().lean();
  let weights = {
    phq9: 0.3,
    gad7: 0.25,
    dass_depression: 0.2,
    dass_anxiety: 0.15,
    dass_stress: 0.1,
  };
  
  if (config && config.weights) {
    weights = config.weights;
  }
  
  // Fetch active DASS-21 instrument from DB
  const dassInstrument = await MentalBatteryInstrumentModel.findOne({ instrumentId: "dass-21" }).lean();
  const dassQuestions = dassInstrument ? dassInstrument.questions : [];

  // 1. Raw totals
  const phq9Total = sum(phq9Answers);
  const gad7Total = sum(gad7Answers);

  const dassSubscales = computeDASS21Subscales(
    dass21Answers,
    dassQuestions
  );

  const rawScores: RawScores = {
    phq9Total,
    gad7Total,
    dass21Depression: dassSubscales.depression,
    dass21Anxiety: dassSubscales.anxiety,
    dass21Stress: dassSubscales.stress,
  };

  // 2. Normalize each to 0–100 (100 = worst distress)
  const phq9Norm = (phq9Total / PHQ9_MAX) * 100;
  const gad7Norm = (gad7Total / GAD7_MAX) * 100;
  const dassDepNorm = (dassSubscales.depression / DASS21_SUBSCALE_MAX) * 100;
  const dassAnxNorm = (dassSubscales.anxiety / DASS21_SUBSCALE_MAX) * 100;
  const dassStrNorm = (dassSubscales.stress / DASS21_SUBSCALE_MAX) * 100;

  // 3. Weighted composite distress (0–100)
  const distress =
    (phq9Total / PHQ9_MAX) * weights.phq9 * 100 +
    (gad7Total / GAD7_MAX) * weights.gad7 * 100 +
    (dassSubscales.depression / DASS21_SUBSCALE_MAX) * weights.dass_depression * 100 +
    (dassSubscales.anxiety / DASS21_SUBSCALE_MAX) * weights.dass_anxiety * 100 +
    (dassSubscales.stress / DASS21_SUBSCALE_MAX) * weights.dass_stress * 100;

  // 4. Mental Battery = 100 - distress
  const batteryPercentage = Math.max(0, Math.min(100, Math.round(100 - distress)));

  // 5. Battery status
  const batteryStatus = getBatteryStatus(batteryPercentage);

  // 6. Sub-metrics
  const subMetrics = computeSubMetrics(rawScores);

  // 7. Fetch all archetypes for assignment
  const dynamicArchetypes = await DynamicArchetypeModel.find().lean();
  
  // 7. Archetype assignment
  const archetypeId = assignArchetype(
    rawScores,
    batteryPercentage,
    phq9Answers,
    previousBattery
  );

  // Validate archetype exists in DB, fallback to 'silent_burnout' if missing
  const assignedArch = dynamicArchetypes.find((a) => a.archetypeId === archetypeId);
  const finalArchetypeId = assignedArch ? assignedArch.archetypeId : "silent_burnout";

  return {
    batteryPercentage,
    batteryStatus,
    subMetrics,
    archetypeId: finalArchetypeId,
    rawScores,
  };
}

// ── Sub-Metrics ────────────────────────────────────────────────────────

function computeSubMetrics(raw: RawScores): SubMetrics {
  // Stress Level — dari DASS-21 Stress subscale (0–21)
  const stressLevel: SeverityLevel =
    raw.dass21Stress <= 5
      ? "rendah"
      : raw.dass21Stress <= 10
        ? "sedang"
        : raw.dass21Stress <= 15
          ? "tinggi"
          : "sangat_tinggi";

  // Recovery Score — inverse dari PHQ-9 (kemampuan menikmati hidup)
  const recoveryScore: SeverityLevel =
    raw.phq9Total <= 4
      ? "rendah" // rendah distress = recovery baik
      : raw.phq9Total <= 9
        ? "sedang"
        : raw.phq9Total <= 14
          ? "tinggi"
          : "sangat_tinggi";

  // Focus Capacity — dari GAD-7 (kecemasan mengganggu fokus)
  const focusCapacity: SeverityLevel =
    raw.gad7Total <= 4
      ? "rendah"
      : raw.gad7Total <= 9
        ? "sedang"
        : raw.gad7Total <= 14
          ? "tinggi"
          : "sangat_tinggi";

  // Emotional Load — composite PHQ-9 + GAD-7
  const combined = raw.phq9Total + raw.gad7Total;
  const emotionalLoad: SeverityLevel =
    combined <= 10
      ? "rendah"
      : combined <= 20
        ? "sedang"
        : combined <= 30
          ? "tinggi"
          : "sangat_tinggi";

  return { stressLevel, recoveryScore, focusCapacity, emotionalLoad };
}

// ── Archetype Assignment ───────────────────────────────────────────────

/**
 * Assign archetype berdasarkan pattern skor.
 *
 * Psikolog: adjust threshold dan urutan priority sesuai kebutuhan.
 * Urutan checking matters — semakin atas semakin diprioritaskan.
 */
function assignArchetype(
  raw: RawScores,
  battery: number,
  phq9Answers: number[],
  previousBattery?: number
): ArchetypeId {
  // The Flourisher — kondisi sehat
  if (battery >= 78) return "flourisher";

  // The Recovering Warrior — ada history assessment sebelumnya yang lebih buruk
  if (previousBattery != null && battery > previousBattery + 10) {
    return "recovering_warrior";
  }

  // The Anxious Achiever — kecemasan dominan, depresi rendah
  if (raw.gad7Total >= 10 && raw.phq9Total <= 9 && raw.dass21Anxiety > raw.dass21Depression) {
    return "anxious_achiever";
  }

  // The Numb Wanderer — anhedonia tinggi (PHQ item 1+2 tinggi), profil flat
  if (raw.phq9Total >= 10 && phq9Answers[0] + phq9Answers[1] >= 4) {
    return "numb_wanderer";
  }

  // The People Pleaser — stress tinggi + indikator "merasa menjadi beban" (PHQ item 6, index 5)
  if (raw.dass21Stress >= 12 && phq9Answers[5] >= 2) {
    return "people_pleaser";
  }

  // The Lost Navigator — moderate semua, general distress tanpa dominan
  if (battery >= 30 && battery <= 60 && raw.gad7Total >= 7 && raw.phq9Total >= 7) {
    return "lost_navigator";
  }

  // The Overwhelmed Caregiver — stress sangat tinggi + emotional load berat
  if (raw.dass21Stress >= 15 && raw.gad7Total >= 10) {
    return "overwhelmed_caregiver";
  }

  // Default — The Silent Burnout
  return "silent_burnout";
}

// ── Battery Status Label ───────────────────────────────────────────────

function getBatteryStatus(
  pct: number
): MentalBatteryResult["batteryStatus"] {
  if (pct >= 80) return "charged";
  if (pct >= 60) return "stabil";
  if (pct >= 40) return "draining";
  if (pct >= 20) return "low_power";
  return "critical";
}

// ── Helpers ────────────────────────────────────────────────────────────

function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

// (Constants moved to mental-battery-constants.ts)
