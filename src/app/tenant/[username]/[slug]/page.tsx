import Link from "next/link";
import { notFound } from "next/navigation";
import { LiteraWidget } from "@/components/litera/LiteraWidget";
import { getTenantArticleBySlug, getTenantArticles } from "@/lib/tenant-storage";

export default async function TenantArticlePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  // Don't intercept the 'write' page if accessed
  if (slug === "write") {
    notFound();
  }

  const article = getTenantArticleBySlug(username, slug);

  // Dynamic fallback for custom slugs if not pre-seeded
  const title = article
    ? article.title
    : slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

  const content = article
    ? article.content
    : `Ini adalah artikel yang diterbitkan melalui subdomain personal @${username}. Setiap tulisan di sini dapat dikoleksi oleh pembaca sebagai sertifikat digital permanen melalui jaringan Litera Web3 di blockchain Polygon.`;

  const tags = article?.tags || ["Refleksi", "Kesehatan Mental"];
  const otherArticles = getTenantArticles(username).filter(
    (a) => a.slug !== slug
  );

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-6 py-12 text-slate-900 md:px-12">
      <article className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-[#b86644] hover:underline"
          >
            ← Kembali ke profil @{username}
          </Link>
          <Link
            href="/write"
            className="text-xs font-semibold text-slate-500 hover:text-[#d07954]"
          >
            + Tulis Baru
          </Link>
        </div>

        <header className="mb-10 mt-8 border-b border-slate-200 pb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#d07954]/10 px-3 py-1 text-xs font-bold text-[#b86644]">
              Ruang Refleksi @{username}
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

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Ditulis oleh <strong>@{username}</strong>
            </span>
            {article?.createdAt && (
              <span>
                {new Date(article.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </header>

        {/* Konten Tulisan */}
        <div className="prose prose-slate max-w-none text-lg leading-relaxed text-slate-700">
          {content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="mb-6 whitespace-pre-line leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

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
          <LiteraWidget title={title} />
        </div>

        {/* Rekomendasi Tulisan Lain dari Penulis Ini */}
        {otherArticles.length > 0 && (
          <section className="mt-16 border-t border-slate-200 pt-8">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Tulisan Lain oleh @{username}
            </h3>
            <div className="space-y-3">
              {otherArticles.slice(0, 3).map((other) => (
                <div
                  key={other.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#d07954]"
                >
                  <Link
                    href={`/${other.slug}`}
                    className="font-semibold text-slate-800 hover:text-[#d07954]"
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
