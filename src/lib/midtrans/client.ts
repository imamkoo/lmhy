import { Buffer } from "node:buffer";

const SNAP_TRANSACTION_URLS = {
  sandbox: "https://app.sandbox.midtrans.com/snap/v1/transactions",
  production: "https://app.midtrans.com/snap/v1/transactions",
} as const;

export async function createSnapToken(input: {
  orderId: string;
  grossAmount: number;
  itemName: string;
}): Promise<{ token: string; redirectUrl: string }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }

  const environment = process.env.MIDTRANS_ENV === "production" ? "production" : "sandbox";

  const response = await fetch(SNAP_TRANSACTION_URLS[environment], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount,
      },
      item_details: [
        {
          id: input.orderId,
          price: input.grossAmount,
          quantity: 1,
          name: input.itemName,
        },
      ],
      enabled_payments: ["gopay", "shopeepay", "other_qris"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Midtrans snap transaction request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { token?: unknown; redirect_url?: unknown };

  if (typeof body.token !== "string" || body.token.length === 0) {
    throw new Error("Midtrans snap transaction response did not include a token");
  }

  return {
    token: body.token,
    redirectUrl: typeof body.redirect_url === "string" ? body.redirect_url : "",
  };
}
