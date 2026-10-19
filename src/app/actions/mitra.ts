"use server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSubmissionRateLimit, recordSubmission } from "@/lib/mitra/rate-limit";
import { validateMitraDraft, type MitraDraft } from "@/lib/mitra/application-schema";
import { evaluateSubmission, type SubmitResult } from "@/lib/mitra/submit";
import { suggestUsernames, validateMitraUsername } from "@/lib/mitra/username-rules";
import type { Json } from "@/lib/supabase/types";

export async function submitMitraApplication(draft: MitraDraft, context?: { ip?: string }): Promise<SubmitResult> {
  const requestHeaders = await headers();
  const forwardedIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 128);
  const ip = context?.ip?.trim().slice(0, 128) || forwardedIp || "unknown";
  const key = `ip:${ip}`;
  if (!checkSubmissionRateLimit(key).allowed) return { ok: false, code: "RATE_LIMITED", message: "Terlalu banyak pengajuan. Silakan coba lagi nanti." };
  const validation = validateMitraDraft(draft);
  if (!validation.ok) return { ok: false, code: "VALIDATION_FAILED", issues: validation.issues };
  const normalized = validation.normalized!;
  const admin = await createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("username");
  const password = draft.password;
  const { data: created, error: userError } = await admin.auth.admin.createUser({ email: normalized.applicantEmail, password, email_confirm: false, user_metadata: { display_name: normalized.applicantName } });
  if (userError) return { ok: false, code: /already registered|already been registered/i.test(userError.message) ? "EMAIL_EXISTS" : "SERVER_ERROR" };
  const existingUsernames = (profiles ?? []).map((row: { username: string }) => row.username);
  const decision = evaluateSubmission({ draft, existingEmails: [], existingUsernames, rateLimited: false, activeForEmail: 0 });
  if (!decision.ok && decision.code === "USERNAME_TAKEN") return decision;
  const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, username: normalized.username, display_name: normalized.applicantName, creator_role: "PENULIS", service_track: null, verification_status: "PENDING" });
  if (profileError) return { ok: false, code: /unique/i.test(profileError.message) ? "USERNAME_TAKEN" : "SERVER_ERROR" };
  const { data: application, error: applicationError } = await admin.from("provider_applications").insert({ user_id: created.user.id, track: normalized.track, username: normalized.username, applicant_name: normalized.applicantName, applicant_email: normalized.applicantEmail, whatsapp: normalized.whatsapp, domicile_province: normalized.domicileProvince, domicile_city: normalized.domicileCity, motivation: normalized.motivation, ethics_pledge_at: normalized.ethicsAcceptedAt, pledge_version: "2026-10-20", details: normalized.details as Json, status: "PENDING", applied_at: normalized.ethicsAcceptedAt }).select("id").single();
  if (applicationError) return { ok: false, code: "SERVER_ERROR" };
  recordSubmission(key); recordSubmission(`email:${normalized.applicantEmail}`);
  return { ok: true, code: "OK", applicationId: application.id, username: normalized.username };
}

export async function checkMitraUsernameAction(username: string): Promise<{ available: boolean; error?: string; suggestions: string[] }> {
  const validation = validateMitraUsername(username);
  if (!validation.valid) return { available: false, error: validation.error, suggestions: [] };
  const admin = await createAdminClient(); const { data } = await admin.from("profiles").select("username");
  const taken = new Set((data ?? []).map((row: { username: string }) => row.username));
  return { available: !taken.has(username), suggestions: suggestUsernames(username, (candidate) => taken.has(candidate)) };
}

