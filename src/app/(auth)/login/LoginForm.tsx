'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithGoogleAction,
  signInWithFacebookAction,
  signInWithEmailAction,
  signUpWithEmailAction,
} from '@/app/actions/auth';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || searchParams.get('redirect') || '/builder';
  const errorParam = searchParams.get('error');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? 'Autentikasi gagal atau dibatalkan. Silakan coba kembali.' : null
  );
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    setOauthLoading('google');
    startTransition(async () => {
      try {
        const res = await signInWithGoogleAction(nextUrl);
        if (res.success && res.url) {
          window.location.assign(res.url);
        } else {
          setErrorMessage(res.error || 'Gagal memulai login dengan Google.');
          setOauthLoading(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan.';
        setErrorMessage(msg);
        setOauthLoading(null);
      }
    });
  };

  const handleFacebookLogin = () => {
    setErrorMessage(null);
    setOauthLoading('facebook');
    startTransition(async () => {
      try {
        const res = await signInWithFacebookAction(nextUrl);
        if (res.success && res.url) {
          window.location.assign(res.url);
        } else {
          setErrorMessage(res.error || 'Gagal memulai login dengan Facebook.');
          setOauthLoading(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan.';
        setErrorMessage(msg);
        setOauthLoading(null);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    startTransition(async () => {
      if (mode === 'signin') {
        const res = await signInWithEmailAction({ email, password });
        if (!res.success) {
          setErrorMessage(res.error || 'Email atau kata sandi tidak cocok.');
          return;
        }

        if (res.needsOnboarding) {
          router.push('/onboarding');
        } else {
          router.push(nextUrl);
        }
      } else {
        const res = await signUpWithEmailAction({ email, password, displayName });
        if (!res.success) {
          setErrorMessage(res.error || 'Pendaftaran gagal.');
          return;
        }

        if (res.needsConfirmation) {
          setSuccessNotice(
            'Tautan konfirmasi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.'
          );
        } else {
          router.push('/onboarding');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#F7ABC5]/20 selection:text-[#3F3766]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-block group mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7ABC5]/20 px-3 py-1 text-xs font-bold text-[#3F3766]/80 border border-[#F7ABC5] group-hover:bg-[#F7ABC5]/40 transition">
            Let Me Hear You
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3F3766]">
          Ruang Cerita & Refleksi
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          Masuk untuk menulis renungan, merawat karya, dan terhubung bersama komunitas.
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-[0_8px_30px_0_rgba(63,55,102,0.08)] border border-[#eadecf]/80">
          {/* Mode Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F5E7C6]/40 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'signin'
                  ? 'bg-white text-[#3F3766] shadow-[0_2px_0_0_#F7ABC5] ring-2 ring-[#F7ABC5]/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-white text-[#3F3766] shadow-[0_2px_0_0_#F7ABC5] ring-2 ring-[#F7ABC5]/30'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successNotice && (
            <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successNotice}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isPending || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#F7ABC5]/30 bg-white text-sm font-semibold text-[#3F3766]/90 hover:bg-[#F5E7C6]/60 hover:shadow-[0_2px_0_0_#F7ABC5] hover:translate-y-[2px] active:shadow-[0_4px_0_0_#F7ABC5] active:translate-y-0 transition shadow-[0_4px_0_0_#F7ABC5] focus:ring-2 focus:ring-[#F7ABC5]/50 focus:outline-none disabled:opacity-60 disabled:hover:shadow-[0_4px_0_0_#F7ABC5] disabled:hover:translate-y-0"
            >
              {oauthLoading === 'google' ? (
                <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Masuk dengan Google</span>
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isPending || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#F7ABC5]/30 bg-white text-sm font-semibold text-[#3F3766]/90 hover:bg-[#F5E7C6]/60 hover:shadow-[0_2px_0_0_#F7ABC5] hover:translate-y-[2px] active:shadow-[0_4px_0_0_#F7ABC5] active:translate-y-0 transition shadow-[0_4px_0_0_#F7ABC5] focus:ring-2 focus:ring-[#F7ABC5]/50 focus:outline-none disabled:opacity-60 disabled:hover:shadow-[0_4px_0_0_#F7ABC5] disabled:hover:translate-y-0"
            >
              {oauthLoading === 'facebook' ? (
                <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              <span>Masuk dengan Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F7ABC5]/40" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#3F3766]/70 font-medium">atau dengan email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold text-[#3F3766]/80 mb-1"
                >
                  Nama Tampilan / Nama Pena
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  maxLength={60}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full rounded-xl border border-[#3F3766]/10 bg-[#F5E7C6]/10 px-3.5 py-2.5 text-sm text-[#3F3766] placeholder-[#3F3766]/60 focus:border-[#F7ABC5] focus:bg-white focus:ring-2 focus:ring-[#F7ABC5]/20 focus:outline-none transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nama yang akan muncul di tajuk artikel dan profil Anda.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#3F3766]/80 mb-1"
              >
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-[#3F3766]/10 bg-[#F5E7C6]/10 px-3.5 py-2.5 text-sm text-[#3F3766] placeholder-[#3F3766]/60 focus:border-[#F7ABC5] focus:bg-white focus:ring-2 focus:ring-[#F7ABC5]/20 focus:outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#3F3766]/80 mb-1"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-[#3F3766]/10 bg-[#F5E7C6]/10 px-3.5 py-2.5 text-sm text-[#3F3766] placeholder-[#3F3766]/60 focus:border-[#F7ABC5] focus:bg-white focus:ring-2 focus:ring-[#F7ABC5]/20 focus:outline-none transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Gunakan minimal 6 karakter, termasuk huruf dan angka.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending || oauthLoading !== null}
              className="w-full mt-2 rounded-xl bg-[#F7ABC5] hover:bg-[#F5E7C6] text-[#3F3766] py-3 px-4 text-sm font-black shadow-[0_6px_0_0_#3F3766] hover:shadow-[0_4px_0_0_#3F3766] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#3F3766] active:translate-y-[5px] transition focus:ring-2 focus:ring-[#F7ABC5]/50 focus:outline-none disabled:opacity-60 disabled:hover:shadow-[0_6px_0_0_#3F3766] disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isPending && (
                <div className="h-4 w-4 border-2 border-[#3F3766]/30 border-t-[#3F3766] rounded-full animate-spin" />
              )}
              <span>{mode === 'signin' ? 'Masuk ke Ruang Tulis' : 'Daftar ke Ruang Tulis'}</span>
            </button>
          </form>

          {/* Privacy Note */}
          <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
            Dengan melanjutkan, Anda menyetujui ruang berbagi yang ramah, santun, dan saling
            menghargai perjalanan pemulihan setiap jiwa.
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[#3F3766]/70 hover:text-[#3F3766] hover:underline decoration-[#F7ABC5] decoration-2 underline-offset-4 transition"
          >
            ← Kembali ke Beranda LMHY
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF8F5] flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-[#3F3766]/30 border-t-[#3F3766] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
