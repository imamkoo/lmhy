import test from "node:test";
import assert from "node:assert/strict";
import { formatAuditActionLabel } from "./activity";

test("formatAuditActionLabel memberikan deskripsi bahasa Indonesia untuk setiap aksi audit", () => {
  assert.equal(
    formatAuditActionLabel("APPLICATION_APPROVED"),
    "Menyetujui pengajuan mitra"
  );
  assert.equal(
    formatAuditActionLabel("APPLICATION_REJECTED"),
    "Menolak pengajuan mitra"
  );
  assert.equal(
    formatAuditActionLabel("DOCUMENT_PURGED"),
    "Membersihkan dokumen kedaluwarsa"
  );
});
