import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSessionCookieOptions } from '@/lib/supabase/cookie';
import {
  parseVerificationParams,
  safeNextPath,
  selectPendingApplicationsToVerify,
} from '@/lib/mitra/email-verification';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const verification = parseVerificationParams(searchParams);
  const requestedNext = searchParams.get("next");
  const next = verification ? safeNextPath(requestedNext) : (requestedNext || "/");

  if (!code && !verification) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  try {
    const cookieStore = await cookies();
    const host = request.headers.get('host') || '';
    const cookieOptions = getSessionCookieOptions(host);

    const responseCookies: Array<{
      name: string;
      value: string;
      options: Record<string, unknown>;
    }> = [];

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookieOptions,
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const merged = {
                ...options,
                ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
              };
              cookieStore.set(name, value, merged);
              responseCookies.push({ name, value, options: merged });
            });
          },
        },
      }
    );

    let data: Awaited<ReturnType<typeof supabase.auth.verifyOtp>>["data"];
    let error: Awaited<ReturnType<typeof supabase.auth.verifyOtp>>["error"];

    if (verification) {
      ({ data, error } = await supabase.auth.verifyOtp({
        token_hash: verification.tokenHash,
        type: verification.type as EmailOtpType,
      }));
    } else {
      ({ data, error } = await supabase.auth.exchangeCodeForSession(
        code as string
      ));
    }

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    if (verification) {
      await markApplicationsVerified(data.user.id, data.user.email);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user.id)
      .maybeSingle();

    let targetUrl: string;
    if (!profile?.username) {
      targetUrl = `${origin}/onboarding`;
    } else if (verification) {
      targetUrl = `${origin}${next}`;
    } else if (next === "/") {
      targetUrl = `https://${profile.username}.letmehearyou.id/`;
    } else {
      const redirectPath = next.startsWith("/") ? next : `/${next}`;
      targetUrl = `${origin}${redirectPath}`;
    }

    const response = NextResponse.redirect(targetUrl);
    responseCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (err) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
}

async function markApplicationsVerified(
  userId: string,
  email: string | undefined
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const admin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: applications, error } = await admin
    .from('provider_applications')
    .select('id, applied_at, status, email_verified_at')
    .eq('user_id', userId)
    .eq('status', 'PENDING');

  if (error || !applications) return;

  const ids = selectPendingApplicationsToVerify(applications);
  if (ids.length === 0) return;

  const { error: updateError } = await admin
    .from('provider_applications')
    .update({ email_verified_at: new Date().toISOString() })
    .in('id', ids)
    .is('email_verified_at', null);

  if (updateError) {
    console.error('Failed to mark applications verified:', updateError.message, {
      userId,
      email,
    });
  }
}
