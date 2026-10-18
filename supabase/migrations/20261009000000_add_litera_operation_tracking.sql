-- Migration: Add Litera Operation Tracking to Articles
-- Task 11: Hardened Auto-Minting & Async Operation Tracking
-- Additive only: nullable columns + unique partial index on litera_operation_id

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS litera_operation_id text,
  ADD COLUMN IF NOT EXISTS litera_intent_id text,
  ADD COLUMN IF NOT EXISTS litera_status text,
  ADD COLUMN IF NOT EXISTS litera_tx_hash text,
  ADD COLUMN IF NOT EXISTS litera_token_id bigint,
  ADD COLUMN IF NOT EXISTS litera_failure_code text,
  ADD COLUMN IF NOT EXISTS litera_failure_message text,
  ADD COLUMN IF NOT EXISTS litera_updated_at timestamptz;

-- Unique partial index on non-null litera_operation_id for fast webhook/indexer reconciliation
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_litera_operation_id
  ON articles (litera_operation_id)
  WHERE litera_operation_id IS NOT NULL;
