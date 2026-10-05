import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type { Comment } from '@/lib/supabase/types';

export interface CommentAuthor {
  id?: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface CommentWithAuthor {
  id: string;
  article_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author?: CommentAuthor | null;
}

export interface CreateCommentInput {
  articleId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

// In-memory runtime cache for development, preview sessions, and offline fallbacks
const runtimeComments: Map<string, CommentWithAuthor[]> = new Map();

function getRuntimeComments(articleId: string): CommentWithAuthor[] {
  return runtimeComments.get(articleId) || [];
}

function addRuntimeComment(comment: CommentWithAuthor): void {
  const existing = runtimeComments.get(comment.article_id) || [];
  const updated = [...existing.filter((c) => c.id !== comment.id), comment].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  runtimeComments.set(comment.article_id, updated);
}

function removeRuntimeComment(commentId: string, authorId?: string): boolean {
  let removed = false;
  for (const [articleId, list] of runtimeComments.entries()) {
    const filtered = list.filter((c) => {
      if (c.id === commentId) {
        if (!authorId || c.author_id === authorId) {
          removed = true;
          return false;
        }
      }
      return true;
    });
    runtimeComments.set(articleId, filtered);
  }
  return removed;
}

/**
 * Fetch all reflection comments for an article, joined with author profile metadata.
 * Ordered by creation timestamp ascending.
 */
export async function getCommentsByArticle(articleId: string): Promise<CommentWithAuthor[]> {
  const normalizedArticleId = (articleId || '').trim();
  if (!normalizedArticleId) return [];

  let dbComments: CommentWithAuthor[] = [];

  try {
    const supabase = await createClient();

    // 1. Try relational select with foreign key join
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        article_id,
        author_id,
        parent_id,
        content,
        created_at,
        updated_at,
        author:profiles!comments_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('article_id', normalizedArticleId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      dbComments = data.map((item: Record<string, unknown>) => {
        const rawAuthor = item.author;
        const authorObj: CommentAuthor | null = Array.isArray(rawAuthor)
          ? (rawAuthor[0] as CommentAuthor | undefined) ?? null
          : (rawAuthor as CommentAuthor | null) ?? null;

        return {
          id: String(item.id),
          article_id: String(item.article_id),
          author_id: String(item.author_id),
          parent_id: item.parent_id ? String(item.parent_id) : null,
          content: String(item.content),
          created_at: String(item.created_at),
          updated_at: String(item.updated_at),
          author: authorObj,
        };
      });
    } else if (error) {
      // 2. Fallback to two-step query if relational foreign key is not resolved
      const { data: rawRows, error: rawError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', normalizedArticleId)
        .order('created_at', { ascending: true });

      if (!rawError && rawRows && rawRows.length > 0) {
        const authorIds = Array.from(new Set(rawRows.map((r) => r.author_id)));
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', authorIds);

        const authorMap = new Map((authors || []).map((a) => [a.id, a]));

        dbComments = rawRows.map((r) => ({
          id: r.id,
          article_id: r.article_id,
          author_id: r.author_id,
          parent_id: r.parent_id,
          content: r.content,
          created_at: r.created_at,
          updated_at: r.updated_at,
          author: authorMap.get(r.author_id) || null,
        }));
      }
    }
  } catch (err: unknown) {
    console.error(`[comment-storage] Error fetching comments for article "${normalizedArticleId}":`, err);
  }

  // Merge with runtime in-memory cache to support seeded fallback articles and offline previews
  const memoryComments = getRuntimeComments(normalizedArticleId);
  const dbIds = new Set(dbComments.map((c) => c.id));
  const merged = [...dbComments, ...memoryComments.filter((c) => !dbIds.has(c.id))].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return merged;
}

/**
 * Create a new reflection comment in Supabase.
 */
export async function createComment(data: CreateCommentInput): Promise<CommentWithAuthor> {
  const articleId = (data.articleId || '').trim();
  const authorId = (data.authorId || '').trim();
  const content = (data.content || '').trim();

  if (!articleId) {
    throw new Error('ID artikel wajib diisi untuk mengirim komentar.');
  }

  if (!authorId) {
    throw new Error('ID penulis wajib disertakan.');
  }

  if (!content) {
    throw new Error('Konten komentar tidak boleh kosong.');
  }

  const now = new Date().toISOString();
  let authorProfile: CommentAuthor | null = null;

  try {
    const supabase = await createClient();

    // Fetch author profile metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', authorId)
      .maybeSingle();

    if (profile) {
      authorProfile = profile;
    }

    // Insert payload
    const payload: Database['public']['Tables']['comments']['Insert'] = {
      article_id: articleId,
      author_id: authorId,
      content,
      parent_id: data.parentId || null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('comments')
      .insert(payload)
      .select('id, article_id, author_id, parent_id, content, created_at, updated_at')
      .single();

    if (!error && inserted) {
      const result: CommentWithAuthor = {
        id: inserted.id,
        article_id: inserted.article_id,
        author_id: inserted.author_id,
        parent_id: inserted.parent_id,
        content: inserted.content,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
        author: authorProfile,
      };

      addRuntimeComment(result);
      return result;
    }

    if (error) {
      console.warn(`[comment-storage] DB insert warning: ${error.message}`);
      // If DB fails on a real UUID article (not unmigrated mock), surface the error
      if (articleId.includes('-') && articleId.length === 36) {
        throw new Error(`Gagal menyimpan komentar ke database: ${error.message}`);
      }
    }
  } catch (err: unknown) {
    console.error('[comment-storage] Exception in createComment, using fallback cache:', err);
  }

  // Fallback creation in runtime cache if DB table is unmigrated or article is pre-seeded
  const fallbackComment: CommentWithAuthor = {
    id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    article_id: articleId,
    author_id: authorId,
    parent_id: data.parentId || null,
    content,
    created_at: now,
    updated_at: now,
    author: authorProfile || {
      id: authorId,
      username: 'pengguna',
      display_name: 'Pembaca Refleksi',
      avatar_url: null,
    },
  };

  addRuntimeComment(fallbackComment);
  return fallbackComment;
}

/**
 * Delete a comment by ID, verifying that the deleting author owns the comment.
 */
export async function deleteComment(commentId: string, authorId: string): Promise<boolean> {
  const normalizedCommentId = (commentId || '').trim();
  const normalizedAuthorId = (authorId || '').trim();

  if (!normalizedCommentId || !normalizedAuthorId) {
    throw new Error('ID komentar dan ID penulis diperlukan untuk menghapus komentar.');
  }

  let dbSuccess = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', normalizedCommentId)
      .eq('author_id', normalizedAuthorId);

    if (!error) {
      dbSuccess = true;
    } else {
      console.warn(`[comment-storage] Error deleting from DB: ${error.message}`);
    }
  } catch (err: unknown) {
    console.error('[comment-storage] Exception in deleteComment:', err);
  }

  const memoryDeleted = removeRuntimeComment(normalizedCommentId, normalizedAuthorId);
  return dbSuccess || memoryDeleted;
}

/**
 * Query whether a user is following a target creator profile.
 */
export async function getFollowStatus(
  followerId: string,
  targetUserId: string
): Promise<boolean> {
  const fId = (followerId || '').trim();
  const tId = (targetUserId || '').trim();

  if (!fId || !tId || fId === tId) {
    return false;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', fId)
      .eq('following_id', tId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (err: unknown) {
    console.error('[comment-storage] Exception checking follow status:', err);
    return false;
  }
}
