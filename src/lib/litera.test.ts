import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { LiteraClient } from "./litera";

const article = {
  id: "article-7",
  updatedAt: "2026-10-09T12:00:00.000Z",
  articleUrl: "https://author.letmehearyou.id/hope",
  title: "Hope",
  author: "Author",
  creator: "0x1111111111111111111111111111111111111111",
  coverImageUrl: "https://cdn.example.com/cover.jpg",
  quiz: { passingScore: 80, questions: [{ question: "Q?", options: ["A", "B"], correctOption: 1 }] },
};

test("registerArticle sends canonical metadata, API defaults, and stable idempotency key", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: true, data: { created: true, operation: { operationId: "op-1", intentId: "intent-1", articleUrl: article.articleUrl, status: "REGISTERED", creditState: "AVAILABLE", depositLite: "0", nextAction: null, createdAt: article.updatedAt, updatedAt: article.updatedAt }, embedCode: "<div />" }, meta: { version: "1", correlationId: "corr-1" } }), { status: 202, headers: { "content-type": "application/json" } });
  };
  try {
    const client = new LiteraClient({ baseUrl: "https://litera.test/api/v1", apiKey: "secret" });
    const result = await client.registerArticle(article);
    assert.equal(result.operation.status, "REGISTERED");
    const body = JSON.parse(String(calls[0].init?.body));
    assert.deepEqual(body, { articleUrl: article.articleUrl, title: "Hope", author: "Author", creator: article.creator, coverImageUrl: article.coverImageUrl, quiz: article.quiz, autoMint: true });
    for (const key of ["userReward", "creatorMintReward", "creatorApproveReward", "maxMinted", "price", "feeEnabled"]) assert.equal(key in body, false);
    const headers = calls[0].init?.headers as Record<string, string>;
    assert.equal(headers["Idempotency-Key"], createHash("sha256").update(`lmhy:${article.id}:${article.updatedAt}`).digest("hex"));
  } finally { globalThis.fetch = originalFetch; }
});

test("registerArticle rejects unsafe media before fetch", async () => {
  const originalFetch = globalThis.fetch;
  let fetched = false;
  globalThis.fetch = async () => { fetched = true; return new Response(); };
  try {
    const client = new LiteraClient({ baseUrl: "https://litera.test", apiKey: "secret" });
    for (const coverImageUrl of ["/cover.jpg", "blob:https://example.com/id"]) {
      await assert.rejects(() => client.registerArticle({ ...article, coverImageUrl }), /https/i);
    }
    assert.equal(fetched, false);
  } finally { globalThis.fetch = originalFetch; }
});
