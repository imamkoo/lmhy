import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export type AuditAction =
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_EXPIRED"
  | "APPLICATION_RESUBMITTED"
  | "DOCUMENT_VIEWED"
  | "CHECKLIST_UPDATED"
  | "LITERA_CONFIG_UPDATED"
  | "EMAIL_RESENT"
  | "SWEEP_FAILED";

export interface AuditEntry {
  action: AuditAction;
  targetType: string;
  targetId: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  "APPLICATION_APPROVED",
  "APPLICATION_REJECTED",
  "APPLICATION_EXPIRED",
  "APPLICATION_RESUBMITTED",
  "DOCUMENT_VIEWED",
  "CHECKLIST_UPDATED",
  "LITERA_CONFIG_UPDATED",
  "EMAIL_RESENT",
  "SWEEP_FAILED",
];

export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export async function writeAuditLog(actorId: string, entry: AuditEntry): Promise<boolean> {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      note: entry.note ?? null,
      metadata: (entry.metadata as unknown as Json) ?? null,
    });
    return !error;
  } catch {
    return false;
  }
}
