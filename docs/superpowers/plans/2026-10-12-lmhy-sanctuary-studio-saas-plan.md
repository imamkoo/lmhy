# LMHY Sanctuary Studio SaaS Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paid human-service layer (Sesi Dengar) on top of the free reflection-publishing layer — role ladder, guided prompts, slot scheduling, QRIS checkout, and crisis safety — without paywalling content or touching the canonical landing page.

**Architecture:** Additive Supabase schema (new tables + new `profiles` columns). Pure logic lives in `src/lib/sanctuary/*` and `src/lib/midtrans/*` so it is unit-testable without a database. Next.js Server Actions own slot reservation and Snap token minting. A signature-verified Midtrans webhook is the only authority for payment state. UI mounts additively into existing tenant routes and `/builder`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase (`@supabase/ssr`), Tailwind v4 (Warm Sanctuary tokens), `node:test` via `tsx --test`, Midtrans Snap REST.

**Spec:** `docs/superpowers/specs/2026-10-12-lmhy-sanctuary-studio-saas-design.md`

## Global Constraints

- Migration is additive only: no `DROP`, `TRUNCATE`, `DELETE`, or destructive `ALTER`. Existing `profiles` / `articles` / `follows` / `comments` rows and columns are untouched.
- `MIDTRANS_SERVER_KEY` is server-only; never prefixed `NEXT_PUBLIC_`.
- Webhook signature is `SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`; mismatch → HTTP 403.
- Only `settlement`, or `capture` with `fraud_status = accept`, marks a booking `CONFIRMED`.
- Articles are never paywalled; no payment gate on any reading surface.
- Crisis signals block booking before token minting; the payment screen is never reached.
- `COMPANION` copy never uses the word "konseling"; only `PROFESSIONAL` may.
- Canonical landing files (`src/components/landing/*`, `src/styles/landing.css`, `src/app/(marketing)/*`) must not be modified.
- Design tokens: Warm Sanctuary only; no new colours/radii/fonts.
- No unrequested code comments.
- LMHY quality gate: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Review Focus

- A booking intake note containing a crisis signal must never produce a Snap token, even when the note is evasive (spacing, casing, Indonesian + English variants).
- A tampered or missing `signature_key` on the Midtrans webhook must be rejected with 403 and must not change any booking state.
- A `pending` (not `settlement`) notification must not mark a booking paid; `expire`/`deny` must release the slot.
- Two clients attempting the same slot concurrently must yield at most one booking.
- Take rate must resolve to 500 bps for PRO and 1000 bps for FREE, and be persisted on the booking at creation time.
- A `REFLECTOR` (unverified) profile must not be able to create a slot or receive a booking, even by calling the server action directly.

---

### Task 1: Additive Sanctuary Schema Migration

**Files:**
- Create: `supabase/migrations/20261012000000_sanctuary_studio_schema.sql`

**Interfaces:**
- Consumes: existing `public.profiles`, `auth.users`.
- Produces: tables `creator_subscriptions`, `listening_slots`, `session_bookings`, `guided_prompts`; `profiles` columns `creator_role`, `service_track`, `credential_type`, `credential_number`, `credential_document_url`, `verification_status`, `verified_at`, `verified_by`, `verification_note`, `pro_until`.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20261012000000_sanctuary_studio_schema.sql` with, in order:

`creator_subscriptions`: `id uuid PK default gen_random_uuid()`, `provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `tier text NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE','PRO'))`, `current_period_end timestamptz`, `status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED'))`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`, `UNIQUE(provider_id)`.

`listening_slots`: `id uuid PK default gen_random_uuid()`, `provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `start_time timestamptz NOT NULL`, `duration_min integer NOT NULL CHECK (duration_min BETWEEN 15 AND 120)`, `price_idr bigint NOT NULL CHECK (price_idr >= 0)`, `status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','RESERVED','BOOKED','CANCELLED','COMPLETED'))`, `reserved_until timestamptz`, `created_at timestamptz DEFAULT now()`.

`session_bookings`: `id uuid PK default gen_random_uuid()`, `slot_id uuid NOT NULL REFERENCES public.listening_slots(id) ON DELETE CASCADE`, `client_pseudonym text NOT NULL`, `client_contact text NOT NULL`, `client_note text`, `consent_accepted boolean NOT NULL DEFAULT false`, `status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','CONFIRMED','COMPLETED','CANCELLED','REFUNDED','NO_SHOW'))`, `order_id text UNIQUE`, `midtrans_transaction_id text`, `room_url text`, `take_rate_bps integer NOT NULL CHECK (take_rate_bps BETWEEN 500 AND 10000)`, `amount_idr bigint NOT NULL`, `risk_flag text`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.

`guided_prompts`: `id uuid PK default gen_random_uuid()`, `slug text UNIQUE NOT NULL`, `title text NOT NULL`, `prompt_body text NOT NULL`, `category text NOT NULL CHECK (category IN ('Burnout','Duka','Penerimaan Diri','Hubungan','Kecemasan'))`, `is_active boolean NOT NULL DEFAULT true`, `created_at timestamptz DEFAULT now()`.

`profiles` additive columns via a single `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ...` statement: `creator_role text NOT NULL DEFAULT 'REFLECTOR' CHECK (creator_role IN ('REFLECTOR','COMPANION','PROFESSIONAL'))`, `service_track text CHECK (service_track IN ('PEER','CLINICAL'))`, `credential_type text`, `credential_number text`, `credential_document_url text`, `verification_status text NOT NULL DEFAULT 'NONE' CHECK (verification_status IN ('NONE','PENDING','APPROVED','REJECTED'))`, `verified_at timestamptz`, `verified_by uuid REFERENCES auth.users(id)`, `verification_note text`, `pro_until timestamptz`.

Indexes: `idx_listening_slots_provider` on `listening_slots(provider_id)`; `idx_session_bookings_slot` on `session_bookings(slot_id)`; `idx_guided_prompts_category` on `guided_prompts(category)`; `idx_profiles_creator_role` on `profiles(creator_role)`; `idx_profiles_verification_status` on `profiles(verification_status)`.

Also enable RLS on the four new tables and add: `guided_prompts` select-for-all; `listening_slots` select-for-all (public availability), insert/update/delete only where `auth.uid() = provider_id`; `session_bookings` insert-for-authenticated, select where the caller is the slot's provider or the row's `order_id` is supplied via service role, update restricted to service role; `creator_subscriptions` select where `auth.uid() = provider_id`, write restricted to service role.

- [ ] **Step 2: Verify the SQL is syntactically consistent**

Run: `node -e "const s=require('fs').readFileSync('supabase/migrations/20261012000000_sanctuary_studio_schema.sql','utf8'); const opens=(s.match(/\\(/g)||[]).length, closes=(s.match(/\\)/g)||[]).length; if(opens!==closes){throw new Error('unbalanced parens '+opens+' vs '+closes)} console.log('parens balanced:',opens)"`

Expected: prints `parens balanced: <n>` and exits 0.

- [ ] **Step 3: Verify no destructive statement is present**

Run: `grep -Ei '\\b(drop|truncate|delete from)\\b' supabase/migrations/20261012000000_sanctuary_studio_schema.sql && echo "DESTRUCTIVE FOUND" || echo "clean"`

Expected: prints `clean`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261012000000_sanctuary_studio_schema.sql
git commit -m "feat(sanctuary): additive schema migration for sessions and roles"
```

---

### Task 2: Crisis Scan and Take Rate Logic

**Files:**
- Create: `src/lib/sanctuary/crisis-scan.ts`
- Create: `src/lib/sanctuary/take-rate.ts`
- Test: `src/lib/sanctuary/crisis-scan.test.ts`
- Test: `src/lib/sanctuary/take-rate.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `scanForCrisis(text: string | null | undefined): { flagged: boolean; matched: string[] }`; `resolveTakeRateBps(tier: 'FREE' | 'PRO' | string | null | undefined): number`; constants `TAKE_RATE_FREE_BPS = 1000`, `TAKE_RATE_PRO_BPS = 500`.

- [ ] **Step 1: Write the failing tests**

`src/lib/sanctuary/take-rate.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { resolveTakeRateBps, TAKE_RATE_FREE_BPS, TAKE_RATE_PRO_BPS } from "./take-rate";

test("PRO tier resolves to the lower take rate", () => {
  assert.equal(resolveTakeRateBps("PRO"), TAKE_RATE_PRO_BPS);
  assert.equal(TAKE_RATE_PRO_BPS, 500);
});

test("FREE, null, and unknown tiers resolve to the default take rate", () => {
  assert.equal(resolveTakeRateBps("FREE"), TAKE_RATE_FREE_BPS);
  assert.equal(resolveTakeRateBps(null), TAKE_RATE_FREE_BPS);
  assert.equal(resolveTakeRateBps("pro"), TAKE_RATE_FREE_BPS);
  assert.equal(TAKE_RATE_FREE_BPS, 1000);
});
```

`src/lib/sanctuary/crisis-scan.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { scanForCrisis } from "./crisis-scan";

test("flags direct self-harm ideation", () => {
  const result = scanForCrisis("aku pengen bunuh diri");
  assert.equal(result.flagged, true);
  assert.ok(result.matched.length > 0);
});

test("flags evasive spacing and casing", () => {
  assert.equal(scanForCrisis("BUNUH   DIRI").flagged, true);
  assert.equal(scanForCrisis("ingin  mengakhiri hidup").flagged, true);
});

test("flags English variants", () => {
  assert.equal(scanForCrisis("i want to kill myself").flagged, true);
});

test("does not flag ordinary distress", () => {
  assert.equal(scanForCrisis("aku capek banget dan sedih akhir-akhir ini").flagged, false);
  assert.equal(scanForCrisis("").flagged, false);
  assert.equal(scanForCrisis(null).flagged, false);
  assert.equal(scanForCrisis(undefined).flagged, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- src/lib/sanctuary/take-rate.test.ts src/lib/sanctuary/crisis-scan.test.ts`

Expected: FAIL — cannot resolve module `./take-rate` / `./crisis-scan`.

- [ ] **Step 3: Implement `src/lib/sanctuary/take-rate.ts`**

Export the two constants and `resolveTakeRateBps`, which returns `TAKE_RATE_PRO_BPS` only for the exact uppercase string `"PRO"` and `TAKE_RATE_FREE_BPS` otherwise.

- [ ] **Step 4: Implement `src/lib/sanctuary/crisis-scan.ts`**

Normalize input by lowercasing, collapsing all whitespace runs to a single space, and stripping non-letter/non-space characters. Then test the normalized string against a fixed list of Indonesian and English phrase patterns, including at minimum: `bunuh diri`, `mengakhiri hidup`, `akhiri hidup`, `ingin mati`, `pengen mati`, `self harm`, `menyakiti diri`, `kill myself`, `end my life`, `suicide`. Return `{ flagged, matched }` where `matched` holds the patterns found. Empty/nullish input returns `{ flagged: false, matched: [] }`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- src/lib/sanctuary/take-rate.test.ts src/lib/sanctuary/crisis-scan.test.ts`

Expected: PASS, all cases.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sanctuary/take-rate.ts src/lib/sanctuary/crisis-scan.ts src/lib/sanctuary/take-rate.test.ts src/lib/sanctuary/crisis-scan.test.ts
git commit -m "feat(sanctuary): crisis scan and take rate logic"
```

---

### Task 3: Midtrans Signature and Client

**Files:**
- Create: `src/lib/midtrans/signature.ts`
- Create: `src/lib/midtrans/client.ts`
- Test: `src/lib/midtrans/signature.test.ts`

**Interfaces:**
- Consumes: `node:crypto`.
- Produces: `verifyMidtransSignature(input: { orderId: string; statusCode: string; grossAmount: string; signatureKey: string; serverKey: string }): boolean`; `createSnapToken(input: { orderId: string; grossAmount: number; itemName: string }): Promise<{ token: string; redirectUrl: string }>`; `isPaidStatus(input: { transactionStatus: string; fraudStatus?: string }): boolean`.

- [ ] **Step 1: Write the failing test**

`src/lib/midtrans/signature.test.ts`:

```ts
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
});

test("only settlement, and capture with accept, count as paid", () => {
  assert.equal(isPaidStatus({ transactionStatus: "settlement" }), true);
  assert.equal(isPaidStatus({ transactionStatus: "capture", fraudStatus: "accept" }), true);
  assert.equal(isPaidStatus({ transactionStatus: "capture", fraudStatus: "challenge" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "pending" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "expire" }), false);
  assert.equal(isPaidStatus({ transactionStatus: "deny" }), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/lib/midtrans/signature.test.ts`

Expected: FAIL — cannot resolve module `./signature`.

- [ ] **Step 3: Implement `src/lib/midtrans/signature.ts`**

`verifyMidtransSignature` returns `false` if any of `orderId`, `statusCode`, `grossAmount`, `signatureKey`, `serverKey` is empty. Otherwise compute `sha512(orderId + statusCode + grossAmount + serverKey)` hex and compare to `signatureKey` with `crypto.timingSafeEqual` over equal-length buffers (return `false` on length mismatch). `isPaidStatus` returns `true` only for `transactionStatus === "settlement"`, or `transactionStatus === "capture"` with `fraudStatus === "accept"`.

- [ ] **Step 4: Implement `src/lib/midtrans/client.ts`**

`createSnapToken` reads `process.env.MIDTRANS_SERVER_KEY` and `process.env.MIDTRANS_ENV` (`sandbox` default, `production` when set). It POSTs to `https://app.sandbox.midtrans.com/snap/v1/transactions` (sandbox) or `https://app.midtrans.com/snap/v1/transactions` (production) with HTTP Basic auth `base64(serverKey + ":")` and body `{ transaction_details: { order_id, gross_amount }, item_details: [{ id: orderId, price: grossAmount, quantity: 1, name: itemName }], enabled_payments: ["gopay", "shopeepay", "other_qris"] }`. It throws if the server key is missing or the response is not ok, and returns `{ token, redirectUrl }` from the JSON body.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- src/lib/midtrans/signature.test.ts`

Expected: PASS, all cases.

- [ ] **Step 6: Commit**

```bash
git add src/lib/midtrans/signature.ts src/lib/midtrans/client.ts src/lib/midtrans/signature.test.ts
git commit -m "feat(midtrans): signature verification and snap token client"
```

---

### Task 4: Booking Server Action

**Files:**
- Create: `src/lib/sanctuary/booking-rules.ts`
- Test: `src/lib/sanctuary/booking-rules.test.ts`
- Create: `src/app/actions/booking.ts`

**Interfaces:**
- Consumes: `scanForCrisis` (Task 2), `resolveTakeRateBps` (Task 2), `createSnapToken` (Task 3), `createClient` from `@/lib/supabase/server`.
- Produces: `canProviderCreateSlot(profile: { creator_role?: string | null; verification_status?: string | null }): boolean`; `isSlotReservationExpired(reservedUntil: string | null, now: Date): boolean`; server actions `initiateSessionBooking(input: { slotId: string; pseudonym: string; contact: string; note?: string; consent: boolean }): Promise<{ ok: true; token: string; redirectUrl: string } | { ok: false; code: string; message: string }>` and `createListeningSlot(input: { startTime: string; durationMin: number; priceIdr: number }): Promise<{ ok: boolean; message?: string }>`.

- [ ] **Step 1: Write the failing tests**

`src/lib/sanctuary/booking-rules.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { canProviderCreateSlot, isSlotReservationExpired } from "./booking-rules";

test("only approved companions and professionals may create slots", () => {
  assert.equal(canProviderCreateSlot({ creator_role: "COMPANION", verification_status: "APPROVED" }), true);
  assert.equal(canProviderCreateSlot({ creator_role: "PROFESSIONAL", verification_status: "APPROVED" }), true);
  assert.equal(canProviderCreateSlot({ creator_role: "REFLECTOR", verification_status: "APPROVED" }), false);
  assert.equal(canProviderCreateSlot({ creator_role: "COMPANION", verification_status: "PENDING" }), false);
  assert.equal(canProviderCreateSlot({ creator_role: null, verification_status: null }), false);
});

test("reservation expiry is measured against the reservation window", () => {
  const now = new Date("2026-10-12T10:00:00.000Z");
  assert.equal(isSlotReservationExpired(null, now), true);
  assert.equal(isSlotReservationExpired("2026-10-12T10:05:00.000Z", now), false);
  assert.equal(isSlotReservationExpired("2026-10-12T09:59:00.000Z", now), true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- src/lib/sanctuary/booking-rules.test.ts`

Expected: FAIL — cannot resolve module `./booking-rules`.

- [ ] **Step 3: Implement `src/lib/sanctuary/booking-rules.ts`**

`canProviderCreateSlot` returns `true` only when `verification_status === "APPROVED"` and `creator_role` is `"COMPANION"` or `"PROFESSIONAL"`. `isSlotReservationExpired` returns `true` when `reservedUntil` is null/unparseable or its time is `<= now`.

- [ ] **Step 4: Implement `src/app/actions/booking.ts`**

`'use server'` module. `initiateSessionBooking`:
1. Validate `consent === true`, non-empty pseudonym and contact; else `{ ok: false, code: 'INVALID_INPUT', ... }`.
2. `scanForCrisis(note)`; if flagged, return `{ ok: false, code: 'CRISIS', message: <crisis copy with LISA 0811-3815-472 and Kemenkes 119 ext 8> }` and persist `risk_flag` on no row (return before any insert).
3. Load the slot joined to the provider profile; reject if slot is not `AVAILABLE` or if `isSlotReservationExpired` applies and the slot is stale-`RESERVED`.
4. Set slot `status='RESERVED'`, `reserved_until = now + 15 minutes`.
5. Insert `session_bookings` row with `status='PENDING'`, `order_id = booking id`, `amount_idr = slot.price_idr`, `take_rate_bps = resolveTakeRateBps(providerTier)`.
6. Call `createSnapToken`; on success return `{ ok: true, token, redirectUrl }`; on failure roll the slot back to `AVAILABLE` and return `{ ok: false, code: 'PAYMENT_INIT_FAILED', ... }`.

`createListeningSlot`: require an authenticated session, load the caller's profile, reject with a message unless `canProviderCreateSlot(profile)`, then insert an `AVAILABLE` slot.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- src/lib/sanctuary/booking-rules.test.ts`

Expected: PASS, all cases.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from these files.

- [ ] **Step 7: Commit**

```bash
git add src/lib/sanctuary/booking-rules.ts src/lib/sanctuary/booking-rules.test.ts src/app/actions/booking.ts
git commit -m "feat(sanctuary): booking rules and server actions"
```

---

### Task 5: Midtrans Webhook Route

**Files:**
- Create: `src/app/api/payments/midtrans/webhook/route.ts`

**Interfaces:**
- Consumes: `verifyMidtransSignature`, `isPaidStatus` (Task 3).
- Produces: `POST` handler at `/api/payments/midtrans/webhook`.

- [ ] **Step 1: Implement the route**

Read the JSON body. Require `order_id`, `status_code`, `gross_amount`, `signature_key`, `transaction_status`. Call `verifyMidtransSignature` with `serverKey = process.env.MIDTRANS_SERVER_KEY`; on failure return `new Response(null, { status: 403 })` and change nothing.

On success: load the booking by `order_id` using the service-role Supabase client (`@/lib/supabase/admin`). If `isPaidStatus({ transactionStatus, fraudStatus })`, set booking `status='CONFIRMED'`, `midtrans_transaction_id`, and slot `status='BOOKED'`. If `transaction_status` is `expire`, `deny`, or `cancel`, set booking `status='CANCELLED'` and slot `status='AVAILABLE'`, clearing `reserved_until`. Return `new Response(null, { status: 200 })`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/payments/midtrans/webhook/route.ts
git commit -m "feat(payments): signature-verified midtrans webhook"
```

---

### Task 6: Reader Doorway Card and Crisis Banner

**Files:**
- Create: `src/components/sanctuary/DoorwayCard.tsx`
- Create: `src/components/sanctuary/CrisisBanner.tsx`
- Create: `src/components/sanctuary/ProviderBadge.tsx`
- Modify: `src/app/tenant/[username]/[slug]/page.tsx` (mount `DoorwayCard` additively, below existing article content)

**Interfaces:**
- Consumes: Warm Sanctuary tokens; profile fields `creator_role`, `verification_status`.
- Produces: default-exported React components `DoorwayCard`, `CrisisBanner`, `ProviderBadge`.

- [ ] **Step 1: Implement the components**

`CrisisBanner`: renders the LISA number `0811-3815-472` and `Kemenkes 119 ext 8` with the calm copy from the spec. No payment CTA.

`ProviderBadge`: renders a verified badge; accepts `role: 'COMPANION' | 'PROFESSIONAL'`. For `COMPANION` the label is "Pendamping Sebaya Terverifikasi"; for `PROFESSIONAL`, "Praktisi Terverifikasi". Never renders the word "konseling" for `COMPANION`.

`DoorwayCard`: accepts `{ username, role, isVerified, hasSlots }`. If `isVerified && hasSlots`, links to `/tenant/{username}#sesi-dengar` with CTA "Ajak Bicara". If verified but no slots, links to `/tenant/{username}#sesi-dengar` with CTA "Lihat Jadwal". If not verified, renders the platform-directory variant with copy "Merasa terhubung dengan cerita ini? Kamu tidak harus melewatinya sendirian." plus a link to `/tenant/{username}`.

- [ ] **Step 2: Mount `DoorwayCard` in the article page**

In `src/app/tenant/[username]/[slug]/page.tsx`, after the existing article body and before the comment section, render `DoorwayCard` with the author's `creator_role`, `verification_status`, and whether the author has any `AVAILABLE` slot. Do not alter existing markup or ordering of unrelated elements.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/sanctuary/DoorwayCard.tsx src/components/sanctuary/CrisisBanner.tsx src/components/sanctuary/ProviderBadge.tsx "src/app/tenant/[username]/[slug]/page.tsx"
git commit -m "feat(sanctuary): doorway card, crisis banner, provider badge"
```

---

### Task 7: Provider Profile Session Tab and Booking Page

**Files:**
- Create: `src/components/sanctuary/SessionTabs.tsx`
- Create: `src/app/tenant/[username]/book/[slotId]/page.tsx`
- Create: `src/app/tenant/[username]/book/[slotId]/BookingClient.tsx`
- Modify: `src/app/tenant/[username]/page.tsx` (add the session tab + badge additively)

**Interfaces:**
- Consumes: `ProviderBadge` (Task 6), `CrisisBanner` (Task 6), `initiateSessionBooking` (Task 4), `scanForCrisis` (Task 2).
- Produces: profile `#sesi-dengar` section; booking route rendering slots and the Snap popup.

- [ ] **Step 1: Implement `SessionTabs`**

Renders the provider's upcoming `AVAILABLE` slots with price in IDR and a link to `/tenant/{username}/book/{slotId}`. Renders nothing when the provider is not verified.

- [ ] **Step 2: Mount the session tab on the profile page**

In `src/app/tenant/[username]/page.tsx`, add a `Sesi Dengar` section with `id="sesi-dengar"` after the existing tabs, shown only when `verification_status === 'APPROVED'`, plus `ProviderBadge` in the header. Leave existing banner/avatar/tab markup unchanged.

- [ ] **Step 3: Implement the booking page and client**

`page.tsx` loads the slot + provider, 404s when the slot is missing or not `AVAILABLE`, and renders `BookingClient`.

`BookingClient.tsx` (`'use client'`) renders the pseudonym, contact, optional note fields, the consent checkbox, and the price. On submit it calls `initiateSessionBooking`. On `{ ok: false, code: 'CRISIS' }` it swaps the form for `CrisisBanner` and never loads Snap. On `{ ok: true }` it loads the Snap script for the configured environment (`MIDTRANS_ENV`) via `next/script` with `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` and calls `window.snap.pay(token)`.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/sanctuary/SessionTabs.tsx "src/app/tenant/[username]/book/[slotId]/page.tsx" "src/app/tenant/[username]/book/[slotId]/BookingClient.tsx" "src/app/tenant/[username]/page.tsx"
git commit -m "feat(sanctuary): provider session tab and booking page"
```

---

### Task 8: Builder Guided Prompts and Scheduling Tab

**Files:**
- Create: `src/components/sanctuary/SlotCalendar.tsx`
- Modify: `src/app/builder/WebBuilderClient.tsx` (add guided-prompt picker + role-gated scheduling tab)
- Modify: `.env.example` (document the Midtrans variables)

**Interfaces:**
- Consumes: `createListeningSlot` (Task 4), `canProviderCreateSlot` (Task 4), `guided_prompts` table (Task 1).
- Produces: guided-prompt picker in the builder; `Jadwal Sesi` tab gated on role.

- [ ] **Step 1: Implement `SlotCalendar`**

A client component that accepts `canSchedule: boolean` and a list of existing slots, renders a simple weekly form (date, time, duration, price), and calls `createListeningSlot`. Renders nothing when `canSchedule` is false.

- [ ] **Step 2: Wire the builder**

Add a guided-prompt picker (loads active `guided_prompts`, inserting the chosen `prompt_body` as a starting template in the editor). Add a `Jadwal Sesi` tab rendered only when `canProviderCreateSlot(profile)` is true; otherwise omit the tab entirely.

- [ ] **Step 3: Document environment variables**

Append to `.env.example`:

```env
# ==============================================================================
# MIDTRANS (SANCTUARY STUDIO SESSIONS — QRIS)
# ==============================================================================
# Server Key (HANYA server-side, TIDAK BOLEH diekspos ke browser / NEXT_PUBLIC_)
MIDTRANS_SERVER_KEY=
# Client Key (aman untuk browser, dipakai snap.js)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
# Lingkungan Midtrans: sandbox | production
MIDTRANS_ENV=sandbox
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/sanctuary/SlotCalendar.tsx src/app/builder/WebBuilderClient.tsx .env.example
git commit -m "feat(builder): guided prompts and role-gated session scheduling"
```

---

### Task 9: Quality Gate

**Files:** none (verification only)

- [ ] **Step 1: Run the full quality gate**

Run: `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build`
Expected: lint clean, no new type errors, all unit tests pass, production build succeeds.

- [ ] **Step 2: Confirm the landing page is untouched**

Run: `git diff --stat $(git merge-base main HEAD) HEAD -- src/components/landing src/styles/landing.css "src/app/(marketing)"`
Expected: no output (no changes in the canonical landing paths).

- [ ] **Step 3: Record the result**

If any step fails, fix forward in the owning task and re-run. Do not claim completion without the full command output.
