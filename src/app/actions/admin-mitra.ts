"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/mitra/audit";
import {
  evaluateApproval,
  evaluateRejection,
  roleForTrack,
  serviceTrackForTrack,
} from "@/lib/mitra/application-state";
import type { TablesUpdate } from "@/lib/supabase/types";

export interface AdminActionResult {
  ok: boolean;
  code?: string;
  message?: string;
}

export async function getApplicationDetailAction(applicationId: string): Promise<{
  ok: boolean;
  application?: Record<string, unknown>;
  documents?: Array<{
    id: string;
    doc_type: string;
    uploaded_at: string;
    original_filename: string;
    size_bytes: number;
    mime_type: string;
  }>;
  error?: string;
}> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Akses admin diperlukan." };
  }

  const supabase = await createAdminClient();
  const { data: application, error: appError } = await supabase
    .from("provider_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return { ok: false, error: "Pengajuan tidak ditemukan." };
  }

  const { data: documents } = await supabase
    .from("provider_documents")
    .select("id, doc_type, uploaded_at, original_filename, size_bytes, mime_type")
    .eq("application_id", applicationId)
    .order("uploaded_at", { ascending: true });

  return {
    ok: true,
    application: application as Record<string, unknown>,
    documents: documents ?? [],
  };
}

export async function getDocumentUrlAction(
  documentId: string,
  retry: boolean = false
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Akses admin diperlukan." };
  }

  const supabase = await createAdminClient();
  const { data: doc, error: docError } = await supabase
    .from("provider_documents")
    .select("id, storage_path, application_id")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    return { ok: false, error: "Dokumen tidak ditemukan." };
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("provider-credentials")
    .createSignedUrl(doc.storage_path, 60);

  if (signedError || !signedData?.signedUrl) {
    return { ok: false, error: "Gagal membuat tautan dokumen." };
  }

  await writeAuditLog(admin.id, {
    action: "DOCUMENT_VIEWED",
    targetType: "provider_document",
    targetId: documentId,
    metadata: {
      application_id: doc.application_id,
      retry,
    },
  });

  return { ok: true, url: signedData.signedUrl };
}

export async function updateChecklistAction(
  applicationId: string,
  patch: {
    waJoinedConfirmed?: boolean;
    pfaStatus?: "BELUM" | "SEDANG" | "SELESAI";
  }
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, code: "FORBIDDEN", message: "Akses admin diperlukan." };
  }

  const updatePayload: TablesUpdate<"provider_applications"> = {};
  if (patch.waJoinedConfirmed !== undefined) {
    updatePayload.wa_joined_confirmed_at = patch.waJoinedConfirmed
      ? new Date().toISOString()
      : null;
  }
  if (patch.pfaStatus !== undefined) {
    updatePayload.pfa_status = patch.pfaStatus;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { ok: true };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("provider_applications")
    .update(updatePayload)
    .eq("id", applicationId);

  if (error) {
    return { ok: false, code: "SERVER_ERROR", message: "Gagal memperbarui checklist." };
  }

  await writeAuditLog(admin.id, {
    action: "CHECKLIST_UPDATED",
    targetType: "provider_application",
    targetId: applicationId,
    metadata: patch,
  });

  return { ok: true };
}

export async function approveApplicationAction(
  applicationId: string,
  note?: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, code: "FORBIDDEN", message: "Akses admin diperlukan." };
  }

  const supabase = await createAdminClient();
  const { data: application, error: appError } = await supabase
    .from("provider_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return { ok: false, code: "NOT_FOUND", message: "Pengajuan tidak ditemukan." };
  }

  const { data: docs } = await supabase
    .from("provider_documents")
    .select("id")
    .eq("application_id", applicationId);

  const hasRequiredDocuments = (docs?.length ?? 0) > 0;

  const gate = evaluateApproval({
    status: application.status,
    track: application.track,
    emailVerifiedAt: application.email_verified_at,
    waJoinedConfirmedAt: application.wa_joined_confirmed_at,
    pfaStatus: application.pfa_status,
    hasRequiredDocuments,
    adminUserId: admin.id,
    applicantUserId: application.user_id,
    note,
  });

  if (!gate.allowed) {
    return {
      ok: false,
      code: "GATE_FAILED",
      message: gate.reasons.join(" "),
    };
  }

  const nowIso = new Date().toISOString();

  // Optimistic concurrency check: update where status = 'PENDING'
  const { data: updated, error: updateError } = await supabase
    .from("provider_applications")
    .update({
      status: "APPROVED",
      decided_at: nowIso,
      decided_by: admin.id,
      decision_note: note ?? null,
    })
    .eq("id", applicationId)
    .eq("status", "PENDING")
    .select("id");

  if (updateError) {
    return { ok: false, code: "SERVER_ERROR", message: "Gagal memperbarui pengajuan." };
  }

  if (!updated || updated.length === 0) {
    return {
      ok: false,
      code: "ALREADY_DECIDED",
      message: "Pengajuan ini sudah diproses admin lain.",
    };
  }

  // Update profiles table
  const newRole = roleForTrack(application.track);
  const newServiceTrack = serviceTrackForTrack(application.track);

  await supabase
    .from("profiles")
    .update({
      creator_role: newRole,
      service_track: newServiceTrack,
      verification_status: "APPROVED",
      verified_at: nowIso,
      verified_by: admin.id,
      verification_note: note ?? null,
    })
    .eq("id", application.user_id);

  // Supersede other pending applications for the same user
  await supabase
    .from("provider_applications")
    .update({ status: "SUPERSEDED" })
    .eq("user_id", application.user_id)
    .eq("status", "PENDING")
    .neq("id", applicationId);

  await writeAuditLog(admin.id, {
    action: "APPLICATION_APPROVED",
    targetType: "provider_application",
    targetId: applicationId,
    note: note ?? undefined,
  });

  return { ok: true };
}

export async function rejectApplicationAction(
  applicationId: string,
  note: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, code: "FORBIDDEN", message: "Akses admin diperlukan." };
  }

  const supabase = await createAdminClient();
  const { data: application, error: appError } = await supabase
    .from("provider_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return { ok: false, code: "NOT_FOUND", message: "Pengajuan tidak ditemukan." };
  }

  const gate = evaluateRejection({
    status: application.status,
    note,
    adminUserId: admin.id,
    applicantUserId: application.user_id,
  });

  if (!gate.allowed) {
    return {
      ok: false,
      code: "GATE_FAILED",
      message: gate.reasons.join(" "),
    };
  }

  const nowIso = new Date().toISOString();

  // Optimistic concurrency
  const { data: updated, error: updateError } = await supabase
    .from("provider_applications")
    .update({
      status: "REJECTED",
      decided_at: nowIso,
      decided_by: admin.id,
      decision_note: note,
    })
    .eq("id", applicationId)
    .eq("status", "PENDING")
    .select("id");

  if (updateError) {
    return { ok: false, code: "SERVER_ERROR", message: "Gagal menolak pengajuan." };
  }

  if (!updated || updated.length === 0) {
    return {
      ok: false,
      code: "ALREADY_DECIDED",
      message: "Pengajuan ini sudah diproses admin lain.",
    };
  }

  // Update profiles: verification_status = 'REJECTED', creator_role stays unchanged
  await supabase
    .from("profiles")
    .update({
      verification_status: "REJECTED",
      verification_note: note,
    })
    .eq("id", application.user_id);

  await writeAuditLog(admin.id, {
    action: "APPLICATION_REJECTED",
    targetType: "provider_application",
    targetId: applicationId,
    note,
  });

  return { ok: true };
}
