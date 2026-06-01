import mongoose, { Schema, models, model } from "mongoose";

export interface IMentalBatteryConfig {
  _id: mongoose.Types.ObjectId;
  weights: {
    phq9: number;
    gad7: number;
    dass_depression: number;
    dass_anxiety: number;
    dass_stress: number;
  };
  thresholds: {
    depression: { mild: number; moderate: number; severe: number; extremely_severe: number };
    anxiety: { mild: number; moderate: number; severe: number; extremely_severe: number };
    stress: { mild: number; moderate: number; severe: number; extremely_severe: number };
  };
  archetypeLogic: {
    condition: string; // e.g., 'D > severe && A > severe' or 'totalScore > 80'
    archetypeId: string; // Matches ID in DynamicArchetype
  }[];
  updatedAt: Date;
}

const MentalBatteryConfigSchema = new Schema<IMentalBatteryConfig>(
  {
    weights: {
      phq9: { type: Number, required: true, default: 0.3 },
      gad7: { type: Number, required: true, default: 0.25 },
      dass_depression: { type: Number, required: true, default: 0.2 },
      dass_anxiety: { type: Number, required: true, default: 0.15 },
      dass_stress: { type: Number, required: true, default: 0.1 },
    },
    thresholds: {
      depression: {
        mild: { type: Number, default: 10 },
        moderate: { type: Number, default: 14 },
        severe: { type: Number, default: 21 },
        extremely_severe: { type: Number, default: 28 },
      },
      anxiety: {
        mild: { type: Number, default: 8 },
        moderate: { type: Number, default: 10 },
        severe: { type: Number, default: 15 },
        extremely_severe: { type: Number, default: 20 },
      },
      stress: {
        mild: { type: Number, default: 15 },
        moderate: { type: Number, default: 19 },
        severe: { type: Number, default: 26 },
        extremely_severe: { type: Number, default: 34 },
      }
    },
    archetypeLogic: [
      {
        condition: { type: String, required: true },
        archetypeId: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const MentalBatteryConfigModel =
  models.MentalBatteryConfig ||
  model<IMentalBatteryConfig>("MentalBatteryConfig", MentalBatteryConfigSchema);
