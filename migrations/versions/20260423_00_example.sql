-- Example manual migration
--
-- Copy this file and rename it using the convention:
--   YYYYMMDD_NN_describe_change.sql
--
-- Execute manually against the target database.
-- Prefer idempotent SQL when possible.

BEGIN;

-- Example schema change:
-- ALTER TABLE prd.produtos
-- ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Example data migration:
-- UPDATE prd.produtos
-- SET observacoes = 'preenchido manualmente'
-- WHERE observacoes IS NULL;

COMMIT;
