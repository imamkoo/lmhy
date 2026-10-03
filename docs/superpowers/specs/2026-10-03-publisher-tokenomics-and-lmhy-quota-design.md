# Publisher Tokenomics Policy & LMHY Quota Integration Design

## Goal

Make Litera the source of truth for publisher quota and default tokenomics while allowing LMHY and other Web Builders to consume the policy server-to-server without rebuilding tokenomics configuration interfaces.

## Scope

### In scope

- Fix LMHY's server-runtime detection and error reporting for `LITERA_API_KEY`.
- Keep quota data realtime from `GET /cms/quota`.
- Add an additive publisher tokenomics profile in Litera.
- Add publisher-authenticated read/update endpoints for the profile.
- Resolve publisher defaults during `POST /cms/articles/register`.
- Preserve existing article intent values and existing publisher behavior.

### Out of scope

- OAuth/Connected Apps and removal of all partner-held credentials.
- Smart-contract changes or legacy-contract writes.
- Deleting, renaming, or altering existing database columns/tables.
- Production migration or VPS deployment during initial implementation without a separate explicit go-live confirmation.

## Data safety contract

- The migration may only create a new table and its indexes/constraints.
- It must contain no `DROP`, `TRUNCATE`, `DELETE`, destructive `ALTER`, or reset operation.
- Existing `Publisher`, `PublisherApiKey`, `PublisherQuota`, and `CmsArticleIntent` rows must remain untouched.
- Existing article-level tokenomics remains authoritative for already-created intents.
- New defaults apply only when a new article omits the corresponding tokenomics field.
- Safe defaults are `price=0`, `feeEnabled=false`, rewards `0`, and `autoMint=false`.

## Architecture

`PublisherApiKey.wallet` identifies the publisher. A new `PublisherTokenomicsProfile` row belongs to that publisher wallet. The CMS service loads the profile after API-key authentication and merges only omitted article fields. Publisher settings are edited through the Litera publisher dashboard using the existing wallet/session authentication, never through an ordinary CMS API key.

LMHY keeps `LITERA_API_KEY` server-only. Its server action reports three distinct states: missing runtime key, invalid/unreachable Litera API, and successful live quota. Browser code never receives the key.

## API contract

Publisher settings endpoints:

- `GET /publisher/tokenomics`
- `PUT /publisher/tokenomics`

CMS behavior:

- `POST /cms/articles/register` accepts existing payloads unchanged.
- Omitted tokenomics fields are resolved from the publisher profile.
- Explicit fields are honored only when the profile allows article overrides and values pass configured maximums.
