import test from "node:test";
import assert from "node:assert/strict";
import { canProviderCreateSlot, isSlotReservationExpired } from "./booking-rules";

test("only approved PENDAMPING and PRAKTISI may create slots", () => {
  assert.equal(canProviderCreateSlot({ creator_role: "PENDAMPING", verification_status: "APPROVED" }), true);
  assert.equal(canProviderCreateSlot({ creator_role: "PRAKTISI", verification_status: "APPROVED" }), true);
  assert.equal(canProviderCreateSlot({ creator_role: "PENULIS", verification_status: "APPROVED" }), false);
  assert.equal(canProviderCreateSlot({ creator_role: "PENDAMPING", verification_status: "PENDING" }), false);
  assert.equal(canProviderCreateSlot({ creator_role: "PRAKTISI", verification_status: "PENDING" }), false);
  assert.equal(canProviderCreateSlot({ creator_role: null, verification_status: null }), false);
});

test("reservation expiry is measured against the reservation window", () => {
  const now = new Date("2026-10-12T10:00:00.000Z");
  assert.equal(isSlotReservationExpired(null, now), true);
  assert.equal(isSlotReservationExpired("2026-10-12T10:05:00.000Z", now), false);
  assert.equal(isSlotReservationExpired("2026-10-12T09:59:00.000Z", now), true);
});
