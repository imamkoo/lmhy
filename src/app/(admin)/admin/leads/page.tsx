import { connectDB } from "@/lib/db";
import { LeadModel } from "@/models/Lead";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await connectDB();

  const leads = await LeadModel.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leads</h1>
        <p className="text-slate-500 mt-1">Daftar pengguna yang telah menyelesaikan assessment dan mengisi form claim.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[200px] font-semibold text-slate-700">Nama</TableHead>
              <TableHead className="font-semibold text-slate-700">Kontak</TableHead>
              <TableHead className="font-semibold text-slate-700">Skor</TableHead>
              <TableHead className="font-semibold text-slate-700">Archetype</TableHead>
              <TableHead className="font-semibold text-slate-700">Source</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Tanggal</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  Belum ada leads masuk.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead: any) => (
                <TableRow key={lead._id.toString()}>
                  <TableCell className="font-medium text-slate-900">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">{lead.email}</span>
                      {lead.whatsapp && (
                        <span className="text-xs text-slate-500">WA: {lead.whatsapp}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      lead.batteryScore >= 60 ? "bg-green-50 text-green-700" :
                      lead.batteryScore >= 40 ? "bg-yellow-50 text-yellow-700" :
                      lead.batteryScore >= 20 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                    }`}>
                      {lead.batteryScore}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-700">
                      {lead.archetype}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{lead.source}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/mental-battery/result/${lead.resultId.toString()}?token=${lead.publicToken}`}
                      target="_blank"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Lihat Hasil
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
