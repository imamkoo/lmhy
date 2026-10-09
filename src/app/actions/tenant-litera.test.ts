import test from "node:test";
import assert from "node:assert/strict";
import { deleteArticleWithLitera, describeLiteraPublishState, publishArticleWithLitera } from "./tenant-litera";

test("publish keeps article success when Litera registration fails", async () => {
  const result = await publishArticleWithLitera({
    saveArticle: async () => ({ id: "a1", slug: "hope", updated_at: "2026-10-09T00:00:00.000Z" }),
    registerArticle: async () => { throw new Error("network down"); },
    saveOperation: async () => assert.fail("must not save an operation without Litera response"),
    registerLitera: true,
  });
  assert.equal(result.success, true);
  assert.equal(result.slug, "hope");
  assert.deepEqual(result.litera, { requested: true, status: "FAILED", message: "network down", failureCode: "REGISTRATION_FAILED" });
});

test("publish stores REGISTERED operation without claiming mint", async () => {
  let saved: unknown;
  const result = await publishArticleWithLitera({
    saveArticle: async () => ({ id: "a1", slug: "hope", updated_at: "u" }),
    registerArticle: async () => ({ created: true, operation: { operationId: "op-1", intentId: "in-1", status: "REGISTERED" } }),
    saveOperation: async (articleId, operation) => { saved = { articleId, operation }; },
    registerLitera: true,
  });
  assert.deepEqual(result.litera, { requested: true, operationId: "op-1", status: "REGISTERED" });
  assert.deepEqual(saved, { articleId: "a1", operation: { operationId: "op-1", intentId: "in-1", status: "REGISTERED" } });
});

test("builder state copy covers processing, minted, blocked, and failed", () => {
  assert.equal(describeLiteraPublishState({ requested: true, status: "REGISTERED" }).title, "NFT sedang diproses");
  assert.equal(describeLiteraPublishState({ requested: true, status: "MINTED", txHash: "0xabc" }).href, "https://polygonscan.com/tx/0xabc");
  assert.match(describeLiteraPublishState({ requested: true, status: "BLOCKED", failureCode: "BLOCKED_CREDITS_EXHAUSTED" }).body, /kredit/i);
  const failed = describeLiteraPublishState({ requested: true, status: "FAILED" });
  assert.match(failed.body, /artikel tetap terbit/i);
});

test("delete handles Litera 2xx, 404, 409, and network confirmation", async () => {
  const run = async (status: number | Error, confirmLocalOnly = false) => {
    let deleted = false;
    const result = await deleteArticleWithLitera({
      intentId: "in-1",
      confirmLocalOnly,
      deleteIntent: async () => { if (status instanceof Error) throw status; return { status }; },
      deleteLocal: async () => { deleted = true; },
    });
    return { result, deleted };
  };
  assert.deepEqual(await run(204), { result: { success: true, deleted: true }, deleted: true });
  assert.deepEqual(await run(404), { result: { success: true, deleted: true }, deleted: true });
  assert.deepEqual(await run(409), { result: { success: true, deleted: true, nftRemainsOnChain: true, message: "NFT tetap ada on-chain" }, deleted: true });
  const network = await run(new Error("offline"));
  assert.equal(network.deleted, false);
  assert.equal(network.result.requiresConfirmation, true);
  assert.equal((await run(new Error("offline"), true)).deleted, true);
  assert.equal((await run(503)).result.requiresConfirmation, true);
});
