import { SiteLayout, shellMainClass } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatSupabaseAuthError } from "@/lib/supabaseErrors";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function Giris() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading, refresh: refreshMe } = useAuth();
  const utils = trpc.useUtils();
  const [submitting, setSubmitting] = useState(false);
  const ready = isSupabaseConfigured();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) setLocation("/panel");
  }, [authLoading, isAuthenticated, setLocation]);

  const onSubmit = form.handleSubmit(async values => {
    if (!ready) {
      toast.error("Supabase configuration is missing (.env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or VITE_* equivalents).");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });
      if (error) {
        toast.error(formatSupabaseAuthError(error));
        return;
      }
      const me = await refreshMe();
      if (!me?.data) {
        const health = await utils.auth.dbHealth.fetch();
        if (!health.ok) {
          const tech =
            import.meta.env.DEV && "detail" in health && health.detail
              ? `\n\nTechnical details: ${health.detail}`
              : "";
          toast.error(health.message + tech, { duration: 18_000 });
        } else {
          toast.error(
            "REST appears healthy, but the session could not be completed: check JWT or `users` write access. Verify terminal logs [Auth]/[Database], `SUPABASE_SERVICE_ROLE_KEY`, URL, and schema migration `supabase/migrations/0000_init_schema.sql`.",
            { duration: 20_000 }
          );
        }
        return;
      }
      toast.success("Signed in successfully");
      setLocation("/panel");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SiteLayout>
      <main className={`${shellMainClass} pb-24 pt-12 sm:pt-20`}>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="font-display mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Sign in with your email and password. Your account is securely managed by Supabase Auth.
          </p>
          {!ready && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-100/90">
              Supabase keys are not configured for local development. Add these keys to{" "}
              <code className="rounded bg-black/25 px-1">.env</code>:{" "}
              <code className="rounded bg-black/25 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
              <code className="rounded bg-black/25 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (veya{" "}
              <code className="rounded bg-black/25 px-1">VITE_</code> alternatives if you use Vite prefixes).
            </p>
          )}
          <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="giris-email">Email</Label>
              <Input
                id="giris-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={submitting}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="giris-sifre">Password</Label>
              <Input
                id="giris-sifre"
                type="password"
                autoComplete="current-password"
                disabled={submitting}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-lg text-base font-semibold text-primary-foreground"
              disabled={submitting || !ready}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="font-medium text-emerald-400 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </main>
    </SiteLayout>
  );
}
