import assert from "node:assert/strict";
import { test } from "node:test";
import { isAdminUser } from "./admin-auth";

test("isAdminUser hanya true untuk app_metadata.is_admin === true", () => {
  assert.equal(isAdminUser({ app_metadata: { is_admin: true } }), true);
  assert.equal(isAdminUser({ app_metadata: { is_admin: "true" } }), false);
  assert.equal(isAdminUser({ app_metadata: { is_admin: false } }), false);
  assert.equal(isAdminUser({ app_metadata: {} }), false);
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser(undefined), false);
});

test("user_metadata tidak dihitung sebagai admin", () => {
  assert.equal(isAdminUser({ app_metadata: {}, user_metadata: { is_admin: true } } as never), false);
});
