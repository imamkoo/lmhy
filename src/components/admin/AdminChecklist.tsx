"use client";

import { useState, useTransition } from "react";
import { updateChecklistAction } from "@/app/actions/admin-mitra";

interface AdminChecklistProps {
  applicationId: string;
  track: "SEBAYA" | "KLINIS";
  emailVerifiedAt: string | null;
  waJoinedConfirmedAt: string | null;
  pfaStatus: "BELUM" | "SEDANG" | "SELESAI";
  ethicsPledgeAt: string;
  hasDocuments: boolean;
  onUpdated?: () => void;
}

export function AdminChecklist({
  applicationId,
  track,
  emailVerifiedAt,
  waJoinedConfirmedAt,
  pfaStatus,
  ethicsPledgeAt,
  hasDocuments,
  onUpdated,
}: AdminChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [waConfirmed, setWaConfirmed] = useState(Boolean(waJoinedConfirmedAt));
  const [currentPfa, setCurrentPfa] = useState(pfaStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleWa = (checked: boolean) => {
    setWaConfirmed(checked);
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateChecklistAction(applicationId, {
        waJoinedConfirmed: checked,
      });
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal memperbarui status WA.");
        setWaConfirmed(!checked);
      } else {
        onUpdated?.();
      }
    });
  };

  const handleChangePfa = (status: "BELUM" | "SEDANG" | "SELESAI") => {
    const prev = currentPfa;
    setCurrentPfa(status);
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateChecklistAction(applicationId, {
        pfaStatus: status,
      });
      if (!res.ok) {
        setErrorMessage(res.message || "Gagal memperbarui status PFA.");
        setCurrentPfa(prev);
      } else {
        onUpdated?.();
      }
    });
  };

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
      <h3 className="text-sm font-bold tracking-tight text-[#3C3163]">
        Checklist Verifikasi Admin
      </h3>
      <p className="mt-1 text-xs text-black/60">
        Status ini menentukan kelayakan persetujuan pengajuan mitra.
      </p>

      {errorMessage && (
        <div className="mt-3 rounded-lg bg-[hsl(344,81%,87%)]/30 p-2 text-xs text-[#3C3163]">
          {errorMessage}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {/* Email verification (Read-only) */}
        <div className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3 text-xs">
          <div>
            <span className="font-semibold text-[#3C3163]">
              1. Verifikasi Alamat Email
            </span>
            <p className="mt-0.5 text-[11px] text-black/50">
              Otomatis terverifikasi via email konfirmasi.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              emailVerifiedAt
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {emailVerifiedAt ? "Terverifikasi" : "Belum Verifikasi"}
          </span>
        </div>

        {/* WhatsApp confirmation (Sebaya specific) */}
        {track === "SEBAYA" && (
          <div className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3 text-xs">
            <div className="pr-4">
              <span className="font-semibold text-[#3C3163]">
                2. Bergabung Grup Komunitas WA
              </span>
              <p className="mt-0.5 text-[11px] text-black/50">
                Admin memastikan pelamar sudah masuk grup WhatsApp mitra.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                disabled={isPending}
                checked={waConfirmed}
                onChange={(e) => handleToggleWa(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-[#3C3163] focus:ring-[hsl(257,68%,73%)]"
              />
            </label>
          </div>
        )}

        {/* PFA status (Sebaya specific) */}
        {track === "SEBAYA" && (
          <div className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3 text-xs">
            <div className="pr-4">
              <span className="font-semibold text-[#3C3163]">
                3. Status Pelatihan PFA
              </span>
              <p className="mt-0.5 text-[11px] text-black/50">
                Wajib diselesaikan sebelum disetujui sebagai Pendamping.
              </p>
            </div>
            <select
              disabled={isPending}
              value={currentPfa}
              onChange={(e) =>
                handleChangePfa(
                  e.target.value as "BELUM" | "SEDANG" | "SELESAI"
                )
              }
              className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[#3C3163] focus:outline-none focus:ring-2 focus:ring-[hsl(257,68%,73%)]"
            >
              <option value="BELUM">Belum</option>
              <option value="SEDANG">Sedang Berjalan</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        )}

        {/* Documents requirement (Read-only check) */}
        <div className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3 text-xs">
          <div>
            <span className="font-semibold text-[#3C3163]">
              {track === "KLINIS"
                ? "2. Berkas Kredensial STR / Izin Praktik"
                : "4. Kelengkapan Berkas Dokumen"}
            </span>
            <p className="mt-0.5 text-[11px] text-black/50">
              Minimal 1 dokumen wajib terunggah.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              hasDocuments
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {hasDocuments ? "Lengkap" : "Kurang"}
          </span>
        </div>

        {/* Ethics pledge (Read-only) */}
        <div className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3 text-xs">
          <div>
            <span className="font-semibold text-[#3C3163]">
              {track === "KLINIS" ? "3." : "5."} Komitmen Kode Etik Layanan
            </span>
            <p className="mt-0.5 text-[11px] text-black/50">
              Disetujui saat pengiriman form.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {ethicsPledgeAt ? "Disetujui" : "Belum"}
          </span>
        </div>
      </div>
    </div>
  );
}
