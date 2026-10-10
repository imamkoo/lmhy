import { createHash } from "node:crypto";

/**
 * Litera Protocol Client for Let Me Hear You
 * Standardized S2S Integration with Litera Platform (Polygon Web3 NFT Publishing)
 * Task 11: Hardened Auto-Minting, Envelope Unwrapping, & Status Tracking
 */

export interface LiteraQuizQuestionInput {
  question: string;
  options: string[];
  correctIndex?: number;
  correctOption?: number;
  explanation?: string;
}

export interface LiteraQuizInput {
  passingScore?: number;
  questions?: LiteraQuizQuestionInput[];
  // Legacy single question compatibility
  question?: string;
  options?: string[];
  correctIndex?: number;
  correctOption?: number;
  explanation?: string;
}

export interface LiteraRegisterArticleInput {
  id?: string;
  updatedAt?: string;
  articleUrl: string;
  title: string;
  author?: string;
  creator?: string;
  creatorAddress?: string;
  coverImageUrl?: string;
  mediaUrl?: string;
  description?: string;
  collectionName?: string;
  collectionId?: string;
  info?: string;
  externalUrl?: string;
  unlockableUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
  mediaIpfsCid?: string;
  quiz?: LiteraQuizInput;
}

export interface LiteraOperation {
  operationId: string;
  intentId: string;
  articleUrl: string;
  status: "REGISTERED" | "QUEUED" | "SUBMITTED" | "MINTED" | "BLOCKED" | "FAILED" | string;
  creditState?: string | null;
  depositLite?: string | null;
  nextAction?: string | null;
  txHash?: string | null;
  tokenId?: number | string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface LiteraRegisterArticleResponse {
  created?: boolean;
  operation: LiteraOperation;
  embedCode?: string;
  [key: string]: unknown;
}

export interface LiteraCollection {
  id: string;
  name: string;
  description?: string;
  articleCount?: number;
  createdAt?: string;
}

export interface LiteraDomainResponse {
  success: boolean;
  addedDomains: string[];
  totalDomains: number;
  addedToCORS: boolean;
  message?: string;
}

export interface LiteraPublisherQuota {
  publisherWallet: string;
  freeQuota: number;
  usedFreeQuota: number;
  freeRemaining: number;
  paidCredits: number;
  usedPaidCredits: number;
  creditsRemaining: number;
  totalRemaining: number;
}

export interface LiteraPublisherTokenomics {
  publisherWallet: string;
  price: number;
  feeEnabled: boolean;
  maxMinted: number;
  userReward: number;
  creatorMintReward: number;
  creatorApproveReward: number;
  autoMint: boolean;
  defaultCollectionName: string | null;
  allowArticleOverride: boolean;
  maxAllowedPrice: number;
  maxAllowedMinted: number;
}

export interface LiteraIntegrationStatusDto {
  status: "SYNCHRONIZED" | "DOMAIN_UNBOUND" | "DOMAIN_NOT_LIVE" | "PUBLISHER_MISMATCH";
  apiKeyWallet: string;
  domainOwnerWallet: string | null;
  domain: string;
  addedToCORS: boolean;
}

export interface LiteraClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class LiteraClient {
  private customBaseUrl?: string;
  private customApiKey?: string;

  constructor(options?: LiteraClientOptions) {
    this.customBaseUrl = options?.baseUrl;
    this.customApiKey = options?.apiKey;
  }

  private get baseUrl(): string {
    return (
      this.customBaseUrl ||
      process.env.LITERA_API_URL ||
      process.env.NEXT_PUBLIC_LITERA_API_URL ||
      "https://literaa.xyz/api/v1"
    ).replace(/\/$/, "");
  }

  private get apiKey(): string | undefined {
    return this.customApiKey !== undefined ? this.customApiKey : process.env.LITERA_API_KEY;
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["x-api-key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * Register domains / subdomains to Litera CORS whitelist
   */
  async registerDomains(
    domains: string | string[]
  ): Promise<LiteraDomainResponse> {
    const domainList = Array.isArray(domains) ? domains : [domains];
    const cleaned = domainList.map((d) =>
      d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(":")[0]
    );

    if (!this.apiKey) {
      return {
        success: false,
        addedDomains: [],
        totalDomains: 0,
        addedToCORS: false,
        message: "LITERA_API_KEY tidak dikonfigurasi di server environment.",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/domains/register`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ domains: cleaned }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gagal mendaftarkan domain CORS (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn("[Litera S2S] Domain registration notice:", err);
      return {
        success: false,
        addedDomains: [],
        totalDomains: 0,
        addedToCORS: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Register an article NFT intent with Litera CMS with auto-mint enabled.
   * Sends ONLY article metadata + autoMint: true (omitting all tokenomics fields).
   */
  async registerArticle(
    input: LiteraRegisterArticleInput
  ): Promise<LiteraRegisterArticleResponse> {
    const urlsToCheck = [
      { name: "coverImageUrl", url: input.coverImageUrl },
      { name: "mediaUrl", url: input.mediaUrl },
    ];
    for (const { name, url } of urlsToCheck) {
      if (url !== undefined && url !== null && url !== "") {
        if (!/^https:\/\//i.test(url)) {
          throw new Error(`${name} must be an absolute https:// URL`);
        }
      }
    }
    const mediaUrl = input.coverImageUrl || input.mediaUrl;

    const resolvedCreator = input.creatorAddress || input.creator || undefined;

    const payload: Record<string, unknown> = {
      articleUrl: input.articleUrl,
      title: input.title,
      author: input.author,
      creatorAddress: resolvedCreator,
      creator: resolvedCreator,
      coverImageUrl: mediaUrl,
      autoMint: true,
    };

    if (input.description) payload.description = input.description;
    if (input.collectionName) payload.collectionName = input.collectionName;
    if (input.info) payload.info = input.info;
    if (input.externalUrl) payload.externalUrl = input.externalUrl;
    if (input.unlockableUrl) payload.unlockableUrl = input.unlockableUrl;
    if (input.quiz) payload.quiz = input.quiz;

    // Clean undefined, null, or empty string keys
    for (const key of Object.keys(payload)) {
      if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        delete payload[key];
      }
    }

    const requestHeaders: Record<string, string> = { ...this.headers };
    if (input.id) {
      const rawKey = `lmhy:${input.id}:${input.updatedAt || ""}`;
      requestHeaders["Idempotency-Key"] = createHash("sha256").update(rawKey).digest("hex");
    }

    const res = await fetch(`${this.baseUrl}/cms/articles/register`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok && res.status !== 202) {
      const errorText = await res.text();
      throw new Error(`Gagal mendaftarkan artikel ke Litera (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    return (json.data || json) as LiteraRegisterArticleResponse;
  }

  /**
   * Fetch article operation status by article URL
   */
  async getArticleStatus(articleUrl: string): Promise<LiteraOperation | null> {
    if (!this.apiKey) return null;

    try {
      const url = `${this.baseUrl}/cms/articles/status?url=${encodeURIComponent(articleUrl)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: this.headers,
        cache: "no-store",
      });

      if (!res.ok) return null;
      const json = await res.json();
      return (json.data?.operation || json.data || json) as LiteraOperation;
    } catch (err) {
      console.warn("[Litera S2S] Failed to fetch article status:", err);
      return null;
    }
  }

  /**
   * Delete an un-broadcast article intent in Litera CMS
   */
  async deleteArticleIntent(intentId: string): Promise<{ status: number; deleted?: boolean; message?: string }> {
    const res = await fetch(`${this.baseUrl}/cms/articles/${encodeURIComponent(intentId)}`, {
      method: "DELETE",
      headers: this.headers,
    });

    let message: string | undefined;
    try {
      const json = await res.json();
      message = json.message || json.error;
    } catch {
      // ignore
    }

    return {
      status: res.status,
      deleted: res.ok,
      message,
    };
  }

  /**
   * Fetch all collections for the publisher
   */
  async getCollections(): Promise<LiteraCollection[]> {
    if (!this.apiKey) {
      return [
        {
          id: "col_default_lmhy",
          name: "Let Me Hear You",
          description: "Koleksi tulisan refleksi resmi komunitas Let Me Hear You",
          articleCount: 1,
        },
      ];
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/collections`, {
        method: "GET",
        headers: this.headers,
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (err) {
      console.warn("[Litera S2S] Failed to fetch collections:", err);
      return [];
    }
  }

  /**
   * Create a new collection on the fly
   */
  async createCollection(
    name: string,
    description?: string
  ): Promise<LiteraCollection | null> {
    if (!this.apiKey) {
      return {
        id: `col_${Date.now()}`,
        name,
        description,
        articleCount: 0,
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/collections`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        return null;
      }

      const result = await res.json();
      return result.data || result;
    } catch (err) {
      console.warn("[Litera S2S] Failed to create collection:", err);
      return null;
    }
  }

  /**
   * Fetch current publisher tokenomics policy from Litera API
   */
  async getPublisherTokenomics(): Promise<LiteraPublisherTokenomics | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/tokenomics`, {
        method: "GET",
        headers: this.headers,
        cache: "no-store",
      });

      if (!res.ok) {
        return null;
      }

      const raw = await res.json();
      return (raw?.data || raw) as LiteraPublisherTokenomics;
    } catch (err) {
      console.warn("[Litera S2S] Failed to fetch tokenomics:", err);
      return null;
    }
  }

  /**
   * Fetch current publisher quota & credits from Litera API
   */
  async getPublisherQuota(): Promise<LiteraPublisherQuota | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/quota`, {
        method: "GET",
        headers: this.headers,
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Litera S2S] Quota API error (${res.status}):`, errText);
        return null;
      }

      const raw = await res.json();
      const data = raw?.data || raw;
      return {
        publisherWallet: data.publisherWallet || "",
        freeQuota: Number(data.freeQuota) || 0,
        usedFreeQuota: Number(data.usedFreeQuota) || 0,
        freeRemaining: Number(data.freeRemaining ?? (data.freeQuota - data.usedFreeQuota)) || 0,
        paidCredits: Number(data.paidCredits) || 0,
        usedPaidCredits: Number(data.usedPaidCredits) || 0,
        creditsRemaining: Number(data.creditsRemaining ?? (data.paidCredits - data.usedPaidCredits)) || 0,
        totalRemaining: Number(data.totalRemaining ?? ((data.freeRemaining ?? 0) + (data.creditsRemaining ?? 0))) || 0,
      };
    } catch (err) {
      console.warn("[Litera S2S] Failed to fetch quota:", err);
      return null;
    }
  }

  /**
   * Fetch current publisher integration status (Domain, CORS, and wallet binding)
   */
  async getIntegrationStatus(domain?: string): Promise<LiteraIntegrationStatusDto | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = new URL(`${this.baseUrl}/cms/integration/status`);
      if (domain) {
        url.searchParams.set("domain", domain);
      }

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: this.headers,
        cache: "no-store",
      });

      if (!res.ok) {
        return null;
      }

      const raw = await res.json();
      const data = (raw?.data || raw) as LiteraIntegrationStatusDto;
      return data;
    } catch (err) {
      console.warn("[Litera S2S] Failed to fetch integration status:", err);
      return null;
    }
  }
}

export const literaClient = new LiteraClient();
