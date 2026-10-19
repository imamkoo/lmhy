import { fetchOverviewMetrics } from "@/lib/mitra/metrics";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const metrics = await fetchOverviewMetrics();
  const totalStatuses = Object.values(metrics.statusCounts).reduce((sum, value) => sum + value, 0);
  const cards = [
    ["Pendamping terverifikasi", metrics.totalPendamping],
    ["Praktisi terverifikasi", metrics.totalPraktisi],
    ["Pengajuan menunggu", metrics.pendingTotal],
    ["Diproses 30 hari", `${metrics.decided30d.approved} disetujui · ${metrics.decided30d.rejected} ditolak · ${metrics.decided30d.expired} kedaluwarsa`],
    ["Median review", metrics.medianReviewHours === null ? "—" : `${metrics.medianReviewHours.toFixed(1)} jam`],
  ] as const;
  return (
    <div>
      <h1 className="text-3xl font-bold">Ringkasan</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-black/[0.06] bg-white p-5"><p className="text-sm opacity-70">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
      </div>
      <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5">
        <h2 className="font-bold">Distribusi status verifikasi</h2>
        <div className="mt-4 space-y-3">{Object.entries(metrics.statusCounts).map(([status, count]) => <div key={status}><div className="flex justify-between text-sm"><span>{status}</span><span>{count}</span></div><div className="mt-1 h-2 rounded-full bg-[#FBF8F5]"><div className="h-2 rounded-full bg-[hsl(257,68%,73%)]" style={{ width: `${totalStatuses ? count / totalStatuses * 100 : 0}%` }} /></div></div>)}</div>
        <p className="mt-5 text-sm opacity-70">Menunggu: {metrics.pendingByTrack.SEBAYA} Sebaya · {metrics.pendingByTrack.KLINIS} Klinis</p>
      </section>
    </div>
  );
}
