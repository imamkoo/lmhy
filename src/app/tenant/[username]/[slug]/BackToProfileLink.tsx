"use client";

export function BackToProfileLink({ username }: { username: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        window.location.assign("/");
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#3F3766] shadow-sm ring-1 ring-[#3F3766]/10 backdrop-blur-sm transition hover:bg-[#F7ABC5]/20 active:scale-[0.97] active:bg-[#F7ABC5]/30 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7ABC5]"
    >
      ← Kembali ke profil @{username}
    </a>
  );
}
