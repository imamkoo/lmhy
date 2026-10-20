import Link from "next/link";
import { redirect } from "next/navigation";
import AccountOverview from "@/components/mitra/AccountOverview";
import ApplicationTimeline from "@/components/mitra/ApplicationTimeline";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/akun");
  const admin = await createAdminClient();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <main className="min-h-screen bg-[#FBF8F5] p-8">
        <p role="alert">Konfigurasi server belum lengkap.</p>
      </main>
    );
  }
  const [{ data: profile }, { data: applications }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "username, display_name, creator_role, service_track, verification_status",
      )
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("provider_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false }),
  ]);
  const { tab } = await searchParams;
  const isApplications = tab === "pengajuan";
  return (
    <main className="min-h-screen bg-[#FBF8F5] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-[#3C3163]">
          Akun saya
        </h1>
        <nav className="mt-6 flex gap-3" aria-label="Navigasi akun">
          <Link
            aria-current={isApplications ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm ${!isApplications ? "bg-[#3C3163] text-white" : "bg-white"}`}
            href="/akun"
          >
            Ringkasan
          </Link>
          <Link
            className={`rounded-full px-4 py-2 text-sm ${isApplications ? "bg-[#3C3163] text-white" : "bg-white"}`}
            href="/akun?tab=pengajuan"
          >
            Pengajuan
          </Link>
        </nav>
        <div className="mt-6">
          {isApplications ? (
            <ApplicationTimeline applications={applications ?? []} />
          ) : (
            <AccountOverview
              profile={profile}
              application={applications?.[0] ?? null}
            />
          )}
        </div>
      </div>
    </main>
  );
}
