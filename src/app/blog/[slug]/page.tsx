import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { LiteraWidget } from "@/components/litera/LiteraWidget";
import { mdxComponents } from "@/components/blog/mdx-components";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { BlogList } from "@/components/blog/BlogList";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: { canonical: post.slug ? `/blog/${post.slug}` : undefined },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      images: post.ogImage || post.coverImage ? [post.ogImage || post.coverImage || ""] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { content } = await compileMDX({ source: post.content, components: mdxComponents });
  const related = getRelatedPosts(post);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    image: post.ogImage || post.coverImage,
  };

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-5 py-12 text-slate-900 md:px-10">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm font-semibold text-[#b86644]">← Semua artikel</Link>
        <header className="mb-10 mt-10">
          <div className="mb-4 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#d07954]/10 px-3 py-1 text-xs font-bold text-[#b86644]">{tag}</span>)}</div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>
          <p className="mt-4 text-sm text-slate-500">{post.author} · {new Date(post.date).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
        </header>
        <div className="prose prose-slate max-w-none">{content}</div>
        <LiteraWidget title={post.title} />
        {related.length > 0 && <section className="mt-16 border-t border-slate-200 pt-10"><h2 className="mb-6 text-2xl font-bold">Artikel terkait</h2><BlogList posts={related} /></section>}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
