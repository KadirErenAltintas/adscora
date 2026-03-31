import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

type Options = {
  /** Oturum yokken gidilecek rota */
  redirectTo?: string;
};

/**
 * Korumalı sayfalar: önce auth.me’nin yüklenmesini bekler (giriş sonrası yarışı önler).
 * Oturum yoksa redirectTo’ya yönlendirir.
 */
export function useRequireAuth(options?: Options) {
  const redirectTo = options?.redirectTo ?? "/";
  const auth = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.isAuthenticated) {
      setLocation(redirectTo);
    }
  }, [auth.loading, auth.isAuthenticated, redirectTo, setLocation]);

  return auth;
}
