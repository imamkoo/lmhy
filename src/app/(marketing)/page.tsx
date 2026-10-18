import { LandingPage } from "@/components/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";
import { getLandingShowcase } from "@/lib/article-storage";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();
    initialProfile = profile;
  }

  // Fetch showcase articles (top + newest) for landing page showcase
  const recentArticles = await getLandingShowcase();

  return (
    <LandingPage
      initialUser={user}
      initialProfile={initialProfile}
      recentArticles={recentArticles}
    />
  );
}
