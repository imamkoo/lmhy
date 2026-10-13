# LMHY Sanctuary Studio — SaaS Layer Design Spec

**Date:** 2026-10-12
**Status:** Draft (pending review)
**Spec owner:** Product (imamkoo)
**Implements:** ROADMAP milestone ordering — Tangga 1 (Bibliotherapy) + Tangga 3 (Guided Sessions) as the first monetizable layer of Let Me Hear You.

---

## 1. Goal

Turn `letmehearyou.id` from a free creator-publishing surface into a sustainable mental-health platform by adding a **paid human-service layer (Sesi Dengar)** on top of the existing free reflection-publishing layer — without ever paywalling the bibliotherapy content itself.

Two revenue streams, one entitlement core:
- **Creator/Provider subscription** (Sanctuary Pro, Rp 79.000–149.000/bln) — lower platform take rate.
- **Per-session ticket take rate** (5–10% of each booked session).

## 2. Why this shape (evidence base)

The design is not arbitrary. Each major decision is anchored in research gathered 2026-10-11/12:

| Decision | Evidence |
|---|---|
| Content stays 100% free (no paywall) | Paywalling recovery narratives contradicts the mission and the "doorway" function; Indonesian digital media is not subscription-native. |
| Writing is a clinical intervention, not "content" | Expressive writing meta-analyses (Pennebaker paradigm); NEON trial (N=1.023) — recovery narratives improve quality of life and are cost-effective. |
| Human handoff is the retention engine | 79-RCT meta-analysis: human contact reduces dropout; gamification does not. |
| B2C-only is a death trap | Real (raised $18M, shut down); Calm FY2025: 40% churn, CAC ~$120; retention as low as 3–4% after 30 days in real-world settings. |
| Gate money, not writing | Indonesian regulation: "konseling" is a protected profession (STR + SIP required, UU 17/2023). Peer support is legal only as non-clinical "pendampingan". |
| QRIS-first payments | Cheapest rails for the target audience (0,70% vs 2,9% + Rp 2.000 card); matches Saweria/Trakteer/Karyakarsa behaviour (ARPPU Rp 47.500/bln). |
| Escrow + crisis protocol | Duty of care for users in fragile states; non-negotiable ethically. |

## 3. Scope

### In scope (MVP)

1. Role ladder on `profiles` (`REFLECTOR` / `COMPANION` / `PROFESSIONAL`) with admin verification flow.
2. Guided reflection prompts catalog (`guided_prompts`) wired into `/builder`.
3. Provider availability scheduling (`listening_slots`) + booking flow (`session_bookings`).
4. Midtrans Snap QRIS checkout (server-action token + signed webhook).
5. Doorway Card component on article reader pages + provider profile "Sesi Dengar" tab.
6. Sanctuary Pro subscription status + take-rate resolution.
7. Crisis Guard: crisis-signal detection with hard intercept to emergency resources.
8. Provider earnings view + manual weekly payout process.

### Out of scope (deferred to later milestones)

- AI counseling chatbot / RAG memory (ROADMAP M3).
- Organization/campus nodes and anonymous pulse dashboards (Model 3, later phase).
- Video education, events, seminars, academic coaching (ROADMAP M4).
- Automated bank/e-wallet payout rails (MVP uses manual scheduled payout).
- Insurance/FSA/HSA itemisation or clinical EHR integration.
- Any modification to the canonical landing page (`src/components/landing/`, `src/styles/landing.css`, `src/app/(marketing)/`).

## 4. Product principles (non-negotiable)

1. **Bibliotherapy is never paywalled.** Articles are free forever. Money changes hands only for human time.
2. **Writing is open to everyone; monetisation is gated.** The gate is credential + trust, never follower count.
3. **Every touchpoint has a doorway upward** and a doorway to crisis help. No dead ends.
4. **Outcomes are the success metric**, not views or GMV: wellbeing deltas and healthy escalation rate.
5. **Clinical language is protected.** `COMPANION` offers "Sesi Dengar" (pendampingan sebaya), never "konseling". Only `PROFESSIONAL` may offer "Sesi Konseling".
6. **Safety intercepts before commerce.** Crisis signals never reach a payment screen.

## 5. Architecture

### 5.1 System context

```
                    ┌─────────────────────────────────────┐
                    │  Reader / Klien (anonim-friendly)    │
                    └───────────────┬─────────────────────┘
                                   │ reads + books
                    ┌──────────────▼─────────────────────┐
                    │  LMHY Next.js 16 (App Router)        │
                    │  • /blog, /tenant/[user]/* (free)    │
                    │  • /builder (prompts + slots)        │
                    │  • booking + Snap popup              │
                    │  • /api/payments/midtrans/webhook    │
                    └───┬───────────────┬───────────────┬──┘
                        │               │               │
        ┌───────────────▼───┐  ┌────────▼────────┐  ┌────▼──────────┐
        │  Supabase         │  │ Midtrans Snap    │  │ Litera S2S    │
        │  (auth, profiles, │  │ (QRIS escrow,    │  │ (session      │
        │   slots, bookings,│  │  settlement)     │  │  receipt NFT) │
        │   subscriptions)  │  └────────┬────────┘  └───────────────┘
        └───────────────────┘           │ signed SHA-512 webhook
                                        ▼
```

### 5.2 Role ladder and trust gates

```
TINGKAT 3  VERIFIED PROVIDER ── can transact
              ▲ only via: human review + credential
              │
TINGKAT 2  SERVICE APPLICANT ── in verification
              ▲ only via: explicit request + training
              │
TINGKAT 1  REFLECTOR ── default for every signup
              writes freely, own subdomain, no service buttons
```

**Gate 1 — automatic system check (to enter Tingkat 2):**
- ≥ 3 published reflections
- Complete profile (photo, bio, topic areas)
- Account age ≥ 14 days
- No active violation reports

**Gate 2 — track selection + training (Tingkat 2 → review):**
- `COMPANION` track: complete LMHY peer-support training module OR upload external certificate + digitally sign Code of Ethics + acknowledge crisis referral protocol.
- `PROFESSIONAL` track: upload STR + SIP documents.

**Gate 3 — human review (Tingkat 2 → Tingkat 3):**
- Admin approves/rejects with a written reason. This is a deliberate bottleneck for duty-of-care reasons, not a scaling flaw.

**Gate 4 — ongoing maintenance:**
- 30-day probation, client ratings, crisis-referral compliance. Violation demotes back to Tingkat 1.

### 5.3 Surface differences (what users actually see)

| Element | Reflector | Verified Provider |
|---|---|---|
| Profile | banner, avatar, "Tulisan" tab | + verified badge + "Sesi Dengar" tab |
| Under article | Doorway Card → platform directory | Doorway Card → own slot calendar |
| `/builder` | reflection editor + guided prompts | + "Jadwal Sesi" tab + rates + earnings |
| Actions | "Ikuti", "Bagikan" | + "Ajak Bicara" |

## 6. Data model (additive only)

All migrations are additive. No existing column or row in `profiles` / `articles` / `follows` / `comments` is altered or deleted.

**`profiles` (additive columns):**
- `creator_role` enum('REFLECTOR','COMPANION','PROFESSIONAL') NOT NULL DEFAULT 'REFLECTOR'
- `service_track` enum('PEER','CLINICAL') NULL
- `credential_type` text NULL
- `credential_number` text NULL
- `credential_document_url` text NULL
- `verification_status` enum('NONE','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'NONE'
- `verified_at` timestamptz NULL
- `verified_by` uuid NULL
- `verification_note` text NULL
- `pro_until` timestamptz NULL

**`guided_prompts`:**
- `id` uuid PK, `slug` text unique, `title` text, `prompt_body` text, `category` text (Burnout, Duka, Penerimaan Diri, Hubungan, Kecemasan), `is_active` boolean default true, `created_at`.

**`listening_slots`:**
- `id` uuid PK, `provider_id` uuid FK profiles, `start_time` timestamptz, `duration_min` int default 45, `price_idr` bigint, `status` enum('AVAILABLE','RESERVED','BOOKED','CANCELLED','COMPLETED') default 'AVAILABLE', `reserved_until` timestamptz NULL, `created_at`.
- Unique partial index on `(provider_id, start_time)` where status = 'AVAILABLE'.
- CHECK (`price_idr` >= 0).

**`session_bookings`:**
- `id` uuid PK, `slot_id` uuid FK listening_slots, `client_pseudonym` text, `client_contact` text, `client_note` text NULL, `consent_accepted` boolean NOT NULL, `status` enum('PENDING','PAID','CONFIRMED','COMPLETED','CANCELLED','REFUNDED','NO_SHOW') default 'PENDING', `order_id` text unique, `midtrans_transaction_id` text NULL, `room_url` text NULL, `take_rate_bps` int NOT NULL, `amount_idr` bigint NOT NULL, `risk_flag` text NULL, `created_at`, `updated_at`.
- RLS: client-visible rows only via signed booking token; provider sees own slots' bookings; admin full access.

**`creator_subscriptions`:**
- `id` uuid PK, `provider_id` uuid FK profiles, `tier` enum('FREE','PRO') default 'FREE', `current_period_end` timestamptz NULL, `status` enum('ACTIVE','EXPIRED','CANCELLED') default 'ACTIVE', `updated_at`.

**Seed data:** four `guided_prompts` (one per category) shipped in the migration.

## 7. Money flow

1. Client picks slot → 15-minute reservation lock (`RESERVED`, `reserved_until`).
2. Server action mints Snap token with `order_id` = booking id, `gross_amount` = `price_idr` (integer IDR, no decimals), `enabled_payments` limited to QRIS-routed methods (`['gopay','shopeepay','other_qris']`, acquirer GoPay) for MVP — GoPay direct integration (2,00%) is deferred.
3. Client pays via popup; browser `onSuccess` is UX-only.
4. Midtrans webhook posts to `/api/payments/midtrans/webhook`; server re-computes `SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`; mismatch → 403.
5. Only `settlement` (or `capture` + `fraud_status = accept`) flips booking to `CONFIRMED`, slot to `BOOKED`. `pending` stays pending; `expire`/`deny` releases the slot.
6. Funds sit in Midtrans escrow until session `COMPLETED`.
7. Take rate resolved at booking time from `creator_subscriptions.tier`: PRO = 500 bps, FREE = 1000 bps.
8. `COMPLETED` bookings accumulate in provider earnings; manual weekly payout above Rp 50.000 floor.

**Cancellation policy:**
- Client cancels > 12h before slot → full refund, slot released.
- Client cancels < 12h or no-show → 50% to provider, 50% refunded.
- Provider cancels → 100% refund or free reschedule.

## 8. Crisis Guard

Crisis-signal scan runs on booking intake and (later) comment/journal input:

1. Regex + keyword scan (self-harm, suicide ideation) on `client_note` and pseudonym.
2. On hit: booking creation is **blocked**, payment screen is never reached.
3. User is shown Sanctuary Crisis Banner: LISA 0811-3815-472 and Kemenkes 119 ext 8, with calm copy: *"Kamu sangat berharga dan tidak harus menanggung ini sendirian. Sesi berjadwal ini bukan untuk kondisi darurat. Silakan hubungi layanan bantuan krisis di atas sekarang."*
4. Event logged (`risk_flag`) for admin review; admin follows up if user consents to contact.

## 9. File map

**Create:**
- `supabase/migrations/20261012000000_sanctuary_studio_schema.sql`
- `src/app/actions/booking.ts` — slot reservation, token minting, webhook-side booking updates
- `src/app/actions/provider-verification.ts` — application submit + admin approve/reject
- `src/app/api/payments/midtrans/webhook/route.ts` — signature-verified payment status
- `src/app/tenant/[username]/book/[slotId]/page.tsx` — booking page
- `src/components/sanctuary/DoorwayCard.tsx` — post-article CTA
- `src/components/sanctuary/CrisisBanner.tsx` — crisis intercept UI
- `src/components/sanctuary/ProviderBadge.tsx`
- `src/components/sanctuary/SessionTabs.tsx` — profile "Sesi Dengar" tab
- `src/components/sanctuary/SlotCalendar.tsx` — `/builder` scheduling
- `src/lib/sanctuary/crisis-scan.ts` — keyword scan
- `src/lib/sanctuary/take-rate.ts`
- `src/lib/midtrans/client.ts` — server-only Snap token creation
- `src/lib/midtrans/signature.ts` — SHA-512 verification

**Modify (additive only):**
- `src/app/builder/WebBuilderClient.tsx` — add prompts picker + scheduling tab gated on role
- `src/app/tenant/[username]/page.tsx` — add provider tab + badge gated on role
- `src/app/tenant/[username]/[slug]/page.tsx` — mount DoorwayCard
- `.env.example` — `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_ENV`

**Do not touch:** `src/components/landing/*`, `src/styles/landing.css`, `src/app/(marketing)/*`.

## 10. Security & compliance

- `MIDTRANS_SERVER_KEY` server-only; never prefixed `NEXT_PUBLIC_`. Client key is public by design.
- Webhook signature verified per notification; 403 on mismatch.
- `client_contact` treated as PII; RLS-restricted; never exposed to other clients.
- `COMPANION` copy and badges must never imply clinical licensure; disclaimer required on every provider surface.
- `PROFESSIONAL` requires STR/SIP on file before approval; admin verifies before flipping role.
- Booking intake requires explicit consent checkbox (non-clinical, non-emergency acknowledgement).
- Landing-page canonicality and existing CSP headers preserved.

## 11. Testing strategy

- Unit: `crisis-scan` (positive + negative + evasive variants), `take-rate` resolution, signature verification (valid, tampered, missing).
- Integration: slot reservation expiry (15-min TTL), webhook → booking state machine (settlement / pending / expire / deny / capture+accept / capture+deny).
- E2E (sandbox): full book → pay (sandbox QRIS simulator) → webhook → confirmed, using Midtrans sandbox keys and no real money.
- Boundary: double-booking race on the same slot, cancel-before-reservation-expiry, refund paths.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Crisis event slips through to payment | Crisis scan is a hard gate before token minting; admin alerting; never bypassed by client code |
| Unauthorized "konseling" by peers | Role-gated copy; `COMPANION` label enforced server-side; report + demote flow |
| Payment trust failure | Escrow hold until COMPLETED; explicit cancellation policy; signed webhook only |
| Two-sided cold start | Content stays free as lead magnet; earliest providers seeded from existing reflection authors |
| Scope creep toward M3/M4 | Out-of-scope list enforced; later milestones get their own spec |

## 13. Open questions

1. Exact `Sanctuary Pro` price point (Rp 79.000 vs Rp 99.000 vs Rp 149.000) — decide before checkout build.
2. Which e-wallets to enable in `enabled_payments` for go-live (QRIS-only vs QRIS + GoPay direct).
3. Provider onboarding: build LMHY training module in-app vs accept external certificates only for MVP.
4. Session room provider: Google Meet vs Zoom auto-generated links.
