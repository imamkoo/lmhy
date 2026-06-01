"use server";

import { connectDB } from "@/lib/db";
import { DynamicArchetypeModel } from "@/models/DynamicArchetype";
import { revalidatePath } from "next/cache";

export async function createArchetype(formData: FormData) {
  await connectDB();
  
  const signals = formData.get("signals")?.toString().split(",").map(s => s.trim()).filter(Boolean) || [];

  await DynamicArchetypeModel.create({
    archetypeId: formData.get("archetypeId"),
    name: formData.get("name"),
    emoji: formData.get("emoji") || "",
    imageUrl: formData.get("imageUrl") || "",
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    gradient: formData.get("gradient") || "from-slate-800 to-slate-900",
    accentColor: formData.get("accentColor") || "#334155",
    signals,
  });

  revalidatePath("/admin/archetypes");
}

export async function updateArchetype(id: string, formData: FormData) {
  await connectDB();
  
  const signals = formData.get("signals")?.toString().split(",").map(s => s.trim()).filter(Boolean) || [];

  const updateData = {
    archetypeId: formData.get("archetypeId"),
    name: formData.get("name"),
    emoji: formData.get("emoji") || "",
    imageUrl: formData.get("imageUrl") || "",
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    gradient: formData.get("gradient"),
    accentColor: formData.get("accentColor"),
    signals,
  };

  console.log("Updating archetype", id, updateData);

  await DynamicArchetypeModel.findByIdAndUpdate(id, updateData, { strict: false });

  revalidatePath("/admin/archetypes");
}

export async function deleteArchetype(id: string) {
  await connectDB();
  await DynamicArchetypeModel.findByIdAndDelete(id);
  revalidatePath("/admin/archetypes");
}
