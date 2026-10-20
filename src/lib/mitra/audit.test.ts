import test from "node:test";
import assert from "node:assert/strict";
import { isAuditAction } from "./audit";

test("isAuditAction hanya menerima aksi yang dikenal", () => {
  assert.equal(isAuditAction("APPLICATION_APPROVED"), true);
  assert.equal(isAuditAction("DROP_TABLE"), false);
});
