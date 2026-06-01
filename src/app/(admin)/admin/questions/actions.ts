"use server";

import { connectDB } from "@/lib/db";
import { MentalBatteryInstrumentModel, IMentalBatteryInstrument } from "@/models/MentalBatteryInstrument";
import { revalidatePath } from "next/cache";

export async function toggleInstrumentLock(id: string, locked: boolean) {
  await connectDB();
  const inst = await MentalBatteryInstrumentModel.findById(id);
  if (!inst) throw new Error("Instrument not found");

  inst.editable = !locked;
  inst.updatedBy = "admin@lmhy.id"; // Hardcoded for now, should use session
  await inst.save();
  
  revalidatePath("/admin/questions");
}

export async function updateInstrumentContent(id: string, payload: Partial<IMentalBatteryInstrument>) {
  await connectDB();
  const inst = await MentalBatteryInstrumentModel.findById(id);
  if (!inst) throw new Error("Instrument not found");

  if (!inst.editable) {
    throw new Error("Instrument is locked");
  }

  // Increment version
  inst.version = (inst.version || 1) + 1;
  inst.updatedBy = "admin@lmhy.id";
  
  if (payload.title) inst.title = payload.title;
  if (payload.instruction) inst.instruction = payload.instruction;
  if (payload.scaleLabels) inst.scaleLabels = payload.scaleLabels;
  if (payload.questions) inst.questions = payload.questions;

  await inst.save();
  revalidatePath("/admin/questions");
}
