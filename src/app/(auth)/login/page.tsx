import LoginForm from './LoginForm';

/**
 * Server component untuk segmen route /login.
 *
 * `force-dynamic` WAJIB ditulis di file ini, bukan di komponen kliennya:
 * Next.js mengabaikan export konfigurasi segment route pada file 'use client'
 * (sudah diverifikasi — `next build` tetap menandai /login sebagai ○ Static
 * sebelum pemisahan file ini).
 *
 * Kenapa harus dynamic: LoginForm membaca query string (?next=..., ?error=...)
 * lewat useSearchParams(). Saat /login di-prerender statis, useSearchParams()
 * memaksa Client Component tree ke Suspense fallback, sehingga HTML yang
 * dikirim server hanya berisi spinner — form baru muncul setelah hydration.
 * Akibatnya ada blank flash bagi pengguna dan konten form tidak terbaca SEO.
 * Dengan render per-request, seluruh form ikut ter-render di server.
 */
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}
