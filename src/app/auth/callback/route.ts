import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSessionCookieOptions } from '@/lib/supabase/cookie';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    try {
      const cookieStore = await cookies();
      const host = request.headers.get('host') || '';
      const cookieOptions = getSessionCookieOptions(host);

      // Track cookies that need to be set on the redirect response
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

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        // Check if user has completed onboarding with a chosen username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .maybeSingle();

        let targetUrl: string;
        if (!profile?.username) {
          targetUrl = `${origin}/onboarding`;
        } else if (next === "/") {
          // Default: redirect to creator's profile subdomain
          targetUrl = `https://${profile.username}.letmehearyou.id/`;
        } else {
          const redirectPath = next.startsWith("/") ? next : `/${next}`;
          targetUrl = `${origin}${redirectPath}`;
        }

        const response = NextResponse.redirect(targetUrl);
        responseCookies.forEach(({ name, value, options }) => {
          // Explicitly attach all session cookies to the redirect response
          response.cookies.set(name, value, options);
        });

        return response;
      }
    } catch (err) {
      console.error('Auth callback exchange error:', err);
    }
  }

  // Fallback to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
