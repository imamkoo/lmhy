import { connectDB } from "@/lib/db";
import { MentalBatteryInstrumentModel } from "@/models/MentalBatteryInstrument";
import QuizClient from "./QuizClient";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  await connectDB();
  // Fetch instruments that are NOT archived, sorted so PHQ-9 is first, then GAD-7, then DASS-21
  const rawInstruments = await MentalBatteryInstrumentModel.find({ status: { $ne: "ARCHIVED" } }).lean();
  
  // Sort based on known order
  const order = { "phq-9": 1, "gad-7": 2, "dass-21": 3 };
  rawInstruments.sort((a, b) => (order[a.instrumentId as keyof typeof order] || 99) - (order[b.instrumentId as keyof typeof order] || 99));

  // Serialize for client component
  const instruments = rawInstruments.map(i => ({
    instrumentId: i.instrumentId,
    title: i.title,
    instruction: i.instruction,
    scaleLabels: i.scaleLabels,
    questions: i.questions.map((q: { id: string; text: string; subscale?: string }) => ({
      id: q.id,
      text: q.text,
      subscale: q.subscale
    }))
  }));

  // Calculate total questions
  const totalQuestions = instruments.reduce((sum, inst) => sum + inst.questions.length, 0);

  return <QuizClient instruments={instruments} totalQuestions={totalQuestions} />;
}
