import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://letmehearyou.com";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    ...getAllPosts().map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: new Date(post.date) })),
  ];
}
