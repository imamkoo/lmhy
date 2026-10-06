import Link from "next/link";
import { notFound } from "next/navigation";
import { LiteraWidget } from "@/components/litera/LiteraWidget";
import { getTenantArticleBySlug, getTenantArticles } from "@/lib/tenant-storage";
import { getArticleBySlug } from "@/lib/article-storage";
import { getProfileByUsername } from "@/lib/profile-storage";
import { getCommentsByArticle, getFollowStatus } from "@/lib/comment-storage";
import { createClient } from "@/lib/supabase/server";
import { SocialShareBar } from "../components/SocialShareBar";
import { CommentSection } from "../components/CommentSection";
import { FollowButton } from "../components/FollowButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const normalizedUser = (username || "").toLowerCase();
  const dbArticle = await getArticleBySlug(normalizedUser, slug);
  const fallbackArticle = !dbArticle ? getTenantArticleBySlug(normalizedUser, slug) : null;

  const title =
    dbArticle?.title ||
    fallbackArticle?.title ||
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const description =
    dbArticle?.excerpt ||
    fallbackArticle?.excerpt ||
    `Refleksi mendalam oleh @${normalizedUser} di ruang jurnal Let Me Hear You.`;

  return {
    title: `${title} — @${normalizedUser} | Let Me Hear You`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://${normalizedUser}.letmehearyou.id/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TenantArticlePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const normalizedUser = (username || "").trim().toLowerCase();

  // Don't intercept the 'write' page if accessed
  if (slug === "write") {
    notFound();
  }

  // 1. Fetch article from DB or fallback storage
  const dbArticle = await getArticleBySlug(normalizedUser, slug);
  const legacyArticle = !dbArticle ? getTenantArticleBySlug(normalizedUser, slug) : null;

  const articleId = dbArticle?.id || legacyArticle?.id || `slug_${normalizedUser}_${slug}`;

  // Title fallback
  const title = dbArticle?.title || legacyArticle?.title || slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Content fallback
  const content =
    dbArticle?.content ||
    legacyArticle?.content ||
    `Ini adalah artikel yang diterbitkan melalui subdomain personal @${normalizedUser}. Setiap tulisan di sini dapat dikoleksi oleh pembaca sebagai sertifikat digital permanen melalui jaringan Litera Web3 di blockchain Polygon.`;

  const tags = dbArticle?.tags || legacyArticle?.tags || ["Refleksi", "Kesehatan Mental"];
  const mediaUrl = dbArticle?.media_url || legacyArticle?.mediaUrl;
  const mediaType = dbArticle?.media_type || legacyArticle?.mediaType || "IMAGE";
  const publishedAt = dbArticle?.published_at || legacyArticle?.createdAt;

  const otherArticles = getTenantArticles(normalizedUser).filter(
    (a) => a.slug !== slug
  );

  // 2. Fetch author profile
  const authorProfile = await getProfileByUsername(normalizedUser);
  const authorId = authorProfile?.id || dbArticle?.author_id;

  // 3. Fetch visitor auth session
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let currentUser = null;
  let isFollowingAuthor = false;

  if (authUser) {
    const { data: userProf } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", authUser.id)
      .maybeSingle();

    currentUser = {
      id: authUser.id,
      username: userProf?.username || authUser.user_metadata?.username,
      display_name:
        userProf?.display_name ||
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.name,
      avatar_url: userProf?.avatar_url || authUser.user_metadata?.avatar_url,
    };

    if (authorId && authUser.id !== authorId) {
      isFollowingAuthor = await getFollowStatus(authUser.id, authorId);
    }
  }

  // 4. Fetch comments for this article
  const comments = await getCommentsByArticle(articleId);

  const articleCanonicalUrl = `https://${normalizedUser}.letmehearyou.id/${slug}`;

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-6 py-12 text-slate-900 md:px-12">
      <article className="mx-auto max-w-3xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-[#3F3766] hover:underline"
          >
            ← Kembali ke profil @{normalizedUser}
          </Link>
          <Link
            href={`/builder?username=${normalizedUser}`}
            className="text-xs font-semibold text-slate-500 hover:text-[#3F3766]"
          >
            + Tulis Baru
          </Link>
        </div>

        {/* Header */}
        <header className="mb-10 mt-8 border-b border-slate-200 pb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F7ABC5]/20 px-3 py-1 text-xs font-bold text-[#3F3766]">
              Ruang Refleksi @{normalizedUser}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Ditulis oleh <strong>@{normalizedUser}</strong>
              </span>
              {authorId && authUser?.id !== authorId && (
                <FollowButton
                  targetUserId={authorId}
                  targetUsername={normalizedUser}
                  initialIsFollowing={isFollowingAuthor}
                  size="sm"
                />
              )}
            </div>

            {publishedAt && (
              <span>
                {new Date(publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </header>

        {/* Media Cover (Image or Video) */}
        {mediaUrl && (
          <div className="mb-8 overflow-hidden rounded-3xl border-2 border-slate-200 shadow-sm">
            {mediaType === "VIDEO" ? (
              <video
                src={mediaUrl}
                controls
                className="w-full max-h-[480px] object-cover bg-black"
              />
            ) : (
              <div className="relative w-full h-72 sm:h-96 bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Konten Tulisan */}
        <div className="prose prose-slate max-w-none text-lg leading-relaxed text-slate-700">
          {content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-6 whitespace-pre-line leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Requirement: Display SocialShareBar under article content */}
        <SocialShareBar
          url={articleCanonicalUrl}
          title={title}
          authorUsername={normalizedUser}
        />

        {/* Litera NFT Widget Resmi Web3 */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Sertifikat Digital & Edisi Koleksi
            </h3>
            <p className="text-sm text-slate-600">
              Dukung penulis dan simpan bukti keterlibatan Anda sebagai sertifikat digital resmi di Polygon melalui Litera.
            </p>
          </div>
          <LiteraWidget
            title={title}
            articleUrl={articleCanonicalUrl}
          />
        </div>

        {/* Requirement: Display CommentSection under the Litera NFT widget */}
        <CommentSection
          articleId={articleId}
          creatorUsername={normalizedUser}
          creatorId={authorId}
          initialComments={comments}
          currentUser={currentUser}
        />

        {/* Rekomendasi Tulisan Lain dari Penulis Ini */}
        {otherArticles.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-8">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Tulisan Lain oleh @{normalizedUser}
            </h3>
            <div className="space-y-3">
              {otherArticles.slice(0, 3).map((other) => (
                <div
                  key={other.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#F7ABC5]"
                >
                  <Link
                    href={`/${other.slug}`}
                    className="font-semibold text-slate-800 hover:text-[#3F3766]"
                  >
                    {other.title}
                  </Link>
                  <span className="text-xs text-slate-400">
                    {new Date(other.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
