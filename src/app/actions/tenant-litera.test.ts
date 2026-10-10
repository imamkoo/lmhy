import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { LiteraClient } from "@/lib/litera";
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

test("publish when registerLitera is false skips registration and returns requested:false", async () => {
  let savedArticleCalled = false;
  const result = await publishArticleWithLitera({
    saveArticle: async () => {
      savedArticleCalled = true;
      return { id: "a2", slug: "peace", updated_at: "2026-10-09T00:00:00.000Z" };
    },
    registerArticle: async () => assert.fail("must not call registerArticle when registerLitera is false"),
    registerLitera: false,
  });
  assert.equal(savedArticleCalled, true);
  assert.equal(result.success, true);
  assert.equal(result.slug, "peace");
  assert.deepEqual(result.litera, { requested: false });
});

test("publish integrates real LiteraClient: sends canonical article id in Idempotency-Key and isolates network errors", async () => {
  const originalFetch = globalThis.fetch;
  const recordedCalls: Array<{ url: string; init?: RequestInit }> = [];

  const canonicalArticle = {
    id: "uuid-article-canonical-999",
    slug: "article-slug-only",
    updated_at: "2026-10-09T18:30:00.000Z",
  };

  try {
    // 1. Test real boundary success
    globalThis.fetch = async (url, init) => {
      recordedCalls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            created: true,
            operation: {
              operationId: "op-real-1",
              intentId: "intent-real-1",
              articleUrl: "https://user.letmehearyou.id/article-slug-only",
              status: "REGISTERED",
            },
          },
        }),
        { status: 202, headers: { "content-type": "application/json" } }
      );
    };

    const client = new LiteraClient({ baseUrl: "https://litera.test/api/v1", apiKey: "real-key" });
    let savedOp: unknown;

    const successResult = await publishArticleWithLitera({
      saveArticle: async () => canonicalArticle,
      registerArticle: async () => {
        return await client.registerArticle({
          id: canonicalArticle.id,
          updatedAt: canonicalArticle.updated_at,
          articleUrl: "https://user.letmehearyou.id/article-slug-only",
          title: "Canonical Title",
          author: "@user",
          creator: "0x2222222222222222222222222222222222222222",
          coverImageUrl: "https://cdn.example.com/banner.png",
        });
      },
      saveOperation: async (articleId, op) => {
        savedOp = { articleId, op };
      },
      registerLitera: true,
    });

    assert.equal(successResult.success, true);
    assert.equal(successResult.slug, "article-slug-only");
    assert.deepEqual(successResult.litera, { requested: true, operationId: "op-real-1", status: "REGISTERED" });
    assert.deepEqual(savedOp, {
      articleId: "uuid-article-canonical-999",
      op: {
        operationId: "op-real-1",
        intentId: "intent-real-1",
        articleUrl: "https://user.letmehearyou.id/article-slug-only",
        status: "REGISTERED",
      },
    });

    // Verify actual headers and payload at real fetch boundary
    const headers = recordedCalls[0].init?.headers as Record<string, string>;
    const expectedIdempotencyKey = createHash("sha256")
      .update(`lmhy:${canonicalArticle.id}:${canonicalArticle.updated_at}`)
      .digest("hex");
    assert.equal(headers["Idempotency-Key"], expectedIdempotencyKey);

    const body = JSON.parse(String(recordedCalls[0].init?.body));
    assert.equal(body.autoMint, true);
    assert.equal(body.title, "Canonical Title");
    for (const key of ["userReward", "creatorMintReward", "creatorApproveReward", "maxMinted", "price", "feeEnabled"]) {
      assert.equal(key in body, false);
    }

    // 2. Test real boundary network failure: persistence remains valid
    globalThis.fetch = async () => {
      throw new Error("Litera gateway connection timeout (504)");
    };

    const failResult = await publishArticleWithLitera({
      saveArticle: async () => canonicalArticle,
      registerArticle: async () => {
        return await client.registerArticle({
          id: canonicalArticle.id,
          updatedAt: canonicalArticle.updated_at,
          articleUrl: "https://user.letmehearyou.id/article-slug-only",
          title: "Canonical Title",
        });
      },
      registerLitera: true,
    });

    assert.equal(failResult.success, true);
    assert.equal(failResult.slug, canonicalArticle.slug);
    assert.equal(failResult.litera.requested, true);
    assert.equal(failResult.litera.status, "FAILED");
    assert.equal(failResult.litera.failureCode, "REGISTRATION_FAILED");
    assert.match(failResult.litera.message || "", /timeout/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
