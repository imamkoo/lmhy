import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { activitySchema } from "@/lib/validations";
import { ActivityEntry } from "@/models/ActivityEntry";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

  try {
    await connectDB();
    const entries = await ActivityEntry.find({
      userId: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ loggedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e._id.toString(),
        type: e.type,
        name: e.name,
        description: e.description,
        durationMinutes: e.durationMinutes,
        loggedAt: e.loggedAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat aktivitas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const limited = rateLimit(`activity:${session.userId}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu sering." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    await connectDB();
    const entry = await ActivityEntry.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      ...parsed.data,
      loggedAt: new Date(),
    });

    return NextResponse.json({
      entry: {
        id: entry._id.toString(),
        type: entry.type,
        name: entry.name,
        description: entry.description,
        durationMinutes: entry.durationMinutes,
        loggedAt: entry.loggedAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan aktivitas." }, { status: 500 });
  }
}
