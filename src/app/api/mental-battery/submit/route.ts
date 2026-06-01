import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { calculateMentalBattery } from "@/lib/mental-battery";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phq9, gad7, dass21 } = body;

    if (!Array.isArray(phq9) || !Array.isArray(gad7) || !Array.isArray(dass21)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    await connectDB();

    // Calculate score
    const resultData = await calculateMentalBattery(phq9, gad7, dass21);

    // Create unique token for sharing/claim
    const publicToken = crypto.randomBytes(16).toString("hex");

    // Save result (without Lead/UserId for now, since this is Guest Assessment)
    const newResult = await MentalBatteryResultModel.create({
      publicToken,
      answers: { phq9, gad7, dass21 },
      rawScores: resultData.rawScores,
      batteryPercentage: resultData.batteryPercentage,
      batteryStatus: resultData.batteryStatus,
      subMetrics: resultData.subMetrics,
      archetypeId: resultData.archetypeId,
      isHighRisk: resultData.batteryStatus === "critical" || resultData.rawScores.phq9Total >= 15, // Simple high-risk heuristic
    });

    return NextResponse.json({
      id: newResult._id.toString(),
      publicToken,
      batteryPercentage: resultData.batteryPercentage,
      batteryStatus: resultData.batteryStatus,
      archetypeId: resultData.archetypeId,
      subMetrics: resultData.subMetrics,
      isHighRisk: newResult.isHighRisk,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Gagal memproses data" }, { status: 500 });
  }
}
