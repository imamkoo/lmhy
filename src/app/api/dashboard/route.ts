import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { MoodEntry } from "@/models/MoodEntry";
import { ActivityEntry } from "@/models/ActivityEntry";
import { AssessmentAttempt } from "@/models/AssessmentAttempt";
import { questionnaireList } from "@/data/questionnaires";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);
    const user = await User.findById(userId).select("name");

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [moodEntries, activityCount, assessmentAttempts] = await Promise.all([
      MoodEntry.find({ userId, recordedAt: { $gte: weekAgo } })
        .sort({ recordedAt: -1 })
        .lean(),
      ActivityEntry.countDocuments({ userId, loggedAt: { $gte: weekAgo } }),
      AssessmentAttempt.find({ userId })
        .sort({ completedAt: -1 })
        .lean(),
    ]);

    const moodScores = moodEntries.map((m) => m.score);
    const moodAvg =
      moodScores.length > 0
        ? Math.round(moodScores.reduce((a, b) => a + b, 0) / moodScores.length)
        : null;
    const moodMin = moodScores.length ? Math.min(...moodScores) : null;
    const moodMax = moodScores.length ? Math.max(...moodScores) : null;

    const latestByInstrument = new Map<string, Date>();
    for (const a of assessmentAttempts) {
      if (!latestByInstrument.has(a.instrumentId)) {
        latestByInstrument.set(a.instrumentId, a.completedAt);
      }
    }

    const screeningStatus = questionnaireList.map((q) => ({
      instrumentId: q.id,
      title: q.title,
      completed: latestByInstrument.has(q.id),
      lastCompletedAt: latestByInstrument.get(q.id)?.toISOString() ?? null,
    }));

    const completedCount = screeningStatus.filter((s) => s.completed).length;

    return NextResponse.json({
      greetingName: user?.name ?? "Pengguna",
      today: new Date().toISOString(),
      mood: {
        entriesThisWeek: moodEntries.length,
        average: moodAvg,
        min: moodMin,
        max: moodMax,
        latest: moodEntries[0]
          ? {
              score: moodEntries[0].score,
              recordedAt: moodEntries[0].recordedAt,
            }
          : null,
      },
      activities: { countThisWeek: activityCount },
      screening: {
        completedCount,
        totalInstruments: questionnaireList.length,
        instruments: screeningStatus,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Gagal memuat dasbor." }, { status: 500 });
  }
}
