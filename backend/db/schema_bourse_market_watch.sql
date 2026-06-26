-- Bourse de Tunis Market Watch → application storage
-- Run against the same database as DATABASE_URL (PostgreSQL).
-- If you use Sequelize with DB_SYNC=true, these columns are created from the Asset model;
-- use this file for production migrations or manual alignment.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS variation_percent DECIMAL(12, 4) NULL;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS last_volume BIGINT NULL;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS quote_updated_at TIMESTAMPTZ NULL;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS market_cap DECIMAL(24, 4) NULL;

COMMENT ON COLUMN assets.variation_percent IS 'Daily change % from BVMT Market Watch (same as site "Variation")';
COMMENT ON COLUMN assets.last_volume IS 'Session volume from BVMT Market Watch';
COMMENT ON COLUMN assets.quote_updated_at IS 'When Market Watch data was last synced';
COMMENT ON COLUMN assets.market_cap IS 'BVMT REST `caps` is in thousands of TND; stored value is caps × 1000 (full TND).';
