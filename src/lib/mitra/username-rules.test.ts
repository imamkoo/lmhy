import test from "node:test";
import assert from "node:assert/strict";
import {
  MITRA_RESERVED_USERNAMES,
  isReservedMitraUsername,
  suggestUsernames,
  validateMitraUsername,
} from "./username-rules";

test("valid username passes", () => {
  assert.equal(validateMitraUsername("budi_santoso").valid, false);
  assert.equal(validateMitraUsername("budi-santoso").valid, true);
});

test("username kosong / terlalu pendek / terlalu panjang ditolak", () => {
  assert.equal(validateMitraUsername("").valid, false);
  assert.equal(validateMitraUsername("ab").valid, false);
  assert.equal(validateMitraUsername("a".repeat(31)).valid, false);
});

test("huruf besar, spasi, dan tanda baca ditolak", () => {
  assert.equal(validateMitraUsername("Budi").valid, false);
  assert.equal(validateMitraUsername("budi santoso").valid, false);
  assert.equal(validateMitraUsername("budi.santoso").valid, false);
});

test("username reserved ditolak", () => {
  assert.equal(validateMitraUsername("admin").valid, false);
  assert.equal(validateMitraUsername("mitra").valid, false);
  assert.equal(validateMitraUsername("praktik").valid, false);
  assert.equal(isReservedMitraUsername("artikel"), true);
  assert.equal(MITRA_RESERVED_USERNAMES.has("articles"), true);
});

test("suggestUsernames mengembalikan 3 alternatif yang valid dan belum dipakai", () => {
  const taken = new Set(["budi-santoso", "budi-santoso-1"]);
  const out = suggestUsernames("Budi Santoso", (c) => taken.has(c));
  assert.equal(out.length, 3);
  for (const c of out) {
    assert.equal(validateMitraUsername(c).valid, true);
    assert.equal(taken.has(c), false);
  }
});
