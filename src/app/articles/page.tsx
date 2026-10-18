import { createClient } from "@/lib/supabase/server";
import { getAllPublicArticles } from "@/lib/article-storage";
import { ArticlesPortalClient } from "./ArticlesPortalClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Warta & Karya Tulis Komunitas | Let Me Hear You",
  description:
    "Ruang publikasi dan warta kesehatan mental resmi karya kontributor, praktisi, dan pendamping Let Me Hear You. Eksplorasi cerita, esai, dan panduan hidup berkesadaran.",
  openGraph: {
    title: "Portal Warta & Karya Tulis Komunitas | Let Me Hear You",
    description:
      "Ruang publikasi dan warta kesehatan mental resmi karya kontributor dan praktisi Let Me Hear You.",
    url: "https://letmehearyou.id/articles",
    type: "website",
  },
};

export default async function ArticlesPage() {
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

  // Fetch recent public articles
  const articles = await getAllPublicArticles(36);

  // Fetch top authors/creators who have written articles
  const { data: topProfiles } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio, creator_role")
    .not("username", "is", null)
    .limit(8);

  return (
    <ArticlesPortalClient
      articles={articles}
      authors={topProfiles || []}
      initialUser={user}
      initialProfile={initialProfile}
    />
  );
}
