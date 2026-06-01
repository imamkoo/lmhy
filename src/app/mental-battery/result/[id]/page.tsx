"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ARCHETYPES, type ArchetypeId } from "@/data/mental-battery/archetypes";
import {
  SEVERITY_LABELS,
  BATTERY_STATUS_LABELS,
  type SeverityLevel,
} from "@/lib/mental-battery-constants";

interface ResultData {
  id: string;
  publicToken: string;
  batteryPercentage: number;
  batteryStatus: keyof typeof BATTERY_STATUS_LABELS;
  archetypeId: ArchetypeId;
  subMetrics: {
    stressLevel: SeverityLevel;
    recoveryScore: SeverityLevel;
    focusCapacity: SeverityLevel;
    emotionalLoad: SeverityLevel;
  };
  rawScores: {
    phq9Total: number;
    gad7Total: number;
    dass21Depression: number;
    dass21Anxiety: number;
    dass21Stress: number;
  };
  aiSummary: string | null;
  isHighRisk: boolean;
  completedAt: string;
}

export default function MentalBatteryResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const token = searchParams.get("token") || "";

  const [result, setResult] = useState<(ResultData & { archetype?: any }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Token akses tidak valid.");
      setLoading(false);
      return;
    }

    fetch(`/api/mental-battery/results/${id}?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setResult(d);
      })
      .catch(() => setError("Gagal memuat hasil."))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="text-4xl mb-4 animate-bounce">⚡</div>
        <p className="text-xl font-bold" style={{ color: "var(--black-90)" }}>
          Memuat Hasil...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-indigo-600 underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const { batteryPercentage, batteryStatus, subMetrics, archetype } = result;

  const dataForDisplay = { ...result, batteryPercentage, batteryStatus, subMetrics, archetype };
  const batteryLabel = BATTERY_STATUS_LABELS[dataForDisplay.batteryStatus as keyof typeof BATTERY_STATUS_LABELS];
  const completedDate = new Date(dataForDisplay.completedAt).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subMetricItems = [
    {
      label: "Stress Level",
      value: result.subMetrics.stressLevel,
      desc: "Tingkat tekanan yang dirasakan",
    },
    {
      label: "Recovery Score",
      value: result.subMetrics.recoveryScore,
      desc: "Kemampuan menikmati hidup",
    },
    {
      label: "Focus Capacity",
      value: result.subMetrics.focusCapacity,
      desc: "Gangguan pada konsentrasi",
    },
    {
      label: "Emotional Load",
      value: result.subMetrics.emotionalLoad,
      desc: "Beban emosional keseluruhan",
    },
  ];

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/mental-battery/result/${id}?token=${result.publicToken}`;
  const waText = encodeURIComponent(
    `Saya baru saja cek Mental Battery di Let Me Hear You!\n\nSkor saya: ${result.batteryPercentage}% (Archetype: ${archetype?.name}).\n\nCek kondisi mentalmu di sini:\nhttps://mentalbattery.lmhy.id`
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FFFDF8", color: "#1E293B" }}>
      {/* Simple Header */}
      <header className="py-6 px-4 max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/LMHY.png" alt="Let Me Hear You" className="w-10 h-10" />
          <span className="font-bold text-indigo-900 tracking-tight text-lg">Let Me Hear You</span>
        </Link>
        <Link href="/mental-battery" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
          Ambil Assessment Lagi
        </Link>
      </header>

      <main className="px-4 pb-20">
        <div className="mx-auto max-w-2xl space-y-6 mt-8">
          {/* Share Card UI */}
      {archetype && (
        <div className="lmhy-card p-6 border-2" style={{ borderColor: archetype.accentColor || "var(--border-color-1)" }}>
          <h2 className="text-center font-bold text-lg mb-4">✨ Share Hasilmu!</h2>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative aspect-[1200/630] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`/api/og/battery-card?archetype=${result.archetypeId}&score=${result.batteryPercentage}&stress=${result.subMetrics.stressLevel}&recovery=${result.subMetrics.recoveryScore}&focus=${result.subMetrics.focusCapacity}&emotional=${result.subMetrics.emotionalLoad}`}
              alt="Mental Battery Share Card"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center py-3 rounded-xl font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              Bagikan ke WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* High Risk Alert */}
      {result.isHighRisk && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 text-sm text-red-900 dark:border-red-600 dark:bg-red-950/30 dark:text-red-100">
          <strong>⚠️ Perhatian:</strong> Hasil assessment menunjukkan kondisi
          yang perlu perhatian segera. Jika kamu merasa tidak aman, segera
          kunjungi halaman{" "}
          <Link href="/emergency" className="underline font-bold">
            Bantuan Darurat
          </Link>{" "}
          atau hubungi 119 ext 8.
        </div>
      )}

      {/* Battery Card */}
      <div className="lmhy-card p-6 text-center">
        <p className="text-sm" style={{ color: "var(--black-70)" }}>
          ⚡ Laporan Detail
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--black-70)" }}>
          {completedDate}
        </p>

        {/* Battery Percentage */}
        <div className="mt-6">
          <span
            className="text-6xl font-bold"
            style={{ color: "var(--black-90)" }}
          >
            {result.batteryPercentage}%
          </span>
          <div className="mt-3 mx-auto max-w-xs">
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ background: "var(--border-color-1)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${result.batteryPercentage}%`,
                  background:
                    result.batteryPercentage >= 60
                      ? "#22c55e"
                      : result.batteryPercentage >= 40
                        ? "#eab308"
                        : result.batteryPercentage >= 20
                          ? "#f97316"
                          : "#ef4444",
                }}
              />
            </div>
          </div>
          <p className={`mt-2 font-semibold ${batteryLabel.color}`}>
            {batteryLabel.label}
          </p>
        </div>
      </div>

      {/* Sub Metrics */}
      <div className="lmhy-card p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--black-90)" }}>
          📊 Sub-Metrik
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {subMetricItems.map((item) => {
            const severity = SEVERITY_LABELS[item.value];
            return (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{
                  background: "var(--body-bg-color)",
                  border: "1px solid var(--border-color-1)",
                }}
              >
                <p className="text-xs" style={{ color: "var(--black-70)" }}>
                  {item.label}
                </p>
                <p className={`mt-1 font-semibold ${severity.color}`}>
                  {severity.emoji} {severity.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--black-70)" }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archetype Card */}
      {archetype && (
        <div
          className={`rounded-2xl bg-gradient-to-br ${archetype.gradient} p-6 text-white flex flex-col items-center text-center`}
        >
          {archetype.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={archetype.imageUrl.replace(/^\/uploads\//, "/api/uploads/")} alt={archetype.name} className="w-24 h-24 mb-4 object-cover rounded-xl shadow-sm bg-white/10" />
          ) : (
            <div className="w-24 h-24 mb-4 rounded-xl bg-white/10 shadow-inner flex items-center justify-center text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <h2 className="text-2xl font-bold">{archetype.name}</h2>
          <p className="mt-1 text-sm opacity-90 italic">"{archetype.tagline}"</p>
          <p className="mt-4 text-sm opacity-90 leading-relaxed">
            {archetype.description}
          </p>

          {/* Signals */}
          <div className="mt-4 flex flex-wrap gap-2">
            {archetype.signals.map((s: string) => (
              <span
                key={s}
                className="rounded-full bg-white/20 px-3 py-1 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Scores (collapsible — untuk psikolog / advanced user) */}
      <details className="lmhy-card p-6">
        <summary
          className="text-sm font-medium cursor-pointer"
          style={{ color: "var(--black-90)" }}
        >
          📋 Detail Skor Instrumen (untuk tenaga profesional)
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: "var(--black-70)" }}>PHQ-9</p>
            <p className="font-semibold" style={{ color: "var(--black-90)" }}>
              {result.rawScores.phq9Total} / 27
            </p>
          </div>
          <div>
            <p style={{ color: "var(--black-70)" }}>GAD-7</p>
            <p className="font-semibold" style={{ color: "var(--black-90)" }}>
              {result.rawScores.gad7Total} / 21
            </p>
          </div>
          <div>
            <p style={{ color: "var(--black-70)" }}>DASS-21 Depresi</p>
            <p className="font-semibold" style={{ color: "var(--black-90)" }}>
              {result.rawScores.dass21Depression} / 21
            </p>
          </div>
          <div>
            <p style={{ color: "var(--black-70)" }}>DASS-21 Kecemasan</p>
            <p className="font-semibold" style={{ color: "var(--black-90)" }}>
              {result.rawScores.dass21Anxiety} / 21
            </p>
          </div>
          <div>
            <p style={{ color: "var(--black-70)" }}>DASS-21 Stres</p>
            <p className="font-semibold" style={{ color: "var(--black-90)" }}>
              {result.rawScores.dass21Stress} / 21
            </p>
          </div>
        </div>
      </details>

        </div>
      </main>
    </div>
  );
}
