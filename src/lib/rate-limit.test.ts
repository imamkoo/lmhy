import test from "node:test";
import assert from "node:assert/strict";
import {
  checkPasswordResetLimit,
  recordPasswordResetRequest,
  resetPasswordResetLimit,
} from "./rate-limit";

const unique = () => `reset-test-${Math.random().toString(36).slice(2)}`;

test("kuota reset kata sandi mengizinkan tiga permintaan", () => {
  const id = unique();
  const now = Date.now();
  for (let i = 0; i < 3; i++) {
    assert.equal(checkPasswordResetLimit(id, now).allowed, true);
    recordPasswordResetRequest(id, now);
  }
  const fourth = checkPasswordResetLimit(id, now);
  assert.equal(fourth.allowed, false);
  assert.ok((fourth.retryAfterSeconds ?? 0) > 0);
  resetPasswordResetLimit(id);
});

test("kuota reset pulih setelah jendela 15 menit lewat", () => {
  const id = unique();
  const now = Date.now();
  for (let i = 0; i < 3; i++) recordPasswordResetRequest(id, now);
  assert.equal(checkPasswordResetLimit(id, now).allowed, false);
  assert.equal(checkPasswordResetLimit(id, now + 15 * 60 * 1000 + 1).allowed, true);
  resetPasswordResetLimit(id);
});

test("identifier berbeda punya kuota terpisah", () => {
  const a = unique();
  const b = unique();
  const now = Date.now();
  for (let i = 0; i < 3; i++) recordPasswordResetRequest(a, now);
  assert.equal(checkPasswordResetLimit(a, now).allowed, false);
  assert.equal(checkPasswordResetLimit(b, now).allowed, true);
  resetPasswordResetLimit(a);
  resetPasswordResetLimit(b);
});
