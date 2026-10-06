import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuilderUrl } from "@/lib/builder";
import { LiteraWidget } from "@/components/litera/LiteraWidget";
import { getTenantArticleBySlug, getTenantArticles } from "@/lib/tenant-storage";
import { getArticleBySlug } from "@/lib/article-storage";
import { getProfileByUsername } from "@/lib/profile-storage";
import { getCommentsByArticle, getFollowStatus } from "@/lib/comment-storage";
import { getDesignTemplate } from "@/lib/design-templates";
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
  const templateId = dbArticle?.template_id || legacyArticle?.templateId || "warm-sanctuary";
  const activeTemplate = getDesignTemplate(templateId);

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
    <main className={`min-h-screen px-4 sm:px-6 py-8 sm:py-12 transition-colors ${activeTemplate.previewClass.container}`}>
      <article className="mx-auto max-w-3xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-current/10">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold hover:underline opacity-80 hover:opacity-100 transition"
          >
            ← Kembali ke profil @{normalizedUser}
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold opacity-60">
              Tema: {activeTemplate.name}
            </span>
            <Link
              href={getBuilderUrl(normalizedUser)}
              className="text-xs font-semibold opacity-70 hover:opacity-100 transition"
            >
              + Tulis Baru
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className={`mb-8 sm:mb-10 mt-6 sm:mt-8 pb-6 sm:pb-8 ${activeTemplate.previewClass.header}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={activeTemplate.previewClass.badge}>
              Ruang Refleksi @{normalizedUser}
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className={activeTemplate.previewClass.tag}
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl leading-tight ${activeTemplate.previewClass.title}`}>
            {title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm opacity-80">
            <div className="flex flex-wrap items-center gap-3">
              <span className={activeTemplate.previewClass.authorName}>
                Ditulis oleh @{normalizedUser}
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
              <span className="opacity-70">
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
          <div className={`mb-8 ${activeTemplate.previewClass.mediaCard}`}>
            {mediaType === "VIDEO" ? (
              <video
                src={mediaUrl}
                controls
                className="w-full max-h-[480px] object-cover bg-black"
              />
            ) : (
              <div className="relative w-full h-64 sm:h-80 md:h-96 flex items-center justify-center">
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
        <div className={`text-base sm:text-lg leading-relaxed ${activeTemplate.previewClass.content}`}>
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
        <div className="mt-12 border-t border-current/15 pt-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-inherit">
              Sertifikat Digital & Edisi Koleksi
            </h3>
            <p className="text-sm opacity-75">
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
          <section className="mt-16 border-t border-current/15 pt-8">
            <h3 className="mb-4 text-lg font-bold text-inherit">
              Tulisan Lain oleh @{normalizedUser}
            </h3>
            <div className="space-y-3">
              {otherArticles.slice(0, 3).map((other) => (
                <div
                  key={other.id}
                  className="flex items-center justify-between rounded-xl border border-current/15 bg-white/40 backdrop-blur-sm p-4 transition hover:border-current/40"
                >
                  <Link
                    href={`/${other.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {other.title}
                  </Link>
                  <span className="text-xs opacity-60">
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
