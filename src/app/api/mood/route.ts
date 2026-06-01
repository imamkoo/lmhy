import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { moodSchema } from "@/lib/validations";
import { MoodEntry } from "@/models/MoodEntry";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

  try {
    await connectDB();
    const entries = await MoodEntry.find({
      userId: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e._id.toString(),
        score: e.score,
        note: e.note,
        recordedAt: e.recordedAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat mood." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const limited = rateLimit(`mood:${session.userId}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu sering." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = moodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    await connectDB();
    const entry = await MoodEntry.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      score: parsed.data.score,
      note: parsed.data.note,
      recordedAt: new Date(),
    });

    return NextResponse.json({
      entry: {
        id: entry._id.toString(),
        score: entry.score,
        note: entry.note,
        recordedAt: entry.recordedAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan mood." }, { status: 500 });
  }
}
