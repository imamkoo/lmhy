"use server";

import { revalidatePath } from "next/cache";
import { literaClient } from "@/lib/litera";
import { saveTenantArticle, TenantArticle } from "@/lib/tenant-storage";

export interface PublishArticleInput {
  username: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string;
  registerLitera?: boolean;
}

export interface PublishArticleResult {
  success: boolean;
  slug?: string;
  error?: string;
  literaMessage?: string;
}

export async function publishTenantArticle(
  input: PublishArticleInput
): Promise<PublishArticleResult> {
  const { username, title, excerpt, content, tags, registerLitera = true } = input;

  if (!username || !username.trim()) {
    return { success: false, error: "Username tidak valid" };
  }
  if (!title || !title.trim()) {
    return { success: false, error: "Judul artikel wajib diisi" };
  }
  if (!content || !content.trim()) {
    return { success: false, error: "Konten tulisan tidak boleh kosong" };
  }

  // Generate safe slug from title
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const parsedTags = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : ["Refleksi", "Kesehatan Mental"];

  const article: TenantArticle = {
    id: `art_${Date.now()}`,
    username: username.toLowerCase().trim(),
    slug: slug || `post-${Date.now()}`,
    title: title.trim(),
    excerpt: excerpt?.trim() || content.slice(0, 160).trim() + "...",
    content: content.trim(),
    createdAt: new Date().toISOString(),
    tags: parsedTags,
    isLiteraRegistered: registerLitera,
  };

  saveTenantArticle(article);

  let literaNotice = "";

  if (registerLitera) {
    const fullArticleUrl = `https://${username}.letmehearyou.id/${article.slug}`;

    // 1. Auto-register subdomain to Litera CORS allowlist
    await literaClient.registerDomains([
      `${username}.letmehearyou.id`,
      `${username}.letmehearyou.my.id`,
    ]);

    // 2. Register article intent to Litera S2S CMS API
    const regRes = await literaClient.registerArticle({
      articleUrl: fullArticleUrl,
      title: article.title,
      author: `@${username}`,
    });

    literaNotice = regRes.message || "Artikel terdaftar di jaringan Litera";
  }

  revalidatePath(`/tenant/${username}`);
  revalidatePath(`/tenant/${username}/${article.slug}`);

  return {
    success: true,
    slug: article.slug,
    literaMessage: literaNotice,
  };
}
