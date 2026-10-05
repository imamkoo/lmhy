'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createComment,
  deleteComment,
  CommentWithAuthor,
} from '@/lib/comment-storage';
import { revalidatePath } from 'next/cache';

export interface FollowActionResult {
  isFollowing: boolean;
  error?: string;
}

export interface PostCommentActionResult {
  success: boolean;
  comment?: CommentWithAuthor;
  error?: string;
}

export interface DeleteCommentActionResult {
  success: boolean;
  error?: string;
}

/**
 * Toggle follow/unfollow for a creator profile.
 * Requires authenticated session.
 */
export async function toggleFollowAction(targetUserId: string): Promise<FollowActionResult> {
  const normalizedTargetId = (targetUserId || '').trim();

  if (!normalizedTargetId) {
    return { isFollowing: false, error: 'Target ID kreator wajib diisi.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isFollowing: false,
        error: 'Silakan masuk terlebih dahulu untuk mengikuti kreator ini.',
      };
    }

    if (user.id === normalizedTargetId) {
      return {
        isFollowing: false,
        error: 'Anda tidak dapat mengikuti profil Anda sendiri.',
      };
    }

    // Check existing follow record
    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', normalizedTargetId)
      .maybeSingle();

    if (existing) {
      // Unfollow
      const { error: delError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', normalizedTargetId);

      if (delError) {
        return { isFollowing: true, error: delError.message };
      }

      revalidatePath('/');
      return { isFollowing: false };
    } else {
      // Follow
      const { error: insError } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: normalizedTargetId,
      });

      if (insError) {
        return { isFollowing: false, error: insError.message };
      }

      revalidatePath('/');
      return { isFollowing: true };
    }
  } catch (err: unknown) {
    console.error('[community-action] Error toggling follow:', err);
    return {
      isFollowing: false,
      error: err instanceof Error ? err.message : 'Gagal memperbarui status mengikuti.',
    };
  }
}

/**
 * Post a new reflection comment on an article.
 * Requires authenticated session.
 */
export async function postCommentAction(
  articleId: string,
  content: string,
  parentId?: string
): Promise<PostCommentActionResult> {
  const normalizedArticleId = (articleId || '').trim();
  const normalizedContent = (content || '').trim();

  if (!normalizedArticleId) {
    return { success: false, error: 'ID artikel wajib disertakan.' };
  }

  if (!normalizedContent) {
    return { success: false, error: 'Komentar refleksi tidak boleh kosong.' };
  }

  if (normalizedContent.length > 2000) {
    return { success: false, error: 'Komentar maksimal 2.000 karakter.' };
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
        error: 'Silakan masuk terlebih dahulu untuk meninggalkan komentar refleksi.',
      };
    }

    const newComment = await createComment({
      articleId: normalizedArticleId,
      authorId: user.id,
      content: normalizedContent,
      parentId: parentId || undefined,
    });

    revalidatePath('/');
    return {
      success: true,
      comment: newComment,
    };
  } catch (err: unknown) {
    console.error('[community-action] Error posting comment:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mempublikasikan komentar.',
    };
  }
}

/**
 * Delete a reflection comment authored by the current user.
 */
export async function deleteCommentAction(commentId: string): Promise<DeleteCommentActionResult> {
  const normalizedCommentId = (commentId || '').trim();

  if (!normalizedCommentId) {
    return { success: false, error: 'ID komentar wajib diisi.' };
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
        error: 'Sesi masuk tidak ditemukan. Silakan masuk terlebih dahulu.',
      };
    }

    const success = await deleteComment(normalizedCommentId, user.id);
    if (!success) {
      return {
        success: false,
        error: 'Gagal menghapus komentar atau Anda tidak memiliki hak akses.',
      };
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    console.error('[community-action] Error deleting comment:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal menghapus komentar.',
    };
  }
}
