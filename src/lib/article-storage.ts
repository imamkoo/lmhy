import { createClient } from '@/lib/supabase/server';
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
    published_at: ta.createdAt,
    updated_at: ta.createdAt,
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

  // If brand new user with no articles anywhere, return a starter welcome article
  if (allArticles.length === 0) {
    return [
      {
        id: `welcome_${normalizedUser}`,
        author_id: '00000000-0000-0000-0000-000000000000',
        username: normalizedUser,
        slug: 'selamat-datang-di-ruang-refleksi',
        title: `Selamat Datang di Jurnal Digital @${normalizedUser}`,
        excerpt:
          'Ini adalah artikel pertama di subdomain personal Anda. Tulisan di sini terhubung langsung dengan jaringan sertifikat digital Litera.',
        content: `Halo dan selamat datang di ruang refleksi digital @${normalizedUser}. Di sini Anda dapat menuliskan perjalanan pikiran, kesehatan mental, dan wawasan berharga Anda. Setiap artikel dapat dikoleksi oleh pembaca sebagai sertifikat digital resmi di blockchain Polygon.`,
        tags: ['Refleksi', 'Jurnal', 'Web3'],
        media_type: 'IMAGE',
        media_url: '/assets/sapiens.png',
        register_litera: true,
        creator_wallet: null,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

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

  // Welcome starter article fallback
  if (normalizedSlug === 'selamat-datang-di-ruang-refleksi') {
    return {
      id: `welcome_${normalizedUser}`,
      author_id: '00000000-0000-0000-0000-000000000000',
      username: normalizedUser,
      slug: 'selamat-datang-di-ruang-refleksi',
      title: `Selamat Datang di Jurnal Digital @${normalizedUser}`,
      excerpt:
        'Ini adalah artikel pertama di subdomain personal Anda. Tulisan di sini terhubung langsung dengan jaringan sertifikat digital Litera.',
      content: `Halo dan selamat datang di ruang refleksi digital @${normalizedUser}. Di sini Anda dapat menuliskan perjalanan pikiran, kesehatan mental, dan wawasan berharga Anda. Setiap artikel dapat dikoleksi oleh pembaca sebagai sertifikat digital resmi di blockchain Polygon.`,
      tags: ['Refleksi', 'Jurnal', 'Web3'],
      media_type: 'IMAGE',
      media_url: '/assets/sapiens.png',
      register_litera: true,
      creator_wallet: null,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
