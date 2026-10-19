import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";

type ProfileSummary = Pick<
  Tables<"profiles">,
  "username" | "display_name" | "creator_role" | "service_track" | "verification_status"
>;

export default function AccountOverview({
  profile,
  application,
}: {
  profile: ProfileSummary | null;
  application: Tables<"provider_applications"> | null;
}) {
  if (!profile) return <p>Profil Anda belum tersedia.</p>;

  const roleLabel = {
    PENULIS: "Penulis",
    PENDAMPING: "Pendamping Sebaya",
    PRAKTISI: "Praktisi",
  }[profile.creator_role];

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-2xl font-bold text-[#3C3163]">
        Ringkasan akun
      </h2>
      <dl className="mt-5 space-y-4 text-sm">
        <div><dt className="text-slate-500">Nama</dt><dd>{profile.display_name}</dd></div>
        <div><dt className="text-slate-500">Username</dt><dd><Link className="text-[#3C3163] underline" href={`/${profile.username}`}>@{profile.username}</Link></dd></div>
        <div><dt className="text-slate-500">Peran</dt><dd>{roleLabel} {profile.verification_status === "APPROVED" && <span className="ml-2 rounded-full bg-[hsl(42,73%,74%)] px-2 py-1 text-xs">Terverifikasi</span>}</dd></div>
        <div><dt className="text-slate-500">Status pengajuan</dt><dd>{application ? application.status : "Belum ada pengajuan"}</dd></div>
      </dl>
      {profile.creator_role === "PENULIS" && (
        <Link className="mt-6 inline-flex rounded-full bg-[#3C3163] px-4 py-3 text-sm font-semibold text-white" href="/mitra/pendamping">
          Ajukan Jadi Pendamping Sebaya
        </Link>
      )}
    </section>
  );
}
