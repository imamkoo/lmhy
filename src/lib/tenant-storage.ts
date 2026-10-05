/**
 * Storage & Data Access for Tenant Subdomain Blogs
 */

export interface TenantArticle {
  id: string;
  username: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  createdAt: string;
  tags: string[];
  mediaType?: "IMAGE" | "VIDEO";
  mediaUrl?: string;
  isLiteraRegistered?: boolean;
}

// Initial sample articles for tenant demonstration
export const DEFAULT_TENANT_ARTICLES: TenantArticle[] = [
  {
    id: "art_1",
    username: "axaa",
    slug: "mengenali-tanda-burnout",
    title: "Mengenali Tanda Burnout Sebelum Terlambat",
    excerpt:
      "Burnout bukan sekadar lelah biasa. Pelajari langkah kecil yang bisa membantu Anda pulih perlahan dan merawat diri.",
    content:
      "Sering kali kita tidak menyadari ketika tubuh dan pikiran sudah mencapai titik jenuh. Kelelahan emosional, hilangnya motivasi, hingga perasaan hampa saat menjalani rutinitas harian adalah sinyal penting bahwa kita perlu berhenti sejenak.\n\nDalam ruang refleksi ini, kita belajar bahwa beristirahat bukanlah bentuk kekalahan, melainkan bagian dari proses penyembuhan yang esensial.",
    createdAt: "2026-10-02T09:00:00Z",
    tags: ["Burnout", "Self-Care", "Kesehatan Mental"],
    isLiteraRegistered: true,
  },
  {
    id: "art_2",
    username: "axaa",
    slug: "seni-menerima-ketidaksempurnaan",
    title: "Seni Menerima Ketidaksempurnaan Diri",
    excerpt:
      "Melepaskan tuntutan perfeksionisme yang melelahkan dan belajar berdamai dengan kelemahan manusiawi kita.",
    content:
      "Kita tumbuh dalam budaya yang memuja kesempurnaan. Namun sering kali, pengejaran standar yang mustahil justru menjadi sumber kecemasan utama. Belajar merangkul ketidaksempurnaan adalah langkah pertama menuju kedamaian batin.",
    createdAt: "2026-10-01T14:30:00Z",
    tags: ["Mindfulness", "Acceptance", "Self-Love"],
    isLiteraRegistered: true,
  },
];

// In-memory runtime storage for newly created tenant articles
const runtimeArticles: TenantArticle[] = [];

export function getTenantArticles(username: string): TenantArticle[] {
  const normalizedUser = username.toLowerCase();
  const matchedRuntime = runtimeArticles.filter(
    (a) => a.username.toLowerCase() === normalizedUser
  );
  const matchedDefaults = DEFAULT_TENANT_ARTICLES.filter(
    (a) => a.username.toLowerCase() === normalizedUser
  );

  // If new user with no articles, create a starter welcome article
  if (matchedRuntime.length === 0 && matchedDefaults.length === 0) {
    return [
      {
        id: `welcome_${normalizedUser}`,
        username: normalizedUser,
        slug: "selamat-datang-di-ruang-refleksi",
        title: `Selamat Datang di Jurnal Digital @${normalizedUser}`,
        excerpt:
          "Ini adalah artikel pertama di subdomain personal Anda. Tulisan di sini terhubung langsung dengan jaringan sertifikat digital Litera.",
        content: `Halo dan selamat datang di ruang refleksi digital @${normalizedUser}. Di sini Anda dapat menuliskan perjalanan pikiran, kesehatan mental, dan wawasan berharga Anda. Setiap artikel dapat dikoleksi oleh pembaca sebagai sertifikat digital resmi di blockchain Polygon.`,
        createdAt: new Date().toISOString(),
        tags: ["Refleksi", "Jurnal", "Web3"],
        isLiteraRegistered: true,
      },
    ];
  }

  return [...matchedRuntime, ...matchedDefaults].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTenantArticleBySlug(
  username: string,
  slug: string
): TenantArticle | null {
  const articles = getTenantArticles(username);
  return articles.find((a) => a.slug === slug) ?? null;
}

export function saveTenantArticle(article: TenantArticle): TenantArticle {
  // Check if exists in runtime, update if so
  const index = runtimeArticles.findIndex(
    (a) =>
      a.username.toLowerCase() === article.username.toLowerCase() &&
      a.slug === article.slug
  );

  if (index >= 0) {
    runtimeArticles[index] = article;
  } else {
    runtimeArticles.unshift(article);
  }

  return article;
}
