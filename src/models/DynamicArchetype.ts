import mongoose, { Schema, models, model } from "mongoose";

export interface IDynamicArchetype {
  _id: mongoose.Types.ObjectId;
  archetypeId: string; // The internal key (e.g., 'silent_burnout')
  name: string;
  emoji: string;
  imageUrl?: string;
  tagline: string;
  description: string;
  signals: string[];
  gradient: string;
  accentColor: string;
  updatedAt: Date;
}

const DynamicArchetypeSchema = new Schema<IDynamicArchetype>(
  {
    archetypeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    emoji: { type: String, required: false },
    imageUrl: { type: String, required: false },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    signals: { type: [String], required: true },
    gradient: { type: String, required: true },
    accentColor: { type: String, required: true },
  },
  { timestamps: true }
);

export const DynamicArchetypeModel =
  models.DynamicArchetype ||
  model<IDynamicArchetype>("DynamicArchetype", DynamicArchetypeSchema);
