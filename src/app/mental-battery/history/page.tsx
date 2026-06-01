"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ARCHETYPES, type ArchetypeId } from "@/data/mental-battery/archetypes";
import { BATTERY_STATUS_LABELS } from "@/lib/mental-battery-constants";

interface HistoryItem {
  id: string;
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/mental-battery"
          className="text-sm hover:underline"
          style={{ color: "var(--color-brand)" }}
        >
          ← Kembali ke Mental Battery
        </Link>
        <h1 className="mt-3 text-2xl font-bold">📊 Riwayat Assessment</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--black-70)" }}>
          Semua hasil Mental Battery Checkup yang pernah kamu lakukan.
        </p>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: "var(--black-70)" }}>
          Memuat...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <div className="lmhy-card p-8 text-center">
          <p className="text-4xl mb-3">⚡</p>
          <p className="font-medium" style={{ color: "var(--black-90)" }}>
            Belum ada riwayat assessment
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--black-70)" }}>
            Mulai Mental Battery Checkup pertamamu untuk melihat hasilnya di
            sini.
          </p>
          <Link
            href="/mental-battery/quiz"
            className="lmhy-btn inline-block mt-4 px-6 py-2"
          >
            Mulai Assessment
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
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
                href={`/mental-battery/result/${item.id}`}
                className="lmhy-card block p-4 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{archetype?.emoji ?? "⚡"}</span>
                    <div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--black-90)" }}
                      >
                        {archetype?.name ?? item.archetypeId}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--black-70)" }}
                      >
                        {date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xl font-bold"
                      style={{ color: "var(--black-90)" }}
                    >
                      {item.batteryPercentage}%
                    </p>
                    <p className={`text-xs font-medium ${status.color}`}>
                      {status.label}
                    </p>
                  </div>
                </div>

                {/* Mini bar */}
                <div
                  className="mt-3 h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--border-color-1)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.batteryPercentage}%`,
                      background:
                        item.batteryPercentage >= 60
                          ? "#22c55e"
                          : item.batteryPercentage >= 40
                            ? "#eab308"
                            : item.batteryPercentage >= 20
                              ? "#f97316"
                              : "#ef4444",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-2">
        <Link href="/mental-battery/quiz" className="lmhy-btn inline-block px-6 py-2.5">
          🔄 Assessment Baru
        </Link>
      </div>
    </div>
  );
}
