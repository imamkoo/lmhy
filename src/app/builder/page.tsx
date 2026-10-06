import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();
    initialProfile = profile;
  }

  return (
    <main className="min-h-screen bg-[#F5E7C6] text-[#3F3766] selection:bg-[#F7ABC5] selection:text-[#3F3766]">
      <WebBuilderClient
        initialUsername={username || initialProfile?.username}
        initialUser={user}
        initialProfile={initialProfile}
      />
    </main>
  );
}
