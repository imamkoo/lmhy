import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyLiteraWebhook, applyLiteraWebhookEvent } from "./litera-webhook";

const event = { eventId: "evt-1", type: "cms.mint.succeeded", operationId: "op-1", payload: { status: "MINTED", txHash: "0xabc", tokenId: 42 }, timestamp: "2026-10-09T12:00:00.000Z" };
const raw = JSON.stringify(event);
const secret = "webhook-secret";
const now = 1_760_011_200_000;
const timestamp = String(now);
const signature = `v1=${createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;

test("verifyLiteraWebhook accepts a valid millisecond HMAC and parses the event", () => {
  assert.deepEqual(verifyLiteraWebhook(raw, new Headers({ "X-Litera-Timestamp": timestamp, "X-Litera-Signature": signature }), secret, now), event);
});

test("verifyLiteraWebhook rejects stale and invalid signatures", () => {
  assert.throws(() => verifyLiteraWebhook(raw, new Headers({ "X-Litera-Timestamp": String(now - 300_001), "X-Litera-Signature": signature }), secret, now), /timestamp/i);
  assert.throws(() => verifyLiteraWebhook(raw, new Headers({ "X-Litera-Timestamp": timestamp, "X-Litera-Signature": "v1=bad" }), secret, now), /signature/i);
});

test("verifyLiteraWebhook requires HMAC over exact raw body bytes and rejects re-serialized signature mismatch", () => {
  // Unformatted JSON with extra whitespaces and raw unicode escapes
  const unformattedJson = `{\n  "eventId":   "evt-spacing-1"  ,\n  "type": "cms.mint.succeeded"  ,\n  "operationId": "op-exact",\n  "payload": {\n    "status": "MINTED",\n    "txHash": "\\u0030xabc123",\n    "tokenId": 99\n  },\n  "timestamp": "2026-10-09T12:00:00.000Z"\n}`;
  const reserializedJson = JSON.stringify(JSON.parse(unformattedJson));

  assert.notEqual(unformattedJson, reserializedJson);

  // 1. Signature computed over exact raw string
  const validRawSignature = `v1=${createHmac("sha256", secret).update(`${timestamp}.${unformattedJson}`).digest("hex")}`;
  const parsed = verifyLiteraWebhook(
    unformattedJson,
    new Headers({ "X-Litera-Timestamp": timestamp, "X-Litera-Signature": validRawSignature }),
    secret,
    now
  );
  assert.equal(parsed.operationId, "op-exact");
  assert.equal(parsed.payload.txHash, "0xabc123");

  // 2. Signature computed over re-serialized JSON fails against the exact raw payload
  const badReserializedSignature = `v1=${createHmac("sha256", secret).update(`${timestamp}.${reserializedJson}`).digest("hex")}`;
  assert.throws(
    () =>
      verifyLiteraWebhook(
        unformattedJson,
        new Headers({ "X-Litera-Timestamp": timestamp, "X-Litera-Signature": badReserializedSignature }),
        secret,
        now
      ),
    /signature/i
  );
});

test("applyLiteraWebhookEvent updates matching operation once", async () => {
  const writes: unknown[] = [];
  const store = { updateByOperationId: async (operationId: string, values: unknown) => { writes.push({ operationId, values }); return true; } };
  assert.equal(await applyLiteraWebhookEvent(event, store), true);
  assert.equal(await applyLiteraWebhookEvent(event, store), false);
  assert.equal(writes.length, 1);
  assert.equal((writes[0] as { operationId: string }).operationId, "op-1");
});

test("verifyLiteraWebhook accepts backend seconds timestamp (prod contract)", () => {
  // Backend mengirim x-litera-timestamp dalam DETIK (Math.floor(Date.now()/1000)),
  // sedangkan verifier menerima now dalam ms. Tanpa normalisasi, semua webhook
  // prod ditolak "Invalid timestamp" (insiden 2026-10-10).
  const backendTsSec = Math.floor(now / 1000);
  const backendRaw = JSON.stringify({ eventId: "evt-sec", type: "cms.mint.succeeded", operationId: "op-sec", payload: { txHash: "0xabc", tokenId: 7 }, timestamp: "2026-10-10T00:00:00.000Z" });
  const backendSig = `v1=${createHmac("sha256", secret).update(`${backendTsSec}.${backendRaw}`).digest("hex")}`;
  const parsed = verifyLiteraWebhook(
    backendRaw,
    new Headers({ "X-Litera-Timestamp": String(backendTsSec), "X-Litera-Signature": backendSig }),
    secret,
    now
  );
  assert.equal(parsed.operationId, "op-sec");
});

test("applyLiteraWebhookEvent derives status from backend event type (no payload.status)", async () => {
  // Bentuk body backend nyata: payload berisi txHash/tokenId/blockNumber TANPA status.
  const cases: Array<{ type: string; payload: Record<string, unknown>; status: string }> = [
    { type: "cms.mint.succeeded", payload: { txHash: "0xabc", tokenId: 42, blockNumber: 123 }, status: "MINTED" },
    { type: "cms.mint.failed", payload: { txHash: "0xdef", failureCode: "ONCHAIN_REVERTED" }, status: "FAILED" },
    { type: "cms.mint.blocked", payload: { failureCode: "QUOTA_EXCEEDED", nextAction: "TOP_UP_CREDITS" }, status: "BLOCKED" },
    { type: "cms.transaction.submitted", payload: { txHash: "0x123" }, status: "SUBMITTED" },
    { type: "cms.article.accepted", payload: { test: true }, status: "REGISTERED" },
  ];
  for (const c of cases) {
    let written: unknown = null;
    const store = { updateByOperationId: async (operationId: string, values: unknown) => { written = { operationId, values }; return true; } };
    const evt = { eventId: `evt-${c.type}`, type: c.type, operationId: "op-x", payload: c.payload, timestamp: "2026-10-10T00:00:00.000Z" };
    assert.equal(await applyLiteraWebhookEvent(evt, store), true);
    assert.equal((written as { values: { litera_status: string } }).values.litera_status, c.status);
  }
});

test("applyLiteraWebhookEvent keeps explicit payload.status when present", async () => {
  let written: unknown = null;
  const store = { updateByOperationId: async (operationId: string, values: unknown) => { written = { operationId, values }; return true; } };
  const evt = { eventId: "evt-explicit", type: "cms.mint.succeeded", operationId: "op-y", payload: { status: "MINTED", txHash: "0xabc" }, timestamp: "2026-10-10T00:00:00.000Z" };
  assert.equal(await applyLiteraWebhookEvent(evt, store), true);
  assert.equal((written as { values: { litera_status: string } }).values.litera_status, "MINTED");
});
