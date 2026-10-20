import test from "node:test";
import assert from "node:assert/strict";
import { createUploadToken, verifyUploadToken } from "./upload-token";
const date = new Date("2026-01-01T00:00:00Z");
test("upload token round trip", () =>
  assert.equal(
    verifyUploadToken(
      createUploadToken({ applicationId: "a", userId: "u" }, "s", date),
      "s",
      date,
    ).ok,
    true,
  ));
test("tampered and wrong secret rejected", () => {
  const token = createUploadToken(
    { applicationId: "a", userId: "u" },
    "s",
    date,
  );
  assert.equal(verifyUploadToken(`${token}x`, "s", date).ok, false);
  assert.equal(verifyUploadToken(token, "x", date).ok, false);
});
test("expired token rejected", () =>
  assert.equal(
    verifyUploadToken(
      createUploadToken({ applicationId: "a", userId: "u" }, "s", date),
      "s",
      new Date(date.getTime() + 25 * 3600000),
    ).ok,
    false,
  ));
