import { NextResponse } from "next/server";
import { purgeExpiredDocuments } from "@/lib/mitra/retention";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<NextResponse> {
  if (!process.env.SWEEP_SECRET && !process.env.CRON_SECRET) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await purgeExpiredDocuments();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
