"use client";

import { useState, useTransition } from "react";
import {
  getDocumentUrlAction,
  approveApplicationAction,
  rejectApplicationAction,
} from "@/app/actions/admin-mitra";
import { AdminChecklist } from "./AdminChecklist";

export interface DocumentItem {
  id: string;
  doc_type: string;
  original_filename: string;
  size_bytes: number;
  uploaded_at: string;
  mime_type: string;
}

export interface ApplicationData {
  id: string;
  user_id: string;
  applicant_name: string;
  applicant_email: string;
  username: string;
  whatsapp: string;
  track: "SEBAYA" | "KLINIS";
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "SUPERSEDED";
  domicile_province: string;
  domicile_city: string;
  motivation: string;
  background_track: string | null;
  pfa_status: "BELUM" | "SEDANG" | "SELESAI";
  wa_joined_confirmed_at: string | null;
  ethics_pledge_at: string;
  pledge_version: string;
  email_verified_at: string | null;
  applied_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
  details: Record<string, unknown>;
}

interface VerificationDetailProps {
  application: ApplicationData;
  documents: DocumentItem[];
  onActionComplete?: () => void;
}

export function VerificationDetail({
  application,
  documents,
  onActionComplete,
}: VerificationDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  // Modal / form states for decision
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNote, setApproveNote] = useState("");

  const formatWaLink = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      return `https://wa.me/62${cleaned.slice(1)}`;
    }
    return `https://wa.me/${cleaned}`;
  };

  const handleCopyWaMessage = async () => {
    const message = `Halo ${application.applicant_name}, terima kasih telah mengajukan diri sebagai mitra ${
      application.track === "KLINIS" ? "Praktisi Klinis" : "Pendamping Sebaya"
    } di Let Me Hear You. Berkas Anda saat ini sedang dalam proses verifikasi tim kami.`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      alert("Gagal menyalin pesan.");
    }
  };

  const handleOpenDocument = async (docId: string) => {
    setLoadingDocId(docId);
    setActionError(null);
    try {
      let res = await getDocumentUrlAction(docId, false);
      if (!res.ok && res.error?.includes("403")) {
        res = await getDocumentUrlAction(docId, true);
      }
      if (res.ok && res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        setActionError(res.error || "Berkas tidak dapat dibuka, coba lagi.");
      }
    } catch {
      setActionError("Terjadi kesalahan saat membuka berkas.");
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleApprove = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await approveApplicationAction(
        application.id,
        approveNote.trim() || undefined
      );
      if (res.ok) {
        setActionSuccess(
          res.code === "EMAIL_FAILED"
            ? res.message || "Disetujui, tetapi email gagal terkirim."
            : "Pengajuan berhasil disetujui!",
        );
        setShowApproveModal(false);
        onActionComplete?.();
      } else {
        setActionError(res.message || "Gagal menyetujui pengajuan.");
      }
    });
  };

  const handleReject = () => {
    if (rejectNote.trim().length < 10) {
      setActionError("Catatan penolakan wajib diisi minimal 10 karakter.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await rejectApplicationAction(
        application.id,
        rejectNote.trim()
      );
      if (res.ok) {
        setActionSuccess(
          res.code === "EMAIL_FAILED"
            ? res.message || "Ditolak, tetapi email gagal terkirim."
            : "Pengajuan telah ditolak.",
        );
        setShowRejectModal(false);
        onActionComplete?.();
      } else {
        setActionError(res.message || "Gagal menolak pengajuan.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  application.track === "KLINIS"
                    ? "bg-purple-100 text-purple-900"
                    : "bg-teal-100 text-teal-900"
                }`}
              >
                Track {application.track}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  application.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : application.status === "REJECTED"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                {application.status}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-[#3C3163]">
              {application.applicant_name}
            </h2>
            <p className="text-sm text-black/60 font-mono">
              @{application.username}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWaMessage}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#FBF8F5] px-3.5 py-1.5 text-xs font-semibold text-[#3C3163] transition hover:bg-black/5"
            >
              <span>{copyFeedback ? "Tersalin!" : "Salin Pesan WA"}</span>
            </button>
            <a
              href={formatWaLink(application.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#20ba59]"
            >
              Buka WA
            </a>
          </div>
        </div>

        {/* Alerts */}
        {actionError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            {actionSuccess}
          </div>
        )}

        {/* PII Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-black/[0.06] pt-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-black/50">Email</span>
            <p className="mt-0.5 font-medium text-[#3C3163] break-all">
              {application.applicant_email}
            </p>
          </div>
          <div>
            <span className="text-black/50">WhatsApp</span>
            <p className="mt-0.5 font-medium text-[#3C3163]">
              {application.whatsapp}
            </p>
          </div>
          <div>
            <span className="text-black/50">Domisili</span>
            <p className="mt-0.5 font-medium text-[#3C3163]">
              {application.domicile_city}, {application.domicile_province}
            </p>
          </div>
        </div>
      </div>

      {/* Details & Motivation */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#3C3163]">
          Detail Profil & Motivasi
        </h3>

        {application.track === "KLINIS" && (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-[#FBF8F5] p-4 text-xs sm:grid-cols-2">
            <div>
              <span className="text-black/50">Nomor STR / Izin Praktik</span>
              <p className="mt-0.5 font-semibold text-[#3C3163]">
                {String(application.details?.str_number || "—")}
              </p>
            </div>
            <div>
              <span className="text-black/50">Status STR</span>
              <p className="mt-0.5 font-semibold text-[#3C3163]">
                {String(application.details?.sip_status || "AKTIF")}
              </p>
            </div>
            <div>
              <span className="text-black/50">Pendidikan Terakhir</span>
              <p className="mt-0.5 font-semibold text-[#3C3163]">
                {String(application.details?.education_institution || "—")} (
                {String(application.details?.graduation_year || "—")})
              </p>
            </div>
            <div>
              <span className="text-black/50">Modalitas Layanan</span>
              <p className="mt-0.5 font-semibold text-[#3C3163]">
                {Array.isArray(application.details?.modalities)
                  ? application.details.modalities.join(", ")
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {application.track === "SEBAYA" && (
          <div className="mt-4 rounded-xl bg-[#FBF8F5] p-4 text-xs">
            <span className="text-black/50">Latar Belakang</span>
            <p className="mt-0.5 font-semibold text-[#3C3163]">
              {application.background_track || "—"}
            </p>
          </div>
        )}

        <div className="mt-4">
          <span className="text-xs text-black/50">Motivasi & Pengalaman</span>
          <p className="mt-1 text-xs leading-relaxed text-[#3C3163] whitespace-pre-wrap rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3">
            {application.motivation}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <AdminChecklist
        applicationId={application.id}
        track={application.track}
        emailVerifiedAt={application.email_verified_at}
        waJoinedConfirmedAt={application.wa_joined_confirmed_at}
        pfaStatus={application.pfa_status}
        ethicsPledgeAt={application.ethics_pledge_at}
        hasDocuments={documents.length > 0}
        onUpdated={onActionComplete}
      />

      {/* Documents */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#3C3163]">
          Dokumen Kredensial ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <p className="mt-3 text-xs text-black/50">
            Belum ada berkas yang diunggah pelamar.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#FBF8F5] p-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#3C3163]">
                      {doc.doc_type}
                    </span>
                    <span className="text-[11px] text-black/40">
                      {(doc.size_bytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-black/50 font-mono">
                    {doc.original_filename}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingDocId === doc.id}
                  onClick={() => handleOpenDocument(doc.id)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#3C3163] shadow-xs transition hover:bg-black/5 disabled:opacity-50"
                >
                  {loadingDocId === doc.id ? "Membuka..." : "Lihat"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Actions Panel */}
      {application.status === "PENDING" ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#3C3163]">
            Keputusan Verifikasi
          </h3>
          <p className="mt-1 text-xs text-black/60">
            Pastikan seluruh syarat checklist terpenuhi sebelum menyetujui.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowApproveModal(true)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Setujui Mitra
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowRejectModal(true)}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
            >
              Tolak Pengajuan
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-[#FBF8F5] p-6 text-xs">
          <span className="font-semibold text-[#3C3163]">Riwayat Keputusan</span>
          <p className="mt-1 text-black/60">
            Diputuskan pada{" "}
            {application.decided_at
              ? new Date(application.decided_at).toLocaleString("id-ID")
              : "—"}{" "}
            oleh {application.decided_by || "Admin"}.
          </p>
          {application.decision_note && (
            <p className="mt-2 rounded-lg border border-black/5 bg-white p-3 text-black/80">
              Catatan: {application.decision_note}
            </p>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="text-base font-bold text-[#3C3163]">
              Setujui Pengajuan Mitra
            </h4>
            <p className="mt-2 text-xs text-black/60">
              Pelamar akan diubah rolenya menjadi{" "}
              {application.track === "KLINIS" ? "PRAKTISI" : "PENDAMPING"} dan
              diberikan hak membuka sesi layanan.
            </p>
            <div className="mt-4">
              <label className="text-xs font-medium text-black/70">
                Catatan Verifikasi (Opsional)
              </label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Misal: Dokumen STR aktif dan PFA valid."
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-black/10 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-black/60 hover:bg-black/5"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? "Memproses..." : "Konfirmasi Persetujuan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="text-base font-bold text-[#3C3163]">
              Tolak Pengajuan Mitra
            </h4>
            <p className="mt-2 text-xs text-black/60">
              Pelamar akan diberitahukan alasan penolakan dan dapat mengajukan ulang
              setelah memperbaiki berkas.
            </p>
            <div className="mt-4">
              <label className="text-xs font-medium text-black/70">
                Alasan Penolakan (Wajib minimal 10 karakter)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Misal: Dokumen STR tidak terbaca jelas, mohon unggah scan resolusi tinggi."
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-black/10 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-black/60 hover:bg-black/5"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending || rejectNote.trim().length < 10}
                onClick={handleReject}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? "Memproses..." : "Konfirmasi Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
