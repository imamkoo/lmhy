import mongoose, { Schema, models, model } from "mongoose";

export interface IActivityEntry {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  name: string;
  description?: string;
  durationMinutes: number;
  loggedAt: Date;
  createdAt: Date;
}

const ActivityEntrySchema = new Schema<IActivityEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, maxlength: 1000 },
    durationMinutes: { type: Number, required: true, min: 1 },
    loggedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

ActivityEntrySchema.index({ userId: 1, loggedAt: -1 });

export const ActivityEntry =
  models.ActivityEntry ||
  model<IActivityEntry>("ActivityEntry", ActivityEntrySchema);
