import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/mitra/audit";

export async function purgeExpiredDocuments(): Promise<{
  purged: number;
  errors: number;
}> {
  const supabase = await createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: expiredDocs, error } = await supabase
    .from("provider_documents")
    .select("id, storage_path, doc_type, application_id")
    .not("purge_after", "is", null)
    .lte("purge_after", nowIso);

  if (error || !expiredDocs) {
    return { purged: 0, errors: error ? 1 : 0 };
  }

  let adminId = process.env.ADMIN_SYSTEM_ACTOR_ID;
  if (!adminId) {
    const { data: latestAudit } = await supabase
      .from("admin_audit_log")
      .select("actor_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    adminId = latestAudit?.actor_id || "00000000-0000-0000-0000-000000000000";
  }

  let purgedCount = 0;
  let errorCount = 0;

  for (const doc of expiredDocs) {
    let removeSuccess = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: removeError } = await supabase.storage
        .from("provider-credentials")
        .remove([doc.storage_path]);
      if (!removeError) {
        removeSuccess = true;
        break;
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!removeSuccess) {
      errorCount++;
      // Postpone purge_after by 1 day
      const tomorrowIso = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      await supabase
        .from("provider_documents")
        .update({ purge_after: tomorrowIso })
        .eq("id", doc.id);
      continue;
    }

    // Delete row from table
    const { error: deleteError } = await supabase
      .from("provider_documents")
      .delete()
      .eq("id", doc.id);

    if (deleteError) {
      errorCount++;
    } else {
      purgedCount++;
      if (adminId) {
        await writeAuditLog(adminId, {
          action: "DOCUMENT_PURGED",
          targetType: "provider_document",
          targetId: doc.id,
          metadata: {
            application_id: doc.application_id,
            storage_path: doc.storage_path,
            doc_type: doc.doc_type,
          },
        });
      }
    }
  }

  return { purged: purgedCount, errors: errorCount };
}
