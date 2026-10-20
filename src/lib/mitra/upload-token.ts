import { createHmac, timingSafeEqual } from "node:crypto";
export const UPLOAD_TOKEN_TTL_HOURS = 24;
export interface UploadTokenPayload {
  applicationId: string;
  userId: string;
  expiresAt: number;
}
export function createUploadToken(
  payload: { applicationId: string; userId: string },
  secret: string,
  now = new Date(),
): string {
  if (!secret) return "";
  const body: UploadTokenPayload = {
    ...payload,
    expiresAt: now.getTime() + UPLOAD_TOKEN_TTL_HOURS * 3600000,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}
export function verifyUploadToken(
  token: string,
  secret: string,
  now = new Date(),
): { ok: boolean; payload?: UploadTokenPayload; error?: string } {
  if (!secret) return { ok: false, error: "Token unggah belum dikonfigurasi." };
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature)
    return { ok: false, error: "Token unggah tidak valid." };
  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return { ok: false, error: "Token unggah tidak valid." };
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString(),
    ) as UploadTokenPayload;
    if (payload.expiresAt <= now.getTime())
      return { ok: false, error: "Token unggah sudah kedaluwarsa." };
    return { ok: true, payload };
  } catch {
    return { ok: false, error: "Token unggah tidak valid." };
  }
}
