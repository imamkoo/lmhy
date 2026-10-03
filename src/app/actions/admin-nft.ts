"use server";

import { revalidatePath } from "next/cache";
import {
  AdminTokenomicsConfig,
  getAdminTokenomicsConfig,
  saveAdminTokenomicsConfig,
} from "@/lib/admin-tokenomics-storage";
import { literaClient, LiteraPublisherQuota } from "@/lib/litera";

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
  error?: string;
}

export async function getAdminLiteraQuotaAction(): Promise<AdminLiteraQuotaResult> {
  const hasApiKey = Boolean(process.env.LITERA_API_KEY && process.env.LITERA_API_KEY.trim());
  if (!hasApiKey) {
    return {
      quota: null,
      hasApiKey: false,
      error: "LITERA_API_KEY belum dikonfigurasi di Environment Variables server.",
    };
  }

  const quota = await literaClient.getPublisherQuota();
  return {
    quota,
    hasApiKey: true,
    error: quota ? undefined : "Kunci API Litera tidak valid atau kuota gagal dimuat dari server Litera.",
  };
}
