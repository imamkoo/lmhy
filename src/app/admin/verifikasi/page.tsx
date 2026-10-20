import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import {
  computeAgeHours,
  computeRedFlags,
  needsAction,
  type QueueItem,
} from "@/lib/mitra/queue";
import { QueueFilters } from "@/components/admin/QueueFilters";
import { VerificationQueue } from "@/components/admin/VerificationQueue";
import type {
  ApplicationData,
  DocumentItem,
} from "@/components/admin/VerificationDetail";

export const dynamic = "force-dynamic";

interface AdminVerifikasiPageProps {
  searchParams: Promise<{
    track?: string;
    status?: string;
    sort?: string;
    q?: string;
    selected?: string;
  }>;
}

export default async function AdminVerifikasiPage({
  searchParams,
}: AdminVerifikasiPageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const params = await searchParams;
  const currentTrack = params.track || "";
  const currentStatus = params.status || "PENDING";
  const currentSort = params.sort || "newest";
  const currentQuery = params.q || "";
  const selectedId = params.selected;

  const supabase = await createAdminClient();

  let query = supabase.from("provider_applications").select("*");

  if (currentStatus !== "ALL") {
    query = query.eq(
      "status",
      currentStatus as Tables<"provider_applications">["status"]
    );
  }

  if (currentTrack === "SEBAYA" || currentTrack === "KLINIS") {
    query = query.eq("track", currentTrack);
  }

  if (currentQuery.trim()) {
    const qClean = currentQuery.trim().replace(/[%_]/g, "");
    query = query.or(
      `applicant_name.ilike.%${qClean}%,applicant_email.ilike.%${qClean}%,username.ilike.%${qClean}%`
    );
  }

  query = query.order("applied_at", {
    ascending: currentSort === "oldest",
  });

  const { data: applications } = await query;
  const appList = applications || [];

  // Fetch document counts for these applications
  const appIds = appList.map((a) => a.id);
  const docCounts: Record<string, number> = {};
  if (appIds.length > 0) {
    const { data: docs } = await supabase
      .from("provider_documents")
      .select("application_id")
      .in("application_id", appIds);

    if (docs) {
      for (const d of docs) {
        docCounts[d.application_id] = (docCounts[d.application_id] || 0) + 1;
      }
    }
  }

  const now = new Date();
  const queueItems: QueueItem[] = appList.map((app) => {
    const docCount = docCounts[app.id] ?? 0;
    const details = {
      ...((app.details as Record<string, unknown>) || {}),
      document_count: docCount,
    };
    const redFlags = computeRedFlags({
      track: app.track,
      email_verified_at: app.email_verified_at,
      wa_joined_confirmed_at: app.wa_joined_confirmed_at,
      pfa_status: app.pfa_status,
      details,
    });
    const ageHours = computeAgeHours(app.applied_at, now);
    const itemNeedsAction = needsAction(
      {
        applied_at: app.applied_at,
        email_verified_at: app.email_verified_at,
      },
      now
    );

    return {
      id: app.id,
      applicant_name: app.applicant_name,
      applicant_email: app.applicant_email,
      username: app.username,
      track: app.track,
      status: app.status,
      applied_at: app.applied_at,
      email_verified_at: app.email_verified_at,
      wa_joined_confirmed_at: app.wa_joined_confirmed_at,
      pfa_status: app.pfa_status,
      details,
      redFlags,
      ageHours,
      needsAction: itemNeedsAction,
    };
  });

  // Pre-load detail and documents for the first item or selected item
  let initialSelectedApplication: ApplicationData | null = null;
  let initialDocuments: DocumentItem[] = [];

  const targetAppId = selectedId || queueItems[0]?.id;
  if (targetAppId) {
    const foundApp = appList.find((a) => a.id === targetAppId) || null;
    if (foundApp) {
      initialSelectedApplication = foundApp as unknown as ApplicationData;
      const { data: docs } = await supabase
        .from("provider_documents")
        .select("id, doc_type, uploaded_at, original_filename, size_bytes, mime_type")
        .eq("application_id", targetAppId)
        .order("uploaded_at", { ascending: true });
      initialDocuments = (docs as DocumentItem[]) || [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#3C3163]">
            Antrean Verifikasi Mitra
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Tinjau berkas, konfirmasi checklist, dan setujui atau tolak pengajuan mitra.
          </p>
        </div>
      </div>

      <QueueFilters
        currentTrack={currentTrack}
        currentStatus={currentStatus}
        currentSort={currentSort}
        currentQuery={currentQuery}
      />

      <VerificationQueue
        initialItems={queueItems}
        selectedId={selectedId}
        initialSelectedApplication={initialSelectedApplication}
        initialDocuments={initialDocuments}
      />
    </div>
  );
}
