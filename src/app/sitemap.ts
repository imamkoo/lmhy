import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getAllPublicArticles } from "@/lib/article-storage";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articlesSitemap: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllPublicArticles(50);
    articlesSitemap = articles.map((art) => ({
      url: `${siteUrl}/tenant/${art.username}/${art.slug}`,
      lastModified: art.published_at ? new Date(art.published_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[sitemap] Failed to load articles for sitemap:", err);
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...articlesSitemap,
  ];
}
