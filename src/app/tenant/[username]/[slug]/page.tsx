import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuilderUrl } from "@/lib/builder";
import { LiteraWidget } from "@/components/litera/LiteraWidget";
import { getTenantArticleBySlug } from "@/lib/tenant-storage";
import { getArticleBySlug, getArticlesByUsername } from "@/lib/article-storage";
import { getProfileByUsername } from "@/lib/profile-storage";
import { getCommentsByArticle, getFollowStatus } from "@/lib/comment-storage";
import { getDesignTemplate } from "@/lib/design-templates";
import { createClient } from "@/lib/supabase/server";
import { SocialShareBar } from "../components/SocialShareBar";
import { CommentSection } from "../components/CommentSection";
import { FollowButton } from "../components/FollowButton";
import { ArticleCoverImage } from "../components/ArticleCoverImage";
import { getAdaptiveCoverPosition } from "@/lib/media-focal";
import { BackToProfileLink } from "./BackToProfileLink";
import DoorwayCard from "@/components/sanctuary/DoorwayCard";

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

  // 1. Fetch article from DB or fallback storage.
  // Unknown slugs must 404 — never render placeholder content.
  const dbArticle = await getArticleBySlug(normalizedUser, slug);
  const legacyArticle = !dbArticle ? getTenantArticleBySlug(normalizedUser, slug) : null;

  if (!dbArticle && !legacyArticle) {
    notFound();
  }

  const articleId = dbArticle?.id || legacyArticle?.id || `slug_${normalizedUser}_${slug}`;

  // Title fallback
  const title =
    dbArticle?.title ||
    legacyArticle?.title ||
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Content fallback (unreachable after the notFound guard above)
  const content = dbArticle?.content || legacyArticle?.content || "";

  const tags = dbArticle?.tags || legacyArticle?.tags || ["Refleksi", "Kesehatan Mental"];
  const mediaUrl = dbArticle?.media_url || legacyArticle?.mediaUrl;
  const mediaType = dbArticle?.media_type || legacyArticle?.mediaType || "IMAGE";
  const coverPosition =
    mediaUrl && mediaType === "IMAGE" && !mediaUrl.startsWith("blob:")
      ? await getAdaptiveCoverPosition(mediaUrl)
      : null;
  const isLiteraRegistered = Boolean(dbArticle?.register_litera ?? legacyArticle?.isLiteraRegistered);
  const publishedAt = dbArticle?.published_at || legacyArticle?.createdAt;
  const templateId = dbArticle?.template_id || legacyArticle?.templateId || "warm-sanctuary";
  const activeTemplate = getDesignTemplate(templateId);
  const isDarkTemplate = activeTemplate.id === "midnight-serenity";

  // Fetch author articles from real database (Supabase) with legacy fallback
  const authorAllArticles = await getArticlesByUsername(normalizedUser);
  const otherArticles = authorAllArticles.filter((a) => a.slug !== slug);

  // 2. Fetch author profile
  const authorProfile = await getProfileByUsername(normalizedUser);
  const authorId = authorProfile?.id || dbArticle?.author_id;

  const authorRole = authorProfile?.creator_role ?? null;
  const isVerifiedProvider =
    authorProfile?.verification_status === "APPROVED" &&
    (authorRole === "PENDAMPING" || authorRole === "PRAKTISI");

  let authorHasAvailableSlot = false;
  if (authorId && isVerifiedProvider) {
    try {
      const supabase = await createClient();
      const { count } = await supabase
        .from("listening_slots")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", authorId)
        .eq("status", "AVAILABLE");

      authorHasAvailableSlot = (count ?? 0) > 0;
    } catch (err) {
      console.error("[TenantArticlePage] Slot availability lookup failed:", err);
    }
  }

  // 3. Fetch visitor auth session. A transient auth/DB failure must never
  // 500 the article — degrade to guest view instead.
  let currentUser: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
  } | null = null;
  let isFollowingAuthor = false;
  let isOwnArticle = false;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

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

      if (authorId && authUser.id === authorId) {
        isOwnArticle = true;
      } else if (authorId && authUser.id !== authorId) {
        isFollowingAuthor = await getFollowStatus(authUser.id, authorId);
      }
    }
  } catch (err) {
    console.error("[TenantArticlePage] Visitor session lookup failed, rendering as guest:", err);
  }

  // 4. Fetch comments for this article
  const comments = await getCommentsByArticle(articleId);

  const articleCanonicalUrl = `https://${normalizedUser}.letmehearyou.id/${slug}`;

  return (
    <main
      className={`min-h-screen px-4 sm:px-6 py-8 sm:py-12 transition-colors ${
        isDarkTemplate ? "dark " : ""
      }${activeTemplate.previewClass.container}`}
    >
      <article className="mx-auto max-w-3xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-current/10">
          <BackToProfileLink username={normalizedUser} />
          <div className="flex items-center gap-2">
            <a
              href="https://letmehearyou.id"
              aria-label="Ke beranda Let Me Hear You"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-current/15 px-2.5 py-1 text-[11px] font-semibold opacity-80 transition hover:opacity-100 hover:border-current/40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5.5 9.5V20h13V9.5" />
              </svg>
              <span>Beranda</span>
            </a>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold opacity-60">
              Tema: {activeTemplate.name}
            </span>
            {isOwnArticle && (
              <Link
                href={getBuilderUrl(normalizedUser)}
                className="text-xs font-semibold opacity-70 hover:opacity-100 transition"
              >
                + Tulis Baru
              </Link>
            )}
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
              {authorId && currentUser?.id !== authorId && (
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
        {mediaUrl && !mediaUrl.startsWith("blob:") && (
          <div className={`mb-8 ${activeTemplate.previewClass.mediaCard}`}>
            {mediaType === "VIDEO" ? (
              <video
                src={mediaUrl}
                controls
                className="w-full max-h-[540px] sm:max-h-[620px] object-cover bg-black"
              />
            ) : (
              <div className="relative w-full overflow-hidden flex items-center justify-center">
                <ArticleCoverImage
                  src={mediaUrl}
                  alt={title}
                  objectPosition={coverPosition ?? undefined}
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

        <DoorwayCard
          username={normalizedUser}
          role={authorRole}
          isVerified={isVerifiedProvider}
          hasSlots={authorHasAvailableSlot}
        />

        {/* Requirement: Display SocialShareBar under article content */}
        <SocialShareBar
          url={articleCanonicalUrl}
          title={title}
          authorUsername={normalizedUser}
        />

        {/* Litera NFT Widget Resmi Web3 (Hanya Tampil Jika Penulis Mengaktifkan Integrasi Web3) */}
        {isLiteraRegistered && (
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
        )}

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-inherit">
                Tulisan Lain oleh @{normalizedUser}
              </h3>
              <Link
                href={`/tenant/${normalizedUser}`}
                className="text-xs font-semibold opacity-70 hover:opacity-100 hover:underline transition"
              >
                Lihat Semua ({otherArticles.length}) →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherArticles.slice(0, 4).map((other) => {
                const dateStr = other.published_at;
                const formattedDate = dateStr
                  ? new Date(dateStr).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Baru saja";
                const primaryTag = (other.tags && other.tags[0]) || "Refleksi";

                return (
                  <Link
                    key={other.id}
                    href={`/tenant/${normalizedUser}/${other.slug}`}
                    className="group flex flex-col justify-between rounded-2xl border border-current/15 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-4 transition-all hover:border-current/40 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      {other.media_url && !other.media_url.startsWith("blob:") && (
                        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={other.media_url}
                            alt={other.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-inherit opacity-60 mb-1">
                        #{primaryTag}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 text-inherit group-hover:underline">
                        {other.title}
                      </h4>
                      {other.excerpt && (
                        <p className="mt-1 text-xs opacity-70 line-clamp-2 leading-relaxed">
                          {other.excerpt}
                        </p>
                      )}
                    </div>
                    <span className="mt-3 text-[11px] opacity-60 font-medium">
                      {formattedDate}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
