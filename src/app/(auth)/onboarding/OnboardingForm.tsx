'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  checkUsernameAvailabilityAction,
  completeOnboardingAction,
  signOutAction,
} from '@/app/actions/auth';
import {
  USERNAME_REGEX,
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
} from '@/lib/auth-constants';

interface OnboardingFormProps {
  initialDisplayName: string;
  initialUsernameCandidate: string;
}

export default function OnboardingForm({
  initialDisplayName,
  initialUsernameCandidate,
}: OnboardingFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsernameCandidate);
  const [isChecking, setIsChecking] = useState(false);
  const [serverAvailability, setServerAvailability] = useState<{
    available: boolean;
    error?: string;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedUsername = useMemo(() => username.trim().toLowerCase(), [username]);

  // Derived local synchronous validation
  const localError = useMemo(() => {
    if (!trimmedUsername) return null;
    if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
      return `Minimal ${MIN_USERNAME_LENGTH} karakter`;
    }
    if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
      return `Maksimal ${MAX_USERNAME_LENGTH} karakter`;
    }
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return 'Hanya huruf kecil (a-z), angka (0-9), & tanda hubung (-)';
    }
    if (trimmedUsername.startsWith('-') || trimmedUsername.endsWith('-')) {
      return 'Tidak boleh diawali atau diakhiri tanda hubung (-)';
    }
    if (trimmedUsername.includes('--')) {
      return 'Tidak boleh memuat tanda hubung ganda (--)';
    }
    return null;
  }, [trimmedUsername]);

  // Debounced server username availability checker
  useEffect(() => {
    if (!trimmedUsername || localError) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await checkUsernameAvailabilityAction(trimmedUsername);
        if (active) {
          setServerAvailability({
            available: res.available,
            error: res.error,
          });
        }
      } catch {
        if (active) {
          setServerAvailability({ available: true });
        }
      } finally {
        if (active) {
          setIsChecking(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [trimmedUsername, localError]);

  const isAvailable = useMemo(() => {
    if (!trimmedUsername || localError) return false;
    if (serverAvailability) return serverAvailability.available;
    return false;
  }, [trimmedUsername, localError, serverAvailability]);

  const validationMessage = useMemo(() => {
    if (localError) return localError;
    if (serverAvailability && !serverAvailability.available) {
      return serverAvailability.error || 'Username ini tidak dapat digunakan.';
    }
    if (serverAvailability?.available) {
      return 'Alamat subdomain tersedia!';
    }
    return null;
  }, [localError, serverAvailability]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setUsername(val);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      setFormError('Nama tampilan atau nama pena wajib diisi.');
      return;
    }

    if (localError || !isAvailable) {
      setFormError(
        validationMessage ||
          'Silakan pilih username yang valid dan belum digunakan.'
      );
      return;
    }

    startTransition(async () => {
      const res = await completeOnboardingAction(trimmedUsername, trimmedDisplayName);
      if (!res.success) {
        setFormError(res.error || 'Gagal menyelesaikan pendaftaran profil.');
        return;
      }

      // Successful onboarding: navigate to builder with new username context
      router.push(`/builder?username=${trimmedUsername}`);
    });
  };

  const safePreviewUser = trimmedUsername || 'nama-anda';

  return (
    <div className="min-h-screen bg-[#fbf8f5] text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#d07954]/20 selection:text-[#b86644]">
      {/* Brand & Introduction Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-8">
        <span className="inline-block rounded-full bg-[#d07954]/10 px-3.5 py-1 text-xs font-bold text-[#b86644] mb-3">
          Langkah Terakhir • Gerbang Identitas
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Pilih Subdomain & Nama Pena Anda
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Setiap penulis di Let Me Hear You memiliki ruang personal khusus untuk mempublikasikan
          refleksi, sertifikat karya digital, dan menjangkau pembaca.
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#f0ebe4] rounded-3xl">
          {/* Subdomain Visual Preview Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#fcf9f6] to-[#f7f2eb] border border-[#eadecf] p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Pratinjau Alamat Publik Anda
            </span>
            <div className="font-mono text-xs sm:text-sm font-semibold text-slate-800 select-all inline-flex items-center justify-center max-w-full overflow-x-auto whitespace-nowrap px-3 py-1.5 rounded-xl bg-white/70 border border-[#eadecf]/80 shadow-xs">
              <span className="text-[#d07954] shrink-0">https://</span>
              <span className="underline decoration-[#d07954] decoration-2 underline-offset-4 text-slate-900 font-bold shrink-0">
                {safePreviewUser}
              </span>
              <span className="text-slate-500 shrink-0">.letmehearyou.id</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Alamat ini bebas dibagikan ke media sosial, resume karya, atau pembaca Anda.
            </p>
          </div>

          {/* Form Error Alert */}
          {formError && (
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
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name Input */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nama Tampilan / Nama Pena Publik
              </label>
              <input
                id="displayName"
                type="text"
                required
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Misal: Budi Santoso"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#d07954] focus:ring-2 focus:ring-[#d07954]/20 focus:outline-none transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nama yang akan muncul di tajuk artikel dan profil Anda.
              </p>
            </div>

            {/* Username / Subdomain Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Pilihan Username Subdomain
              </label>
              <div className="relative rounded-xl">
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="contoh: budi-santoso"
                  className={`w-full rounded-xl border px-3.5 py-2.5 pr-28 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                    trimmedUsername
                      ? isAvailable
                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : localError || (serverAvailability && !serverAvailability.available)
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-[#d07954] focus:ring-2 focus:ring-[#d07954]/20'
                      : 'border-slate-200 focus:border-[#d07954] focus:ring-2 focus:ring-[#d07954]/20'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs">
                  {isChecking ? (
                    <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                      <div className="h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Cek...
                    </span>
                  ) : trimmedUsername ? (
                    isAvailable ? (
                      <span className="text-emerald-600 font-semibold font-sans flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Tersedia
                      </span>
                    ) : localError || (serverAvailability && !serverAvailability.available) ? (
                      <span className="text-rose-500 font-semibold font-sans flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Tidak valid
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans">.letmehearyou.id</span>
                    )
                  ) : (
                    <span className="text-slate-400 font-sans">.letmehearyou.id</span>
                  )}
                </div>
              </div>

              {/* Validation helper status text */}
              {validationMessage && (
                <p
                  className={`text-[11px] mt-1.5 font-medium ${
                    isAvailable ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {validationMessage}
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Gunakan 3-30 karakter huruf kecil, angka, atau tanda hubung (-).
              </p>
            </div>

            {/* Confirm CTA */}
            <button
              type="submit"
              disabled={isPending || isChecking || !isAvailable}
              className="w-full mt-4 rounded-xl bg-[#d07954] hover:bg-[#b86644] text-white py-3 px-4 text-sm font-semibold shadow-sm transition focus:ring-2 focus:ring-[#d07954]/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Konfirmasi & Mulai Menulis</span>
            </button>
          </form>
        </div>

        {/* Back Link / Sign Out */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-slate-500 hover:text-rose-600 transition"
            >
              ← Keluar / Ganti akun
            </button>
          </form>
          <span>•</span>
          <Link
            href="/login"
            className="hover:text-[#d07954] transition"
          >
            Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
