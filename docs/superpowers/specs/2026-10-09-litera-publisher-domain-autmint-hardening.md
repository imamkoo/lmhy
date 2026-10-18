# Litera Publisher Domain Ownership & Auto-Mint Hardening

## Goal

Make Litera publisher identity authoritative, prevent domain hijacking, ensure LMHY uses the wallet that owns its Litera domain, and only enqueue auto-mint after complete metadata validation.

## Scope

This change spans the Litera backend and LMHY application, plus the public integration documentation. It includes the profile/article navigation cleanup and profile thumbnail correction already approved in this conversation.

## Invariants

1. A publisher is identified by the wallet that owns the domain registration in Litera.
2. A root domain can belong to at most one active publisher wallet.
3. An API key is owned by exactly one publisher wallet and cannot be used for another publisher's domain.
4. `creatorAddress` identifies the article creator; it never changes `publisherWallet`.
5. A successful article registration request does not imply a minted NFT.
6. Quota is consumed only after metadata and domain/API-key ownership validation succeeds and an auto-mint intent is created.
7. Retries are idempotent: the same publisher and canonical article URL cannot consume quota or mint twice.
8. Plaintext API keys never enter source control, application logs, test fixtures, or chat transcripts.

## Publisher and Domain Binding

The backend must expose one authoritative integration status for a publisher domain. It must include `publisherWallet`, `apiKeyWallet`, `domainOwnerWallet`, normalized `scopeRoot`, API-key status, domain status, quota, and tokenomics. The status must distinguish at minimum:

- `SYNCHRONIZED`
- `API_KEY_MISSING`
- `API_KEY_REVOKED`
- `DOMAIN_UNBOUND`
- `PUBLISHER_MISMATCH`
- `DOMAIN_NOT_LIVE`

Domain registration must atomically reject a normalized root domain already owned by a different active publisher. Existing duplicate rows must be detected and reported during migration/diagnostics rather than silently reassigned.

For LMHY production, the expected publisher wallet is `0x181fA70024c917531b75a31499E42ad81B674512`, configured as a non-secret environment value. The server must fail closed for publish-to-Litera when the configured wallet does not match the API-key wallet and domain owner.

## Article Metadata Gate

Before an intent can enter `MINTING`, validate:

- canonical HTTPS article URL and domain ownership;
- non-empty title, author, and description/excerpt;
- valid HTTPS cover image URL when an image is declared;
- supported media type and media URL consistency;
- publisher tokenomics and collection resolution;
- creator address format when supplied/required by policy;
- positive available quota when auto-mint is enabled.

Incomplete metadata must produce a structured validation result and a non-minting status. The response must identify missing/invalid fields without exposing secrets. Existing intents must be revalidated before requeue.

## Auto-Mint Lifecycle

The lifecycle is explicit:

`REGISTERED` → `METADATA_INCOMPLETE` or `CONFIGURED` → `MINTING` → `MINTED` | `FAILED`

The API must return an intent identifier and lifecycle status. `MINTED` requires token ID and transaction hash. `FAILED` requires a safe failure code/message and must support idempotent retry where policy allows. Requeue must use the existing intent and never consume quota twice.

## LMHY Integration

LMHY must persist the Litera intent ID, publisher wallet, lifecycle status, token ID, transaction hash, and safe failure reason on the article record or an integration record. The admin page must show the authoritative binding status rather than inferring health from an HTTP quota response. Publish UI must distinguish database publication from Litera registration and minting.

LMHY must send `autoMint: true` only after its integration preflight confirms synchronized binding and complete metadata. The backend remains the final authority and must validate independently.

## UI Navigation and Media

- Litera widget DOM, loader, global data, and event state must be cleaned when leaving an article.
- Profile pages must not contain a Litera root, widget marker, or stale placeholder after article → back navigation.
- Profile article thumbnails must preserve the complete image with `object-contain`; article detail media remains full-width and uncropped according to the existing design.

## Documentation

The OpenAPI descriptions and developer guide must show the complete sequence: domain owner wallet → domain registration → API key issued by the same wallet → synchronized preflight → article registration → lifecycle polling/retry. They must explicitly define publisher wallet, creator address, API-key owner, and collector wallet.

## Security and Migration

- Rotate the exposed API key; do not put it in repository files or logs.
- Configure the replacement key only in the deployment secret manager.
- Configure `LITERA_PUBLISHER_WALLET` with the domain owner wallet.
- Verify synchronization and quota using redacted metadata only.
- Revoke the exposed/old key after successful verification.
- Provide a diagnostic/migration path for existing intents and duplicate domain rows; never silently reassign ownership.

## Verification

Litera backend: focused unit/integration tests, full relevant Jest suite, build, and OpenAPI generation/check.

LMHY: focused tests, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and production/browser verification of profile → article → back plus synchronized integration status.
