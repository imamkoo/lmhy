/**
 * Centralized Admin Tokenomics Storage for Litera Protocol
 * Managed exclusively by Admin (/admin/litera) with PIN 123456
 * Automatically merged into user article publishing
 */

export interface AdminTokenomicsConfig {
  userReward: number;
  creatorReward: number;
  creatorApproveReward: number;
  maxMint: number;
  mintingFeeEnabled: boolean;
  priceLite: number;
  isDepositConfirmed: boolean;
  updatedAt: string;
}

// Global runtime config with official defaults
let globalTokenomicsConfig: AdminTokenomicsConfig = {
  userReward: 0,
  creatorReward: 0,
  creatorApproveReward: 0,
  maxMint: 100,
  mintingFeeEnabled: false,
  priceLite: 0,
  isDepositConfirmed: false,
  updatedAt: new Date().toISOString(),
};

export function getAdminTokenomicsConfig(): AdminTokenomicsConfig {
  return { ...globalTokenomicsConfig };
}

export function saveAdminTokenomicsConfig(
  newConfig: Partial<AdminTokenomicsConfig>
): AdminTokenomicsConfig {
  globalTokenomicsConfig = {
    ...globalTokenomicsConfig,
    ...newConfig,
    updatedAt: new Date().toISOString(),
  };
  return { ...globalTokenomicsConfig };
}
