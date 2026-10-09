/**
 * Storage & Data Access for Tenant Subdomain Blogs
 */

export interface TenantArticle {
  id: string;
  username: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  createdAt: string;
  tags: string[];
  mediaType?: "IMAGE" | "VIDEO";
  mediaUrl?: string;
  isLiteraRegistered?: boolean;
  templateId?: string;
}

// Initial sample articles for tenant demonstration (Empty for clean DB testing)
export const DEFAULT_TENANT_ARTICLES: TenantArticle[] = [];

// In-memory runtime storage for newly created tenant articles
const runtimeArticles: TenantArticle[] = [];

export function getTenantArticles(username: string): TenantArticle[] {
  const normalizedUser = username.toLowerCase();
  const matchedRuntime = runtimeArticles.filter(
    (a) => a.username.toLowerCase() === normalizedUser
  );
  const matchedDefaults = DEFAULT_TENANT_ARTICLES.filter(
    (a) => a.username.toLowerCase() === normalizedUser
  );

  return [...matchedRuntime, ...matchedDefaults].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTenantArticleBySlug(
  username: string,
  slug: string
): TenantArticle | null {
  const articles = getTenantArticles(username);
  return articles.find((a) => a.slug === slug) ?? null;
}

export function saveTenantArticle(article: TenantArticle): TenantArticle {
  // Check if exists in runtime, update if so
  const index = runtimeArticles.findIndex(
    (a) =>
      a.username.toLowerCase() === article.username.toLowerCase() &&
      a.slug === article.slug
  );

  if (index >= 0) {
    runtimeArticles[index] = article;
  } else {
    runtimeArticles.unshift(article);
  }

  return article;
}

export function deleteTenantArticle(username: string, slug: string): boolean {
  const normalizedUser = username.toLowerCase();
  const index = runtimeArticles.findIndex(
    (a) => a.username.toLowerCase() === normalizedUser && a.slug === slug
  );
  if (index >= 0) {
    runtimeArticles.splice(index, 1);
    return true;
  }
  return false;
}

