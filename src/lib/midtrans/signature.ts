import { createHash, timingSafeEqual } from "node:crypto";

export function verifyMidtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey: string;
}): boolean {
  const { orderId, statusCode, grossAmount, signatureKey, serverKey } = input;

  if (!orderId || !statusCode || !grossAmount || !signatureKey || !serverKey) {
    return false;
  }

  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signatureKey, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function isPaidStatus(input: { transactionStatus: string; fraudStatus?: string }): boolean {
  if (input.transactionStatus === "settlement") {
    return true;
  }

  return input.transactionStatus === "capture" && input.fraudStatus === "accept";
}
