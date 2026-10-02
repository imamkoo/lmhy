import { Metadata } from "next";
import { WebBuilderClient } from "./WebBuilderClient";

export const metadata: Metadata = {
  title: "Web Builder Refleksi & Subdomain — Let Me Hear You",
  description: "Buat personal blog subdomain refleksi kesehatan mental Anda dengan template siap pakai dan integrasi sertifikat Web3 Litera.",
};

export default async function WebBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const { username } = await searchParams;

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <WebBuilderClient initialUsername={username} />
    </main>
  );
}
