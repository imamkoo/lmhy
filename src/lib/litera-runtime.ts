export type LiteraApiKeyStatus = "MISSING_API_KEY" | "CONFIGURED";

export function getLiteraApiKeyStatus(value: string | undefined): LiteraApiKeyStatus {
  return value?.trim() ? "CONFIGURED" : "MISSING_API_KEY";
}
