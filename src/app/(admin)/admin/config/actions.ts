"use server";

import { connectDB } from "@/lib/db";
import { MentalBatteryConfigModel } from "@/models/MentalBatteryConfig";
import { revalidatePath } from "next/cache";

export async function updateConfig(formData: FormData) {
  await connectDB();
  
  const thresholds = {
    depression: {
      mild: Number(formData.get("d_mild")),
      moderate: Number(formData.get("d_moderate")),
      severe: Number(formData.get("d_severe")),
      extremely_severe: Number(formData.get("d_extremely_severe")),
    },
    anxiety: {
      mild: Number(formData.get("a_mild")),
      moderate: Number(formData.get("a_moderate")),
      severe: Number(formData.get("a_severe")),
      extremely_severe: Number(formData.get("a_extremely_severe")),
    },
    stress: {
      mild: Number(formData.get("s_mild")),
      moderate: Number(formData.get("s_moderate")),
      severe: Number(formData.get("s_severe")),
      extremely_severe: Number(formData.get("s_extremely_severe")),
    }
  };

  const weights = {
    phq9: Number(formData.get("w_phq9")),
    gad7: Number(formData.get("w_gad7")),
    dass_depression: Number(formData.get("w_dass_depression")),
    dass_anxiety: Number(formData.get("w_dass_anxiety")),
    dass_stress: Number(formData.get("w_dass_stress")),
  };

  let config = await MentalBatteryConfigModel.findOne();
  if (!config) {
    config = new MentalBatteryConfigModel();
  }
  
  config.thresholds = thresholds;
  config.weights = weights;
  
  await config.save();
  revalidatePath("/admin/config");
}
