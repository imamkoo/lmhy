import { createAdminClient } from "@/lib/supabase/admin";

export interface OverviewMetrics {
  totalPendamping: number;
  totalPraktisi: number;
  statusCounts: { NONE: number; PENDING: number; APPROVED: number; REJECTED: number };
  pendingTotal: number;
  pendingByTrack: { SEBAYA: number; KLINIS: number };
  decided30d: { approved: number; rejected: number; expired: number };
  medianReviewHours: number | null;
}

export function medianReviewHours(
  decided: Array<{ applied_at: string; decided_at: string | null }>,
): number | null {
  const hours = decided
    .filter((row) => row.decided_at !== null)
    .map((row) => (new Date(row.decided_at as string).getTime() - new Date(row.applied_at).getTime()) / 3600000)
    .sort((a, b) => a - b);
  if (hours.length === 0) return null;
  return hours[Math.floor((hours.length - 1) / 2)];
}

export async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  const supabase = await createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [roles, statuses, pending, decided] = await Promise.all([
    supabase.from("profiles").select("creator_role").in("creator_role", ["PENDAMPING", "PRAKTISI"]).eq("verification_status", "APPROVED"),
    supabase.from("profiles").select("verification_status").in("verification_status", ["NONE", "PENDING", "APPROVED", "REJECTED"]),
    supabase.from("provider_applications").select("track").eq("status", "PENDING"),
    supabase.from("provider_applications").select("status, applied_at, decided_at").gte("decided_at", since),
  ]);
  const roleRows = (roles.data ?? []) as Array<{ creator_role: string }>;
  const statusRows = (statuses.data ?? []) as Array<{ verification_status: keyof OverviewMetrics["statusCounts"] }>;
  const pendingRows = (pending.data ?? []) as Array<{ track: "SEBAYA" | "KLINIS" }>;
  const decidedRows = (decided.data ?? []) as Array<{ status: string; applied_at: string; decided_at: string | null }>;
  const statusCounts = { NONE: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const row of statusRows) statusCounts[row.verification_status]++;
  return {
    totalPendamping: roleRows.filter((row) => row.creator_role === "PENDAMPING").length,
    totalPraktisi: roleRows.filter((row) => row.creator_role === "PRAKTISI").length,
    statusCounts,
    pendingTotal: pendingRows.length,
    pendingByTrack: {
      SEBAYA: pendingRows.filter((row) => row.track === "SEBAYA").length,
      KLINIS: pendingRows.filter((row) => row.track === "KLINIS").length,
    },
    decided30d: {
      approved: decidedRows.filter((row) => row.status === "APPROVED").length,
      rejected: decidedRows.filter((row) => row.status === "REJECTED").length,
      expired: decidedRows.filter((row) => row.status === "EXPIRED").length,
    },
    medianReviewHours: medianReviewHours(decidedRows),
  };
}
