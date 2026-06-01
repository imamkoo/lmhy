import { connectDB } from "@/lib/db";
import { LeadModel } from "@/models/Lead";
import { MentalBatteryResultModel } from "@/models/MentalBatteryResult";
import { User } from "@/models/User";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await connectDB();

  const totalLeads = await LeadModel.countDocuments();
  const totalAssessments = await MentalBatteryResultModel.countDocuments();
  const totalUsers = await User.countDocuments();

  // Get recent 5 leads
  const recentLeads = await LeadModel.find().sort({ createdAt: -1 }).limit(5).lean();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview metrik sistem Let Me Hear You.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500">Total Leads Acquired</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500">Total Assessments</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{totalAssessments}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500">Registered Users</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{totalUsers}</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Leads Terbaru</h2>
          <Link href="/admin/leads" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Lihat Semua &rarr;
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {recentLeads.length === 0 ? (
             <div className="p-8 text-center text-slate-500">Belum ada data.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLeads.map((lead: any) => (
                <div key={lead._id.toString()} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-sm text-slate-500">{lead.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">{lead.archetype}</p>
                    <p className="text-xs text-slate-400">Score: {lead.batteryScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
