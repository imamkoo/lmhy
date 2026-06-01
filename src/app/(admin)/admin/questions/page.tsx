import { connectDB } from "@/lib/db";
import { MentalBatteryInstrumentModel } from "@/models/MentalBatteryInstrument";
import QuestionsClient from "./QuestionsClient";

export default async function AdminQuestionsPage() {
  await connectDB();
  // Fetch instruments, sort by instrumentId (e.g. dass-21, gad-7, phq-9)
  const rawInstruments = await MentalBatteryInstrumentModel.find().sort({ instrumentId: 1 }).lean();
  
  // Serialize for client component
  const instruments = rawInstruments.map(i => ({
    ...i,
    _id: i._id.toString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Questions & Instruments</h1>
        <p className="text-slate-500 mt-1">Kelola instrumen psikologis, status publikasi, dan draf versi Anda.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
        <p className="font-semibold mb-1">🛡️ Clinical Governance Mode Active</p>
        <p>Instrumen terkunci (Locked) secara bawaan untuk mencegah perubahan tak sengaja yang dapat merusak validitas psikometrik. Buka kunci (Unlock) hanya jika Anda mendapat persetujuan dari tim Psikolog klinis.</p>
      </div>

      <QuestionsClient initialInstruments={instruments} />
    </div>
  );
}
