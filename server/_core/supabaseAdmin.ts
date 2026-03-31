import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let admin: SupabaseClient | null = null;

const SUPABASE_FETCH_TIMEOUT_MS = 45_000;

/** Yavaş ağ / VPN / güvenlik duvarı için daha uzun süre (varsayılan ~10s zaman aşımını aşar). */
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), SUPABASE_FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
};

/** Sunucu tarafı DB: PostgREST. service_role RLS’yi atlar; istemciye asla vermeyin. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = ENV.supabaseUrl;
  const key = ENV.supabaseServiceRoleKey;
  if (!url || !key) return null;
  if (!admin) {
    admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: fetchWithTimeout },
    });
  }
  return admin;
}

export function resetSupabaseAdmin(): void {
  admin = null;
}
