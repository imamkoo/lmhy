import Link from "next/link";
import { getTenantArticles } from "@/lib/tenant-storage";

export default async function TenantProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const articles = getTenantArticles(username);

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-6 py-16 text-slate-900 md:px-12">
      <div className="mx-auto max-w-3xl">
        {/* Header Profil Kreator */}
        <header className="mb-12 border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-block rounded-full bg-[#d07954]/15 px-3.5 py-1 text-xs font-bold text-[#b86644]">
                Ruang Refleksi & Jurnal Digital
              </div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                @{username}
              </h1>
              <p className="mt-2 text-base text-slate-600 md:text-lg">
                Kumpulan refleksi, tulisan kesehatan mental, dan edisi sertifikat digital resmi di Let Me Hear You.
              </p>
            </div>
            <div className="self-start sm:self-auto flex items-center gap-2">
              <Link
                href={`/builder?username=${username}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#d07954] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b86644]"
              >
                <span>✏️</span> Tulis di Web Builder
              </Link>
            </div>
          </div>
        </header>

        {/* Daftar Artikel Penulis */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              Daftar Artikel ({articles.length})
            </h2>
          </div>

          <div className="space-y-4">
            {articles.map((art) => (
              <article
                key={art.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#d07954]/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {art.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                  {art.isLiteraRegistered && (
                    <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      NFT Ready
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-2xl font-bold text-slate-900">
                  <Link
                    href={`/${art.slug}`}
                    className="transition hover:text-[#d07954]"
                  >
                    {art.title}
                  </Link>
                </h3>

                <p className="mt-2 text-slate-600 line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    {new Date(art.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/${art.slug}`}
                    className="text-sm font-bold text-[#d07954] hover:underline"
                  >
                    Baca tulisan & sertifikat →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
          <p>
            Diterbitkan melalui <strong>Let Me Hear You Subdomain Network</strong>. Terintegrasi dengan protokol <strong>Litera Web3</strong>.
          </p>
        </footer>
      </div>
    </main>
  );
}
