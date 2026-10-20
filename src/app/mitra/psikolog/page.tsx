import type { Metadata } from "next";
import { isTrackEnabled } from "@/lib/mitra/flags";
import PsikologApplicationForm from "@/components/mitra/PsikologApplicationForm";

export const metadata: Metadata = {
  title: "Daftar sebagai Psikolog | Let Me Hear You",
};
export default function Page() {
  return isTrackEnabled("KLINIS") ? (
    <PsikologApplicationForm />
  ) : (
    <main className="min-h-screen bg-[#FBF8F5] p-8 text-center">
      <h1 className="text-3xl font-bold text-[#3C3163]">Segera hadir</h1>
      <p className="mt-3">Pendaftaran psikolog sedang kami siapkan.</p>
    </main>
  );
}
