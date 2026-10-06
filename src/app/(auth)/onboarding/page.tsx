import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingForm from './OnboardingForm';

/**
 * Server Component untuk segmen route /onboarding.
 *
 * `force-dynamic` memastikan verifikasi sesi selalu dijalankan per-request
 * di sisi server dari HTTP cookies, mencegah flash/bouncing di client.
 */
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/onboarding');
  }

  // Cek apakah pengguna sudah pernah menyelesaikan onboarding & memiliki username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.username) {
    redirect(`/builder?username=${profile.username}`);
  }

  const metaName =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    '';

  const rawCandidate = metaName || (user.email ? user.email.split('@')[0] : '');
  const candidate = rawCandidate
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);

  return (
    <OnboardingForm
      initialDisplayName={metaName}
      initialUsernameCandidate={candidate.length >= 3 ? candidate : ''}
    />
  );
}
