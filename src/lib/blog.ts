import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIRECTORY = path.join(process.cwd(), "content", "blog");

export type BlogPost = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  author: string;
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
};

export type BlogPostWithContent = BlogPost & {
  content: string;
};

function assertPost(value: Record<string, unknown>, source: string): BlogPost {
  const required = ["title", "slug", "date", "excerpt", "author"] as const;
  for (const key of required) {
    if (typeof value[key] !== "string" || !value[key].trim()) {
      throw new Error(`Blog post ${source} is missing required frontmatter: ${key}`);
    }
  }

  if (typeof value.slug !== "string" || !/^[a-z0-9-]+$/.test(value.slug)) {
    throw new Error(`Blog post ${source} has an invalid slug`);
  }

  return {
    title: value.title as string,
    slug: value.slug as string,
    date: value.date as string,
    excerpt: value.excerpt as string,
    coverImage: typeof value.coverImage === "string" ? value.coverImage : undefined,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : [],
    author: value.author as string,
    category: typeof value.category === "string" ? value.category : undefined,
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : undefined,
    seoDescription: typeof value.seoDescription === "string" ? value.seoDescription : undefined,
    ogImage: typeof value.ogImage === "string" ? value.ogImage : undefined,
  };
}

function readPost(filename: string): BlogPostWithContent {
  const source = fs.readFileSync(path.join(BLOG_DIRECTORY, filename), "utf8");
  const { data, content } = matter(source);
  return { ...assertPost(data, filename), content };
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIRECTORY)) return [];

  return fs
    .readdirSync(BLOG_DIRECTORY)
    .filter((filename) => filename.endsWith(".mdx"))
    .map((filename) => readPost(filename))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((post) => {
      const { content, ...metadata } = post;
      void content;
      return metadata;
    });
}

export function getPostBySlug(slug: string): BlogPostWithContent | null {
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(BLOG_DIRECTORY)) return null;

  const posts = fs
    .readdirSync(BLOG_DIRECTORY)
    .filter((filename) => filename.endsWith(".mdx"))
    .map((filename) => readPost(filename));

  return posts.find((post) => post.slug === slug) ?? null;
}

export function getAllTags(): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const related = getAllPosts().filter((candidate) => candidate.slug !== post.slug);
  return related
    .sort((a, b) => {
      const aMatches = a.tags.filter((tag) => post.tags.includes(tag)).length;
      const bMatches = b.tags.filter((tag) => post.tags.includes(tag)).length;
      return bMatches - aMatches;
    })
    .slice(0, limit);
}
