import { NextResponse } from "next/server";
import { runExpirySweepAction } from "@/app/actions/admin-mitra";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function handle(request: Request): Promise<NextResponse> {
  if (!process.env.SWEEP_SECRET && !process.env.CRON_SECRET) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isAuthorizedCronRequest(request)) {
    return unauthorized();
  }

  const result = await runExpirySweepAction();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
