import mongoose, { Schema, models, model } from "mongoose";
import type { ArchetypeId } from "@/data/mental-battery/archetypes";
import type {
  MentalBatteryResult as MBResult,
  SeverityLevel,
} from "@/lib/mental-battery";

export interface IMentalBatteryResult {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional for anonymous guest assessment
  leadId?: mongoose.Types.ObjectId; // Link to captured lead details
  publicToken: string; // Token for viewing results without auth via URL
  /** Raw answers per instrument */
  answers: {
    phq9: number[];
    gad7: number[];
    dass21: number[];
  };
  /** Raw totals per instrument / subscale */
  rawScores: {
    phq9Total: number;
    gad7Total: number;
    dass21Depression: number;
    dass21Anxiety: number;
    dass21Stress: number;
  };
  /** Mental Battery computed values */
  batteryPercentage: number;
  batteryStatus: MBResult["batteryStatus"];
  subMetrics: {
    stressLevel: SeverityLevel;
    recoveryScore: SeverityLevel;
    focusCapacity: SeverityLevel;
    emotionalLoad: SeverityLevel;
  };
  archetypeId: ArchetypeId;
  /** Optional: AI-generated summary (Phase 2) */
  aiSummary?: string;
  /** Flag high-risk untuk admin alert */
  isHighRisk: boolean;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const severityEnum = ["rendah", "sedang", "tinggi", "sangat_tinggi"];
const batteryStatusEnum = ["charged", "stabil", "draining", "low_power", "critical"];
const archetypeEnum = [
  "silent_burnout",
  "anxious_achiever",
  "people_pleaser",
  "lost_navigator",
  "numb_wanderer",
  "overwhelmed_caregiver",
  "recovering_warrior",
  "flourisher",
];

const MentalBatteryResultSchema = new Schema<IMentalBatteryResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },
    publicToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    answers: {
      phq9: { type: [Number], required: true },
      gad7: { type: [Number], required: true },
      dass21: { type: [Number], required: true },
    },
    rawScores: {
      phq9Total: { type: Number, required: true },
      gad7Total: { type: Number, required: true },
      dass21Depression: { type: Number, required: true },
      dass21Anxiety: { type: Number, required: true },
      dass21Stress: { type: Number, required: true },
    },
    batteryPercentage: { type: Number, required: true, min: 0, max: 100 },
    batteryStatus: { type: String, enum: batteryStatusEnum, required: true },
    subMetrics: {
      stressLevel: { type: String, enum: severityEnum, required: true },
      recoveryScore: { type: String, enum: severityEnum, required: true },
      focusCapacity: { type: String, enum: severityEnum, required: true },
      emotionalLoad: { type: String, enum: severityEnum, required: true },
    },
    archetypeId: { type: String, enum: archetypeEnum, required: true },
    aiSummary: { type: String },
    isHighRisk: { type: Boolean, default: false },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

MentalBatteryResultSchema.index({ userId: 1, completedAt: -1 });

export const MentalBatteryResultModel =
  models.MentalBatteryResult ||
  model<IMentalBatteryResult>("MentalBatteryResult", MentalBatteryResultSchema);
