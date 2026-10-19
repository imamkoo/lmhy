"use client";

import { useState } from "react";
import {
  createDocumentUploadAction,
  finalizeDocumentUploadAction,
} from "@/app/actions/mitra";
const ALLOWED_DOCUMENT_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

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
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const reportError = (message: string) => {
    onStatusChange?.("gagal");
    onError?.(message);
  };
  const upload = async (file: File) => {
    if (
      !ALLOWED_DOCUMENT_MIME.includes(file.type) ||
      file.size > MAX_DOCUMENT_BYTES
    ) {
      reportError(
        "Jenis dokumen tidak didukung atau ukuran dokumen maksimal 5 MB.",
      );
      return;
    }
    if (!applicationId) {
      reportError("Pengajuan belum tersedia.");
      return;
    }
    setUploading(true);
    onStatusChange?.("mengunggah");
    try {
      const ticket = await createDocumentUploadAction({
        applicationId,
        uploadToken,
        docType,
        mimeType: file.type,
        sizeBytes: file.size,
        filename: file.name,
      });
      if (!ticket.ok || !ticket.path || !ticket.signedUrl) {
        reportError(ticket.error || "Gagal membuat tiket unggah.");
        return;
      }
      const response = await fetch(ticket.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!response.ok) {
        reportError(`Gagal mengunggah dokumen (${response.status}).`);
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
    } catch {
      reportError("Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
      setInputKey((key) => key + 1);
    }
  };
  return (
    <input
      key={inputKey}
      id={`upload-${docType}`}
      type="file"
      disabled={uploading}
      accept="application/pdf,image/jpeg,image/png"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(file);
      }}
    />
  );
}
