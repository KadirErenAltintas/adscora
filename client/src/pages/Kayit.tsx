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
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { z } from "zod";

const schema = z
  .object({
    fullName: z.string().optional(),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine(d => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function Kayit() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading, refresh: refreshMe } = useAuth();
  const utils = trpc.useUtils();
  const [submitting, setSubmitting] = useState(false);
  const ready = isSupabaseConfigured();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) setLocation("/panel");
  }, [authLoading, isAuthenticated, setLocation]);

  const onSubmit = form.handleSubmit(async values => {
    if (!ready) {
      toast.error("Supabase configuration is missing (.env: NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_*).");
      return;
    }
    setSubmitting(true);
    try {
      const name = values.fullName?.trim();
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: name
          ? {
              data: { full_name: name },
            }
          : undefined,
      });
      if (error) {
        toast.error(formatSupabaseAuthError(error));
        return;
      }
      if (data.session) {
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
              "Account created but session initialization failed (JWT or `users`). Verify `SUPABASE_SERVICE_ROLE_KEY`, URL, and whether `supabase/migrations/0000_init_schema.sql` was applied.",
              { duration: 20_000 }
            );
          }
          return;
        }
        toast.success("Account created");
        setLocation("/panel");
      } else {
        toast.success("Verification email sent. Check your inbox, then sign in.");
        setLocation("/login");
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SiteLayout>
      <main className={`${shellMainClass} pb-24 pt-12 sm:pt-20`}>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="font-display mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Create account</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Create your account with email to get started for free. Passwords are securely handled by Supabase.
          </p>
          {!ready && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-100/90">
              Supabase keys are not configured locally. Add the following to{" "}
              <code className="rounded bg-black/25 px-1">.env</code>:{" "}
              <code className="rounded bg-black/25 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
              <code className="rounded bg-black/25 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ekleyin.
            </p>
          )}
          <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="kayit-ad">Full name (optional)</Label>
              <Input
                id="kayit-ad"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                disabled={submitting}
                {...form.register("fullName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kayit-email">Email</Label>
              <Input
                id="kayit-email"
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
              <Label htmlFor="kayit-sifre">Password</Label>
              <Input
                id="kayit-sifre"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kayit-sifre2">Confirm password</Label>
              <Input
                id="kayit-sifre2"
                type="password"
                autoComplete="new-password"
                disabled={submitting}
                {...form.register("confirm")}
              />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-lg text-base font-semibold text-primary-foreground"
              disabled={submitting || !ready}
            >
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-emerald-400 hover:underline">
              Sign in
            </a>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to the{" "}
            <a href="/kosullar" className="text-emerald-400/90 underline-offset-2 hover:underline">
              Terms of Service
            </a>{" "}
            ve{" "}
            <a href="/gizlilik" className="text-emerald-400/90 underline-offset-2 hover:underline">
              Privacy Policy
            </a>{" "}
            .
          </p>
        </div>
      </main>
    </SiteLayout>
  );
}
