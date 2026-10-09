export type LiteraApiKeyStatus = "MISSING_API_KEY" | "CONFIGURED";

export function getLiteraApiKeyStatus(value: string | undefined): LiteraApiKeyStatus {
  return value?.trim() ? "CONFIGURED" : "MISSING_API_KEY";
}

export interface LiteraIntegrationPreflightResult {
  status: "SYNCHRONIZED" | "API_KEY_MISSING" | "DOMAIN_UNBOUND" | "DOMAIN_NOT_LIVE" | "PUBLISHER_MISMATCH";
  apiKeyWallet: string | null;
  domainOwnerWallet: string | null;
  domain: string;
  addedToCORS: boolean;
  message: string;
}

export function evaluateIntegrationPreflight(params: {
  apiKey?: string;
  configuredPublisherWallet?: string;
  statusResponse?: {
    status: "SYNCHRONIZED" | "DOMAIN_UNBOUND" | "DOMAIN_NOT_LIVE" | "PUBLISHER_MISMATCH";
    apiKeyWallet: string;
    domainOwnerWallet: string | null;
    domain: string;
    addedToCORS: boolean;
  } | null;
}): LiteraIntegrationPreflightResult {
  if (!params.apiKey?.trim()) {
    return {
      status: "API_KEY_MISSING",
      apiKeyWallet: null,
      domainOwnerWallet: null,
      domain: "",
      addedToCORS: false,
      message: "LITERA_API_KEY belum dikonfigurasi pada environment server.",
    };
  }

  const res = params.statusResponse;
  if (!res) {
    return {
      status: "DOMAIN_NOT_LIVE",
      apiKeyWallet: null,
      domainOwnerWallet: null,
      domain: "",
      addedToCORS: false,
      message: "Status integrasi Litera tidak dapat dimuat dari server Litera.",
    };
  }

  if (res.status === "PUBLISHER_MISMATCH") {
    return {
      status: "PUBLISHER_MISMATCH",
      apiKeyWallet: res.apiKeyWallet,
      domainOwnerWallet: res.domainOwnerWallet,
      domain: res.domain,
      addedToCORS: res.addedToCORS,
      message: `Publisher API key (${res.apiKeyWallet}) tidak cocok dengan pemilik domain Litera (${res.domainOwnerWallet || "belum terdaftar"}).`,
    };
  }

  if (
    params.configuredPublisherWallet &&
    params.configuredPublisherWallet.toLowerCase() !== res.apiKeyWallet.toLowerCase()
  ) {
    return {
      status: "PUBLISHER_MISMATCH",
      apiKeyWallet: res.apiKeyWallet,
      domainOwnerWallet: res.domainOwnerWallet,
      domain: res.domain,
      addedToCORS: res.addedToCORS,
      message: `LITERA_PUBLISHER_WALLET lokal (${params.configuredPublisherWallet}) tidak cocok dengan pemilik API key di server Litera (${res.apiKeyWallet}).`,
    };
  }

  return {
    status: res.status,
    apiKeyWallet: res.apiKeyWallet,
    domainOwnerWallet: res.domainOwnerWallet,
    domain: res.domain,
    addedToCORS: res.addedToCORS,
    message:
      res.status === "SYNCHRONIZED"
        ? "Integrasi Litera tersinkronisasi penuh."
        : res.status === "DOMAIN_UNBOUND"
          ? "API key belum terikat domain atau domain kosong."
          : "Domain belum live di allowlist CORS Litera.",
  };
}
