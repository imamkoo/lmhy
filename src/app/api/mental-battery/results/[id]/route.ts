import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!id || !token) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 400 });
    }

    await connectDB();
    const result = await MentalBatteryResultModel.findOne({
      _id: id,
      publicToken: token,
    }).lean();

    if (!result) {
      return NextResponse.json({ error: "Hasil tidak ditemukan" }, { status: 404 });
    }

    // Fetch the dynamic archetype
    const { DynamicArchetypeModel } = await import("@/models/DynamicArchetype");
    const archetype = await DynamicArchetypeModel.findOne({ archetypeId: result.archetypeId }).lean();

    return NextResponse.json({
      id: result._id.toString(),
      publicToken: result.publicToken,
      batteryPercentage: result.batteryPercentage,
      batteryStatus: result.batteryStatus,
      subMetrics: result.subMetrics,
      archetypeId: result.archetypeId,
      archetype: archetype || null,
      rawScores: result.rawScores,
      isHighRisk: result.isHighRisk,
      completedAt: result.completedAt,
    });
  } catch (error) {
    console.error("Fetch result error:", error);
    return NextResponse.json({ error: "Gagal memuat hasil" }, { status: 500 });
  }
}
