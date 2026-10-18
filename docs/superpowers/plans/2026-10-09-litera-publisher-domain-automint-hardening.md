# Litera Publisher Domain Ownership & Auto-Mint Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind each Litera domain to one authoritative publisher wallet, prevent cross-publisher API-key use, and give LMHY reliable, metadata-gated auto-mint lifecycle reporting.

**Architecture:** Litera owns domain identity and validates every S2S request against the API-key wallet and the global root-domain owner. Article intents receive an explicit validation/lifecycle state and are only enqueued for relayer minting after metadata passes. LMHY consumes a redacted integration-status endpoint, persists returned intent state, and fails closed on a publisher mismatch.

**Tech Stack:** NestJS, Prisma/PostgreSQL, Jest, Swagger/OpenAPI; Next.js 16 App Router, Supabase, TypeScript, ESLint.

**Spec:** `docs/superpowers/specs/2026-10-09-litera-publisher-domain-autmint-hardening.md`

## Global Constraints

- Publisher identity is the wallet owning the normalized root domain in Litera.
- One active publisher owns one normalized root domain globally.
- `creatorAddress` never controls `publisherWallet`.
- Never log, commit, fixture, or return plaintext API keys.
- Auto-mint requires complete metadata and consumes quota exactly once.
- Existing Landing Page canonical files remain unchanged.
- No on-chain writes to legacy Litera contracts; all production writes require explicit human authorization outside this plan.
- LMHY quality gate: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Review Focus

- Concurrent attempts to bind the same normalized domain must yield exactly one owner and one conflict response.
- A valid API key from publisher A must be denied for publisher B's bound domain, without quota consumption.
- Existing `CONFIGURED`/`REGISTERED` intents with incomplete cover/description must never requeue to `MINTING`.
- Repeated publish/requeue for one canonical URL must preserve one intent and one quota debit.
- Article → profile back navigation must leave no Litera root or stale widget content even with a delayed embed-script load.

---

### Task 1: Litera Global Domain Ownership

**Files:**
- Modify: `litera-backend-main/prisma/schema.prisma`
- Modify: `litera-backend-main/src/modules/publisher-request/publisher-request.service.ts`
- Modify: `litera-backend-main/src/modules/cms/cms.service.ts`
- Test: `litera-backend-main/src/modules/publisher-request/publisher-request.service.spec.ts`

**Interfaces:**
- Produces `resolveDomainOwner(domain: string): Promise<DomainOwnership>` and `assertDomainOwnedBy(wallet: string, domain: string): Promise<DomainOwnership>`.
- Consumed by CMS domain registration and article registration.

- [ ] **Step 1: Write failing ownership tests**

Cover normalized root domain uniqueness across two publisher wallets, same-wallet idempotent registration, and a CMS article registration attempt using a different wallet.

- [ ] **Step 2: Run focused tests to verify expected failure**

Run: `npx jest src/modules/publisher-request/publisher-request.service.spec.ts --runInBand`

Expected: FAIL because global ownership enforcement does not exist.

- [ ] **Step 3: Add global normalized-domain ownership persistence and transactional registration**

Create a Prisma migration/model with a globally unique normalized root domain and owner wallet. Backfill/detect duplicate legacy request-domain rows without silently moving ownership. Registration must reject a different owner with an actionable conflict error.

- [ ] **Step 4: Enforce ownership in CMS request validation**

`CmsService.registerArticle(wallet, dto, keyCtx)` must call `assertDomainOwnedBy(wallet, host)` after API-key scope validation and before quota lookup.

- [ ] **Step 5: Run focused tests to verify they pass**

Run: `npx jest src/modules/publisher-request/publisher-request.service.spec.ts src/modules/cms/cms.service.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma src/modules/publisher-request src/modules/cms
git commit -m "feat(cms): enforce global publisher domain ownership"
```

### Task 2: Integration Binding Status API

**Files:**
- Modify: `litera-backend-main/src/modules/cms/cms.service.ts`
- Modify: `litera-backend-main/src/modules/cms/cms.controller.ts`
- Modify: `litera-backend-main/src/modules/cms/cms.dto.ts`
- Test: `litera-backend-main/src/modules/cms/cms.service.spec.ts`

**Interfaces:**
- Consumes `resolveDomainOwner` from Task 1.
- Produces authenticated `GET /cms/integration-status?domain=<host>` with a redacted `CmsIntegrationStatus` result.

- [ ] **Step 1: Write failing status tests**

Assert `SYNCHRONIZED`, `DOMAIN_UNBOUND`, `PUBLISHER_MISMATCH`, and revoked-key cases; assert key plaintext/hash are absent.

- [ ] **Step 2: Run focused tests to verify expected failure**

Run: `npx jest src/modules/cms/cms.service.spec.ts --runInBand`

Expected: FAIL because integration status endpoint/type is absent.

- [ ] **Step 3: Implement `getIntegrationStatus(wallet, domain, keyCtx): Promise<CmsIntegrationStatus>`**

Return normalized domain, API-key wallet/id/active state (redacted), domain owner wallet, CORS-live state, binding status, quota, and tokenomics. The controller must authenticate with `CmsApiKeyGuard`.

- [ ] **Step 4: Update Swagger DTO/descriptions**

Define the identity roles and status enum in OpenAPI so docs show domain owner → publisher/API key relationship.

- [ ] **Step 5: Run focused tests to verify they pass**

Run: `npx jest src/modules/cms/cms.service.spec.ts src/modules/cms/cms.controller.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/cms
git commit -m "feat(cms): expose redacted publisher domain binding status"
```

### Task 3: Metadata Gate and Idempotent Auto-Mint Lifecycle

**Files:**
- Modify: `litera-backend-main/prisma/schema.prisma`
- Modify: `litera-backend-main/src/modules/cms/cms.service.ts`
- Modify: `litera-backend-main/src/modules/cms/cms.dto.ts`
- Create: `litera-backend-main/src/modules/cms/article-metadata.validator.ts`
- Test: `litera-backend-main/src/modules/cms/article-metadata.validator.spec.ts`
- Test: `litera-backend-main/src/modules/cms/cms.service.spec.ts`

**Interfaces:**
- Consumes domain ownership from Task 1.
- Produces `validateArticleMetadata(dto, resolvedPolicy): MetadataValidationResult` and lifecycle statuses `METADATA_INCOMPLETE`, `MINTING`, `MINTED`, `FAILED`.

- [ ] **Step 1: Write failing metadata validator tests**

Assert missing title, author, description, invalid/non-HTTPS cover image, media mismatch, and invalid creator address are reported as safe field-level failures. Assert complete metadata passes.

- [ ] **Step 2: Run validator tests to verify expected failure**

Run: `npx jest src/modules/cms/article-metadata.validator.spec.ts --runInBand`

Expected: FAIL because validator is absent.

- [ ] **Step 3: Implement `validateArticleMetadata`**

Keep it pure and return `{ valid: boolean; missing: string[]; invalid: string[] }`; do not call network services or expose secrets.

- [ ] **Step 4: Write failing CMS lifecycle tests**

Assert incomplete metadata creates/updates a non-minting intent without consuming quota; complete metadata with auto-mint consumes once and enters `MINTING`; repeated canonical URL does not debit twice; failed/requeue paths preserve a single intent.

- [ ] **Step 5: Run lifecycle tests to verify expected failure**

Run: `npx jest src/modules/cms/cms.service.spec.ts --runInBand`

Expected: FAIL because current service consumes quota before metadata validation and lacks metadata status.

- [ ] **Step 6: Implement schema and CMS lifecycle changes**

Persist safe metadata validation result/failure code on intents. Validate before `consumeQuota`; make canonical existing intents revalidate and only transition by valid lifecycle rules. Preserve the existing unique `(publisherWallet, articleUrl)` invariant.

- [ ] **Step 7: Connect only validated `MINTING` intents to the existing relayer execution boundary**

Use the current publication/blockchain application service rather than a legacy contract path. Record token ID/transaction hash on success and a safe code on failure. Do not issue a production transaction during tests.

- [ ] **Step 8: Run focused tests to verify they pass**

Run: `npx jest src/modules/cms/article-metadata.validator.spec.ts src/modules/cms/cms.service.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add prisma src/modules/cms src/modules/publication
git commit -m "feat(cms): gate auto mint on complete article metadata"
```

### Task 4: LMHY S2S Preflight and Article Integration State

**Files:**
- Modify: `letmehearyou/src/lib/litera.ts`
- Modify: `letmehearyou/src/app/actions/tenant.ts`
- Modify: `letmehearyou/src/app/actions/admin-nft.ts`
- Modify: `letmehearyou/src/app/admin/litera/AdminLiteraClient.tsx`
- Modify: `letmehearyou/src/lib/supabase/types.ts`
- Add migration: `letmehearyou/supabase/migrations/<timestamp>_litera_article_integration.sql`
- Test: `letmehearyou/src/lib/litera.test.ts`
- Test: `letmehearyou/src/app/actions/tenant.test.ts`

**Interfaces:**
- Consumes `GET /cms/integration-status` and registration lifecycle result from Tasks 2–3.
- Produces `LiteraIntegrationStatus` and persisted article integration fields.

- [ ] **Step 1: Write failing client tests**

Assert the client uses the redacted integration endpoint, compares `LITERA_PUBLISHER_WALLET` to both API-key and domain owner wallets, and returns a fail-closed mismatch result without calling article registration.

- [ ] **Step 2: Run focused tests to verify expected failure**

Run: `npm test -- --watchAll=false --testPathPattern="litera|tenant"`

Expected: FAIL because no integration preflight/canonical wallet exists.

- [ ] **Step 3: Implement typed preflight in `src/lib/litera.ts`**

Define `LiteraIntegrationStatus` and `getIntegrationStatus(domain)`. Read `LITERA_PUBLISHER_WALLET` server-side only; compare normalized wallets; never expose `LITERA_API_KEY`.

- [ ] **Step 4: Persist article integration lifecycle state**

Add typed database fields for intent ID, publisher wallet, lifecycle status, token ID, transaction hash, and safe failure reason. On publish, run preflight before registration and persist the returned lifecycle fields. Local database publication remains possible, but Litera state must truthfully indicate why no mint occurred.

- [ ] **Step 5: Update the Admin Litera page**

Show configured publisher, API-key owner, domain owner, normalized domain, binding status, and quota. Never show “Live S2S Terhubung” unless status is `SYNCHRONIZED`.

- [ ] **Step 6: Run focused tests to verify they pass**

Run: `npm test -- --watchAll=false --testPathPattern="litera|tenant"`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/litera.ts src/app/actions src/app/admin src/lib/supabase supabase/migrations
git commit -m "feat(litera): require synchronized publisher binding before auto mint"
```

### Task 5: Widget Navigation Isolation and Profile Thumbnail Media

**Files:**
- Modify: `letmehearyou/src/components/litera/LiteraWidget.tsx`
- Modify: `letmehearyou/src/app/tenant/[username]/components/ProfileTabs.tsx`
- Test: `letmehearyou/src/components/litera/LiteraWidget.test.tsx`
- Test: `letmehearyou/src/app/tenant/[username]/components/ProfileTabs.test.tsx`

**Interfaces:**
- Produces article-only widget cleanup behavior and uncropped profile thumbnail rendering.

- [ ] **Step 1: Write failing widget cleanup test**

Mount the widget, simulate delayed script load, unmount it, and assert no `#litera`, `data-litera-widget`, loader script, global widget payload, or stale widget node remains.

- [ ] **Step 2: Run the widget test to verify expected failure**

Run: `npm test -- --watchAll=false --testPathPattern="LiteraWidget"`

Expected: FAIL because the loader script persists after unmount.

- [ ] **Step 3: Implement article-only widget teardown**

Cancel timers/load handling, remove the owned loader script only when no active widget exists, clear widget globals/events, and guard mounts against disconnected roots.

- [ ] **Step 4: Write failing thumbnail test**

Render an article card with a portrait cover and assert the image has `object-contain` and the neutral background container remains present.

- [ ] **Step 5: Run thumbnail test to verify expected failure**

Run: `npm test -- --watchAll=false --testPathPattern="ProfileTabs"`

Expected: FAIL because thumbnail is `object-cover`.

- [ ] **Step 6: Change thumbnail rendering to preserve full image**

Use `object-contain` with the existing neutral container. Do not alter the article-detail cover treatment.

- [ ] **Step 7: Run focused tests to verify they pass**

Run: `npm test -- --watchAll=false --testPathPattern="LiteraWidget|ProfileTabs"`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/litera src/app/tenant
git commit -m "fix(tenant): isolate widget navigation and preserve cover thumbnails"
```

### Task 6: Litera Developer Documentation and Safe Migration Runbook

**Files:**
- Modify: `litera-backend-main/src/modules/cms/cms.controller.ts`
- Modify: `litera-backend-main/src/modules/cms/cms.dto.ts`
- Modify: `litera-backend-main/src/docs/developer-portal.template.ts`
- Create: `litera-backend-main/docs/publisher-domain-api-key-migration.md`
- Test: `litera-backend-main/src/modules/cms/cms.controller.spec.ts`

**Interfaces:**
- Documents Task 1–3 endpoints and statuses.

- [ ] **Step 1: Write failing documentation/schema assertions**

Assert generated OpenAPI descriptions name the distinct domain owner, API-key owner, publisher, creator, and collector roles, and include the integration-status endpoint.

- [ ] **Step 2: Run documentation test to verify expected failure**

Run: `npx jest src/modules/cms/cms.controller.spec.ts --runInBand`

Expected: FAIL because current docs describe registration as Phase 1/no on-chain mint and omit authoritative binding.

- [ ] **Step 3: Update OpenAPI and developer portal documentation**

Include exact integration sequence, binding status meanings, metadata gate, lifecycle polling, requeue behavior, and redacted secret-handling rules. Clearly state that an API key must be issued by the same wallet that owns the root domain.

- [ ] **Step 4: Add the migration runbook**

Document: issue a replacement key from the domain-owner wallet, configure it only in deployment secrets, set `LITERA_PUBLISHER_WALLET`, verify `SYNCHRONIZED`, revoke old/exposed keys, then revalidate/requeue eligible legacy intents. Do not include real keys.

- [ ] **Step 5: Run docs tests and OpenAPI generation**

Run: `npx jest src/modules/cms/cms.controller.spec.ts --runInBand && npm run swagger:generate`

Expected: PASS and deterministic OpenAPI output.

- [ ] **Step 6: Commit**

```bash
git add src/modules/cms src/docs docs
git commit -m "docs(cms): clarify publisher domain and auto mint integration"
```

### Task 7: Full Verification and Controlled Secret Migration

**Files:**
- Verify only; do not commit secret files.

**Interfaces:**
- Consumes all prior tasks and deployment-secret values supplied outside source control.

- [ ] **Step 1: Run backend quality gates**

Run relevant Jest suites, `npm run build`, OpenAPI generation, and contract verification.

- [ ] **Step 2: Run LMHY quality gates**

Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, and the full applicable test suite.

- [ ] **Step 3: Perform secret-manager migration manually with the domain owner**

Issue a replacement API key while signed into the domain-owner wallet; set `LITERA_API_KEY` and `LITERA_PUBLISHER_WALLET` in deployment secrets without displaying plaintext in logs; deploy.

- [ ] **Step 4: Verify production integration using redacted endpoints**

Assert `SYNCHRONIZED`, configured publisher = API-key wallet = domain owner, domain is live, and no key plaintext appears in HTTP response/logs.

- [ ] **Step 5: Revalidate/requeue one eligible legacy intent in dry-run/read-only mode first**

Confirm metadata completeness and intended lifecycle transition without sending an on-chain transaction. Obtain explicit authorization before any live mint transaction.

- [ ] **Step 6: Revoke exposed and obsolete keys**

Only after successful deployment verification, revoke the key exposed in conversation and the obsolete key bound to the non-domain-owner wallet.
