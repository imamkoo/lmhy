import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername, getProfileStats } from "@/lib/profile-storage";
import { getArticlesByUsername } from "@/lib/article-storage";
import { ProfileBanner } from "./components/ProfileBanner";
import { ProfileTabs } from "./components/ProfileTabs";
import { EditProfileModal } from "./components/EditProfileModal";
import type { Profile } from "@/lib/supabase/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const normalized = (username || "").trim().toLowerCase();

  return {
    title: `@${normalized} — Ruang Refleksi | Let Me Hear You`,
    description: `Kumpulan tulisan, refleksi batin, dan sertifikat digital Litera NFT resmi oleh @${normalized} di Let Me Hear You.`,
  };
}

export default async function TenantProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = (rawUsername || "").trim().toLowerCase();

  if (!username) {
    notFound();
  }

  // 1. Fetch profile from Supabase. Unknown usernames must 404 —
  // never render a placeholder profile for unregistered subdomains.
  const profile: Profile | null = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // 2. Fetch all creator articles
  const articles = await getArticlesByUsername(username);

  // 3. Fetch social & publication stats
  const stats = await getProfileStats(profile.id);
  if (stats.articlesCount === 0 && articles.length > 0) {
    stats.articlesCount = articles.length;
  }

  // 4. Authenticate current visitor/author session
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const isOwnProfile = Boolean(currentUser && currentUser.id === profile.id);

  // 5. Check if current user is following this creator
  let isFollowing = false;
  if (currentUser && !isOwnProfile) {
    try {
      const { data: followRow } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id)
        .maybeSingle();

      isFollowing = Boolean(followRow);
    } catch {
      // Ignored for unauthenticated or fallback states
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-4 py-8 text-slate-900 sm:px-6 md:px-12 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <a href="https://letmehearyou.id" className="inline-flex shrink-0 items-center" aria-label="Ke beranda Let Me Hear You">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/LMHY.png" alt="Let Me Hear You" className="h-6 w-auto max-w-[50vw] object-contain sm:h-9" />
          </a>
          <a
            href="https://letmehearyou.id"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-[#3F3766] shadow-xs backdrop-blur-xs transition hover:bg-[#F7ABC5]/20 hover:text-[#3F3766] sm:border-transparent sm:bg-transparent sm:px-3 sm:py-2 sm:shadow-none"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Beranda</span>
          </a>
        </div>

        {/* Profile Banner with Cover, Avatar, Bio, Subdomain, & Actions */}
        <ProfileBanner
          profile={profile}
          stats={stats}
          isOwnProfile={isOwnProfile}
          initialIsFollowing={isFollowing}
        />

        {/* Medium-style Tabs: Refleksi & Tulisan, Litera NFT Certificates, Tentang Penulis */}
        <ProfileTabs
          articles={articles}
          profile={profile}
          username={username}
          isOwnProfile={isOwnProfile}
        />

        {/* Modal for Creator to update profile details */}
        {isOwnProfile && <EditProfileModal profile={profile} />}

        {/* Global Footer */}
        <footer className="mt-20 border-t border-slate-200/80 pt-8 text-center text-xs text-slate-500">
          <p>
            Diterbitkan melalui <strong>Let Me Hear You Creator Network</strong>. Terintegrasi dengan protokol <strong>Litera Web3</strong> di Polygon Mainnet.
          </p>
        </footer>
      </div>
    </main>
  );
}
