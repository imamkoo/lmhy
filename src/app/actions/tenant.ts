"use server";

import { revalidatePath } from "next/cache";
import { literaClient, LiteraQuizInput } from "@/lib/litera";
import { saveTenantArticle, deleteTenantArticle, TenantArticle } from "@/lib/tenant-storage";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/profile-storage";
import {
  savePersistentArticle,
  updateArticleLiteraOperation,
  deletePersistentArticle,
} from "@/lib/article-storage";
import {
  publishArticleWithLitera,
  deleteArticleWithLitera,
  describeLiteraPublishState,
} from "./tenant-litera";

export {
  publishArticleWithLitera,
  deleteArticleWithLitera,
  describeLiteraPublishState,
};

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
  litera?: {
    requested: boolean;
    operationId?: string;
    status?: string;
    message?: string;
    failureCode?: string;
  };
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

  // 5. Decoupled Publishing: Save article first, then register Litera asynchronously
  try {
    const pubResult = await publishArticleWithLitera({
      saveArticle: async () => {
        const saved = await savePersistentArticle({
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

        // Sync to in-memory runtime for backwards-compatibility
        const legacyArticle: TenantArticle = {
          id: saved.id,
          username: saved.username,
          slug: saved.slug,
          title: saved.title,
          excerpt: saved.excerpt,
          content: saved.content,
          createdAt: saved.published_at,
          tags: saved.tags || [],
          mediaType: saved.media_type || undefined,
          mediaUrl: saved.media_url || undefined,
          isLiteraRegistered: saved.register_litera ?? false,
          templateId: saved.template_id || "warm-sanctuary",
        };
        saveTenantArticle(legacyArticle);

        return saved;
      },
      registerArticle: async () => {
        const fullArticleUrl = `https://${creatorUsername}.letmehearyou.id/${finalSlug}`;

        // Auto-register subdomain to Litera CORS allowlist
        await literaClient.registerDomains([
          `${creatorUsername}.letmehearyou.id`,
        ]);

        return await literaClient.registerArticle({
          id: finalSlug,
          updatedAt: new Date().toISOString(),
          articleUrl: fullArticleUrl,
          title: title.trim(),
          author: `@${creatorUsername}`,
          creator: creatorAddress,
          coverImageUrl: mediaUrl?.startsWith("https://") ? mediaUrl : undefined,
          description: excerpt?.trim() || content.slice(0, 160).trim() + "...",
          collectionName,
          unlockableUrl,
          quiz,
        });
      },
      saveOperation: async (articleId, operation) => {
        const op = operation as {
          operationId?: string;
          intentId?: string;
          status?: string;
          txHash?: string | null;
          tokenId?: number | string | null;
          failureCode?: string | null;
          failureMessage?: string | null;
          updatedAt?: string;
        };
        await updateArticleLiteraOperation(articleId, op);
      },
      registerLitera,
    });

    // 6. Revalidate paths
    revalidatePath(`/tenant/${creatorUsername}`);
    revalidatePath(`/tenant/${creatorUsername}/${pubResult.slug}`);
    revalidatePath(`/${pubResult.slug}`);

    let literaNotice = "";
    if (pubResult.litera.requested) {
      if (pubResult.litera.status === "FAILED") {
        literaNotice = `Peringatan: ${pubResult.litera.message || "Gagal menghubungi Litera"}`;
      } else {
        literaNotice = "Artikel terdaftar di jaringan Litera (sedang diproses)";
      }
    }

    return {
      success: true,
      slug: pubResult.slug,
      litera: pubResult.litera,
      literaMessage: literaNotice,
    };
  } catch (err: unknown) {
    console.error("[publishTenantArticle] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menerbitkan artikel.",
    };
  }
}

export interface DeleteTenantArticleInput {
  username: string;
  slug: string;
  intentId?: string | null;
  confirmLocalOnly?: boolean;
}

export interface DeleteTenantArticleResult {
  success: boolean;
  deleted: boolean;
  error?: string;
  requiresConfirmation?: boolean;
  nftRemainsOnChain?: boolean;
  message?: string;
}

export async function deleteTenantArticleAction(
  input: DeleteTenantArticleInput
): Promise<DeleteTenantArticleResult> {
  const { username, slug, intentId, confirmLocalOnly = false } = input;

  // 1. Authenticate user session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      deleted: false,
      error: "Sesi masuk tidak ditemukan.",
    };
  }

  // 2. Author check
  const profile = await getProfileById(user.id);
  if (!profile || !profile.username) {
    return {
      success: false,
      deleted: false,
      error: "Profil pengguna tidak valid.",
    };
  }

  const targetUsername = (username || "").trim().toLowerCase();
  const creatorUsername = profile.username.trim().toLowerCase();

  if (creatorUsername !== targetUsername) {
    return {
      success: false,
      deleted: false,
      error: "Anda tidak memiliki izin untuk menghapus artikel ini.",
    };
  }

  // 3. Decoupled Deletion
  const delResult = await deleteArticleWithLitera({
    intentId,
    confirmLocalOnly,
    deleteIntent: (id) => literaClient.deleteArticleIntent(id),
    deleteLocal: async () => {
      await deletePersistentArticle(creatorUsername, slug);
      deleteTenantArticle(creatorUsername, slug);
    },
  });

  if (delResult.deleted) {
    revalidatePath(`/tenant/${creatorUsername}`);
    revalidatePath(`/tenant/${creatorUsername}/${slug}`);
    revalidatePath(`/${slug}`);
  }

  return {
    success: delResult.success,
    deleted: delResult.deleted,
    requiresConfirmation: delResult.requiresConfirmation,
    nftRemainsOnChain: delResult.nftRemainsOnChain,
    message: delResult.message,
  };
}
