import { createHmac, timingSafeEqual } from "node:crypto";

export interface LiteraWebhookEventPayload {
  status: "REGISTERED" | "QUEUED" | "SUBMITTED" | "MINTED" | "BLOCKED" | "FAILED" | string;
  txHash?: string | null;
  tokenId?: number | string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  nextAction?: string | null;
}

export interface LiteraWebhookEvent {
  eventId: string;
  type: string;
  operationId: string;
  payload: LiteraWebhookEventPayload;
  timestamp: string;
}

export interface LiteraWebhookStore {
  updateByOperationId: (
    operationId: string,
    values: {
      litera_status?: string;
      litera_tx_hash?: string | null;
      litera_token_id?: number | string | null;
      litera_failure_code?: string | null;
      litera_failure_message?: string | null;
      litera_updated_at?: string;
    }
  ) => Promise<boolean>;
}

const MAX_REPLAY_AGE_MS = 300_000; // 300 seconds
const processedEvents = new Set<string>();

/**
 * Verifies Litera Webhook HMAC signature and timestamp freshness, returning the typed event.
 */
export function verifyLiteraWebhook(
  rawBody: string,
  headers: Headers | Record<string, string | null | undefined>,
  secret: string,
  now: number = Date.now()
): LiteraWebhookEvent {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower && v) return v;
    }
    return null;
  };

  const tsHeader = getHeader("X-Litera-Timestamp");
  if (!tsHeader) {
    throw new Error("Missing X-Litera-Timestamp header");
  }

  const timestamp = Number(tsHeader);
  if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > MAX_REPLAY_AGE_MS) {
    throw new Error("Invalid timestamp: replay window of 300s exceeded");
  }

  const sigHeader = getHeader("X-Litera-Signature");
  if (!sigHeader) {
    throw new Error("Missing X-Litera-Signature header");
  }

  const expectedHash = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expectedSig = `v1=${expectedHash}`;

  const sigBuf = Buffer.from(sigHeader);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Invalid signature: HMAC verification failed");
  }

  return JSON.parse(rawBody) as LiteraWebhookEvent;
}

/**
 * Idempotently applies a validated Litera webhook event to the persistent store.
 */
export async function applyLiteraWebhookEvent(
  event: LiteraWebhookEvent,
  store: LiteraWebhookStore
): Promise<boolean> {
  const dedupeKey = event.eventId || `${event.operationId}:${event.payload?.status}:${event.timestamp}`;

  if (processedEvents.has(dedupeKey)) {
    return false;
  }

  const values = {
    litera_status: event.payload?.status,
    litera_tx_hash: event.payload?.txHash,
    litera_token_id: event.payload?.tokenId,
    litera_failure_code: event.payload?.failureCode,
    litera_failure_message: event.payload?.failureMessage,
    litera_updated_at: event.timestamp || new Date().toISOString(),
  };

  const updated = await store.updateByOperationId(event.operationId, values);
  if (updated) {
    processedEvents.add(dedupeKey);
    if (event.eventId) processedEvents.add(event.eventId);
  }

  return updated;
}
