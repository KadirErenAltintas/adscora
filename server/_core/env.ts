import { normalizeSupabaseProjectUrl } from "../../shared/normalizeSupabaseProjectUrl";

export const ENV = {
  /**
   * Proje URL’i — JWKS ile ECC imzalı token doğrulama için.
   * Öncelik: SUPABASE_URL → NEXT_PUBLIC_SUPABASE_URL → VITE_SUPABASE_URL
   */
  supabaseUrl: normalizeSupabaseProjectUrl(
    process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      ""
  ),
  /** Sunucu DB (PostgREST). Dashboard → Settings → API → service_role. VITE_ ile expose etmeyin. */
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  /** Eski projeler: Legacy HS256 JWT Secret. ECC anahtar rotasyonunda artık zorunlu değil. */
  supabaseJwtSecret: (process.env.SUPABASE_JWT_SECRET ?? "").trim(),
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  /** OpenAI uyumlu API kökü; boşsa Forge varsayılanı (llm.ts). Örn: https://api.openai.com */
  forgeApiUrl:
    process.env.OPENAI_BASE_URL?.trim() ||
    process.env.BUILT_IN_FORGE_API_URL ||
    "",
  /** Sohbet/analiz LLM; OPENAI_API_KEY öncelikli, yoksa BUILT_IN_FORGE_API_KEY */
  forgeApiKey:
    (process.env.OPENAI_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "").trim(),
  /** OpenAI Chat Completions için model (yalnızca api.openai.com kullanılırken). */
  openaiChatModel: (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim(),

  googleAdsDeveloperToken: (process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "").trim(),
  googleAdsClientId: (process.env.GOOGLE_ADS_CLIENT_ID ?? "").trim(),
  googleAdsClientSecret: (process.env.GOOGLE_ADS_CLIENT_SECRET ?? "").trim(),
  googleAdsLoginCustomerId: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? "").trim(),
  googleAdsDefaultCustomerId: (process.env.GOOGLE_ADS_CUSTOMER_ID ?? "").trim(),
  googleAdsDefaultRefreshToken: (process.env.GOOGLE_ADS_REFRESH_TOKEN ?? "").trim(),

  metaAppId: (process.env.META_APP_ID ?? "").trim(),
  metaAppSecret: (process.env.META_APP_SECRET ?? "").trim(),
  metaAccessToken: (process.env.META_ACCESS_TOKEN ?? "").trim(),
  metaAdAccountId: (process.env.META_AD_ACCOUNT_ID ?? "").trim(),

  tikTokAppId: (process.env.TIKTOK_APP_ID ?? "").trim(),
  tikTokAppSecret: (process.env.TIKTOK_APP_SECRET ?? "").trim(),
  tikTokAccessToken: (process.env.TIKTOK_ACCESS_TOKEN ?? "").trim(),
  tikTokAdvertiserId: (process.env.TIKTOK_ADVERTISER_ID ?? "").trim(),

  /** Tarayıcı yönlendirmeleri için kök URL (OAuth callback). Örn: https://app.example.com veya http://localhost:3000 */
  publicAppUrl: (
    process.env.ADSCORE_PUBLIC_URL ??
    process.env.ADSCORA_PUBLIC_URL ??
    process.env.ADASTRA_PUBLIC_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, ""),
  /** OAuth state JWT imzası; boşsa SUPABASE_JWT_SECRET kullanılır. */
  oauthStateSecret: (
    process.env.ADSCORE_OAUTH_STATE_SECRET ??
    process.env.ADSCORA_OAUTH_STATE_SECRET ??
    process.env.ADASTRA_OAUTH_STATE_SECRET ??
    process.env.SUPABASE_JWT_SECRET ??
    ""
  ).trim(),
  googleOAuthRedirectUri: (process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "").trim(),
  metaOAuthRedirectUri: (process.env.META_OAUTH_REDIRECT_URI ?? "").trim(),
};
