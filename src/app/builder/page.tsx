import { Metadata } from "next";
import { WebBuilderClient } from "./WebBuilderClient";

export const metadata: Metadata = {
  title: "Studio Web Builder Refleksi — Let Me Hear You",
  description: "Rancang dan terbitkan ruang publikasi refleksi digital Anda secara live dengan sertifikat resmi Web3 Litera.",
};

export default async function WebBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const { username } = await searchParams;

  return (
    <main className="min-h-screen bg-[#F5E7C6] text-[#3F3766] selection:bg-[#F7ABC5] selection:text-[#3F3766]">
      <WebBuilderClient initialUsername={username} />
    </main>
  );
}
