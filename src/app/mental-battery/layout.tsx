import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Mental Battery Checkup | Let Me Hear You",
  description: "Kenali Mental Battery-mu Hari Ini. Hanya butuh beberapa menit untuk mengecek tingkat stres, fokus, dan beban emosimu.",
};

export default function MentalBatteryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans antialiased selection:bg-indigo-100" style={{ background: "#FFFDF8", color: "#1E293B" }}>
      {/* Shared Header */}
      <header className="py-4 md:py-6 px-4 max-w-5xl mx-auto flex justify-between items-center border-b border-indigo-50/50">
        <Link href="/" className="flex items-center gap-2 select-none">
          <Image src="/assets/LMHY.png" alt="Let Me Hear You" width={40} height={40} className="w-10 h-10 object-contain hover:rotate-12 transition-transform duration-300" />
          <span className="font-bold text-indigo-900 tracking-tight text-lg">Let Me Hear You</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/mental-battery/history" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
            Riwayat
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
            Beranda
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
