import { NextRequest, NextResponse } from "next/server";
import { verifyLiteraWebhook, applyLiteraWebhookEvent } from "@/lib/litera-webhook";
import { updateArticleByOperationId } from "@/lib/article-storage";

export async function POST(request: NextRequest) {
  const secret =
    process.env.LITERA_WEBHOOK_SECRET || process.env.LITERA_API_KEY || "";

  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured on the server" },
      { status: 500 }
    );
  }

  // 1. MUST read the raw body as text before any JSON parse to preserve exact HMAC bytes
  const rawBody = await request.text();

  let event;
  try {
    event = verifyLiteraWebhook(rawBody, request.headers, secret, Date.now());
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Invalid webhook signature";
    console.warn("[Litera Webhook] Verification rejected:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 401 });
  }

  // 2. Safe, idempotent update to article store
  try {
    const store = {
      updateByOperationId: async (operationId: string, values: Parameters<typeof updateArticleByOperationId>[1]) => {
        return await updateArticleByOperationId(operationId, values);
      },
    };

    const updated = await applyLiteraWebhookEvent(event, store);

    return NextResponse.json(
      {
        received: true,
        eventId: event.eventId,
        operationId: event.operationId,
        updated,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[Litera Webhook] Processing error:", err);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
