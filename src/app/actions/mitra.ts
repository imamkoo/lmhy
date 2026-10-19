"use server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  activeApplicationCountByEmail,
  checkSubmissionRateLimit,
  checkUsernameCheckLimit,
  recordSubmission,
} from "@/lib/mitra/rate-limit";
import {
  validateMitraDraft,
  type MitraDraft,
} from "@/lib/mitra/application-schema";
import { evaluateSubmission, type SubmitResult } from "@/lib/mitra/submit";
import { createUploadTicket, stripImageMetadata } from "@/lib/mitra/documents";
import {
  suggestUsernames,
  validateMitraUsername,
} from "@/lib/mitra/username-rules";
import { createUploadToken, verifyUploadToken } from "@/lib/mitra/upload-token";
import { writeAuditLog } from "@/lib/mitra/audit";
import type { Json, TablesInsert } from "@/lib/supabase/types";

export async function submitMitraApplication(
  draft: MitraDraft,
  context?: { ip?: string },
): Promise<SubmitResult> {
  const secret = process.env.MITRA_UPLOAD_SECRET;
  if (!secret) {
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "Token unggah belum dikonfigurasi.",
    };
  }

  const client = await createClient();
  const {
    data: { user: sessionUser },
  } = await client.auth.getUser();
  const requestHeaders = await headers();
  const forwardedIp = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim()
    .slice(0, 128);
  const ip = context?.ip?.trim().slice(0, 128) || forwardedIp || "unknown";
  const key = `ip:${ip}`;

  if (!checkSubmissionRateLimit(key).allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "Terlalu banyak pengajuan. Silakan coba lagi nanti.",
    };
  }

  const validation = validateMitraDraft(draft);
  if (!validation.ok) {
    return { ok: false, code: "VALIDATION_FAILED", issues: validation.issues };
  }

  const normalized = validation.normalized!;
  if (
    sessionUser?.email &&
    normalized.applicantEmail !== sessionUser.email.toLowerCase()
  ) {
    return {
      ok: false,
      code: "EMAIL_MISMATCH",
      message: "Email harus sama dengan akun yang sedang masuk.",
    };
  }

  const admin = await createAdminClient();
  const { data: memberProfile } = sessionUser
    ? await admin
        .from("profiles")
        .select("username")
        .eq("id", sessionUser.id)
        .maybeSingle()
    : { data: null };
  const [{ data: profiles }, { data: applications }] = await Promise.all([
    admin
      .from("profiles")
      .select("username")
      .eq("username", normalized.username),
    admin
      .from("provider_applications")
      .select("applicant_email, status, user_id")
      .eq("applicant_email", normalized.applicantEmail)
      .eq("status", "PENDING"),
  ]);
  const existingUsernames = (profiles ?? [])
    .map((row) => row.username)
    .filter((username) => username !== memberProfile?.username);
  const activeForEmail = activeApplicationCountByEmail(
    normalized.applicantEmail,
    applications ?? [],
  );
  const decision = evaluateSubmission({
    draft,
    existingEmails: [],
    existingUsernames,
    rateLimited: false,
    activeForEmail: sessionUser ? 0 : activeForEmail,
  });
  if (!decision.ok) return decision;

  if (sessionUser) {
    if (
      (applications ?? []).some(
        (application) => application.user_id === sessionUser.id,
      )
    ) {
      return {
        ok: false,
        code: "ACTIVE_APPLICATION",
        message: "Anda sudah memiliki pengajuan yang sedang ditinjau.",
      };
    }
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        username: normalized.username,
        display_name: normalized.applicantName,
      })
      .eq("id", sessionUser.id);
    if (profileError) return { ok: false, code: "SERVER_ERROR" };
    const result = await createApplication(
      admin,
      sessionUser.id,
      normalized,
      secret,
    );
    if (result.ok) {
      recordSubmission(key);
      recordSubmission(`email:${normalized.applicantEmail}`);
    }
    return result;
  }

  const { data: created, error: userError } = await admin.auth.admin.createUser(
    {
      email: normalized.applicantEmail,
      password: draft.password,
      email_confirm: false,
      user_metadata: { display_name: normalized.applicantName },
    },
  );
  if (userError) {
    return {
      ok: false,
      code: /already registered|already been registered/i.test(
        userError.message,
      )
        ? "EMAIL_EXISTS"
        : "SERVER_ERROR",
    };
  }
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    username: normalized.username,
    display_name: normalized.applicantName,
    creator_role: "PENULIS",
    service_track: null,
    verification_status: "PENDING",
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      ok: false,
      code: /unique/i.test(profileError.message)
        ? "USERNAME_TAKEN"
        : "SERVER_ERROR",
      suggestions: /unique/i.test(profileError.message)
        ? suggestUsernames(normalized.username, (candidate) =>
            existingUsernames.includes(candidate),
          )
        : undefined,
    };
  }
  const result = await createApplication(
    admin,
    created.user.id,
    normalized,
    secret,
  );
  if (!result.ok) {
    await admin.from("profiles").delete().eq("id", created.user.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return result;
  }
  recordSubmission(key);
  recordSubmission(`email:${normalized.applicantEmail}`);
  return result;
}

async function createApplication(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  normalized: NonNullable<ReturnType<typeof validateMitraDraft>["normalized"]>,
  secret: string,
): Promise<SubmitResult> {
  const { data: application, error } = await admin
    .from("provider_applications")
    .insert({
      user_id: userId,
      track: normalized.track,
      username: normalized.username,
      applicant_name: normalized.applicantName,
      applicant_email: normalized.applicantEmail,
      whatsapp: normalized.whatsapp,
      domicile_province: normalized.domicileProvince,
      domicile_city: normalized.domicileCity,
      motivation: normalized.motivation,
      ethics_pledge_at: normalized.ethicsAcceptedAt,
      pledge_version: "2026-10-20",
      details: normalized.details as Json,
      status: "PENDING",
      applied_at: normalized.ethicsAcceptedAt,
    })
    .select("id")
    .single();
  if (error) return { ok: false, code: "SERVER_ERROR" };
  return {
    ok: true,
    code: "OK",
    applicationId: application.id,
    username: normalized.username,
    uploadToken: createUploadToken(
      { applicationId: application.id, userId },
      secret,
    ),
  };
}

export async function checkMitraUsernameAction(
  username: string,
): Promise<{ available: boolean; error?: string; suggestions: string[] }> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim()
      .slice(0, 128) || "unknown";
  if (!checkUsernameCheckLimit(ip).allowed)
    return {
      available: false,
      error: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      suggestions: [],
    };
  const validation = validateMitraUsername(username);
  if (!validation.valid)
    return { available: false, error: validation.error, suggestions: [] };
  const admin = await createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();
  if (!data) return { available: true, suggestions: [] };
  const taken = new Set([username]);
  const suggestions = suggestUsernames(username, (candidate) =>
    taken.has(candidate),
  );
  suggestions.forEach((suggestion) => taken.add(suggestion));
  return {
    available: false,
    error: "Username sudah dipakai.",
    suggestions,
  };
}

export async function finalizeDocumentUploadAction(input: {
  path: string;
  uploadToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const path = input.path;
  const secret = process.env.MITRA_UPLOAD_SECRET;
  if (!secret) return { ok: false, error: "Token unggah belum dikonfigurasi." };
  const token = input.uploadToken
    ? verifyUploadToken(input.uploadToken, secret)
    : undefined;
  if (input.uploadToken && !token?.ok)
    return { ok: false, error: token?.error };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = token?.ok ? token.payload!.userId : user?.id;
  if (!userId) return { ok: false, error: "Sesi masuk tidak ditemukan." };
  const match =
    /^applications\/([^/]+)\/(?:STR|SIPP|CV|TRAINING_CERT|PFA_CERT|OTHER)-[^/]+\.(pdf|jpg|png)$/.exec(
      path,
    );
  if (!match) return { ok: false, error: "Path dokumen tidak valid." };
  const admin = await createAdminClient();
  const { data: application } = await admin
    .from("provider_applications")
    .select("user_id")
    .eq("id", match[1])
    .maybeSingle();
  if (
    !application ||
    application.user_id !== userId ||
    (token?.ok && token.payload!.applicationId !== match[1])
  )
    return { ok: false, error: "Pengajuan tidak ditemukan." };
  const { data: file, error: downloadError } = await admin.storage
    .from("provider-credentials")
    .download(path);
  if (downloadError || !file)
    return { ok: false, error: "Dokumen tidak dapat diproses." };
  const mimeType =
    match[2] === "pdf"
      ? "application/pdf"
      : match[2] === "jpg"
        ? "image/jpeg"
        : "image/png";
  const sanitized = await stripImageMetadata(
    Buffer.from(await file.arrayBuffer()),
    mimeType,
  );
  const { error: uploadError } = await admin.storage
    .from("provider-credentials")
    .upload(path, sanitized, { contentType: mimeType, upsert: true });
  return uploadError
    ? { ok: false, error: "Dokumen tidak dapat disimpan." }
    : { ok: true };
}

export async function createDocumentUploadAction(input: {
  applicationId: string;
  docType: string;
  mimeType: string;
  sizeBytes: number;
  filename: string;
  uploadToken?: string;
}) {
  const secret = process.env.MITRA_UPLOAD_SECRET;
  if (!secret) return { ok: false, error: "Token unggah belum dikonfigurasi." };
  const token = input.uploadToken
    ? verifyUploadToken(input.uploadToken, secret)
    : undefined;
  if (input.uploadToken && !token?.ok)
    return { ok: false, error: token?.error };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const userId = token?.ok ? token.payload!.userId : user?.id;
  if (!userId) return { ok: false, error: "Sesi masuk tidak ditemukan." };
  const admin = await createAdminClient();
  const { data: application } = await admin
    .from("provider_applications")
    .select("user_id")
    .eq("id", input.applicationId)
    .maybeSingle();
  if (
    !application ||
    application.user_id !== userId ||
    (token?.ok && token.payload!.applicationId !== input.applicationId)
  )
    return { ok: false, error: "Pengajuan tidak ditemukan." };
  return createUploadTicket({ ...input, userId });
}

export async function resubmitMitraApplicationAction(
  applicationId: string,
  draft: MitraDraft,
): Promise<SubmitResult> {
  const secret = process.env.MITRA_UPLOAD_SECRET;
  if (!secret) {
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "Token unggah belum dikonfigurasi.",
    };
  }

  const client = await createClient();
  const {
    data: { user: sessionUser },
  } = await client.auth.getUser();

  if (!sessionUser) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Silakan masuk terlebih dahulu.",
    };
  }

  const admin = await createAdminClient();
  const { data: previousApp, error: fetchError } = await admin
    .from("provider_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (fetchError || !previousApp) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Pengajuan lama tidak ditemukan.",
    };
  }

  if (previousApp.user_id !== sessionUser.id) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Anda bukan pemilik pengajuan ini.",
    };
  }

  if (previousApp.status !== "REJECTED" && previousApp.status !== "EXPIRED") {
    return {
      ok: false,
      code: "INVALID_STATE",
      message:
        "Hanya pengajuan yang ditolak atau kedaluwarsa yang dapat diajukan ulang.",
    };
  }

  const validation = validateMitraDraft(draft);
  if (!validation.ok) {
    return { ok: false, code: "VALIDATION_FAILED", issues: validation.issues };
  }

  const normalized = validation.normalized!;
  const nowIso = new Date().toISOString();

  const { data: newApp, error: insertError } = await admin
    .from("provider_applications")
    .insert({
      user_id: sessionUser.id,
      track: normalized.track,
      username: normalized.username,
      applicant_name: normalized.applicantName,
      applicant_email: normalized.applicantEmail,
      whatsapp: normalized.whatsapp,
      domicile_province: normalized.domicileProvince,
      domicile_city: normalized.domicileCity,
      motivation: normalized.motivation,
      background_track:
        (normalized.backgroundTrack as TablesInsert<"provider_applications">["background_track"]) ||
        null,
      ethics_pledge_at: normalized.ethicsAcceptedAt || nowIso,
      pledge_version: "2026-10-20",
      applied_at: nowIso,
      status: "PENDING",
      details: normalized.details as Json,
      supersedes: applicationId,
    })
    .select("id")
    .single();

  if (insertError || !newApp) {
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "Gagal membuat pengajuan baru.",
    };
  }

  await admin
    .from("provider_applications")
    .update({
      status: "SUPERSEDED",
      superseded_by: newApp.id,
    })
    .eq("id", applicationId);

  await admin
    .from("profiles")
    .update({
      display_name: normalized.applicantName,
      verification_status: "PENDING",
    })
    .eq("id", sessionUser.id);

  await writeAuditLog(sessionUser.id, {
    action: "APPLICATION_RESUBMITTED",
    targetType: "provider_application",
    targetId: newApp.id,
    note: `Supersedes ${applicationId}`,
  });

  const uploadToken = createUploadToken(
    { applicationId: newApp.id, userId: sessionUser.id },
    secret,
  );

  return {
    ok: true,
    code: "OK",
    applicationId: newApp.id,
    uploadToken,
  };
}
