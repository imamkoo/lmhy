# Publisher Tokenomics Policy & LMHY Quota Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Litera the source of truth for publisher quota and default tokenomics, and make LMHY consume live quota safely from its server runtime.

**Architecture:** First fix and test LMHY's server-only environment handling. Then add a new additive Litera profile table and publisher-authenticated settings endpoints. Finally resolve profile defaults in CMS article registration while preserving existing article-level configuration and all existing rows.

**Tech Stack:** Next.js 16/TypeScript (LMHY), NestJS/Prisma/PostgreSQL (Litera), Jest, explicit additive SQL migration.

**Spec:** `docs/superpowers/specs/2026-10-03-publisher-tokenomics-and-lmhy-quota-design.md`

## Global Constraints

- Never run `prisma db push --accept-data-loss`.
- Migration SQL must be additive only: create new table/index/constraint; no drop, truncate, delete, destructive alter, or reset.
- Existing publisher, API key, quota, and article intent rows must remain unchanged.
- Keep `LITERA_API_KEY` server-only; never use a `NEXT_PUBLIC_` name.
- Do not write to legacy contracts.
- Do not deploy production until backup, SQL review, tests, and explicit go-live confirmation are complete.

## Review Focus

- LMHY runtime has an empty or whitespace-only key: show missing-runtime status without calling Litera.
- Litera quota returns a non-2xx response: distinguish API failure from missing configuration.
- Existing CMS article intent already has explicit tokenomics: do not overwrite it.
- New CMS article omits tokenomics and has no profile: use safe defaults without creating destructive side effects.
- Article attempts override a locked publisher policy: reject or ignore according to policy, never silently exceed limits.

---

### Task 1: LMHY live quota runtime diagnostics

**Files:**
- Modify: `src/lib/litera.ts`
- Modify: `src/app/actions/admin-nft.ts`
- Modify: `src/app/admin/litera/AdminLiteraClient.tsx`
- Test: existing LMHY test location or add `src/lib/litera.test.ts`

**Interfaces:**
- Produces a typed result distinguishing `MISSING_API_KEY`, `API_ERROR`, and live quota.

- [ ] Write a failing test for whitespace-only runtime key and non-2xx quota response.
- [ ] Run the focused LMHY test and verify the expected failure.
- [ ] Implement server-only runtime diagnostics and preserve existing quota normalization.
- [ ] Update UI copy so Netlify/Vercel instructions do not claim a key exists when runtime is missing.
- [ ] Run focused tests, `npm run lint`, `npx tsc --noEmit`, and `npm run build` in LMHY worktree.

### Task 2: Add additive publisher tokenomics schema and migration

**Files:**
- Modify: Litera `prisma/schema.prisma`
- Create: Litera `prisma/migrations/<timestamp>_add_publisher_tokenomics_profile/migration.sql`
- Test: migration SQL safety check

**Interfaces:**
- Produces Prisma model `PublisherTokenomicsProfile` keyed uniquely by `publisherWallet`.

- [ ] Write a migration safety test/script asserting no destructive SQL keywords and requiring `CREATE TABLE`.
- [ ] Verify the safety test fails before the migration exists.
- [ ] Add only the new model and an explicit additive SQL migration.
- [ ] Verify generated Prisma client/build without applying the migration to production.

### Task 3: Litera publisher tokenomics service and endpoints

**Files:**
- Modify: Litera publisher/controller service module following existing wallet/session patterns
- Create/modify: tokenomics DTOs and service tests
- Test: controller/service tests

**Interfaces:**
- `GET /publisher/tokenomics` returns the effective profile.
- `PUT /publisher/tokenomics` validates and upserts the profile for the authenticated publisher wallet.

- [ ] Write failing tests for safe defaults, validation bounds, and wallet ownership.
- [ ] Run tests and verify they fail for missing implementation.
- [ ] Implement additive upsert/read behavior; do not mutate old article intents.
- [ ] Run focused tests and backend typecheck.

### Task 4: Apply publisher policy during CMS article registration

**Files:**
- Modify: Litera `cms.service.ts`
- Modify: CMS DTO/OpenAPI annotations if needed
- Test: `cms.service.spec.ts` and `cms.controller.spec.ts`

**Interfaces:**
- `registerArticle(wallet, dto)` resolves omitted fields from `PublisherTokenomicsProfile`.

- [ ] Write failing tests for profile defaults, existing intent preservation, and locked override rejection.
- [ ] Run tests and verify expected failures.
- [ ] Implement a focused merge/validation function with safe defaults.
- [ ] Regenerate OpenAPI and run the full CMS test suite plus backend build.

### Task 5: LMHY policy display and publish compatibility

**Files:**
- Modify: LMHY server client/actions/admin UI
- Test: LMHY focused tests

**Interfaces:**
- LMHY shows that tokenomics is managed in Litera and continues publishing articles without sending mandatory tokenomics fields.

- [ ] Write failing test for publish payload omission and live quota display.
- [ ] Implement the minimal read-only policy integration and link to Litera publisher settings.
- [ ] Run LMHY lint, typecheck, build, and focused tests.

### Task 6: Production readiness and controlled migration/deploy

**Files:**
- Modify: deployment/runbook documentation only if needed

- [ ] Inspect migration SQL and prove it is additive.
- [ ] Create/verify a production database backup before migration.
- [ ] Apply migration using Prisma migrate deploy only after backup verification.
- [ ] Verify existing table row counts and new table availability.
- [ ] Deploy backend/LMHY only after explicit go-live confirmation.
- [ ] Smoke-test live quota and tokenomics endpoints without logging secrets.
