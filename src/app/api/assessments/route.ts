import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { assessmentSubmitSchema } from "@/lib/validations";
import { getQuestionnaire } from "@/data/questionnaires";
import { AssessmentAttempt } from "@/models/AssessmentAttempt";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await connectDB();
    const attempts = await AssessmentAttempt.find({
      userId: new mongoose.Types.ObjectId(session.userId),
    })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      attempts: attempts.map((a) => ({
        id: a._id.toString(),
        instrumentId: a.instrumentId,
        answerCount: a.answers.length,
        rawSum: a.answers.reduce((s: number, v: number) => s + v, 0),
        completedAt: a.completedAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat assessment." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const limited = rateLimit(`assessment:${session.userId}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu sering." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = assessmentSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const questionnaire = getQuestionnaire(parsed.data.instrumentId);
    if (!questionnaire) {
      return NextResponse.json({ error: "Instrumen tidak ditemukan." }, { status: 404 });
    }

    if (parsed.data.answers.length !== questionnaire.questions.length) {
      return NextResponse.json(
        {
          error: `Jawaban harus ${questionnaire.questions.length} item.`,
        },
        { status: 400 }
      );
    }

    const maxVal = questionnaire.scaleType === "yes-no" ? 1 : 3;
    if (parsed.data.answers.some((a) => a < 0 || a > maxVal)) {
      return NextResponse.json({ error: "Nilai jawaban tidak valid." }, { status: 400 });
    }

    await connectDB();
    const attempt = await AssessmentAttempt.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      instrumentId: parsed.data.instrumentId,
      answers: parsed.data.answers,
      completedAt: new Date(),
    });

    return NextResponse.json({
      attempt: {
        id: attempt._id.toString(),
        instrumentId: attempt.instrumentId,
        answerCount: attempt.answers.length,
        rawSum: attempt.answers.reduce((s: number, v: number) => s + v, 0),
        completedAt: attempt.completedAt,
      },
      messageId:
        "Jawaban Anda telah disimpan. Ini bukan diagnosis klinis. Konsultasikan dengan tenaga profesional bila perlu.",
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan assessment." }, { status: 500 });
  }
}
