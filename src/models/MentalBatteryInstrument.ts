import mongoose, { Schema, models, model } from "mongoose";

export interface IQuestionItem {
  id: string;
  text: string;
  subscale?: "depression" | "anxiety" | "stress";
}

export interface IMentalBatteryInstrument {
  _id: mongoose.Types.ObjectId;
  instrumentId: string; // 'phq-9', 'gad-7', 'dass-21'
  title: string;
  instruction: string;
  scaleLabels: string[];
  questions: IQuestionItem[];
  
  // Governance & Versioning
  editable: boolean;
  version: number;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

const QuestionItemSchema = new Schema<IQuestionItem>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    subscale: { type: String, enum: ["depression", "anxiety", "stress"], required: false },
  },
  { _id: false }
);

const MentalBatteryInstrumentSchema = new Schema<IMentalBatteryInstrument>(
  {
    instrumentId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    scaleLabels: { type: [String], required: true },
    questions: { type: [QuestionItemSchema], required: true },
    // Governance
    editable: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    updatedBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

export const MentalBatteryInstrumentModel =
  models.MentalBatteryInstrument ||
  model<IMentalBatteryInstrument>("MentalBatteryInstrument", MentalBatteryInstrumentSchema);
