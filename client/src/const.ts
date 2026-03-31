import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "@/lib/supabasePublicEnv";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Primary sign-in route for auth redirects. */
export const getLoginUrl = (): string => "/login";

/** Tarayıcıda Supabase: NEXT_PUBLIC_* veya VITE_* dolu mu? */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(getPublicSupabaseUrl() && getPublicSupabaseAnonKey());
};
