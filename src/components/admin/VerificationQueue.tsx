"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QueueItem } from "@/lib/mitra/queue";
import { getApplicationDetailAction } from "@/app/actions/admin-mitra";
import {
  VerificationDetail,
  type ApplicationData,
  type DocumentItem,
} from "./VerificationDetail";

interface VerificationQueueProps {
  initialItems: QueueItem[];
  selectedId?: string;
  initialSelectedApplication: ApplicationData | null;
  initialDocuments?: DocumentItem[];
}

export function VerificationQueue({
  initialItems,
  selectedId,
  initialSelectedApplication,
  initialDocuments = [],
}: VerificationQueueProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<ApplicationData | null>(
    initialSelectedApplication ||
      (initialItems.length > 0 && selectedId
        ? (initialItems.find((i) => i.id === selectedId) as unknown as ApplicationData)
        : (initialItems[0] as unknown as ApplicationData) || null)
  );
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [, startTransition] = useTransition();

  const handleSelectApplication = async (item: QueueItem) => {
    setIsLoadingDetail(true);
    try {
      const res = await getApplicationDetailAction(item.id);
      if (res.ok && res.application) {
        setSelectedItem(res.application as unknown as ApplicationData);
        setDocuments((res.documents as DocumentItem[]) || []);
      } else {
        setSelectedItem(item as unknown as ApplicationData);
        setDocuments([]);
      }
    } catch {
      setSelectedItem(item as unknown as ApplicationData);
      setDocuments([]);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleActionComplete = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const formatAge = (hours: number) => {
    if (hours < 1) return "Baru saja";
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* List (Left) */}
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-black/60 px-1">
          <span>Menampilkan {initialItems.length} pengajuan</span>
        </div>

        {initialItems.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center text-xs text-black/50">
            Tidak ada pengajuan yang cocok dengan filter saat ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {initialItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectApplication(item)}
                  className={`group cursor-pointer rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-[#3C3163] bg-white shadow-md ring-2 ring-[hsl(257,68%,73%)]/40"
                      : "border-black/[0.06] bg-white hover:border-black/20 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.track === "KLINIS"
                              ? "bg-purple-100 text-purple-900"
                              : "bg-teal-100 text-teal-900"
                          }`}
                        >
                          {item.track}
                        </span>
                        <span className="text-xs font-mono text-black/50 truncate">
                          @{item.username}
                        </span>
                      </div>
                      <h4 className="mt-1 font-bold text-sm text-[#3C3163] truncate">
                        {item.applicant_name}
                      </h4>
                      <p className="text-[11px] text-black/50 truncate">
                        {item.applicant_email}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] text-black/40">
                        {formatAge(item.ageHours)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Red Flags */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {item.needsAction && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Butuh Tindakan (&gt;7 hr)
                      </span>
                    )}
                    {item.redFlags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail (Right) */}
      <div className="lg:col-span-7">
        {isLoadingDetail ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-black/[0.06] bg-white p-8 text-xs text-black/50">
            Memuat rincian pengajuan...
          </div>
        ) : selectedItem ? (
          <VerificationDetail
            key={selectedItem.id}
            application={selectedItem}
            documents={documents}
            onActionComplete={handleActionComplete}
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-black/[0.06] bg-white p-8 text-xs text-black/50">
            Pilih salah satu pengajuan di sisi kiri untuk melihat rincian.
          </div>
        )}
      </div>
    </div>
  );
}
