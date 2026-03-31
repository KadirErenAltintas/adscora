import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@shared/normalizeSupabaseProjectUrl";
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "./supabasePublicEnv";

const envUrl = normalizeSupabaseProjectUrl(getPublicSupabaseUrl());
const envKey = getPublicSupabaseAnonKey();

export const supabaseConfigured = Boolean(envUrl && envKey);

/**
 * Supabase JS, boş URL/anahtar ile createClient çağrılınca modül yüklenirken throw ediyor → beyaz ekran.
 * Env eksikken yer tutucu kullanırız; gerçek istekler yine çalışmaz, ama site açılır ve uyarılar görünür.
 */
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabase = createClient(
  supabaseConfigured ? envUrl : FALLBACK_URL,
  supabaseConfigured ? envKey : FALLBACK_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
