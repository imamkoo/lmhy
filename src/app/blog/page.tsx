import type { Metadata } from "next";
import Link from "next/link";
import { BlogList } from "@/components/blog/BlogList";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog Kesehatan Mental | Let Me Hear You",
  description: "Bacaan terpercaya tentang kesehatan mental, self-care, burnout, dan kesejahteraan emosional.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-5 py-16 text-slate-900 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-[#b86644]">← Kembali ke LMHY</Link>
        <header className="mb-12 mt-10 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#d07954]">LMHY Journal</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Ruang untuk memahami diri.</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">Edukasi dan cerita yang membantu Anda merawat kesehatan mental dengan langkah yang lebih sadar.</p>
        </header>
        <BlogList posts={posts} />
      </div>
    </main>
  );
}
