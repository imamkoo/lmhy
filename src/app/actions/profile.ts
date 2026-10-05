'use server';

import { createClient } from '@/lib/supabase/server';
import { updateProfile, UpdateProfileInput, Profile } from '@/lib/profile-storage';
import { revalidatePath } from 'next/cache';

export interface ProfileActionResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export interface FollowActionResult {
  success: boolean;
  isFollowing?: boolean;
  error?: string;
}

/**
 * Server action to update creator profile (Display Name, Bio, Avatar, Banner, Website, etc.)
 * Verifies that the authenticated user owns the profile being updated.
 */
export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<ProfileActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Sesi masuk tidak ditemukan. Silakan masuk terlebih dahulu untuk memperbarui profil.',
      };
    }

    const updated = await updateProfile(user.id, data);

    // Revalidate paths for instant UI reflection
    if (updated.username) {
      revalidatePath(`/tenant/${updated.username}`);
      revalidatePath(`/tenant/${updated.username}/[slug]`);
    }
    revalidatePath('/');

    return {
      success: true,
      profile: updated,
    };
  } catch (err: unknown) {
    console.error('[updateProfileAction] Error updating profile:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal memperbarui profil pengguna.',
    };
  }
}

/**
 * Server action to toggle follow/unfollow for a creator.
 */
export async function toggleFollowAction(
  targetUserId: string
): Promise<FollowActionResult> {
  if (!targetUserId) {
    return { success: false, error: 'Target user ID is required.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Sesi masuk tidak ditemukan. Silakan masuk terlebih dahulu untuk mengikuti kreator.',
      };
    }

    if (user.id === targetUserId) {
      return {
        success: false,
        error: 'Anda tidak dapat mengikuti akun Anda sendiri.',
      };
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existing) {
      // Unfollow
      const { error: delError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (delError) {
        return { success: false, error: delError.message };
      }
      return { success: true, isFollowing: false };
    } else {
      // Follow
      const { error: insError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (insError) {
        return { success: false, error: insError.message };
      }
      return { success: true, isFollowing: true };
    }
  } catch (err: unknown) {
    console.error('[toggleFollowAction] Error toggling follow:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mengubah status mengikuti.',
    };
  }
}
