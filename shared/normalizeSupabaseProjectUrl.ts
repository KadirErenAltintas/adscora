/**
 * Beklenen: https://&lt;ref&gt;.supabase.co
 * Yanlışlıkla yapıştırılan JWKS veya /auth/v1 yollarını proje köküne indirir.
 */
export function normalizeSupabaseProjectUrl(raw: string): string {
  let s = raw.trim().replace(/\/+$/, "");
  if (!s) return "";
  const lower = s.toLowerCase();
  const authIdx = lower.indexOf("/auth/v1");
  if (authIdx !== -1) {
    s = s.slice(0, authIdx);
  }
  return s.replace(/\/+$/, "");
}
