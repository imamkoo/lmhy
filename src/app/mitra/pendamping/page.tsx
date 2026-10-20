import type { Metadata } from "next";
import { isTrackEnabled } from "@/lib/mitra/flags";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PendampingApplicationForm from "@/components/mitra/PendampingApplicationForm";
export const metadata: Metadata = {
  title: "Daftar sebagai Pendamping Sebaya | Let Me Hear You",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ resubmit?: string }>;
}) {
  if (!isTrackEnabled("SEBAYA"))
    return (
      <main className="min-h-screen bg-[#FBF8F5] p-8 text-center">
        <h1 className="text-3xl font-bold text-[#3C3163]">Segera hadir</h1>
        <p className="mt-3">
          Pendaftaran pendamping sebaya sedang kami siapkan.
        </p>
      </main>
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialValues = {};
  const { resubmit } = await searchParams;
  if (user) {
    const admin = await createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();
    initialValues = {
      applicantName: data?.display_name ?? "",
      applicantEmail: user.email ?? "",
      username: data?.username ?? "",
    };
    if (resubmit) {
      const { data: application } = await admin
        .from("provider_applications")
        .select(
          "applicant_name, whatsapp, domicile_city, domicile_province, username",
        )
        .eq("id", resubmit)
        .eq("user_id", user.id)
        .maybeSingle();
      if (application) {
        initialValues = {
          ...initialValues,
          applicantName: application.applicant_name,
          whatsapp: application.whatsapp,
          domicileCity: application.domicile_city,
          domicileProvince: application.domicile_province,
          username: application.username,
        };
      }
    }
  }
  return (
    <PendampingApplicationForm
      initialValues={initialValues}
      waGroupUrl={process.env.NEXT_PUBLIC_WA_GROUP_URL}
    />
  );
}
