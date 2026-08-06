import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Public client (browser-safe) ─────────────────────────────────────────────
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Keep named export for backward compat — lazy init
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()); },
};

// ── Server client (service role) ─────────────────────────────────────────────
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
