import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { calculateMentalBattery } from "@/lib/mental-battery";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

function validateAnswerArray(arr: unknown, expectedLength: number, label: string): number[] {
  if (!Array.isArray(arr)) {
    throw new Error(`${label}: harus berupa array.`);
  }
  if (arr.length !== expectedLength) {
    throw new Error(`${label}: harus memiliki ${expectedLength} jawaban, diterima ${arr.length}.`);
  }
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 3) {
      throw new Error(`${label} item ${i + 1}: harus integer 0-3, diterima '${val}'.`);
    }
  }
  return arr as number[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let phq9: number[];
    let gad7: number[];
    let dass21: number[];

    try {
      phq9 = validateAnswerArray(body.phq9, 9, "PHQ-9");
      gad7 = validateAnswerArray(body.gad7, 7, "GAD-7");
      dass21 = validateAnswerArray(body.dass21, 21, "DASS-21");
    } catch (validationError: any) {
      return NextResponse.json({ error: validationError.message }, { status: 400 });
    }

    await connectDB();

    const session = await getSession().catch(() => null);

    let previousBattery: number | undefined;
    if (session?.userId) {
      const mongoose = await import("mongoose");
      const lastResult = await MentalBatteryResultModel.findOne({
        userId: new mongoose.default.Types.ObjectId(session.userId),
      })
        .sort({ completedAt: -1 })
        .select("batteryPercentage")
        .lean();

      if (lastResult) {
        previousBattery = lastResult.batteryPercentage;
      }
    }

    const resultData = await calculateMentalBattery(phq9, gad7, dass21, previousBattery);

    const publicToken = crypto.randomBytes(16).toString("hex");

    const newResult = await MentalBatteryResultModel.create({
      ...(session?.userId ? { userId: session.userId } : {}),
      publicToken,
      answers: { phq9, gad7, dass21 },
      rawScores: resultData.rawScores,
      batteryPercentage: resultData.batteryPercentage,
      batteryStatus: resultData.batteryStatus,
      subMetrics: resultData.subMetrics,
      archetypeId: resultData.archetypeId,
      isHighRisk: resultData.batteryStatus === "critical" || resultData.rawScores.phq9Total >= 15,
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
