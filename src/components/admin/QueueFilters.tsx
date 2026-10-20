"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface QueueFiltersProps {
  currentTrack?: string;
  currentStatus?: string;
  currentSort?: string;
  currentQuery?: string;
}

export function QueueFilters({
  currentTrack = "",
  currentStatus = "PENDING",
  currentSort = "newest",
  currentQuery = "",
}: QueueFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentQuery);

  const createQueryString = (paramsToUpdate: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [key, value] of Object.entries(paramsToUpdate)) {
      if (value === null || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }
    return nextParams.toString();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = createQueryString({ q: searchTerm.trim() || null });
    router.push(`/admin/verifikasi?${qs}`);
  };

  const tracks = [
    { label: "Semua Jalur", value: "" },
    { label: "Sebaya", value: "SEBAYA" },
    { label: "Klinis", value: "KLINIS" },
  ];

  const statuses = [
    { label: "Menunggu (Pending)", value: "PENDING" },
    { label: "Disetujui", value: "APPROVED" },
    { label: "Ditolak", value: "REJECTED" },
    { label: "Kedaluwarsa", value: "EXPIRED" },
    { label: "Semua Status", value: "ALL" },
  ];

  const sorts = [
    { label: "Terbaru", value: "newest" },
    { label: "Terlama", value: "oldest" },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama, email, atau @username..."
          className="flex-1 rounded-xl border border-black/10 bg-[#FBF8F5] px-3.5 py-2 text-xs text-[#3C3163] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(257,68%,73%)]"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#3C3163] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2e254e]"
        >
          Cari
        </button>
      </form>

      {/* Track & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-black/[0.04] pt-3">
        {/* Track Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-black/40 mr-1">
            Jalur:
          </span>
          {tracks.map((t) => {
            const active = currentTrack === t.value;
            const qs = createQueryString({ track: t.value || null });
            return (
              <Link
                key={t.value}
                href={`/admin/verifikasi?${qs}`}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  active
                    ? "bg-[#3C3163] text-white"
                    : "bg-[#FBF8F5] text-black/70 hover:bg-black/5"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-black/40 mr-1">
            Urutan:
          </span>
          {sorts.map((s) => {
            const active = currentSort === s.value;
            const qs = createQueryString({ sort: s.value });
            return (
              <Link
                key={s.value}
                href={`/admin/verifikasi?${qs}`}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-black/10 text-[#3C3163] font-bold"
                    : "text-black/50 hover:text-black/80"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-black/[0.04] pt-3">
        <span className="text-[11px] font-medium text-black/40 mr-1">
          Status:
        </span>
        {statuses.map((s) => {
          const active = currentStatus === s.value;
          const qs = createQueryString({ status: s.value });
          return (
            <Link
              key={s.value}
              href={`/admin/verifikasi?${qs}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "bg-[hsl(257,68%,73%)] text-[#3C3163]"
                  : "bg-[#FBF8F5] text-black/70 hover:bg-black/5"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
