import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDocumentPath, sanitizeFilename, validateDocumentUpload } from "@/lib/mitra/documents";
test("MIME di luar daftar ditolak", () => { assert.equal(validateDocumentUpload({ mimeType: "text/html", sizeBytes: 1000, filename: "a.html" }).ok, false); assert.equal(validateDocumentUpload({ mimeType: "application/pdf", sizeBytes: 1000, filename: "a.pdf" }).ok, true); });
test("ukuran melebihi 5MB ditolak", () => assert.equal(validateDocumentUpload({ mimeType: "application/pdf", sizeBytes: 5 * 1024 * 1024 + 1, filename: "a.pdf" }).ok, false));
test("nama file disanitasi tanpa path traversal", () => { assert.equal(sanitizeFilename("../../etc/passwd"), "etcpasswd"); assert.equal(sanitizeFilename("STR saya.pdf"), "str-saya.pdf"); });
test("path dokumen memakai applicationId dan uuid", () => assert.equal(buildDocumentPath("app-1", "STR", "u-1"), "applications/app-1/STR-u-1"));
