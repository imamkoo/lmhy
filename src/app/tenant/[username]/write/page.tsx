import Link from "next/link";
import { WriteForm } from "./WriteForm";

export default async function TenantWritePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-6 py-12 text-slate-900 md:px-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-[#b86644] hover:underline"
          >
            ← Kembali ke profil @{username}
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Tulis Refleksi Baru
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Tuangkan pemikiran, jurnal kesehatan mental, atau artikel refleksi Anda di subdomain <strong>@{username}</strong>.
          </p>
        </div>

        <WriteForm username={username} />
      </div>
    </main>
  );
}
