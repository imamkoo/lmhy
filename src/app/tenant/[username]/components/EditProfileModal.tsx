"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/supabase/types";
import { updateProfileAction } from "@/app/actions/profile";

interface EditProfileModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  profile: Profile;
}

interface EditProfileFormProps {
  profile: Profile;
  onClose: () => void;
}

function EditProfileForm({ profile, onClose }: EditProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_profile_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Nama tampilan tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateProfileAction({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        website: website.trim() || null,
        facebookProfileUrl: facebookUrl.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "Gagal memperbarui profil.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="edit-profile-title" className="text-xl font-bold text-slate-900">
              Edit Profil Kreator
            </h2>
            <p className="text-xs text-slate-500">
              Perbarui informasi identitas, foto, dan bio ruang refleksi Anda.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup modal"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feedback Notices */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            ✓ Profil berhasil disimpan! Memperbarui tampilan...
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nama Tampilan (Display Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Contoh: Budi Santoso"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Bio & Refleksi Diri
              </label>
              <span className="text-[10px] text-slate-400">{bio.length}/300 karakter</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Ceritakan minat menulis, perjalanan batin, atau ruang aman yang Anda bagikan..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
            />
          </div>

          {/* Avatar URL & Live Preview */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              URL Foto Profil (Avatar)
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Preview Avatar"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span>{displayName ? displayName.charAt(0).toUpperCase() : "@"}</span>
                )}
              </div>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... atau link foto"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
              />
            </div>
          </div>

          {/* Banner URL & Live Preview */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              URL Banner Sampul (Header Cover)
            </label>
            <div className="mt-1.5 space-y-2">
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... atau link banner gambar lebar"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
              />
              {bannerUrl && (
                <div className="relative h-20 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerUrl}
                    alt="Preview Banner"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Social Links: Website & Facebook */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Situs Web / Portofolio
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://website-anda.com"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Profil Facebook
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/username-anda"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d07954] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d07954]/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d07954] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b86644] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditProfileModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  profile,
}: EditProfileModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalOpen;

  const handleClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  }, [controlledOnClose]);

  // Listen for custom open event when un-controlled
  useEffect(() => {
    const handleOpenEvent = () => setInternalOpen(true);
    window.addEventListener("open-edit-profile", handleOpenEvent);
    return () => window.removeEventListener("open-edit-profile", handleOpenEvent);
  }, []);

  if (!isOpen) return null;

  return <EditProfileForm key={profile.id + (profile.updated_at || "")} profile={profile} onClose={handleClose} />;
}
