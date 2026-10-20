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
import {
  documentPurgeAfter,
  isApplicationExpired,
  isEmailVerificationExpired,
  tombstoneUsername,
} from "@/lib/mitra/expiry";
import { isShadowMode } from "@/lib/mitra/flags";
import { sendEmail } from "@/lib/email";
import {
  applicationApprovedTemplate,
  applicationExpiredTemplate,
  applicationRejectedTemplate,
  verificationReminderTemplate,
} from "@/lib/email-templates";
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

  if (isShadowMode()) {
    return {
      ok: false,
      code: "SHADOW_MODE",
      message: "Shadow mode aktif: keputusan dinonaktifkan.",
    };
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

  // Set document purge retention date to decided_at + 90 days
  const purgeAfterIso = documentPurgeAfter(new Date(nowIso)).toISOString();
  await supabase
    .from("provider_documents")
    .update({ purge_after: purgeAfterIso })
    .eq("application_id", applicationId);

  await writeAuditLog(admin.id, {
    action: "APPLICATION_APPROVED",
    targetType: "provider_application",
    targetId: applicationId,
    note: note ?? undefined,
  });

  sendEmail({
    to: application.applicant_email,
    ...applicationApprovedTemplate({
      applicantName: application.applicant_name,
      roleLabel:
        newRole === "PRAKTISI" ? "Praktisi Klinis" : "Pendamping Sebaya",
      username: application.username,
    }),
  }).catch(() => {});

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

  if (isShadowMode()) {
    return {
      ok: false,
      code: "SHADOW_MODE",
      message: "Shadow mode aktif: keputusan dinonaktifkan.",
    };
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

  // Set document purge retention date to decided_at + 90 days
  const purgeAfterIso = documentPurgeAfter(new Date(nowIso)).toISOString();
  await supabase
    .from("provider_documents")
    .update({ purge_after: purgeAfterIso })
    .eq("application_id", applicationId);

  await writeAuditLog(admin.id, {
    action: "APPLICATION_REJECTED",
    targetType: "provider_application",
    targetId: applicationId,
    note,
  });

  sendEmail({
    to: application.applicant_email,
    ...applicationRejectedTemplate({
      applicantName: application.applicant_name,
      note,
      username: application.username,
    }),
  }).catch(() => {});

  return { ok: true };
}

export async function runExpirySweepAction(): Promise<{
  ok: boolean;
  expiredEmail: number;
  expiredApplication: number;
  releasedUsernames: number;
  error?: string;
}> {
  try {
    const supabase = await createAdminClient();
    const { data: pendingApps, error } = await supabase
      .from("provider_applications")
      .select(
        "id, user_id, applied_at, email_verified_at, username, applicant_email, applicant_name"
      )
      .eq("status", "PENDING");

    if (error || !pendingApps) {
      return {
        ok: false,
        expiredEmail: 0,
        expiredApplication: 0,
        releasedUsernames: 0,
        error: error?.message || "Failed to fetch pending applications",
      };
    }

    let systemActorId = process.env.ADMIN_SYSTEM_ACTOR_ID;
    if (!systemActorId) {
      const { data: latestAudit } = await supabase
        .from("admin_audit_log")
        .select("actor_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      systemActorId =
        latestAudit?.actor_id || "00000000-0000-0000-0000-000000000000";
    }

    const now = new Date();
    const nowIso = now.toISOString();
    let expiredEmailCount = 0;
    let expiredAppCount = 0;
    let releasedUsernamesCount = 0;

    for (const app of pendingApps) {
      const appliedDate = new Date(app.applied_at);
      let expireReason: string | null = null;
      let isEmailExpiry = false;

      if (!app.email_verified_at && isEmailVerificationExpired(appliedDate, now)) {
        expireReason = "Email tidak terverifikasi dalam 7 hari.";
        isEmailExpiry = true;
      } else if (isApplicationExpired(appliedDate, now)) {
        expireReason = "Pengajuan melewati batas 30 hari.";
      }

      if (expireReason) {
        const { error: updateError } = await supabase
          .from("provider_applications")
          .update({
            status: "EXPIRED",
            decided_at: nowIso,
            decided_by: null,
            decision_note: expireReason,
          })
          .eq("id", app.id)
          .eq("status", "PENDING");

        if (!updateError) {
          if (isEmailExpiry) {
            expiredEmailCount++;
          } else {
            expiredAppCount++;
          }

          const { error: rpcError } = await supabase.rpc(
            "release_mitra_username" as never,
            { target_user_id: app.user_id } as never
          );

          if (rpcError) {
            await supabase
              .from("profiles")
              .update({ username: tombstoneUsername(app.user_id) })
              .eq("id", app.user_id);
          }
          releasedUsernamesCount++;

          await writeAuditLog(systemActorId, {
            action: "APPLICATION_EXPIRED",
            targetType: "provider_application",
            targetId: app.id,
            note: expireReason,
            metadata: {
              reason: isEmailExpiry
                ? "EMAIL_UNVERIFIED_7D"
                : "APPLICATION_TIMEOUT_30D",
              previous_username: app.username,
            },
          });

          sendEmail({
            to: app.applicant_email,
            ...applicationExpiredTemplate({
              applicantName: app.applicant_name,
              username: app.username,
            }),
          }).catch(() => {});
        }
      }
    }

    return {
      ok: true,
      expiredEmail: expiredEmailCount,
      expiredApplication: expiredAppCount,
      releasedUsernames: releasedUsernamesCount,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      expiredEmail: 0,
      expiredApplication: 0,
      releasedUsernames: 0,
      error: err instanceof Error ? err.message : "Internal sweep error",
    };
  }
}

export async function resendVerificationEmailAction(
  applicationId: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, code: "FORBIDDEN", message: "Akses admin diperlukan." };
  }

  const supabase = await createAdminClient();
  const { data: application, error } = await supabase
    .from("provider_applications")
    .select("id, applicant_name, applicant_email, username, email_verified_at")
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    return { ok: false, code: "NOT_FOUND", message: "Pengajuan tidak ditemukan." };
  }

  if (application.email_verified_at) {
    return {
      ok: false,
      code: "ALREADY_VERIFIED",
      message: "Alamat email ini sudah terverifikasi.",
    };
  }

  let verificationUrl: string | undefined;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: application.applicant_email,
    });
    verificationUrl = linkData?.properties?.action_link;
  } catch {
    // fallback without link
  }

  const emailResult = await sendEmail({
    to: application.applicant_email,
    ...verificationReminderTemplate({
      applicantName: application.applicant_name,
      username: application.username,
      verificationUrl,
    }),
  });

  if (!emailResult.ok && !emailResult.skipped) {
    return {
      ok: false,
      code: "EMAIL_FAILED",
      message: emailResult.error || "Gagal mengirim email pengingat.",
    };
  }

  await writeAuditLog(admin.id, {
    action: "EMAIL_RESENT",
    targetType: "provider_application",
    targetId: applicationId,
    note: "Resent email verification reminder",
  });

  return { ok: true };
}

export async function resendDecisionEmailAction(
  applicationId: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, code: "FORBIDDEN", message: "Akses admin diperlukan." };
  }

  const supabase = await createAdminClient();
  const { data: application, error } = await supabase
    .from("provider_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    return { ok: false, code: "NOT_FOUND", message: "Pengajuan tidak ditemukan." };
  }

  if (application.status !== "APPROVED" && application.status !== "REJECTED") {
    return {
      ok: false,
      code: "INVALID_STATE",
      message: "Pengajuan belum diputuskan.",
    };
  }

  let emailTemplate;
  if (application.status === "APPROVED") {
    emailTemplate = applicationApprovedTemplate({
      applicantName: application.applicant_name,
      roleLabel:
        application.track === "KLINIS"
          ? "Praktisi Klinis"
          : "Pendamping Sebaya",
      username: application.username,
    });
  } else {
    emailTemplate = applicationRejectedTemplate({
      applicantName: application.applicant_name,
      note: application.decision_note || "Dokumen belum lengkap.",
      username: application.username,
    });
  }

  const emailResult = await sendEmail({
    to: application.applicant_email,
    ...emailTemplate,
  });

  if (!emailResult.ok && !emailResult.skipped) {
    return {
      ok: false,
      code: "EMAIL_FAILED",
      message: emailResult.error || "Gagal mengirim email keputusan.",
    };
  }

  await writeAuditLog(admin.id, {
    action: "EMAIL_RESENT",
    targetType: "provider_application",
    targetId: applicationId,
    note: `Resent ${application.status} decision email`,
  });

  return { ok: true };
}
