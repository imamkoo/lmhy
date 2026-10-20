'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { requestPasswordResetAction } from '@/app/actions/auth';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const res = await requestPasswordResetAction({ email });
      if (!res.success) {
        setErrorMessage(res.error || 'Permintaan reset gagal dikirim.');
        return;
      }
      setSent(true);
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3F3766]">
          Atur Ulang Kata Sandi
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Kami akan mengirim tautan aman ke email Anda.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[28px] bg-white/75 p-6 sm:p-8 shadow-xl shadow-[#3C3163]/10">
          {sent ? (
            <div role="status">
              <p className="font-semibold text-[#3C3163]">
                Jika email tersebut terdaftar, tautan reset sudah kami kirim.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Tautan berlaku untuk satu kali penggunaan. Periksa juga folder
                spam bila tidak muncul dalam beberapa menit.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex rounded-full bg-[#3C3163] px-5 py-3 text-sm font-semibold text-white"
              >
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <p role="alert" className="text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
              <label className="block">
                <span className="text-sm font-medium text-[#3C3163]">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#3C3163]"
                />
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-full bg-[#3C3163] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? 'Mengirim…' : 'Kirim tautan reset'}
              </button>
              <p className="text-center text-sm text-slate-600">
                Ingat kata sandi?{' '}
                <Link href="/login" className="font-semibold text-[#3C3163] underline">
                  Masuk
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
