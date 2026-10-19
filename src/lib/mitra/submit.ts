import {
  validateMitraDraft,
  type MitraDraft,
  type ValidationIssue,
} from "@/lib/mitra/application-schema";
import { suggestUsernames } from "@/lib/mitra/username-rules";

export type SubmitResultCode =
  | "OK"
  | "VALIDATION_FAILED"
  | "EMAIL_EXISTS"
  | "RATE_LIMITED"
  | "USERNAME_TAKEN"
  | "SERVER_ERROR"
  | "ACTIVE_APPLICATION"
  | "EMAIL_MISMATCH";
export interface SubmitResult {
  ok: boolean;
  code: SubmitResultCode;
  message?: string;
  issues?: ValidationIssue[];
  applicationId?: string;
  username?: string;
  uploadToken?: string;
  suggestions?: string[];
}

export function evaluateMemberSubmission(input: {
  draft: MitraDraft;
  sessionEmail: string;
  ownUsername: string;
  hasPendingApplication: boolean;
}): SubmitResult {
  const validation = validateMitraDraft(input.draft);
  if (!validation.ok) {
    return { ok: false, code: "VALIDATION_FAILED", issues: validation.issues };
  }
  const normalized = validation.normalized!;
  if (normalized.applicantEmail !== input.sessionEmail.toLowerCase()) {
    return {
      ok: false,
      code: "EMAIL_MISMATCH",
      message: "Email harus sama dengan akun yang sedang masuk.",
    };
  }
  if (input.hasPendingApplication) {
    return {
      ok: false,
      code: "ACTIVE_APPLICATION",
      message: "Anda sudah memiliki pengajuan yang sedang ditinjau.",
    };
  }
  if (normalized.username === input.ownUsername.toLowerCase()) {
    return { ok: true, code: "OK", username: normalized.username };
  }
  return evaluateSubmission({
    draft: input.draft,
    existingEmails: [],
    existingUsernames: [normalized.username],
    rateLimited: false,
    activeForEmail: 0,
  });
}

export function evaluateSubmission(input: {
  draft: MitraDraft;
  existingEmails: string[];
  existingUsernames: string[];
  rateLimited: boolean;
  activeForEmail: number;
}): SubmitResult {
  if (input.rateLimited) return { ok: false, code: "RATE_LIMITED" };
  const validation = validateMitraDraft(input.draft);
  if (!validation.ok)
    return { ok: false, code: "VALIDATION_FAILED", issues: validation.issues };
  const email = validation.normalized!.applicantEmail;
  if (
    input.existingEmails.some((value) => value.trim().toLowerCase() === email)
  )
    return { ok: false, code: "EMAIL_EXISTS" };
  if (input.activeForEmail >= 2)
    return {
      ok: false,
      code: "EMAIL_EXISTS",
      message: "Email ini sudah memiliki pengajuan aktif.",
    };
  const taken = new Set(
    input.existingUsernames.map((value) => value.toLowerCase()),
  );
  if (taken.has(validation.normalized!.username))
    return {
      ok: false,
      code: "USERNAME_TAKEN",
      suggestions: suggestUsernames(
        validation.normalized!.username,
        (candidate) => taken.has(candidate),
      ),
    };
  return { ok: true, code: "OK", username: validation.normalized!.username };
}
