"use server";

import { revalidatePath } from "next/cache";
import { literaClient, LiteraCollection, LiteraQuizInput } from "@/lib/litera";

export interface AdminNftRegisterInput {
  collectionName: string;
  title: string;
  author: string;
  articleUrl: string;
  creatorAddress: string;
  info?: string;
  externalUrl?: string;
  description: string;
  userReward?: number;
  creatorReward?: number;
  creatorApproveReward?: number;
  maxMint: number;
  isDepositConfirmed?: boolean;
  mintingFeeEnabled: boolean;
  priceLite: number;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl?: string;
  mediaBase64?: string;
  unlockableUrl?: string;
  quiz?: LiteraQuizInput;
}

export interface AdminNftRegisterResult {
  success: boolean;
  message: string;
  intentId?: string;
  articleUrl?: string;
  error?: string;
}

/**
 * Clean URL from pagination and query junk
 */
function cleanArticleUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    // remove typical query params like ?page=, ?ref=, etc.
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.trim().split("?")[0].split("#")[0];
  }
}

export async function registerAdminNftArticle(
  input: AdminNftRegisterInput
): Promise<AdminNftRegisterResult> {
  const {
    collectionName,
    title,
    author,
    articleUrl,
    creatorAddress,
    info,
    externalUrl,
    description,
    userReward = 0,
    creatorReward = 0,
    creatorApproveReward = 0,
    maxMint = 100,
    isDepositConfirmed = false,
    mintingFeeEnabled = false,
    priceLite = 0,
    mediaType = "IMAGE",
    mediaUrl,
    unlockableUrl,
    quiz,
  } = input;

  if (!collectionName || !collectionName.trim()) {
    return { success: false, message: "Koleksi NFT wajib dipilih atau dibuat." };
  }
  if (!title || !title.trim()) {
    return { success: false, message: "Judul NFT (NFT Name) wajib diisi." };
  }
  if (!author || !author.trim()) {
    return { success: false, message: "Nama Author (Penulis Asli) wajib diisi." };
  }
  if (!articleUrl || !articleUrl.trim()) {
    return { success: false, message: "Tautan Artikel (Article Link) wajib diisi." };
  }
  if (!creatorAddress || !creatorAddress.trim() || !creatorAddress.startsWith("0x")) {
    return { success: false, message: "Alamat Dompet Creator (0x...) tidak valid." };
  }
  if (!description || !description.trim()) {
    return { success: false, message: "Deskripsi (Description) artikel wajib diisi." };
  }
  if (maxMint < 2) {
    return { success: false, message: "Batas Max Mint minimal 2 edisi." };
  }

  // Calculate required deposit
  const totalDepositRequired =
    userReward * maxMint + creatorReward * maxMint + creatorApproveReward;

  if (totalDepositRequired > 0 && !isDepositConfirmed) {
    return {
      success: false,
      message:
        "Anda memiliki alokasi deposit reward LITE. Wajib mencentang konfirmasi deposit Non-Refundable.",
    };
  }

  const cleanedUrl = cleanArticleUrl(articleUrl);

  try {
    // 1. Auto register domain to CORS allowlist if it's an external domain
    try {
      const parsedUrl = new URL(cleanedUrl);
      await literaClient.registerDomains(parsedUrl.hostname);
    } catch {
      // ignore parsing error
    }

    // 2. Register to Litera CMS API
    const res = await literaClient.registerArticle({
      articleUrl: cleanedUrl,
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      creatorAddress: creatorAddress.trim(),
      collectionName: collectionName.trim(),
      info: info?.trim() || undefined,
      externalUrl: externalUrl?.trim() || undefined,
      unlockableUrl: unlockableUrl?.trim() || undefined,
      userReward: Number(userReward) || 0,
      creatorReward: Number(creatorReward) || 0,
      creatorApproveReward: Number(creatorApproveReward) || 0,
      maxMint: Number(maxMint) || 100,
      mintingFeeEnabled,
      priceLite: mintingFeeEnabled ? Number(priceLite) || 0 : 0,
      mediaType,
      mediaUrl: mediaUrl || undefined,
      quiz,
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || "Gagal mendaftarkan NFT ke Litera Protocol.",
        error: res.error,
      };
    }

    revalidatePath("/admin/litera");
    revalidatePath("/builder");

    return {
      success: true,
      message: "NFT Artikel berhasil didaftarkan ke jaringan Litera Protocol.",
      intentId: res.intentId,
      articleUrl: cleanedUrl,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses NFT.",
    };
  }
}

export async function getAdminCollections(): Promise<LiteraCollection[]> {
  return await literaClient.getCollections();
}

export async function createAdminCollection(
  name: string,
  description?: string
): Promise<LiteraCollection | null> {
  return await literaClient.createCollection(name, description);
}
