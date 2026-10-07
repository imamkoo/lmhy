"use client";

import { ProfileBanner } from "@/app/tenant/[username]/components/ProfileBanner";
import { EditProfileModal } from "@/app/tenant/[username]/components/EditProfileModal";
import type { Profile } from "@/lib/supabase/types";

const profile = {
  id: "11111111-2222-4333-8444-555555555555",
  username: "axaalexxa",
  display_name: "Axaalexxa",
  bio: null,
  avatar_url: "https://lh3.googleusercontent.com/test-avatar",
  banner_url: null,
  website: null,
  facebook_profile_url: null,
  facebook_access_token: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
} as Profile;

export default function DevProbeCardPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <ProfileBanner
        profile={profile}
        stats={{ followersCount: 0, followingCount: 0, articlesCount: 0 }}
        isOwnProfile
      />
      <EditProfileModal profile={profile} />
    </div>
  );
}
