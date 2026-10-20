import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction } from "@/lib/mitra/audit";
import { isSlaOverdue } from "@/lib/mitra/expiry";

export interface ActivityEntry {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  note: string | null;
  createdAt: string;
}

export function formatAuditActionLabel(action: AuditAction): string {
  switch (action) {
    case "APPLICATION_APPROVED":
      return "Menyetujui pengajuan mitra";
    case "APPLICATION_REJECTED":
      return "Menolak pengajuan mitra";
    case "APPLICATION_EXPIRED":
      return "Pengajuan kedaluwarsa (otomatis)";
    case "APPLICATION_RESUBMITTED":
      return "Pelamar mengajukan perbaikan";
    case "DOCUMENT_VIEWED":
      return "Membuka berkas dokumen";
    case "CHECKLIST_UPDATED":
      return "Memperbarui checklist verifikasi";
    case "LITERA_CONFIG_UPDATED":
      return "Memperbarui konfigurasi Litera";
    case "EMAIL_RESENT":
      return "Mengirim ulang email notifikasi";
    case "DOCUMENT_PURGED":
      return "Membersihkan dokumen kedaluwarsa";
    case "SWEEP_FAILED":
      return "Sweep kedaluwarsa gagal";
    default:
      return action;
  }
}

export async function fetchRecentAdminActivity(
  limit = 10
): Promise<ActivityEntry[]> {
  const supabase = await createAdminClient();
  const { data: logs } = await supabase
    .from("admin_audit_log")
    .select("id, actor_id, action, target_type, target_id, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!logs || logs.length === 0) return [];

  const actorIds = Array.from(new Set(logs.map((l) => l.actor_id)));
  const emailMap: Record<string, string> = {};

  await Promise.all(
    actorIds.map(async (id) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        if (data?.user?.email) {
          emailMap[id] = data.user.email;
        }
      } catch {
        // ignore
      }
    })
  );

  return logs.map((l) => ({
    id: l.id,
    actorId: l.actor_id,
    actorEmail: emailMap[l.actor_id],
    action: l.action,
    targetType: l.target_type,
    targetId: l.target_id,
    note: l.note,
    createdAt: l.created_at,
  }));
}

export async function fetchOverdueApplicationsCount(
  slaDays = 3
): Promise<number> {
  const supabase = await createAdminClient();
  const { data: pending } = await supabase
    .from("provider_applications")
    .select("applied_at")
    .eq("status", "PENDING");

  if (!pending) return 0;
  const now = new Date();
  return pending.filter((p) => isSlaOverdue(new Date(p.applied_at), now, slaDays))
    .length;
}
