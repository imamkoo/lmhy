import mongoose, { Schema, models, model } from "mongoose";

export interface IMoodEntry {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  score: number;
  note?: string;
  recordedAt: Date;
  createdAt: Date;
}

const MoodEntrySchema = new Schema<IMoodEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, maxlength: 500 },
    recordedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

MoodEntrySchema.index({ userId: 1, recordedAt: -1 });

export const MoodEntry =
  models.MoodEntry || model<IMoodEntry>("MoodEntry", MoodEntrySchema);
