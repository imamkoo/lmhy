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
