import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await connectDB();

    const results = await MentalBatteryResultModel.find({
      userId: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ completedAt: -1 })
      .limit(20)
      .select(
        "batteryPercentage batteryStatus archetypeId subMetrics isHighRisk completedAt"
      )
      .lean();

    return NextResponse.json({
      results: results.map((r) => ({
        id: r._id.toString(),
        batteryPercentage: r.batteryPercentage,
        batteryStatus: r.batteryStatus,
        archetypeId: r.archetypeId,
        subMetrics: r.subMetrics,
        isHighRisk: r.isHighRisk,
        completedAt: r.completedAt,
      })),
    });
  } catch (err) {
    console.error("[mental-battery/history]", err);
    return NextResponse.json(
      { error: "Gagal memuat riwayat." },
      { status: 500 }
    );
  }
}
