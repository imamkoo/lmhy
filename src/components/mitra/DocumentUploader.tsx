"use client";

import {
  createDocumentUploadAction,
  finalizeDocumentUploadAction,
} from "@/app/actions/mitra";

export type DocumentUploadStatus =
  "mengunggah" | "memproses" | "tersimpan" | "gagal";

interface DocumentUploaderProps {
  docType: string;
  applicationId?: string;
  uploadToken?: string;
  onUploaded?: (path: string) => void;
  onError?: (message: string) => void;
  onStatusChange?: (status: DocumentUploadStatus) => void;
}

export default function DocumentUploader({
  docType,
  applicationId,
  uploadToken,
  onUploaded,
  onError,
  onStatusChange,
}: DocumentUploaderProps) {
  const reportError = (message: string) => {
    onStatusChange?.("gagal");
    onError?.(message);
  };

  const upload = async (file: File) => {
    if (!applicationId) {
      reportError("Pengajuan belum tersedia.");
      return;
    }

    onStatusChange?.("mengunggah");
    const ticket = await createDocumentUploadAction({
      applicationId,
      uploadToken,
      docType,
      mimeType: file.type,
      sizeBytes: file.size,
      filename: file.name,
    });

    if (!ticket.ok || !ticket.path || !ticket.token) {
      reportError(ticket.error || "Gagal membuat tiket unggah.");
      return;
    }

    const response = await fetch(ticket.token, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!response.ok) {
      reportError("Gagal mengunggah dokumen.");
      return;
    }

    onStatusChange?.("memproses");
    const finalized = await finalizeDocumentUploadAction({
      path: ticket.path,
      uploadToken,
    });

    if (!finalized.ok) {
      reportError(finalized.error || "Dokumen belum dapat diproses.");
      return;
    }

    onStatusChange?.("tersimpan");
    onUploaded?.(ticket.path);
  };

  return (
    <input
      type="file"
      accept="application/pdf,image/jpeg,image/png"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) {
          void upload(file);
        }
      }}
    />
  );
}
