import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMidtransSignature, isPaidStatus } from "@/lib/midtrans/signature";

const TERMINAL_STATUSES = ["expire", "deny", "cancel"] as const;

interface MidtransWebhookBody {
  order_id?: string;
  status_code?: string | number;
  gross_amount?: string | number;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  transaction_id?: string | number;
}

export async function POST(req: Request) {
  let body: MidtransWebhookBody;
  try {
    body = (await req.json()) as MidtransWebhookBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const orderId = body.order_id;
  const statusCode = body.status_code;
  const grossAmount = body.gross_amount;
  const signatureKey = body.signature_key;
  const transactionStatus = body.transaction_status;

  if (!orderId || statusCode === undefined || statusCode === null || !String(statusCode) ||
      grossAmount === undefined || grossAmount === null || !String(grossAmount) ||
      !signatureKey || !transactionStatus) {
    return new Response(null, { status: 400 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return new Response(null, { status: 500 });
  }

  const signatureValid = verifyMidtransSignature({
    orderId,
    statusCode: String(statusCode),
    grossAmount: String(grossAmount),
    signatureKey,
    serverKey,
  });

  if (!signatureValid) {
    return new Response(null, { status: 403 });
  }

  const supabase = await createAdminClient();

  const { data: booking } = await supabase
    .from("session_bookings")
    .select("id, slot_id, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!booking) {
    return new Response(null, { status: 200 });
  }

  if (isPaidStatus({ transactionStatus, fraudStatus: body.fraud_status })) {
    await supabase
      .from("session_bookings")
      .update({
        status: "CONFIRMED",
        midtrans_transaction_id: String(body.transaction_id ?? ""),
      })
      .eq("id", booking.id);

    await supabase
      .from("listening_slots")
      .update({ status: "BOOKED" })
      .eq("id", booking.slot_id);

    return new Response(null, { status: 200 });
  }

  if (TERMINAL_STATUSES.includes(transactionStatus as (typeof TERMINAL_STATUSES)[number])) {
    await supabase
      .from("session_bookings")
      .update({ status: "CANCELLED" })
      .eq("id", booking.id);

    await supabase
      .from("listening_slots")
      .update({ status: "AVAILABLE", reserved_until: null })
      .eq("id", booking.slot_id)
      .eq("status", "RESERVED");

    return new Response(null, { status: 200 });
  }

  return new Response(null, { status: 200 });
}
