CREATE TABLE IF NOT EXISTS commerce_transactions (
  transaction_id VARCHAR(100) PRIMARY KEY,
  order_id VARCHAR(120) NOT NULL,
  customer_id VARCHAR(100) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(254) NOT NULL DEFAULT '',
  product_id BIGINT,
  product_name VARCHAR(200) NOT NULL,
  category VARCHAR(80) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price > 0),
  total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0 AND total_amount = quantity * unit_price),
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('card','bank_transfer','mobile_money','cash')),
  country VARCHAR(100) NOT NULL,
  status VARCHAR(12) NOT NULL CHECK (status IN ('Completed','Pending','Failed')),
  created_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_hash CHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS commerce_transactions_created_idx ON commerce_transactions (created_at DESC, transaction_id);
CREATE INDEX IF NOT EXISTS commerce_transactions_status_created_idx ON commerce_transactions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS commerce_transactions_category_created_idx ON commerce_transactions (category, created_at DESC);
CREATE TABLE IF NOT EXISTS commerce_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS commerce_sessions_expiry_idx ON commerce_sessions (expires_at);
CREATE TABLE IF NOT EXISTS commerce_dead_letters (
  id BIGSERIAL PRIMARY KEY,
  topic VARCHAR(249) NOT NULL,
  partition_id INTEGER NOT NULL,
  message_offset VARCHAR(30) NOT NULL,
  payload TEXT NOT NULL,
  reason VARCHAR(300) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic, partition_id, message_offset)
);
CREATE INDEX IF NOT EXISTS commerce_dead_letters_created_idx ON commerce_dead_letters (created_at);
