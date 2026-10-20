import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];
export const MAX_DOCUMENTS_PER_APPLICATION = 4;
export const ALLOWED_DOCUMENT_TYPES = [
  "STR",
  "SIPP",
  "CV",
  "TRAINING_CERT",
  "PFA_CERT",
  "OTHER",
] as const;
export interface DocumentValidation {
  ok: boolean;
  error?: string;
}
export function validateDocumentUpload(input: {
  mimeType: string;
  sizeBytes: number;
  filename: string;
}): DocumentValidation {
  if (!ALLOWED_DOCUMENT_MIME.includes(input.mimeType))
    return { ok: false, error: "Jenis dokumen tidak didukung." };
  if (
    !Number.isFinite(input.sizeBytes) ||
    input.sizeBytes <= 0 ||
    input.sizeBytes > MAX_DOCUMENT_BYTES
  )
    return { ok: false, error: "Ukuran dokumen maksimal 5 MB." };
  if (!input.filename.trim())
    return { ok: false, error: "Nama file wajib diisi." };
  return { ok: true };
}
export function isAllowedDocumentType(docType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(
    docType as (typeof ALLOWED_DOCUMENT_TYPES)[number],
  );
}
export function sanitizeFilename(filename: string): string {
  const base = filename
    .replace(/[\\/]/g, "")
    .replace(/\.{2,}/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, (character) => (character === " " ? "-" : ""))
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "dokumen";
}
export function buildDocumentPath(
  applicationId: string,
  docType: string,
  uuid: string,
): string {
  if (!isAllowedDocumentType(docType))
    throw new Error("Jenis dokumen tidak valid.");
  return `applications/${applicationId}/${docType}-${uuid}`;
}
export async function stripImageMetadata(
  buffer: Buffer,
  mimeType: string,
): Promise<Buffer> {
  if (!mimeType.startsWith("image/")) return buffer;
  return sharp(buffer).rotate().toBuffer();
}
export async function createUploadTicket(input: {
  applicationId: string;
  userId: string;
  docType: string;
  mimeType: string;
  sizeBytes: number;
  filename: string;
}): Promise<{
  ok: boolean;
  path?: string;
  signedUrl?: string;
  error?: string;
}> {
  const validation = validateDocumentUpload(input);
  if (!validation.ok) return validation;
  if (!isAllowedDocumentType(input.docType))
    return { ok: false, error: "Jenis dokumen tidak valid." };
  const admin = await createAdminClient();
  const { count, error: countError } = await admin
    .from("provider_documents")
    .select("id", { count: "exact", head: true })
    .eq("application_id", input.applicationId);
  if (countError) return { ok: false, error: "Dokumen tidak dapat diperiksa." };
  if ((count ?? 0) >= MAX_DOCUMENTS_PER_APPLICATION)
    return { ok: false, error: "Maksimal 4 dokumen per pengajuan." };
  const extension =
    input.mimeType === "application/pdf"
      ? ".pdf"
      : input.mimeType === "image/jpeg"
        ? ".jpg"
        : ".png";
  const uploadPath = `${buildDocumentPath(input.applicationId, input.docType, crypto.randomUUID())}${extension}`;
  const { data, error } = await admin.storage
    .from("provider-credentials")
    .createSignedUploadUrl(uploadPath);
  if (error || !data)
    return { ok: false, error: "URL unggah tidak dapat dibuat." };
  return { ok: true, path: uploadPath, signedUrl: data.signedUrl };
}
