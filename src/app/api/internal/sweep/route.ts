import { NextResponse } from "next/server";
import { runExpirySweepAction } from "@/app/actions/admin-mitra";

export async function POST(request: Request) {
  const sweepSecret = process.env.SWEEP_SECRET;
  if (!sweepSecret) {
    return new NextResponse(null, { status: 404 });
  }

  const incomingSecret = request.headers.get("x-sweep-secret");
  if (!incomingSecret || incomingSecret !== sweepSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runExpirySweepAction();
  return NextResponse.json(result);
}
