import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/blog`, lastModified: new Date() },
    ...getAllPosts().map((post) => ({ url: `${siteUrl}/blog/${post.slug}`, lastModified: new Date(post.date) })),
  ];
}
