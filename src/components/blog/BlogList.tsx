import type { BlogPost } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

type BlogListProps = {
  posts: BlogPost[];
};

export function BlogList({ posts }: BlogListProps) {
  if (posts.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Belum ada artikel untuk ditampilkan.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => <BlogCard key={post.slug} post={post} />)}
    </div>
  );
}
