/** Next.js alışkanlığı: NEXT_PUBLIC_* önce; yoksa Vite varsayılanı VITE_*. */
export function getPublicSupabaseUrl(): string {
  return (
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    import.meta.env.VITE_SUPABASE_URL?.trim() ||
    ""
  );
}

export function getPublicSupabaseAnonKey(): string {
  return (
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    ""
  );
}
