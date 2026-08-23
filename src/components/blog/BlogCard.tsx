import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

type BlogCardProps = {
  post: BlogPost;
};

export function BlogCard({ post }: BlogCardProps) {
  const publishedAt = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(post.date));

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#e8ddd3]">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : null}
        </div>
        <div className="p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-[#d07954]/10 px-3 py-1 text-[11px] font-bold text-[#b86644]">
                {tag}
              </span>
            ))}
          </div>
          <p className="mb-2 text-xs font-medium text-slate-500">{publishedAt}</p>
          <h2 className="text-xl font-bold leading-tight text-slate-900">{post.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
          <span className="mt-5 inline-block text-sm font-bold text-[#d07954]">Baca artikel →</span>
        </div>
      </Link>
    </article>
  );
}
