import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/builder';

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        // Check if user has completed onboarding with a chosen username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile?.username) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Return user to requested path
        const redirectPath = next.startsWith('/') ? next : `/${next}`;
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    } catch (err) {
      console.error('Auth callback exchange error:', err);
    }
  }

  // Fallback to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
