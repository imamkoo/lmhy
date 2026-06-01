import mongoose, { Schema, models, model } from "mongoose";

export type InstrumentId = "srq-29" | "dass-21" | "phq-9" | "gad-7";

export interface IAssessmentAttempt {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  instrumentId: InstrumentId;
  answers: number[];
  completedAt: Date;
  createdAt: Date;
}

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    instrumentId: {
      type: String,
      enum: ["srq-29", "dass-21", "phq-9", "gad-7"],
      required: true,
    },
    answers: { type: [Number], required: true },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

AssessmentAttemptSchema.index({ userId: 1, instrumentId: 1, completedAt: -1 });

export const AssessmentAttempt =
  models.AssessmentAttempt ||
  model<IAssessmentAttempt>("AssessmentAttempt", AssessmentAttemptSchema);
