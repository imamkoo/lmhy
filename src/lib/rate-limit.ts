/**
 * In-memory sliding-window rate limiter untuk proteksi brute force login email.
 * Jika login gagal 3 kali dalam jendela 1 menit, IP/identifier akan dibekukan selama 30 detik.
 */

interface AttemptRecord {
  count: number;
  blockedUntil: number | null;
  lastAttempt: number;
}

const attemptsMap = new Map<string, AttemptRecord>();

// Bersihkan record lama setiap 5 menit agar memori tetap hemat
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptsMap.entries()) {
      if (now - record.lastAttempt > 10 * 60 * 1000) {
        attemptsMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

const MAX_FAILED_ATTEMPTS = 3;
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 detik

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
