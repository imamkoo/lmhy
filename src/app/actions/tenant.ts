"use server";

import { revalidatePath } from "next/cache";
import { literaClient, LiteraQuizInput } from "@/lib/litera";
import { saveTenantArticle, TenantArticle } from "@/lib/tenant-storage";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/profile-storage";
import { savePersistentArticle } from "@/lib/article-storage";

export interface PublishArticleInput {
  username: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string;
  templateId?: string;
  registerLitera?: boolean;
  creatorAddress?: string;
  collectionName?: string;
  unlockableUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
  mediaUrl?: string;
  quiz?: LiteraQuizInput;
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
  const {
    username,
    title,
    excerpt,
    content,
    tags,
    templateId,
    registerLitera = true,
    creatorAddress,
    collectionName,
    unlockableUrl,
    mediaType = "IMAGE",
    mediaUrl,
    quiz,
  } = input;

  // 1. Authenticate user session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Sesi masuk tidak ditemukan. Silakan masuk terlebih dahulu untuk menerbitkan artikel.",
    };
  }

  // 2. Author authorization check
  const profile = await getProfileById(user.id);
  if (!profile || !profile.username) {
    return {
      success: false,
      error: "Profil pengguna belum lengkap. Silakan selesaikan proses onboarding terlebih dahulu.",
    };
  }

  const targetUsername = (username || "").trim().toLowerCase();
  const creatorUsername = profile.username.trim().toLowerCase();

  if (creatorUsername !== targetUsername) {
    return {
      success: false,
      error: `Akses ditolak: Anda tidak memiliki izin untuk menerbitkan tulisan di subdomain @${targetUsername}. Anda hanya dapat menerbitkan tulisan di subdomain @${creatorUsername}.`,
    };
  }

  // 3. Validate content
  if (!title || !title.trim()) {
    return { success: false, error: "Judul tulisan wajib diisi." };
  }
  if (!content || !content.trim()) {
    return { success: false, error: "Isi tulisan tidak boleh kosong." };
  }

  // 4. Generate safe slug from title
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const finalSlug = slug || `post-${Date.now()}`;

  const parsedTags = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : ["Refleksi", "Kesehatan Mental"];

  // 5. Persist to Supabase articles
  let savedArticle;
  try {
    savedArticle = await savePersistentArticle({
      author_id: user.id,
      username: creatorUsername,
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt?.trim() || content.slice(0, 160).trim() + "...",
      content: content.trim(),
      tags: parsedTags,
      template_id: templateId || "warm-sanctuary",
      media_type: mediaType,
      media_url: mediaUrl || "/assets/sapiens.png",
      register_litera: registerLitera,
      creator_wallet: creatorAddress || null,
      published_at: new Date().toISOString(),
    });
  } catch (dbErr: unknown) {
    console.error("[publishTenantArticle] Error saving article to Supabase:", dbErr);
    return {
      success: false,
      error: dbErr instanceof Error ? dbErr.message : "Gagal menyimpan artikel ke basis data.",
    };
  }

  // Sync to in-memory runtime for backwards-compatibility
  const legacyArticle: TenantArticle = {
    id: savedArticle.id,
    username: savedArticle.username,
    slug: savedArticle.slug,
    title: savedArticle.title,
    excerpt: savedArticle.excerpt,
    content: savedArticle.content,
    createdAt: savedArticle.published_at,
    tags: savedArticle.tags || [],
    mediaType: savedArticle.media_type || undefined,
    mediaUrl: savedArticle.media_url || undefined,
    isLiteraRegistered: savedArticle.register_litera ?? false,
    templateId: savedArticle.template_id || "warm-sanctuary",
  };
  saveTenantArticle(legacyArticle);

  // 6. Register domains and intent with Litera
  let literaNotice = "";

  if (registerLitera) {
    const fullArticleUrl = `https://${creatorUsername}.letmehearyou.id/${savedArticle.slug}`;

    // 1. Auto-register subdomain to Litera CORS allowlist
    await literaClient.registerDomains([
      `${creatorUsername}.letmehearyou.id`,
    ]);

    // 2. Register article intent to Litera S2S CMS API
    const regRes = await literaClient.registerArticle({
      articleUrl: fullArticleUrl,
      title: savedArticle.title,
      author: `@${creatorUsername}`,
      description: savedArticle.excerpt,
      creatorAddress,
      collectionName,
      unlockableUrl,
      mediaType,
      mediaUrl: savedArticle.media_url || undefined,
      quiz,
    });

    if (!regRes.success) {
      console.warn("[Publish Notice] Litera S2S Registration Warning:", regRes.message);
      literaNotice = regRes.message || "Peringatan: Kunci API Litera belum terkonfigurasi di server.";
    } else {
      literaNotice = regRes.message || "Artikel terdaftar di jaringan Litera";
    }
  }

  // 7. Revalidate paths
  revalidatePath(`/tenant/${creatorUsername}`);
  revalidatePath(`/tenant/${creatorUsername}/${savedArticle.slug}`);
  revalidatePath(`/${savedArticle.slug}`);

  return {
    success: true,
    slug: savedArticle.slug,
    literaMessage: literaNotice,
  };
}

export async function deleteTenantArticle(
  articleId: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesi masuk tidak ditemukan." };
    }

    const normalizedUser = (username || "").trim().toLowerCase();

    const { error: delError } = await supabase
      .from("articles")
      .delete()
      .eq("id", articleId)
      .eq("author_id", user.id);

    if (delError) {
      console.error("[deleteTenantArticle] Error deleting article:", delError);
      return { success: false, error: delError.message };
    }

    revalidatePath(`/tenant/${normalizedUser}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteTenantArticle] Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus artikel.",
    };
  }
}
