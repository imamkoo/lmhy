import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { seed } from "@/scripts/seed-db";

export async function GET() {
  try {
    await connectDB();
    await seed();
    return NextResponse.json({ success: true, message: "DB Seeded successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
