-- User notification preferences + price alert dedupe log
-- Run against the same PostgreSQL database as DATABASE_URL (production / staging).
-- With DB_SYNC=true in development, Sequelize can also align tables from models.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_transaction_email BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_price_alert_email BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN users.notify_transaction_email IS 'When true, API sends an email after each BUY/SELL for this user.';
COMMENT ON COLUMN users.notify_price_alert_email IS 'When true, API may send price-variation alert emails for portfolio holdings.';

CREATE TABLE IF NOT EXISTS price_alert_email_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  alert_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT price_alert_email_logs_user_asset_day UNIQUE (user_id, asset_id, alert_date)
);

CREATE INDEX IF NOT EXISTS price_alert_email_logs_user_id_idx ON price_alert_email_logs (user_id);
CREATE INDEX IF NOT EXISTS price_alert_email_logs_asset_id_idx ON price_alert_email_logs (asset_id);
