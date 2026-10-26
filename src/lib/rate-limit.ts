/**
 * In-memory sliding-window rate limiter untuk proteksi brute force login email.
 * Jika login gagal 3 kali dalam jendela 1 menit, IP/identifier akan dibekukan selama 30 detik.
 * Limiter yang sama dipakai untuk permintaan reset kata sandi dengan kuota lebih ketat.
 */

interface AttemptRecord {
  count: number;
  blockedUntil: number | null;
  lastAttempt: number;
}

const attemptsMap = new Map<string, AttemptRecord>();

// Bersihkan record lama setiap 5 menit agar memori tetap hemat
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptsMap.entries()) {
      if (now - record.lastAttempt > 10 * 60 * 1000) {
        attemptsMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();
}

const MAX_FAILED_ATTEMPTS = 3;
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 detik

const PASSWORD_RESET_MAX_REQUESTS = 3;
const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000;

const passwordResetMap = new Map<string, { count: number; windowStart: number }>();

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = attemptsMap.get(identifier);

  if (!record) {
    return { allowed: true };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, remainingSeconds),
    };
  }

  // Jika durasi blokir sudah lewat, reset
  if (record.blockedUntil && now >= record.blockedUntil) {
    attemptsMap.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(identifier: string): {
  blocked: boolean;
  retryAfterSeconds?: number;
  attemptsLeft: number;
} {
  const now = Date.now();
  const record = attemptsMap.get(identifier) || {
    count: 0,
    blockedUntil: null,
    lastAttempt: now,
  };

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + COOLDOWN_DURATION_MS;
    attemptsMap.set(identifier, record);
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(COOLDOWN_DURATION_MS / 1000),
      attemptsLeft: 0,
    };
  }

  attemptsMap.set(identifier, record);
  return {
    blocked: false,
    attemptsLeft: MAX_FAILED_ATTEMPTS - record.count,
  };
}

export function resetLoginAttempts(identifier: string) {
  attemptsMap.delete(identifier);
}

export function checkPasswordResetLimit(identifier: string, now = Date.now()): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const record = passwordResetMap.get(identifier);
  if (!record) return { allowed: true };

  if (now - record.windowStart >= PASSWORD_RESET_WINDOW_MS) {
    passwordResetMap.delete(identifier);
    return { allowed: true };
  }

  if (record.count >= PASSWORD_RESET_MAX_REQUESTS) {
    const remainingMs = record.windowStart + PASSWORD_RESET_WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  return { allowed: true };
}

export function recordPasswordResetRequest(identifier: string, now = Date.now()) {
  const record = passwordResetMap.get(identifier);
  if (!record || now - record.windowStart >= PASSWORD_RESET_WINDOW_MS) {
    passwordResetMap.set(identifier, { count: 1, windowStart: now });
    return;
  }
  record.count += 1;
}

export function resetPasswordResetLimit(identifier: string) {
  passwordResetMap.delete(identifier);
}
