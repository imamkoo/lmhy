import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Article, Database } from '@/lib/supabase/types';
import { DEFAULT_TENANT_ARTICLES, TenantArticle } from '@/lib/tenant-storage';

export type { Article } from '@/lib/supabase/types';

export interface InsertArticleInput {
  author_id?: string;
  authorId?: string;
  username: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[] | null;
  media_type?: 'IMAGE' | 'VIDEO' | null;
  mediaType?: 'IMAGE' | 'VIDEO' | null;
  media_url?: string | null;
  mediaUrl?: string | null;
  register_litera?: boolean | null;
  registerLitera?: boolean | null;
  creator_wallet?: string | null;
  creatorWallet?: string | null;
  template_id?: string | null;
  templateId?: string | null;
  published_at?: string;
  publishedAt?: string;
}

/**
 * Converts a legacy in-memory TenantArticle into the persistent Article schema.
 */
export function convertTenantArticleToArticle(ta: TenantArticle, authorId?: string): Article {
  return {
    id: ta.id,
    author_id: authorId || '00000000-0000-0000-0000-000000000000',
    username: ta.username.toLowerCase(),
    slug: ta.slug,
    title: ta.title,
    excerpt: ta.excerpt,
    content: ta.content,
    tags: ta.tags || null,
    media_type: ta.mediaType ?? 'IMAGE',
    media_url: ta.mediaUrl ?? '/assets/sapiens.png',
    register_litera: ta.isLiteraRegistered ?? false,
    creator_wallet: null,
    template_id: ta.templateId ?? 'warm-sanctuary',
    published_at: ta.createdAt,
    updated_at: ta.createdAt,
    litera_operation_id: null,
    litera_intent_id: null,
    litera_status: ta.isLiteraRegistered ? 'REGISTERED' : null,
    litera_tx_hash: null,
    litera_token_id: null,
    litera_failure_code: null,
    litera_failure_message: null,
    litera_updated_at: null,
  };
}

/**
 * Fetch all articles for a creator by their subdomain username.
 * Combines Supabase records with fallback to default seeded articles if unseeded.
 */
export async function getArticlesByUsername(username: string): Promise<Article[]> {
  const normalizedUser = (username || '').trim().toLowerCase();
  if (!normalizedUser) return [];

  let dbArticles: Article[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('username', normalizedUser)
      .order('published_at', { ascending: false });

    if (!error && data) {
      dbArticles = data;
    }
  } catch (err: unknown) {
    console.error(`[article-storage] Error querying articles for @${normalizedUser}:`, err);
  }

  // Find fallback default articles for this username that are not already present in DB
  const existingSlugs = new Set(dbArticles.map((a) => a.slug));
  const fallbackArticles = DEFAULT_TENANT_ARTICLES
    .filter((a) => a.username.toLowerCase() === normalizedUser && !existingSlugs.has(a.slug))
    .map((a) => convertTenantArticleToArticle(a));

  const allArticles = [...dbArticles, ...fallbackArticles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return allArticles;
}

/**
 * Fetch a single article by author username and slug.
 */
export async function getArticleBySlug(
  username: string,
  slug: string
): Promise<Article | null> {
  const normalizedUser = (username || '').trim().toLowerCase();
  const normalizedSlug = (slug || '').trim().toLowerCase();

  if (!normalizedUser || !normalizedSlug) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('username', normalizedUser)
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err: unknown) {
    console.error(`[article-storage] Error querying article "${normalizedSlug}" for @${normalizedUser}:`, err);
  }

  // Check fallback default articles
  const defaultMatch = DEFAULT_TENANT_ARTICLES.find(
    (a) =>
      a.username.toLowerCase() === normalizedUser &&
      a.slug.toLowerCase() === normalizedSlug
  );

  if (defaultMatch) {
    return convertTenantArticleToArticle(defaultMatch);
  }

  return null;
}

/**
 * Persistently save or update an article in Supabase.
 */
export async function savePersistentArticle(
  data: InsertArticleInput
): Promise<Article> {
  const authorId = data.author_id || data.authorId;
  if (!authorId) {
    throw new Error('author_id is required to save article');
  }

  const normalizedUser = (data.username || '').trim().toLowerCase();
  const normalizedSlug = (data.slug || '').trim().toLowerCase();

  if (!normalizedUser) {
    throw new Error('username is required to save article');
  }

  if (!normalizedSlug) {
    throw new Error('slug is required to save article');
  }

  const supabase = await createClient();

  const payload: Database['public']['Tables']['articles']['Insert'] = {
    author_id: authorId,
    username: normalizedUser,
    slug: normalizedSlug,
    title: (data.title || '').trim(),
    excerpt: (data.excerpt || '').trim(),
    content: (data.content || '').trim(),
    tags: data.tags ?? ['Refleksi', 'Kesehatan Mental'],
    media_type: data.media_type ?? data.mediaType ?? 'IMAGE',
    media_url: data.media_url ?? data.mediaUrl ?? '/assets/sapiens.png',
    register_litera: data.register_litera ?? data.registerLitera ?? false,
    creator_wallet: data.creator_wallet ?? data.creatorWallet ?? null,
    template_id: data.template_id ?? data.templateId ?? 'warm-sanctuary',
    published_at: data.published_at ?? data.publishedAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from('articles')
    .upsert(payload, { onConflict: 'username,slug' })
    .select('*')
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to save persistent article: ${error?.message || 'Database error'}`);
  }

  return inserted;
}

/**
 * Updates Litera operation tracking fields on an article after registration.
 */
export async function updateArticleLiteraOperation(
  articleId: string,
  operation: {
    operationId?: string;
    intentId?: string;
    status?: string;
    txHash?: string | null;
    tokenId?: number | string | null;
    failureCode?: string | null;
    failureMessage?: string | null;
    updatedAt?: string;
  }
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('articles')
      .update({
        litera_operation_id: operation.operationId,
        litera_intent_id: operation.intentId,
        litera_status: operation.status,
        litera_tx_hash: operation.txHash,
        litera_token_id: operation.tokenId ? Number(operation.tokenId) : null,
        litera_failure_code: operation.failureCode,
        litera_failure_message: operation.failureMessage,
        litera_updated_at: operation.updatedAt || new Date().toISOString(),
      })
      .eq('id', articleId);

    if (error) {
      console.warn('[article-storage] Failed to update article litera operation:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[article-storage] Exception updating article litera operation:', err);
    return false;
  }
}

/**
 * Updates an article by its unique litera_operation_id (used by webhook processor).
 */
export async function updateArticleByOperationId(
  operationId: string,
  values: {
    litera_status?: string;
    litera_tx_hash?: string | null;
    litera_token_id?: number | string | null;
    litera_failure_code?: string | null;
    litera_failure_message?: string | null;
    litera_updated_at?: string;
  }
): Promise<boolean> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .update({
        litera_status: values.litera_status,
        litera_tx_hash: values.litera_tx_hash,
        litera_token_id: values.litera_token_id ? Number(values.litera_token_id) : null,
        litera_failure_code: values.litera_failure_code,
        litera_failure_message: values.litera_failure_message,
        litera_updated_at: values.litera_updated_at || new Date().toISOString(),
      })
      .eq('litera_operation_id', operationId)
      .select('id');

    if (error || !data || data.length === 0) {
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[article-storage] Exception updating article by operationId:', err);
    return false;
  }
}

/**
 * Hard deletes an article from Supabase.
 */
export async function deletePersistentArticle(
  username: string,
  slug: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('username', username.toLowerCase())
      .eq('slug', slug.toLowerCase());

    if (error) {
      console.warn('[article-storage] Error deleting persistent article:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[article-storage] Exception deleting persistent article:', err);
    return false;
  }
}

