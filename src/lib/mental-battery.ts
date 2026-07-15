/**
 * Mental Battery Scoring Engine
 *
 * Menerima raw answers dari PHQ-9, GAD-7, DASS-21
 * dan menghasilkan:
 *  - Mental Battery % (0-100)
 *  - 4 sub-metrics (Stress Level, Recovery Score, Focus Capacity, Emotional Load)
 *  - Archetype assignment
 *
 * Scoring ini BUKAN diagnosis klinis.
 */

import { MentalBatteryConfigModel } from "@/models/MentalBatteryConfig";
import { DynamicArchetypeModel } from "@/models/DynamicArchetype";
import { MentalBatteryInstrumentModel } from "@/models/MentalBatteryInstrument";
import type { ArchetypeId } from "@/data/mental-battery/archetypes";
import { type SeverityLevel } from "./mental-battery-constants";

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
  batteryPercentage: number;
  batteryStatus: "charged" | "stabil" | "draining" | "low_power" | "critical";
  subMetrics: SubMetrics;
  archetypeId: string;
  rawScores: RawScores;
}

const PHQ9_MAX = 27;
const GAD7_MAX = 21;
const DASS21_SUBSCALE_MAX = 21;

function computeDASS21Subscales(
  answers: number[],
  questions: { subscale?: string }[]
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

export async function calculateMentalBattery(
  phq9Answers: number[],
  gad7Answers: number[],
  dass21Answers: number[],
  previousBattery?: number
): Promise<MentalBatteryResult> {
  const config = await MentalBatteryConfigModel.findOne().lean();
  const weights = config?.weights ?? {
    phq9: 0.3,
    gad7: 0.25,
    dass_depression: 0.2,
    dass_anxiety: 0.15,
    dass_stress: 0.1,
  };

  const dassInstrument = await MentalBatteryInstrumentModel.findOne({ instrumentId: "dass-21" }).lean();
  const dassQuestions = dassInstrument ? dassInstrument.questions : [];

  const phq9Total = sum(phq9Answers);
  const gad7Total = sum(gad7Answers);
  const dassSubscales = computeDASS21Subscales(dass21Answers, dassQuestions);

  const rawScores: RawScores = {
    phq9Total,
    gad7Total,
    dass21Depression: dassSubscales.depression,
    dass21Anxiety: dassSubscales.anxiety,
    dass21Stress: dassSubscales.stress,
  };

  const distress =
    (phq9Total / PHQ9_MAX) * weights.phq9 * 100 +
    (gad7Total / GAD7_MAX) * weights.gad7 * 100 +
    (dassSubscales.depression / DASS21_SUBSCALE_MAX) * weights.dass_depression * 100 +
    (dassSubscales.anxiety / DASS21_SUBSCALE_MAX) * weights.dass_anxiety * 100 +
    (dassSubscales.stress / DASS21_SUBSCALE_MAX) * weights.dass_stress * 100;

  const batteryPercentage = Math.max(0, Math.min(100, Math.round(100 - distress)));
  const batteryStatus = getBatteryStatus(batteryPercentage);

  const subMetrics = computeSubMetrics(rawScores, config?.thresholds);

  const dynamicArchetypes = await DynamicArchetypeModel.find().lean();

  const archetypeId = assignArchetype(
    rawScores,
    batteryPercentage,
    phq9Answers,
    previousBattery
  );

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

interface Thresholds {
  depression?: { mild: number; moderate: number; severe: number; extremely_severe: number };
  anxiety?: { mild: number; moderate: number; severe: number; extremely_severe: number };
  stress?: { mild: number; moderate: number; severe: number; extremely_severe: number };
}

function computeSubMetrics(raw: RawScores, thresholds?: Thresholds | null): SubMetrics {
  const stressCuts = thresholds?.stress ?? { mild: 5, moderate: 10, severe: 15 };
  const stressLevel: SeverityLevel =
    raw.dass21Stress <= stressCuts.mild
      ? "rendah"
      : raw.dass21Stress <= stressCuts.moderate
        ? "sedang"
        : raw.dass21Stress <= stressCuts.severe
          ? "tinggi"
          : "sangat_tinggi";

  const depressionCuts = thresholds?.depression ?? { mild: 4, moderate: 9, severe: 14 };
  const recoveryScore: SeverityLevel =
    raw.phq9Total <= depressionCuts.mild
      ? "rendah"
      : raw.phq9Total <= depressionCuts.moderate
        ? "sedang"
        : raw.phq9Total <= depressionCuts.severe
          ? "tinggi"
          : "sangat_tinggi";

  const anxietyCuts = thresholds?.anxiety ?? { mild: 4, moderate: 9, severe: 14 };
  const focusCapacity: SeverityLevel =
    raw.gad7Total <= anxietyCuts.mild
      ? "rendah"
      : raw.gad7Total <= anxietyCuts.moderate
        ? "sedang"
        : raw.gad7Total <= anxietyCuts.severe
          ? "tinggi"
          : "sangat_tinggi";

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

function assignArchetype(
  raw: RawScores,
  battery: number,
  phq9Answers: number[],
  previousBattery?: number
): ArchetypeId {
  if (battery >= 78) return "flourisher";

  if (previousBattery != null && battery > previousBattery + 10) {
    return "recovering_warrior";
  }

  if (raw.gad7Total >= 10 && raw.phq9Total <= 9 && raw.dass21Anxiety > raw.dass21Depression) {
    return "anxious_achiever";
  }

  if (raw.phq9Total >= 10 && phq9Answers[0] + phq9Answers[1] >= 4) {
    return "numb_wanderer";
  }

  if (raw.dass21Stress >= 12 && phq9Answers[5] >= 2) {
    return "people_pleaser";
  }

  if (battery >= 30 && battery <= 60 && raw.gad7Total >= 7 && raw.phq9Total >= 7) {
    return "lost_navigator";
  }

  if (raw.dass21Stress >= 15 && raw.gad7Total >= 10) {
    return "overwhelmed_caregiver";
  }

  return "silent_burnout";
}

function getBatteryStatus(
  pct: number
): MentalBatteryResult["batteryStatus"] {
  if (pct >= 80) return "charged";
  if (pct >= 60) return "stabil";
  if (pct >= 40) return "draining";
  if (pct >= 20) return "low_power";
  return "critical";
}

function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}
