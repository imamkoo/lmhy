import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/verifikasi", label: "Verifikasi Mitra" },
  { href: "/admin/litera", label: "Litera" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  return (
    <div className="min-h-screen bg-[#FBF8F5] text-[#3C3163]">
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <nav className="max-w-[1130px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <span className="font-extrabold text-lg">Kontrol LMHY</span>
          <span className="text-xs opacity-70">{admin.email ?? admin.id}</span>
        </nav>
        <div className="max-w-[1130px] mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto pb-3">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-full px-4 py-2 text-xs font-semibold border border-black/[0.06] whitespace-nowrap hover:ring-2 hover:ring-[hsl(257,68%,73%)]">
              {t.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="max-w-[1130px] mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
