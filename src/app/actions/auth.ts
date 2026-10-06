'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  USERNAME_REGEX,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  RESERVED_USERNAMES,
} from '@/lib/auth-constants';
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from '@/lib/rate-limit';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  url?: string;
  needsConfirmation?: boolean;
  needsOnboarding?: boolean;
  username?: string;
  retryAfterSeconds?: number;
}

export interface AvailabilityResult {
  available: boolean;
  error?: string;
}

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get('host') || 'letmehearyou.id';
  const proto = headerStore.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function checkUsernameAvailabilityAction(rawUsername: string): Promise<AvailabilityResult> {
  const username = (rawUsername || '').trim().toLowerCase();

  if (!username) {
    return { available: false, error: 'Username tidak boleh kosong.' };
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return { available: false, error: `Username minimal ${MIN_USERNAME_LENGTH} karakter.` };
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return { available: false, error: `Username maksimal ${MAX_USERNAME_LENGTH} karakter.` };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      available: false,
      error: 'Username hanya boleh memuat huruf kecil (a-z), angka (0-9), dan tanda hubung (-).',
    };
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    return {
      available: false,
      error: 'Username tidak boleh diawali atau diakhiri dengan tanda hubung (-).',
    };
  }

  if (username.includes('--')) {
    return {
      available: false,
      error: 'Username tidak boleh memuat tanda hubung ganda (--).',
    };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return {
      available: false,
      error: `Username "${username}" merupakan kata cadangan sistem dan tidak dapat digunakan.`,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      // If table doesn't exist or query failed, don't silently block
      return { available: true };
    }

    if (data) {
      return { available: false, error: 'Username ini sudah digunakan oleh kreator lain.' };
    }

    return { available: true };
  } catch (err: unknown) {
    console.error('Error checking username availability:', err);
    return { available: true };
  }
}

export async function completeOnboardingAction(
  rawUsername: string,
  rawDisplayName: string
): Promise<AuthActionResult> {
  const username = (rawUsername || '').trim().toLowerCase();
  const displayName = (rawDisplayName || '').trim();

  if (!displayName || displayName.length < 2) {
    return { success: false, error: 'Nama tampilan minimal 2 karakter.' };
  }

  if (displayName.length > 60) {
    return { success: false, error: 'Nama tampilan maksimal 60 karakter.' };
  }

  const availability = await checkUsernameAvailabilityAction(username);
  if (!availability.available) {
    return { success: false, error: availability.error || 'Username tidak valid atau sudah dipakai.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Sesi masuk tidak ditemukan. Silakan masuk kembali terlebih dahulu.',
      };
    }

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    const { error: insertError } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, username };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan profil.';
    return { success: false, error: message };
  }
}

export async function signInWithGoogleAction(redirectTo?: string): Promise<AuthActionResult> {
  try {
    const origin = await getOrigin();
    const target = redirectTo || '/builder';
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(target)}`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menginisiasi login Google.';
    return { success: false, error: message };
  }
}

export async function signInWithFacebookAction(redirectTo?: string): Promise<AuthActionResult> {
  try {
    const origin = await getOrigin();
    const target = redirectTo || '/builder';
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(target)}`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: callbackUrl,
        scopes: 'public_profile,email',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menginisiasi login Facebook.';
    return { success: false, error: message };
  }
}

export async function signInWithEmailAction(
  input: FormData | { email: string; password: string }
): Promise<AuthActionResult> {
  let email = '';
  let password = '';

  if (input instanceof FormData) {
    email = String(input.get('email') || '').trim();
    password = String(input.get('password') || '').trim();
  } else {
    email = (input.email || '').trim();
    password = (input.password || '').trim();
  }

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' };
  }

  // Rate Limiting & Cooldown Protection (Anti-Bruteforce / DDoS)
  const headerStore = await headers();
  const clientIp = headerStore.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';
  const rateLimitKey = `${clientIp}:${email.toLowerCase()}`;

  const rateCheck = checkLoginRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Terlalu banyak percobaan gagal. Silakan tunggu ${rateCheck.retryAfterSeconds} detik sebelum mencoba kembali.`,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const record = recordFailedLoginAttempt(rateLimitKey);
      if (record.blocked) {
        return {
          success: false,
          error: `Percobaan login gagal 3 kali. Akun ditangguhkan sementara selama ${record.retryAfterSeconds} detik.`,
          retryAfterSeconds: record.retryAfterSeconds,
        };
      }
      return {
        success: false,
        error: `${error.message} (Sisa percobaan: ${record.attemptsLeft})`,
      };
    }

    if (!data.user) {
      return { success: false, error: 'Gagal mengautentikasi pengguna.' };
    }

    // Login sukses: reset failed attempts
    resetLoginAttempts(rateLimitKey);

    // Check if user already completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      success: true,
      needsOnboarding: !profile?.username,
      username: profile?.username,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal masuk akun.';
    return { success: false, error: message };
  }
}

export async function signUpWithEmailAction(
  input: FormData | { email: string; password: string; displayName?: string }
): Promise<AuthActionResult> {
  let email = '';
  let password = '';
  let displayName = '';

  if (input instanceof FormData) {
    email = String(input.get('email') || '').trim();
    password = String(input.get('password') || '').trim();
    displayName = String(input.get('displayName') || '').trim();
  } else {
    email = (input.email || '').trim();
    password = (input.password || '').trim();
    displayName = (input.displayName || '').trim();
  }

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      needsConfirmation: !data.session && !!data.user,
      needsOnboarding: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mendaftarkan akun.';
    return { success: false, error: message };
  }
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err: unknown) {
    console.error('[auth] Error in signOutAction:', err);
  }
  redirect('/login');
}
