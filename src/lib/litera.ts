/**
 * Litera Protocol Client for Let Me Hear You
 * Standardized S2S Integration with Litera Platform (Polygon Web3 NFT Publishing)
 */

export interface LiteraRegisterArticleInput {
  articleUrl: string;
  title: string;
  author?: string;
  description?: string;
  creatorAddress?: string;
  collectionName?: string;
  collectionId?: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
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
      headers["x-api-key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * Register domains / subdomains to Litera CORS whitelist
   * Call this when a new tenant/author subdomain is provisioned.
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
        success: true,
        addedDomains: cleaned,
        totalDomains: cleaned.length,
        addedToCORS: true,
        message: "Simulated registration: LITERA_API_KEY is not configured.",
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
        throw new Error(`Failed to register domains (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn("[Litera] Domain registration notice:", err);
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
   * Register an article intent with Litera CMS
   * Call this when an author publishes an article to be minted as NFT.
   */
  async registerArticle(
    input: LiteraRegisterArticleInput
  ): Promise<LiteraRegisterArticleResponse> {
    if (!this.apiKey) {
      return {
        success: true,
        registered: true,
        articleUrl: input.articleUrl,
        title: input.title,
        collectionId: input.collectionId,
        message: "Simulated registration: LITERA_API_KEY is not configured.",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/cms/articles/register`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to register article (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn("[Litera] Article registration notice:", err);
      return {
        success: false,
        registered: false,
        articleUrl: input.articleUrl,
        title: input.title,
        message: err instanceof Error ? err.message : String(err),
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
      console.warn("[Litera] Failed to fetch collections:", err);
      return [];
    }
  }

  /**
   * Create a new collection for a author or category
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

      return await res.json();
    } catch (err) {
      console.warn("[Litera] Failed to create collection:", err);
      return null;
    }
  }

  /**
   * Resolve article mint status on Polygon blockchain
   */
  async resolveArticle(articleUrl: string): Promise<{
    isMinted: boolean;
    tokenId?: string;
    generation?: number;
  }> {
    try {
      const res = await fetch(
        `${this.baseUrl}/articles/resolve?url=${encodeURIComponent(articleUrl)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (res.status === 404) {
        return { isMinted: false };
      }

      if (!res.ok) {
        return { isMinted: false };
      }

      const data = await res.json();
      return {
        isMinted: true,
        tokenId: data.tokenId,
        generation: data.generation,
      };
    } catch (err) {
      console.warn("[Litera] Failed to resolve article:", err);
      return { isMinted: false };
    }
  }
}

export const literaClient = new LiteraClient();
