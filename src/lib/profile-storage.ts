import { createClient } from '@/lib/supabase/server';
import type { Database, Profile } from '@/lib/supabase/types';
import { DEFAULT_TENANT_ARTICLES } from '@/lib/tenant-storage';

export type { Profile } from '@/lib/supabase/types';

export interface UpdateProfileInput {
  displayName?: string;
  display_name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  bannerUrl?: string | null;
  banner_url?: string | null;
  website?: string | null;
  facebookProfileUrl?: string | null;
  facebook_profile_url?: string | null;
  facebookAccessToken?: string | null;
  facebook_access_token?: string | null;
}

export interface ProfileStats {
  followersCount: number;
  followingCount: number;
  articlesCount: number;
}

/**
 * Fetch a creator profile by their unique subdomain username.
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const normalized = (username || '').trim().toLowerCase();
  if (!normalized) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', normalized)
      .maybeSingle();

    if (error) {
      console.error(`[profile-storage] Error fetching profile by username "${normalized}":`, error.message);
      return null;
    }

    return data;
  } catch (err: unknown) {
    console.error(`[profile-storage] Exception in getProfileByUsername:`, err);
    return null;
  }
}

/**
 * Fetch a creator profile by their Supabase auth user UUID.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[profile-storage] Error fetching profile by id "${userId}":`, error.message);
      return null;
    }

    return data;
  } catch (err: unknown) {
    console.error(`[profile-storage] Exception in getProfileById:`, err);
    return null;
  }
}

/**
 * Build the sanitized update payload for updating a creator profile.
 * Correctly distinguishes between explicit null / empty removal vs omitted undefined fields.
 */
export function buildProfileUpdatePayload(
  data: UpdateProfileInput
): Database['public']['Tables']['profiles']['Update'] {
  const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  const displayName = data.displayName !== undefined ? data.displayName : data.display_name;
  if (displayName !== undefined && displayName.trim()) {
    updatePayload.display_name = displayName.trim();
  }

  const bio = data.bio;
  if (bio !== undefined) {
    updatePayload.bio = bio && bio.trim() ? bio.trim() : null;
  }

  const avatarUrl = data.avatarUrl !== undefined ? data.avatarUrl : data.avatar_url;
  if (avatarUrl !== undefined) {
    updatePayload.avatar_url = avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : null;
  }

  const bannerUrl = data.bannerUrl !== undefined ? data.bannerUrl : data.banner_url;
  if (bannerUrl !== undefined) {
    updatePayload.banner_url = bannerUrl && bannerUrl.trim() ? bannerUrl.trim() : null;
  }

  const website = data.website;
  if (website !== undefined) {
    updatePayload.website = website && website.trim() ? website.trim() : null;
  }

  const facebookProfileUrl =
    data.facebookProfileUrl !== undefined ? data.facebookProfileUrl : data.facebook_profile_url;
  if (facebookProfileUrl !== undefined) {
    updatePayload.facebook_profile_url =
      facebookProfileUrl && facebookProfileUrl.trim() ? facebookProfileUrl.trim() : null;
  }

  const facebookAccessToken =
    data.facebookAccessToken !== undefined ? data.facebookAccessToken : data.facebook_access_token;
  if (facebookAccessToken !== undefined) {
    updatePayload.facebook_access_token =
      facebookAccessToken && facebookAccessToken.trim() ? facebookAccessToken.trim() : null;
  }

  return updatePayload;
}

/**
 * Update creator profile details.
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
): Promise<Profile> {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }

  const supabase = await createClient();
  const updatePayload = buildProfileUpdatePayload(data);

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to update profile');
  }

  return updated;
}

/**
 * Fetch social stats for a creator profile (followers, following, articles count).
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  if (!userId) {
    return { followersCount: 0, followingCount: 0, articlesCount: 0 };
  }

  try {
    const supabase = await createClient();

    const [followersRes, followingRes, articlesRes] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId),
    ]);

    let articlesCount = articlesRes.count ?? 0;

    // Fallback count from default articles if DB has no records for this author
    if (articlesCount === 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.username) {
        const fallbackCount = DEFAULT_TENANT_ARTICLES.filter(
          (a) => a.username.toLowerCase() === profile.username.toLowerCase()
        ).length;
        if (fallbackCount > 0) {
          articlesCount = fallbackCount;
        }
      }
    }

    return {
      followersCount: followersRes.count ?? 0,
      followingCount: followingRes.count ?? 0,
      articlesCount,
    };
  } catch (err: unknown) {
    console.error(`[profile-storage] Error getting profile stats for ${userId}:`, err);
    return { followersCount: 0, followingCount: 0, articlesCount: 0 };
  }
}
