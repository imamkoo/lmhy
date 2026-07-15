"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ARCHETYPES, type ArchetypeId } from "@/data/mental-battery/archetypes";
import { BATTERY_STATUS_LABELS } from "@/lib/mental-battery-constants";

interface HistoryItem {
  id: string;
  publicToken: string;
  batteryPercentage: number;
  batteryStatus: keyof typeof BATTERY_STATUS_LABELS;
  archetypeId: ArchetypeId;
  completedAt: string;
}

export default function MentalBatteryHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mental-battery/history")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setItems(d.results ?? []);
      })
      .catch(() => setError("Gagal memuat riwayat."))
      .finally(() => setLoading(false));
  }, []);

  const getBatteryBarColor = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 60) return "bg-indigo-500";
    if (pct >= 40) return "bg-amber-500";
    if (pct >= 20) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <main className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-2xl space-y-6 mt-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">📊 Riwayat Assessment</h1>
          <p className="mt-1 text-sm text-slate-500">
            Semua hasil Mental Battery Checkup yang pernah kamu lakukan.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="text-5xl mb-4">⚡</div>
            <p className="font-bold text-lg text-slate-800">
              Belum ada riwayat assessment
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Mulai Mental Battery Checkup pertamamu untuk melihat hasilnya di sini.
            </p>
            <Link
              href="/mental-battery/quiz"
              className="inline-block mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Mulai Assessment
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => {
              const archetype = ARCHETYPES[item.archetypeId];
              const status = BATTERY_STATUS_LABELS[item.batteryStatus];
              const date = new Date(item.completedAt).toLocaleDateString(
                "id-ID",
                {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <Link
                  key={item.id}
                  href={`/mental-battery/result/${item.id}?token=${item.publicToken}`}
                  className="bg-white block p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{archetype?.emoji ?? "⚡"}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {archetype?.name ?? item.archetypeId}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-800">
                        {item.batteryPercentage}%
                      </p>
                      <p className={`text-xs font-bold ${status.color}`}>
                        {status.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBatteryBarColor(item.batteryPercentage)}`}
                      style={{ width: `${item.batteryPercentage}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center pt-4">
          <Link href="/mental-battery/quiz" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            🔄 Assessment Baru
          </Link>
        </div>
      </div>
    </main>
  );
}
