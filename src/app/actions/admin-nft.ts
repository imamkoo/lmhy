"use server";

import { revalidatePath } from "next/cache";
import {
  AdminTokenomicsConfig,
  getAdminTokenomicsConfig,
  saveAdminTokenomicsConfig,
} from "@/lib/admin-tokenomics-storage";
import { literaClient, LiteraPublisherQuota } from "@/lib/litera";
import { evaluateIntegrationPreflight, getLiteraApiKeyStatus, type LiteraIntegrationPreflightResult } from "@/lib/litera-runtime";

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const DEFAULT_PIN = "123456";
  const validPin = process.env.ADMIN_PIN || DEFAULT_PIN;
  return pin.trim() === validPin.trim();
}

export async function getTokenomicsConfigAction(): Promise<AdminTokenomicsConfig> {
  return getAdminTokenomicsConfig();
}

export interface SaveTokenomicsResult {
  success: boolean;
  message: string;
  config?: AdminTokenomicsConfig;
}

export async function saveTokenomicsConfigAction(
  newConfig: Partial<AdminTokenomicsConfig>
): Promise<SaveTokenomicsResult> {
  if (newConfig.maxMint !== undefined && newConfig.maxMint < 2) {
    return { success: false, message: "Batas Max Mint minimal 2 edisi." };
  }

  const userReward = Number(newConfig.userReward) || 0;
  const creatorReward = Number(newConfig.creatorReward) || 0;
  const creatorApproveReward = Number(newConfig.creatorApproveReward) || 0;
  const maxMint = Number(newConfig.maxMint) || 100;

  const totalDeposit =
    userReward * maxMint + creatorReward * maxMint + creatorApproveReward;

  if (totalDeposit > 0 && !newConfig.isDepositConfirmed) {
    return {
      success: false,
      message:
        "Terdapat alokasi deposit LITE. Wajib menyetujui konfirmasi Deposit Non-Refundable.",
    };
  }

  const saved = saveAdminTokenomicsConfig({
    userReward,
    creatorReward,
    creatorApproveReward,
    maxMint,
    mintingFeeEnabled: Boolean(newConfig.mintingFeeEnabled),
    priceLite: newConfig.mintingFeeEnabled ? Number(newConfig.priceLite) || 0 : 0,
    isDepositConfirmed: Boolean(newConfig.isDepositConfirmed),
  });

  revalidatePath("/admin/litera");
  revalidatePath("/builder");

  return {
    success: true,
    message: "Konfigurasi Tokenomics berhasil disimpan dan aktif untuk seluruh artikel.",
    config: saved,
  };
}

export interface AdminLiteraQuotaResult {
  quota: LiteraPublisherQuota | null;
  hasApiKey: boolean;
  preflight?: LiteraIntegrationPreflightResult;
  error?: string;
}

export async function getAdminLiteraQuotaAction(): Promise<AdminLiteraQuotaResult> {
  const apiKey = process.env.LITERA_API_KEY;
  const configuredWallet = process.env.LITERA_PUBLISHER_WALLET;
  const apiKeyStatus = getLiteraApiKeyStatus(apiKey);

  if (apiKeyStatus === "MISSING_API_KEY") {
    const preflight = evaluateIntegrationPreflight({ apiKey });
    return {
      quota: null,
      hasApiKey: false,
      preflight,
      error: "LITERA_API_KEY belum dikonfigurasi di Environment Variables server.",
    };
  }

  const [quota, statusRes] = await Promise.all([
    literaClient.getPublisherQuota(),
    literaClient.getIntegrationStatus("letmehearyou.id"),
  ]);

  const preflight = evaluateIntegrationPreflight({
    apiKey,
    configuredPublisherWallet: configuredWallet,
    statusResponse: statusRes,
  });

  return {
    quota,
    hasApiKey: true,
    preflight,
    error:
      preflight.status === "PUBLISHER_MISMATCH"
        ? preflight.message
        : quota
          ? undefined
          : "Kunci API Litera tidak valid atau kuota gagal dimuat dari server Litera.",
  };
}

export async function getAdminLiteraTokenomicsAction() {
  return await literaClient.getPublisherTokenomics();
}
