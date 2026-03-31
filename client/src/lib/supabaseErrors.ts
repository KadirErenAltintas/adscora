import type { AuthError } from "@supabase/supabase-js";

export function formatSupabaseAuthError(err: AuthError | Error): string {
  if ("status" in err && typeof (err as AuthError).message === "string") {
    const a = err as AuthError;
    const code = a.status;
    if (code === 400 && a.message.includes("Email not confirmed")) {
      return "Please click the verification link in your email first.";
    }
    if (code === 400 && a.message.toLowerCase().includes("user already registered")) {
      return "An account already exists with this email. Try signing in.";
    }
    if (code === 400 || code === 401) {
      if (
        a.message.toLowerCase().includes("invalid login credentials") ||
        a.message.toLowerCase().includes("invalid_grant")
      ) {
        return "Incorrect email or password.";
      }
    }
    if (a.message) return a.message;
  }
  return err.message || "Something went wrong.";
}
