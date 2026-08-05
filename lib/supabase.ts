import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnon)
  : null as never;

// Server-side client with service role (for API routes)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL  || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Supabase SQL schema (run once in Supabase SQL editor) ──────────────────
export const SCHEMA_SQL = `
-- Bills table
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

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id     UUID REFERENCES bills(id) ON DELETE CASCADE,
  sr          INTEGER,
  name        TEXT NOT NULL,
  qty         INTEGER DEFAULT 0,
  mrp         NUMERIC(10,2) DEFAULT 0,
  rate        NUMERIC(10,2) DEFAULT 0,
  disc        NUMERIC(5,2) DEFAULT 0,
  amount      NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_products_name    ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_bill_id ON products(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_date       ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_no         ON bills(bill_no);
`;
