import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";
import { LeadModel } from "@/models/Lead";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resultId, publicToken, name, email, whatsapp, source } = body;

    if (!resultId || !publicToken || !name || !email) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await connectDB();

    // Verify result exists and token matches
    const result = await MentalBatteryResultModel.findOne({
      _id: resultId,
      publicToken,
    });

    if (!result) {
      return NextResponse.json({ error: "Hasil tidak ditemukan atau token tidak valid" }, { status: 404 });
    }

    // Check if result is already claimed
    if (result.leadId) {
      return NextResponse.json({ error: "Hasil ini sudah diklaim" }, { status: 400 });
    }

    // Create lead
    const lead = await LeadModel.create({
      name,
      email,
      whatsapp,
      source: source || "direct",
      archetype: result.archetypeId,
      batteryScore: result.batteryPercentage,
      publicToken,
      resultId: result._id,
    });

    // Update result with leadId
    result.leadId = lead._id;
    await result.save();

    return NextResponse.json({ success: true, leadId: lead._id.toString() });
  } catch (error) {
    console.error("Claim lead error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
