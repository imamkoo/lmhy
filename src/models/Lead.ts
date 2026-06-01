import mongoose, { Schema, models, model } from "mongoose";

export interface ILead {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  whatsapp?: string;
  source?: string; // instagram, tiktok, blog, direct, referral, etc.
  archetype?: string; // Stored directly for fast queries
  batteryScore?: number; // Stored directly for fast queries
  publicToken?: string;
  resultId: mongoose.Types.ObjectId; // Link to full MentalBatteryResult
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    whatsapp: { type: String, trim: true },
    source: { type: String, default: "direct" },
    archetype: { type: String, required: true },
    batteryScore: { type: Number, required: true },
    publicToken: { type: String, unique: true, sparse: true },
    resultId: { type: Schema.Types.ObjectId, ref: "MentalBatteryResult", required: true },
  },
  { timestamps: true }
);

LeadSchema.index({ email: 1 });
LeadSchema.index({ createdAt: -1 });

export const LeadModel = models.Lead || model<ILead>("Lead", LeadSchema);
