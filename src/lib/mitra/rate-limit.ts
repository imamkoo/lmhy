export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds?: number;
  limit: number;
  remaining: number;
}

export const IP_SUBMISSION_LIMIT = 3;
export const EMAIL_SUBMISSION_LIMIT = 2;
export const USERNAME_CHECK_LIMIT = 20;

const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const USERNAME_CHECK_WINDOW_MS = 60 * 1000;

const submissions = new Map<string, number[]>();
const usernameChecks = new Map<string, number[]>();

export function resetSubmissionRateLimit(key: string): void {
  submissions.delete(key);
  usernameChecks.delete(key);
}

export function checkSubmissionRateLimit(key: string, now = Date.now()): RateLimitDecision {
  const cutoff = now - SUBMISSION_WINDOW_MS;
  const existing = (submissions.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

  if (existing.length === 0) {
    submissions.delete(key);
  } else {
    submissions.set(key, existing);
  }

  if (existing.length >= IP_SUBMISSION_LIMIT) {
    const oldest = existing[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + SUBMISSION_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      limit: IP_SUBMISSION_LIMIT,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit: IP_SUBMISSION_LIMIT,
    remaining: IP_SUBMISSION_LIMIT - existing.length,
  };
}

export function recordSubmission(key: string, now = Date.now()): RateLimitDecision {
  const cutoff = now - SUBMISSION_WINDOW_MS;
  const existing = (submissions.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

  existing.push(now);
  submissions.set(key, existing);

  if (existing.length >= IP_SUBMISSION_LIMIT) {
    const oldest = existing[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + SUBMISSION_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      limit: IP_SUBMISSION_LIMIT,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit: IP_SUBMISSION_LIMIT,
    remaining: IP_SUBMISSION_LIMIT - existing.length,
  };
}

export function checkUsernameCheckLimit(ip: string, now = Date.now()): RateLimitDecision {
  const cutoff = now - USERNAME_CHECK_WINDOW_MS;
  const existing = (usernameChecks.get(ip) ?? []).filter((timestamp) => timestamp > cutoff);

  existing.push(now);
  usernameChecks.set(ip, existing);

  if (existing.length >= USERNAME_CHECK_LIMIT) {
    const oldest = existing[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + USERNAME_CHECK_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      limit: USERNAME_CHECK_LIMIT,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit: USERNAME_CHECK_LIMIT,
    remaining: USERNAME_CHECK_LIMIT - existing.length,
  };
}

export function activeApplicationCountByEmail(
  email: string,
  applications: Array<{ applicant_email: string; status: string }>
): number {
  const normalized = email.trim().toLowerCase();
  return applications.filter(
    (app) => app.applicant_email.trim().toLowerCase() === normalized && app.status === "PENDING"
  ).length;
}
