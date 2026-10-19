import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { buildDocumentPath, sanitizeFilename, stripImageMetadata, validateDocumentUpload } from "@/lib/mitra/documents";
test("MIME di luar daftar ditolak", () => { assert.equal(validateDocumentUpload({ mimeType: "text/html", sizeBytes: 1000, filename: "a.html" }).ok, false); assert.equal(validateDocumentUpload({ mimeType: "application/pdf", sizeBytes: 1000, filename: "a.pdf" }).ok, true); });
test("ukuran melebihi 5MB ditolak", () => assert.equal(validateDocumentUpload({ mimeType: "application/pdf", sizeBytes: 5 * 1024 * 1024 + 1, filename: "a.pdf" }).ok, false));
test("nama file disanitasi tanpa path traversal", () => { assert.equal(sanitizeFilename("../../etc/passwd"), "etcpasswd"); assert.equal(sanitizeFilename("STR saya.pdf"), "str-saya.pdf"); });
test("path dokumen memakai applicationId dan uuid", () => assert.equal(buildDocumentPath("app-1", "STR", "u-1"), "applications/app-1/STR-u-1"));
test("jenis dokumen di luar daftar ditolak", () => { assert.throws(() => buildDocumentPath("app-1", "../../x", "u-1")); });
test("metadata EXIF gambar dihapus", async () => {
  const original = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).jpeg().withExif({ IFD0: { Artist: "LMHY" } }).toBuffer();
  const sanitized = await stripImageMetadata(original, "image/jpeg");
  assert.equal((await sharp(original).metadata()).exif !== undefined, true);
  assert.equal((await sharp(sanitized).metadata()).exif, undefined);
});
