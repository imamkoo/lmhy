import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canProviderCreateSlot } from "@/lib/sanctuary/booking-rules";
import BookingClient from "./BookingClient";

const SNAP_SCRIPT_URLS = {
  sandbox: "https://app.sandbox.midtrans.com/snap/snap.js",
  production: "https://app.midtrans.com/snap/snap.js",
} as const;

interface SlotRow {
  id: string;
  provider_id: string;
  start_time: string;
  duration_min: number;
  price_idr: number;
  status: string;
}

interface ProviderRow {
  username: string;
  display_name: string | null;
  creator_role: string | null;
  verification_status: string | null;
}

export default async function TenantBookingPage({
  params,
}: {
  params: Promise<{ username: string; slotId: string }>;
}) {
  const { username: rawUsername, slotId } = await params;
  const username = (rawUsername || "").trim().toLowerCase();

  if (!username || !slotId) {
    notFound();
  }

  const supabase = await createClient();

  const { data: slot } = await supabase
    .from("listening_slots")
    .select("id, provider_id, start_time, duration_min, price_idr, status")
    .eq("id", slotId)
    .maybeSingle();

  const slotRow = slot as unknown as SlotRow | null;

  if (!slotRow || slotRow.status !== "AVAILABLE") {
    notFound();
  }

  const { data: provider } = await supabase
    .from("profiles")
    .select("username, display_name, creator_role, verification_status")
    .eq("id", slotRow.provider_id)
    .maybeSingle();

  const providerRow = provider as unknown as ProviderRow | null;

  if (
    !providerRow ||
    !canProviderCreateSlot(providerRow) ||
    providerRow.username.trim().toLowerCase() !== username
  ) {
    notFound();
  }

  const environment =
    process.env.MIDTRANS_ENV === "production" ? "production" : "sandbox";
  const snapScriptUrl = SNAP_SCRIPT_URLS[environment];
  const providerName = providerRow.display_name?.trim() || providerRow.username;

  return (
    <main className="min-h-screen bg-[#fbf8f5] px-4 py-8 text-slate-900 sm:px-6 md:px-12 md:py-12">
      <div className="mx-auto max-w-2xl">
        <BookingClient
          slotId={slotRow.id}
          providerName={providerName}
          startTime={slotRow.start_time}
          durationMin={slotRow.duration_min}
          priceIdr={slotRow.price_idr}
          snapScriptUrl={snapScriptUrl}
          clientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""}
        />
      </div>
    </main>
  );
}
