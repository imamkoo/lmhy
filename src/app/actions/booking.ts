'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scanForCrisis } from '@/lib/sanctuary/crisis-scan';
import { resolveTakeRateBps } from '@/lib/sanctuary/take-rate';
import { canProviderCreateSlot } from '@/lib/sanctuary/booking-rules';
import { createSnapToken } from '@/lib/midtrans/client';

const RESERVATION_WINDOW_MINUTES = 15;
const MIN_DURATION_MIN = 15;
const MAX_DURATION_MIN = 120;

const CRISIS_MESSAGE =
  'Kamu sangat berharga dan tidak harus menanggung ini sendirian. ' +
  'Sesi berjadwal ini bukan untuk kondisi darurat. ' +
  'Silakan hubungi LISA (Love Inside Suicide Awareness) 0811-3815-472 atau Kemenkes 119 ext 8 sekarang.';

const UNAVAILABLE_MESSAGE = 'Slot sudah dipesan atau sedang diproses.';

export type BookingInitResult =
  | { ok: true; token: string; redirectUrl: string }
  | { ok: false; code: 'INVALID_INPUT' | 'CRISIS' | 'UNAVAILABLE' | 'PAYMENT_INIT_FAILED'; message: string };

export type CreateSlotResult = { ok: boolean; message?: string };

interface SlotRow {
  id: string;
  provider_id: string;
  price_idr: number;
  status: string;
  reserved_until: string | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  username: string;
  creator_role: string | null;
  verification_status: string | null;
}

interface ReservedSlotRow {
  id: string;
  provider_id: string;
  price_idr: number;
  status: string;
}

interface NewBookingRow {
  id: string;
}

interface SubscriptionRow {
  tier: string | null;
}

export async function initiateSessionBooking(input: {
  slotId: string;
  pseudonym: string;
  contact: string;
  note?: string;
  consent: boolean;
}): Promise<BookingInitResult> {
  const pseudonym = input.pseudonym.trim();
  const contact = input.contact.trim();
  const note = input.note ?? '';

  if (input.consent !== true || !input.slotId || !pseudonym || !contact) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Nama samaran, kontak, dan persetujuan wajib diisi untuk memesan sesi.',
    };
  }

  const crisis = scanForCrisis(note);
  if (crisis.flagged) {
    return { ok: false, code: 'CRISIS', message: CRISIS_MESSAGE };
  }

  const admin = await createAdminClient();

  const { data: slot, error: slotError } = await admin
    .from('listening_slots')
    .select('id, provider_id, price_idr, status, reserved_until')
    .eq('id', input.slotId)
    .maybeSingle();

  if (slotError || !slot) {
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const slotRow = slot as unknown as SlotRow;

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, display_name, username, creator_role, verification_status')
    .eq('id', slotRow.provider_id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const profileRow = profile as unknown as ProfileRow;

  if (!canProviderCreateSlot(profileRow)) {
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const now = new Date();
  const reservedUntil = new Date(now.getTime() + RESERVATION_WINDOW_MINUTES * 60 * 1000).toISOString();
  const nowIso = now.toISOString();

  const { data: reserved, error: reserveError } = await admin
    .from('listening_slots')
    .update({ status: 'RESERVED', reserved_until: reservedUntil })
    .eq('id', input.slotId)
    .or(`and(status.eq.AVAILABLE),and(status.eq.RESERVED,reserved_until.lt.${nowIso})`)
    .select('id, provider_id, price_idr, status');

  if (reserveError || !reserved || (reserved as unknown[]).length === 0) {
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const reservedSlot = (reserved as unknown as ReservedSlotRow[])[0];
  if (!reservedSlot || !canProviderCreateSlot(profileRow)) {
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const { data: subscription } = await admin
    .from('creator_subscriptions')
    .select('tier')
    .eq('provider_id', reservedSlot.provider_id)
    .maybeSingle();

  const tier = (subscription as unknown as SubscriptionRow | null)?.tier ?? 'FREE';
  void tier;

  const { data: booking, error: bookingError } = await admin
    .from('session_bookings')
    .insert({
      slot_id: input.slotId,
      client_pseudonym: pseudonym,
      client_contact: contact,
      client_note: note ? note : null,
      consent_accepted: true,
      status: 'PENDING',
      amount_idr: reservedSlot.price_idr,
      take_rate_bps: resolveTakeRateBps(),
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    await admin
      .from('listening_slots')
      .update({ status: 'AVAILABLE', reserved_until: null })
      .eq('id', input.slotId);
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const bookingRow = booking as unknown as NewBookingRow;

  const { error: orderError } = await admin
    .from('session_bookings')
    .update({ order_id: bookingRow.id })
    .eq('id', bookingRow.id);

  if (orderError) {
    await admin
      .from('listening_slots')
      .update({ status: 'AVAILABLE', reserved_until: null })
      .eq('id', input.slotId);
    return { ok: false, code: 'UNAVAILABLE', message: UNAVAILABLE_MESSAGE };
  }

  const providerName = profileRow.display_name?.trim() || profileRow.username;

  try {
    const snap = await createSnapToken({
      orderId: bookingRow.id,
      grossAmount: reservedSlot.price_idr,
      itemName: `Sesi Dengar — ${providerName}`,
    });
    return { ok: true, token: snap.token, redirectUrl: snap.redirectUrl };
  } catch {
    await admin
      .from('listening_slots')
      .update({ status: 'AVAILABLE', reserved_until: null })
      .eq('id', input.slotId);
    return {
      ok: false,
      code: 'PAYMENT_INIT_FAILED',
      message: 'Pembayaran belum bisa dimulai. Silakan coba lagi dalam beberapa saat.',
    };
  }
}

export async function createListeningSlot(input: {
  startTime: string;
  durationMin: number;
  priceIdr: number;
}): Promise<CreateSlotResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: 'Silakan masuk terlebih dahulu untuk membuat jadwal sesi.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, creator_role, verification_status')
    .eq('id', user.id)
    .maybeSingle();

  const profileRow = profile as unknown as Pick<ProfileRow, 'id' | 'creator_role' | 'verification_status'> | null;

  if (profileError || !profileRow || !canProviderCreateSlot(profileRow)) {
    return { ok: false, message: 'Hanya pendamping atau praktisi terverifikasi yang dapat membuat jadwal sesi.' };
  }

  const start = new Date(input.startTime);
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return { ok: false, message: 'Waktu mulai sesi harus berupa tanggal yang valid di masa depan.' };
  }

  if (!Number.isInteger(input.durationMin) || input.durationMin < MIN_DURATION_MIN || input.durationMin > MAX_DURATION_MIN) {
    return { ok: false, message: `Durasi sesi harus antara ${MIN_DURATION_MIN} dan ${MAX_DURATION_MIN} menit.` };
  }

  if (!Number.isFinite(input.priceIdr) || input.priceIdr < 0) {
    return { ok: false, message: 'Harga sesi tidak boleh negatif.' };
  }

  const admin = await createAdminClient();
  const { error: insertError } = await admin.from('listening_slots').insert({
    provider_id: user.id,
    start_time: start.toISOString(),
    duration_min: input.durationMin,
    price_idr: Math.floor(input.priceIdr),
    status: 'AVAILABLE',
  });

  if (insertError) {
    return { ok: false, message: 'Jadwal sesi gagal disimpan. Silakan coba lagi.' };
  }

  return { ok: true };
}
