import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyMidtransSignature, isPaidStatus } from "./signature";

const SERVER_KEY = "SB-Mid-server-TESTKEY";
const ORDER = "booking-abc";
const STATUS = "200";
const AMOUNT = "50000.00";

function sign(orderId: string, statusCode: string, grossAmount: string, serverKey: string) {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

test("accepts a correctly signed notification", () => {
  const signatureKey = sign(ORDER, STATUS, AMOUNT, SERVER_KEY);
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: AMOUNT, signatureKey, serverKey: SERVER_KEY }),
    true,
  );
});

test("rejects a tampered signature", () => {
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: AMOUNT, signatureKey: "deadbeef", serverKey: SERVER_KEY }),
    false,
  );
});

test("rejects a signature computed with a different server key", () => {
  const signatureKey = sign(ORDER, STATUS, AMOUNT, "SB-Mid-server-OTHER");
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: AMOUNT, signatureKey, serverKey: SERVER_KEY }),
    false,
  );
});

test("rejects missing input", () => {
  assert.equal(
    verifyMidtransSignature({ orderId: "", statusCode: STATUS, grossAmount: AMOUNT, signatureKey: "x", serverKey: SERVER_KEY }),
    false,
  );
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: "", grossAmount: AMOUNT, signatureKey: "x", serverKey: SERVER_KEY }),
    false,
  );
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: "", signatureKey: "x", serverKey: SERVER_KEY }),
    false,
  );
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: AMOUNT, signatureKey: "", serverKey: SERVER_KEY }),
    false,
  );
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: AMOUNT, signatureKey: "x", serverKey: "" }),
    false,
  );
});

test("never throws on mismatched signature length", () => {
  assert.equal(
    verifyMidtransSignature({ orderId: ORDER, statusCode: STATUS, grossAmount: AMOUNT, signatureKey: "zz", serverKey: SERVER_KEY }),
    false,
  );
});

test("only settlement, and capture with accept, count as paid", () => {
  assert.equal(isPaidStatus({ transactionStatus: "settlement" }), true);
  assert.equal(isPaidStatus({ transactionStatus: "capture", fraudStatus: "accept" }), true);
  assert.equal(isPaidStatus({ transactionStatus: "capture", fraudStatus: "challenge" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "pending" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "expire" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "deny" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "cancel" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "capture" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "something-unknown" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "" }), false);
});
