-- ============================================================
--  AMBIKA BEAUTY BILL MANAGER — Supabase Schema
--  Run this in Supabase SQL Editor (once)
-- ============================================================

-- 1. Bills table
CREATE TABLE IF NOT EXISTS bills (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_no               TEXT NOT NULL,
  bill_date             DATE NOT NULL,
  supplier_name         TEXT DEFAULT 'Unknown Supplier',
  total_qty             INTEGER DEFAULT 0,
  total_amount          NUMERIC(12,2) DEFAULT 0,
  image_url             TEXT,
  cloudinary_public_id  TEXT,
  folder_path           TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id     UUID REFERENCES bills(id) ON DELETE CASCADE,
  sr          INTEGER,
  name        TEXT NOT NULL,
  qty         INTEGER DEFAULT 0,
  mrp         NUMERIC(10,2) DEFAULT 0,
  rate        NUMERIC(10,2) DEFAULT 0,
  disc        NUMERIC(5,2)  DEFAULT 0,
  amount      NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_products_name    ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_bill_id ON products(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_date       ON bills(bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_no         ON bills(bill_no);

-- 4. Enable Row Level Security (RLS) — allow all for anon (your app uses service role)
ALTER TABLE bills    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON bills    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);

-- 5. Useful view: bill summary with product count
CREATE OR REPLACE VIEW bill_summary AS
SELECT
  b.*,
  COUNT(p.id)       AS product_count,
  SUM(p.amount)     AS computed_total
FROM bills b
LEFT JOIN products p ON p.bill_id = b.id
GROUP BY b.id;
