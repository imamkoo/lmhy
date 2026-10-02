/**
 * Litera Protocol Client for Let Me Hear You
 * Standardized S2S Integration with Litera Platform (Polygon Web3 NFT Publishing)
 * Blueprint Integrasi BikinWeb PANDI x Litera Protocol (Creator & Admin Specification)
 */

export interface LiteraQuizInput {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface LiteraRegisterArticleInput {
  articleUrl: string;
  title: string;
  author?: string;
  description?: string;
  creatorAddress?: string;
  collectionName?: string;
  collectionId?: string;
  info?: string;
  externalUrl?: string;
  unlockableUrl?: string;
  userReward?: number;
  creatorReward?: number;
  creatorApproveReward?: number;
  maxMint?: number;
  mintingFeeEnabled?: boolean;
  priceLite?: number;
  mediaType?: "IMAGE" | "VIDEO";
  mediaUrl?: string;
  mediaIpfsCid?: string;
  quiz?: LiteraQuizInput;
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

export interface LiteraRegisterArticleResponse {
  success: boolean;
  registered: boolean;
  articleUrl: string;
  title: string;
  collectionId?: string;
  intentId?: string;
  message?: string;
  error?: string;
}

class LiteraClient {
  private get baseUrl(): string {
    return (
      process.env.LITERA_API_URL ||
      process.env.NEXT_PUBLIC_LITERA_API_URL ||
      "https://literaa.xyz/api/v1"
    ).replace(/\/$/, "");
  }

  private get apiKey(): string | undefined {
    return process.env.LITERA_API_KEY;
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
   * Register an article NFT intent with Litera CMS
   */
  async registerArticle(
    input: LiteraRegisterArticleInput
  ): Promise<LiteraRegisterArticleResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        registered: false,
        articleUrl: input.articleUrl,
        title: input.title,
        message: "LITERA_API_KEY tidak dikonfigurasi di server environment.",
        error: "LITERA_API_KEY_MISSING",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/articles/register`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          articleUrl: input.articleUrl,
          title: input.title,
          author: input.author,
          description: input.description,
          creatorAddress: input.creatorAddress,
          collectionName: input.collectionName,
          info: input.info,
          externalUrl: input.externalUrl,
          unlockableUrl: input.unlockableUrl,
          userReward: input.userReward ?? 0,
          creatorReward: input.creatorReward ?? 0,
          creatorApproveReward: input.creatorApproveReward ?? 0,
          maxMint: input.maxMint ?? 100,
          mintingFeeEnabled: input.mintingFeeEnabled ?? false,
          priceLite: input.priceLite ?? 0,
          mediaType: input.mediaType || "IMAGE",
          mediaUrl: input.mediaUrl,
          mediaIpfsCid: input.mediaIpfsCid,
          quiz: input.quiz,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gagal mendaftarkan artikel ke Litera (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn("[Litera S2S] Article registration notice:", err);
      return {
        success: false,
        registered: false,
        articleUrl: input.articleUrl,
        title: input.title,
        message: err instanceof Error ? err.message : String(err),
        error: "S2S_NETWORK_OR_AUTH_ERROR",
      };
    }
  }

  /**
   * Fetch all collections for the publisher
   */
  async getCollections(): Promise<LiteraCollection[]> {
    if (!this.apiKey) {
      return [
        {
          id: "col_default_lmhy",
          name: "Let Me Hear You - Jurnal & Refleksi",
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
}

export const literaClient = new LiteraClient();
