/**
 * Tenant Litera Publishing & Deletion Helpers
 * Provides decoupling between article content persistence and asynchronous Litera NFT states.
 */

export interface PublishArticleWithLiteraParams {
  saveArticle: () => Promise<{ id: string; slug: string; updated_at?: string; [key: string]: unknown }>;
  registerArticle?: () => Promise<{
    created?: boolean;
    operation: {
      operationId: string;
      intentId: string;
      status: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  saveOperation?: (articleId: string, operation: unknown) => Promise<void>;
  registerLitera?: boolean;
}

export interface PublishArticleWithLiteraResult {
  success: boolean;
  slug: string;
  litera: {
    requested: boolean;
    operationId?: string;
    status?: string;
    message?: string;
    failureCode?: string;
  };
}

export interface LiteraStateDescription {
  title: string;
  body: string;
  href?: string;
  status?: string;
}

export interface DeleteArticleWithLiteraParams {
  intentId?: string | null;
  confirmLocalOnly?: boolean;
  deleteIntent?: (intentId: string) => Promise<{ status: number }>;
  deleteLocal: () => Promise<void>;
}

export interface DeleteArticleWithLiteraResult {
  success: boolean;
  deleted: boolean;
  requiresConfirmation?: boolean;
  nftRemainsOnChain?: boolean;
  message?: string;
}

/**
 * Publishes an article persistently, then conditionally attempts Litera S2S registration.
 * Article persistence remains successful even if Litera registration throws or fails.
 */
export async function publishArticleWithLitera(
  params: PublishArticleWithLiteraParams
): Promise<PublishArticleWithLiteraResult> {
  const { saveArticle, registerArticle, saveOperation, registerLitera = false } = params;

  // 1. Persist article locally first
  const saved = await saveArticle();

  if (!registerLitera || !registerArticle) {
    return {
      success: true,
      slug: saved.slug,
      litera: { requested: false },
    };
  }

  // 2. Attempt Litera registration
  try {
    const regRes = await registerArticle();
    const op = regRes.operation;

    if (saveOperation) {
      await saveOperation(saved.id, op);
    }

    return {
      success: true,
      slug: saved.slug,
      litera: {
        requested: true,
        operationId: op.operationId,
        status: op.status,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: true,
      slug: saved.slug,
      litera: {
        requested: true,
        status: "FAILED",
        message,
        failureCode: "REGISTRATION_FAILED",
      },
    };
  }
}

/**
 * Converts Litera asynchronous publishing status into localized, actionable UI copy.
 */
export function describeLiteraPublishState(litera: {
  requested?: boolean;
  status?: string;
  txHash?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  nextAction?: string | null;
}): LiteraStateDescription {
  if (!litera.requested) {
    return { title: "", body: "" };
  }

  const status = litera.status || "REGISTERED";

  switch (status) {
    case "REGISTERED":
    case "QUEUED":
    case "SUBMITTED":
      return {
        title: "NFT sedang diproses",
        body: "Penerbitan NFT sedang diproses di blockchain Polygon. Anda dapat terus mengedit artikel.",
        status,
      };

    case "MINTED":
      return {
        title: "NFT Berhasil Diterbitkan",
        body: "NFT artikel Anda telah tercatat on-chain di Polygon.",
        href: litera.txHash ? `https://polygonscan.com/tx/${litera.txHash}` : undefined,
        status: "MINTED",
      };

    case "BLOCKED": {
      let blockedMsg = "Penerbitan NFT tertunda karena konfigurasi atau kredit publisher.";
      if (
        litera.failureCode === "BLOCKED_CREDITS_EXHAUSTED" ||
        litera.nextAction === "TOP_UP_CREDITS"
      ) {
        blockedMsg = "Penerbitan NFT tertunda: kredit publisher habis. Silakan top up kredit Litera Anda.";
      } else if (
        litera.failureCode === "BLOCKED_INSUFFICIENT_LITE_BALANCE" ||
        litera.nextAction === "FUND_LITE"
      ) {
        blockedMsg = "Penerbitan NFT tertunda: saldo LITE tidak mencukupi untuk deposit tokenomics.";
      } else if (
        litera.failureCode === "BLOCKED_ALLOWANCE_INSUFFICIENT" ||
        litera.nextAction === "INCREASE_ALLOWANCE"
      ) {
        blockedMsg = "Penerbitan NFT tertunda: allowance LITE relayer belum disetujui.";
      }
      return {
        title: "Penerbitan NFT Tertunda",
        body: blockedMsg,
        status: "BLOCKED",
      };
    }

    case "FAILED":
    default:
      return {
        title: "Penerbitan NFT Gagal",
        body: "Gagal memproses NFT ke Litera, tetapi artikel tetap terbit dan tersimpan dengan aman.",
        status: "FAILED",
      };
  }
}

/**
 * Handles two-stage deletion: calls pre-broadcast Litera deletion first, then local DB delete.
 */
export async function deleteArticleWithLitera(
  params: DeleteArticleWithLiteraParams
): Promise<DeleteArticleWithLiteraResult> {
  const { intentId, confirmLocalOnly = false, deleteIntent, deleteLocal } = params;

  if (intentId && deleteIntent) {
    try {
      const res = await deleteIntent(intentId);

      if (res.status >= 200 && res.status < 300) {
        await deleteLocal();
        return { success: true, deleted: true };
      }

      if (res.status === 404) {
        // Intent already deleted or does not exist in Litera
        await deleteLocal();
        return { success: true, deleted: true };
      }

      if (res.status === 409) {
        // Conflict: NFT has already been broadcast or minted on-chain
        await deleteLocal();
        return {
          success: true,
          deleted: true,
          nftRemainsOnChain: true,
          message: "NFT tetap ada on-chain",
        };
      }

      // 5xx / other server errors
      if (confirmLocalOnly) {
        await deleteLocal();
        return { success: true, deleted: true };
      }

      return {
        success: false,
        deleted: false,
        requiresConfirmation: true,
        message: "Layanan Litera tidak dapat dihubungi. Konfirmasi penghapusan lokal saja?",
      };
    } catch (err: unknown) {
      if (confirmLocalOnly) {
        await deleteLocal();
        return { success: true, deleted: true };
      }

      return {
        success: false,
        deleted: false,
        requiresConfirmation: true,
        message: err instanceof Error ? err.message : "Gagal menghubungi server Litera.",
      };
    }
  }

  // No remote intentId to delete
  await deleteLocal();
  return { success: true, deleted: true };
}
