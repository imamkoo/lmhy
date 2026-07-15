"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ArchetypeId, ArchetypeDefinition } from "@/data/mental-battery/archetypes";
import { ARCHETYPE_RECOMMENDATIONS } from "@/data/mental-battery/recommendations";
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

  const [error, setError] = useState<string | null>(!token ? "Token akses tidak valid." : null);
  const [loading, setLoading] = useState(!!token);
  const [result, setResult] = useState<(ResultData & { archetype?: ArchetypeDefinition }) | null>(null);

  useEffect(() => {
    if (!token) {
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
      <div className="mx-auto max-w-xl py-32 text-center">
        <div className="text-5xl mb-4 animate-bounce">⚡</div>
        <p className="text-xl font-bold text-slate-800">
          Memuat Hasil...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-xl py-32 text-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-6">
          <p className="font-semibold">{error || "Hasil tidak ditemukan."}</p>
        </div>
        <Link href="/mental-battery" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition">
          Kembali ke Utama
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
      desc: "Tingkat tekanan dan stres harianmu.",
    },
    {
      label: "Recovery Score",
      value: result.subMetrics.recoveryScore,
      desc: "Kapasitasmu untuk menikmati hidup dan re-charge.",
    },
    {
      label: "Focus Capacity",
      value: result.subMetrics.focusCapacity,
      desc: "Kemampuanmu berkonsentrasi tanpa terganggu kecemasan.",
    },
    {
      label: "Emotional Load",
      value: result.subMetrics.emotionalLoad,
      desc: "Total beban emosional keseluruhan yang sedang dipikul.",
    },
  ];

  const recommendations = ARCHETYPE_RECOMMENDATIONS[result.archetypeId as ArchetypeId] || ARCHETYPE_RECOMMENDATIONS["silent_burnout"];

  const waText = encodeURIComponent(
    `Saya baru saja cek Mental Battery di Let Me Hear You!\n\nSkor saya: ${result.batteryPercentage}% (Archetype: ${archetype?.name}).\n\nCek kondisi mentalmu di sini:\nhttps://mentalbattery.lmhy.id`
  );

  // Determine battery color
  const getBatteryColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (pct >= 60) return "text-indigo-500 bg-indigo-50 border-indigo-200";
    if (pct >= 40) return "text-amber-500 bg-amber-50 border-amber-200";
    if (pct >= 20) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-rose-500 bg-rose-50 border-rose-200";
  };

  const getBatteryProgressColor = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 60) return "bg-indigo-500";
    if (pct >= 40) return "bg-amber-500";
    if (pct >= 20) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <main className="px-4 pb-20 pt-6">
      <div className="mx-auto max-w-2xl space-y-8 mt-4">
        {/* High Risk Alert */}
        {result.isHighRisk && (
          <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-5 text-sm text-rose-900 shadow-sm">
            <strong className="block mb-1 text-rose-950 text-base">⚠️ Perhatian:</strong>
            Hasil assessment menunjukkan kondisi mental yang saat ini membutuhkan perhatian lebih. Jika kamu merasa sangat tertekan, cemas, atau memiliki pikiran melukai diri sendiri, silakan segera kunjungi halaman{" "}
            <Link href="/emergency" className="underline font-bold hover:text-rose-950">
              Bantuan Darurat
            </Link>{" "}
            atau hubungi hotline nasional Kemenkes di 119 ext 8.
          </div>
        )}

        {/* Battery Dashboard */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100" />
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Laporan Mental Battery</span>
          <p className="text-xs text-slate-500 mt-1">{completedDate}</p>

          <div className="mt-8 flex flex-col items-center">
            {/* Battery Circular / Large Indicator */}
            <div className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-inner relative transition-all ${getBatteryColor(result.batteryPercentage)}`}>
              <span className="text-5xl font-black">{result.batteryPercentage}%</span>
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Sisa Daya</span>
            </div>

            {/* Custom Horizontal Battery Meter */}
            <div className="mt-8 w-full max-w-sm">
              <div className="h-6 rounded-full bg-slate-100 border border-slate-200/50 p-1 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getBatteryProgressColor(result.batteryPercentage)}`}
                  style={{ width: `${result.batteryPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                <span>0% KRITIS</span>
                <span>50% SEDANG</span>
                <span>100% SEHAT</span>
              </div>
            </div>

            <h2 className="mt-6 text-2xl font-black text-slate-800 tracking-tight">
              Status Battery: <span className={batteryLabel.color}>{batteryLabel.label}</span>
            </h2>
            <p className="mt-2 text-slate-500 max-w-md text-sm leading-relaxed">
              Persentase ini mewakili keseluruhan ketahanan mentalmu saat ini, dihitung berdasarkan tingkat kecemasan, depresi, dan stres yang kamu laporkan.
            </p>
          </div>
        </div>

        {/* Sub-Metrics Detail */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span>📊</span> Breakdown Sub-Metrik
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subMetricItems.map((item) => {
              const severity = SEVERITY_LABELS[item.value];
              return (
                <div
                  key={item.label}
                  className="rounded-2xl p-4 border border-slate-100 bg-[#FFFDF8]/50 hover:bg-[#FFFDF8] hover:shadow-sm transition-all duration-200"
                >
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{item.label}</p>
                  <p className={`mt-2 text-lg font-bold flex items-center gap-1.5 ${severity.color}`}>
                    <span className="text-xl">{severity.emoji}</span> {severity.label}
                  </p>
                  <p className="text-xs mt-1.5 text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Archetype Profile Card */}
        {archetype && (
          <div className={`rounded-3xl bg-gradient-to-br ${archetype.gradient} p-8 text-white shadow-xl shadow-indigo-900/10 flex flex-col items-center text-center relative overflow-hidden`}>
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            
            {archetype.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={archetype.imageUrl.replace(/^\/uploads\//, "/api/uploads/")} alt={archetype.name} className="w-24 h-24 mb-4 object-cover rounded-2xl shadow-md bg-white/10 border-2 border-white/20" />
            ) : (
              <div className="text-7xl mb-4 animate-pulse">{archetype.emoji}</div>
            )}
            
            <span className="text-[10px] font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full uppercase mb-2">Archetype Profilmu</span>
            <h2 className="text-3xl font-black tracking-tight">{archetype.name}</h2>
            <p className="mt-2 text-base opacity-90 italic font-medium">&ldquo;{archetype.tagline}&rdquo;</p>
            <p className="mt-5 text-sm opacity-90 leading-relaxed max-w-lg">
              {archetype.description}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {archetype.signals.map((s: string) => (
                <span
                  key={s}
                  className="rounded-xl bg-white/20 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations & Action Plan */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            <span>💡</span> Panduan Langkah Tindak Lanjut
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Tips Harian Untukmu</h4>
              <ul className="space-y-2.5">
                {recommendations.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2.5">
                    <span className="text-indigo-500 font-bold">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Langkah Selanjutnya</h4>
              <ul className="space-y-2.5">
                {recommendations.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2.5">
                    <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Afirmasi Hari Ini</h4>
              <p className="text-sm text-slate-600 italic font-medium leading-relaxed">
                &ldquo;{recommendations.affirmation}&rdquo;
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Sumber Bantuan & Informasi</h4>
              <ul className="space-y-2.5">
                {recommendations.resources.map((res, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2.5">
                    <span className="text-slate-400">⚡</span>
                    <span className="font-medium">{res}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Professional Details (Collapsible) */}
        <details className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] group transition-all duration-300">
          <summary className="text-sm font-bold text-slate-800 cursor-pointer list-none flex justify-between items-center">
            <span>📋 Detail Skor Klinis (untuk Tenaga Profesional)</span>
            <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-6 border-t border-slate-100 pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">PHQ-9 (Depresi)</p>
              <p className="text-xl font-bold mt-1 text-slate-800">
                {result.rawScores.phq9Total} <span className="text-xs text-slate-400">/ 27</span>
              </p>
            </div>
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">GAD-7 (Kecemasan)</p>
              <p className="text-xl font-bold mt-1 text-slate-800">
                {result.rawScores.gad7Total} <span className="text-xs text-slate-400">/ 21</span>
              </p>
            </div>
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">DASS-21 Depresi</p>
              <p className="text-xl font-bold mt-1 text-slate-800">
                {result.rawScores.dass21Depression} <span className="text-xs text-slate-400">/ 21</span>
              </p>
            </div>
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">DASS-21 Kecemasan</p>
              <p className="text-xl font-bold mt-1 text-slate-800">
                {result.rawScores.dass21Anxiety} <span className="text-xs text-slate-400">/ 21</span>
              </p>
            </div>
            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">DASS-21 Stres</p>
              <p className="text-xl font-bold mt-1 text-slate-800">
                {result.rawScores.dass21Stress} <span className="text-xs text-slate-400">/ 21</span>
              </p>
            </div>
          </div>
        </details>

        {/* Share Card & CTA (At the bottom) */}
        {archetype && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
            <h3 className="text-base font-bold text-slate-800 text-center">✨ Bagikan Hasilmu!</h3>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative aspect-[1200/630] bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`/api/og/battery-card?archetype=${result.archetypeId}&score=${result.batteryPercentage}&stress=${result.subMetrics.stressLevel}&recovery=${result.subMetrics.recoveryScore}&focus=${result.subMetrics.focusCapacity}&emotional=${result.subMetrics.emotionalLoad}`}
                alt="Mental Battery Share Card"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-3.5 rounded-2xl font-bold text-white transition hover:opacity-95 shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: "#25D366" }}
              >
                <span>💬</span> Bagikan ke WhatsApp
              </a>
              <Link
                href="/mental-battery/quiz"
                className="flex-1 text-center py-3.5 rounded-2xl font-bold border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-2"
              >
                <span>🔄</span> Coba Lagi
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
