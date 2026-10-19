import Link from "next/link";
import { fetchOverviewMetrics } from "@/lib/mitra/metrics";
import {
  fetchOverdueApplicationsCount,
  fetchRecentAdminActivity,
  formatAuditActionLabel,
} from "@/lib/mitra/activity";

export const dynamic = "force-dynamic";

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export default async function AdminOverviewPage() {
  const [metrics, overdueCount, recentActivities] = await Promise.all([
    fetchOverviewMetrics(),
    fetchOverdueApplicationsCount(3),
    fetchRecentAdminActivity(10),
  ]);

  const totalStatuses = Object.values(metrics.statusCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const cards = [
    { label: "Pendamping terverifikasi", value: metrics.totalPendamping },
    { label: "Praktisi terverifikasi", value: metrics.totalPraktisi },
    { label: "Pengajuan menunggu", value: metrics.pendingTotal },
    {
      label: "Diproses 30 hari",
      value: `${metrics.decided30d.approved} disetujui · ${metrics.decided30d.rejected} ditolak · ${metrics.decided30d.expired} kedaluwarsa`,
    },
    {
      label: "Median review",
      value:
        metrics.medianReviewHours === null
          ? "—"
          : `${metrics.medianReviewHours.toFixed(1)} jam`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#3C3163]">
          Ringkasan
        </h1>
        <p className="mt-1 text-sm text-black/60">
          Metrik operasional, antrean verifikasi mitra, dan aktivitas audit admin.
        </p>
      </div>

      {/* SLA Alert Banner if overdue applications exist */}
      {overdueCount > 0 && (
        <Link
          href="/admin/verifikasi?status=PENDING&sort=oldest"
          className="group flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:bg-rose-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white shadow-xs">
              {overdueCount}
            </span>
            <div>
              <p className="text-xs font-bold text-rose-900">
                Peringatan SLA: {overdueCount} pengajuan menunggu review lebih dari 3 hari
              </p>
              <p className="text-[11px] text-rose-700">
                Klik untuk membuka antrean terlama dan menyelesaikan verifikasi.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-900 underline group-hover:no-underline">
            Tinjau Sekarang &rarr;
          </span>
        </Link>
      )}

      {/* Main Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs"
          >
            <p className="text-xs font-medium text-black/50">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#3C3163]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Verification Status Distribution */}
        <section className="lg:col-span-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#3C3163]">
            Distribusi Status Verifikasi
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(metrics.statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#3C3163]">{status}</span>
                  <span className="text-black/60">{count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-[#FBF8F5]">
                  <div
                    className="h-2 rounded-full bg-[hsl(257,68%,73%)]"
                    style={{
                      width: `${totalStatuses ? (count / totalStatuses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-black/60 border-t border-black/[0.04] pt-3">
            Menunggu saat ini: <strong>{metrics.pendingByTrack.SEBAYA}</strong> Sebaya ·{" "}
            <strong>{metrics.pendingByTrack.KLINIS}</strong> Klinis
          </p>
        </section>

        {/* 10 Recent Admin Activities */}
        <section className="lg:col-span-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#3C3163]">
            10 Aktivitas Admin Terakhir
          </h2>
          {recentActivities.length === 0 ? (
            <p className="mt-4 text-xs text-black/50">
              Belum ada riwayat aktivitas admin.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 border-b border-black/[0.04] pb-2.5 text-xs last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#3C3163] truncate">
                      {formatAuditActionLabel(act.action)}
                    </p>
                    <p className="text-[11px] text-black/50 truncate">
                      Oleh: {act.actorEmail || act.actorId}
                      {act.note ? ` · "${act.note}"` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-black/40 shrink-0">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
