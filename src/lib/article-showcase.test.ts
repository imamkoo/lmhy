import test from "node:test";
import assert from "node:assert/strict";
import { collectCommentCounts, rankShowcaseArticles } from "./article-showcase";
import type { Article } from "./supabase/types";

function article(overrides: Partial<Article> & { id: string }): Article {
  return {
    author_id: `author-${overrides.id}`,
    username: "penulis",
    slug: overrides.id,
    title: `Artikel ${overrides.id}`,
    excerpt: "Excerpt",
    content: "Konten",
    tags: null,
    media_type: null,
    media_url: null,
    register_litera: null,
    creator_wallet: null,
    template_id: null,
    published_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    litera_operation_id: null,
    litera_intent_id: null,
    litera_status: null,
    litera_tx_hash: null,
    litera_token_id: null,
    litera_failure_code: null,
    litera_failure_message: null,
    litera_updated_at: null,
    ...overrides,
  };
}

test("collectCommentCounts tallies comments per article", () => {
  const counts = collectCommentCounts([
    { article_id: "a" },
    { article_id: "b" },
    { article_id: "a" },
  ]);

  assert.deepEqual(counts, { a: 2, b: 1 });
});

test("ranks top by comment count and fills newest without overlap", () => {
  const articles = [
    article({ id: "quiet", published_at: "2026-10-10T00:00:00.000Z" }),
    article({ id: "busy", published_at: "2026-10-01T00:00:00.000Z" }),
    article({ id: "mid", published_at: "2026-10-05T00:00:00.000Z" }),
    article({ id: "old", published_at: "2026-09-01T00:00:00.000Z" }),
    article({ id: "fresh", published_at: "2026-10-15T00:00:00.000Z" }),
    article({ id: "oldest", published_at: "2026-08-01T00:00:00.000Z" }),
  ];

  const result = rankShowcaseArticles(articles, { busy: 5, mid: 3, quiet: 1 });

  assert.equal(result.length, 5);
  assert.equal(new Set(result.map((a) => a.id)).size, result.length);
  assert.deepEqual(
    result.map((a) => [a.id, a.showcase_badge]),
    [
      ["busy", "top"],
      ["mid", "top"],
      ["quiet", "top"],
      ["fresh", "newest"],
      ["old", "newest"],
    ]
  );
});

test("tie-breaks equal comments with minted litera status before recency", () => {
  const newer = article({ id: "newer", published_at: "2026-10-12T00:00:00.000Z" });
  const minted = article({
    id: "minted",
    published_at: "2026-09-12T00:00:00.000Z",
    litera_status: "MINTED",
  });
  const third = article({ id: "third", published_at: "2026-08-12T00:00:00.000Z" });

  const result = rankShowcaseArticles([newer, minted, third], {});

  assert.deepEqual(
    result.map((a) => a.id),
    ["minted", "newer", "third"]
  );
  assert.equal(result[0].showcase_badge, "top");
});

test("breaks remaining ties by recency", () => {
  const older = article({ id: "older", published_at: "2026-10-01T00:00:00.000Z" });
  const newest = article({ id: "newest", published_at: "2026-10-14T00:00:00.000Z" });
  const middle = article({ id: "middle", published_at: "2026-10-07T00:00:00.000Z" });

  const result = rankShowcaseArticles([older, newest, middle], {});

  assert.deepEqual(
    result.map((a) => a.id),
    ["newest", "middle", "older"]
  );
});

test("returns every article exactly once when fewer than five exist", () => {
  const result = rankShowcaseArticles([article({ id: "solo" })], {});

  assert.equal(result.length, 1);
  assert.equal(result[0].showcase_badge, "top");
});
