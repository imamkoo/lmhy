import test from "node:test";
import assert from "node:assert/strict";
import {
  checkSubmissionRateLimit,
  recordSubmission,
  resetSubmissionRateLimit,
  checkUsernameCheckLimit,
  activeApplicationCountByEmail,
} from "./rate-limit";

test("IP diblokir setelah 3 percobaan dalam 1 jam", () => {
  resetSubmissionRateLimit("ip:1.2.3.4");
  const now = Date.now();
  recordSubmission("ip:1.2.3.4", now);
  recordSubmission("ip:1.2.3.4", now);
  const third = recordSubmission("ip:1.2.3.4", now);
  assert.equal(third.allowed, false);
  const blocked = checkSubmissionRateLimit("ip:1.2.3.4", now);
  assert.equal(blocked.allowed, false);
  assert.ok((blocked.retryAfterSeconds ?? 0) > 0);
});

test("jendela waktu berakhir => dibolehkan lagi", () => {
  resetSubmissionRateLimit("ip:5.6.7.8");
  const now = Date.now();
  recordSubmission("ip:5.6.7.8", now);
  recordSubmission("ip:5.6.7.8", now);
  recordSubmission("ip:5.6.7.8", now);
  const later = now + 61 * 60 * 1000;
  assert.equal(checkSubmissionRateLimit("ip:5.6.7.8", later).allowed, true);
});

test("email dibatasi 2 pengajuan aktif", () => {
  assert.equal(activeApplicationCountByEmail("a@b.id", [
    { applicant_email: "a@b.id", status: "PENDING" },
    { applicant_email: "a@b.id", status: "APPROVED" },
  ]), 1);
  assert.equal(activeApplicationCountByEmail("a@b.id", [
    { applicant_email: "a@b.id", status: "PENDING" },
    { applicant_email: "a@b.id", status: "REJECTED" },
  ]), 1);
});

test("cek username dibatasi 20 per menit per IP", () => {
  const now = Date.now();
  for (let i = 0; i < 20; i++) checkUsernameCheckLimit("9.9.9.9", now);
  assert.equal(checkUsernameCheckLimit("9.9.9.9", now).allowed, false);
  assert.equal(checkUsernameCheckLimit("9.9.9.9", now + 61_000).allowed, true);
});
