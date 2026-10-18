import type { Article } from "./supabase/types";

export type ShowcaseBadge = "top" | "newest";

export interface ShowcaseArticle extends Article {
  showcase_badge?: ShowcaseBadge;
}

export function collectCommentCounts(
  rows: Array<{ article_id: string }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    counts[row.article_id] = (counts[row.article_id] ?? 0) + 1;
  }

  return counts;
}

export function rankShowcaseArticles(
  articles: Article[],
  commentCounts: Record<string, number>,
  topCount = 3,
  newestCount = 2,
  pinnedSlug?: string
): ShowcaseArticle[] {
  const countOf = (article: Article) => commentCounts[article.id] ?? 0;
  const isMinted = (article: Article) =>
    (article.litera_status ?? "").toUpperCase() === "MINTED";
  const timeOf = (article: Article) =>
    new Date(article.published_at).getTime();

  const ranked = [...articles].sort((a, b) => {
    const byComments = countOf(b) - countOf(a);
    if (byComments !== 0) return byComments;

    const byMinted = Number(isMinted(b)) - Number(isMinted(a));
    if (byMinted !== 0) return byMinted;

    return timeOf(b) - timeOf(a);
  });

  if (pinnedSlug) {
    const target = pinnedSlug.trim().toLowerCase();
    const pinIndex = ranked.findIndex(
      (a) =>
        (a.slug || "").trim().toLowerCase() === target ||
        (a.username || "").trim().toLowerCase() === target
    );
    if (pinIndex > 0) {
      const [pinnedItem] = ranked.splice(pinIndex, 1);
      ranked.unshift(pinnedItem);
    }
  }

  const top = ranked.slice(0, Math.min(topCount, ranked.length));
  const topIds = new Set(top.map((article) => article.id));

  const newest = ranked
    .filter((article) => !topIds.has(article.id))
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, newestCount);

  return [
    ...top.map((article) => ({ ...article, showcase_badge: "top" as const })),
    ...newest.map((article) => ({
      ...article,
      showcase_badge: "newest" as const,
    })),
  ];
}
