'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updatePasswordAction } from '@/app/actions/auth';

interface ResetPasswordFormProps {
  sessionActive: boolean;
}

export default function ResetPasswordForm({ sessionActive }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmation) {
      setErrorMessage('Konfirmasi kata sandi tidak sama.');
      return;
    }

    startTransition(async () => {
      const res = await updatePasswordAction({ password });
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal memperbarui kata sandi.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F5] text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3F3766]">
          Kata Sandi Baru
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[28px] bg-white/75 p-6 sm:p-8 shadow-xl shadow-[#3C3163]/10">
          {!sessionActive ? (
            <div role="alert">
              <p className="font-semibold text-[#3C3163]">
                Tautan reset tidak valid atau sudah kedaluwarsa.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Tautan hanya berlaku sekali. Silakan minta tautan baru.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-flex rounded-full bg-[#3C3163] px-5 py-3 text-sm font-semibold text-white"
              >
                Minta tautan baru
              </Link>
            </div>
          ) : done ? (
            <div role="status">
              <p className="font-semibold text-[#3C3163]">
                Kata sandi berhasil diperbarui.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Mengalihkan Anda ke halaman masuk…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <p role="alert" className="text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
              <label className="block">
                <span className="text-sm font-medium text-[#3C3163]">Kata sandi baru</span>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#3C3163]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#3C3163]">Ulangi kata sandi</span>
                <input
                  type="password"
                  name="confirmation"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#3C3163]"
                />
              </label>
              <p className="text-xs text-slate-500">Minimal 8 karakter.</p>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-full bg-[#3C3163] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? 'Menyimpan…' : 'Simpan kata sandi baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
