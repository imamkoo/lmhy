import { connectDB } from "@/lib/db";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";

export default async function AdminResultsPage() {
  await connectDB();

  const results = await MentalBatteryResultModel.find()
    .sort({ completedAt: -1 })
    .limit(100)
    .lean();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assessment Results</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-900">Score</th>
              <th className="px-6 py-4 font-semibold text-slate-900">Archetype</th>
              <th className="px-6 py-4 font-semibold text-slate-900">High Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Belum ada hasil assessment.
                </td>
              </tr>
            )}
            {results.map((r: any) => (
              <tr key={r._id.toString()} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  {new Date(r.completedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{r.batteryPercentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">{r.archetypeId}</td>
                <td className="px-6 py-4">
                  {r.isHighRisk ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
