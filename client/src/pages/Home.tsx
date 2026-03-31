import { SiteLayout, shellMainClass } from "@/components/SiteLayout";
import { PRICING_PLANS } from "@/data/pricing";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { isSupabaseConfigured } from "@/const";
import { ArrowRight, Check, Sparkles, TrendingUp } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const supabaseReady = isSupabaseConfigured();
  return (
    <SiteLayout>
      {import.meta.env.DEV && !supabaseReady && (
        <div
          className="border-b border-amber-500/40 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-100/90"
          role="status"
        >
          <span className="text-amber-400">[developer]</span> Supabase browser keys are missing -{" "}
          <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
          <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>; for server use{" "}
          <code className="rounded bg-black/30 px-1">SUPABASE_URL</code> +{" "}
          <code className="rounded bg-black/30 px-1">SUPABASE_SERVICE_ROLE_KEY</code>.
        </div>
      )}

      <main>
        {/* Hero — Adscora brand */}
        <section className={`${shellMainClass} relative pb-20 pt-14 sm:pb-28 sm:pt-20 lg:pt-24`}>
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[min(520px,70vw)] w-[min(900px,120%)] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.25) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 70%)",
            }}
          />
          <div className="relative grid items-center gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-20">
            <div className="min-w-0 text-center lg:text-left">
              <p className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90 lg:justify-start">
                AI · Ads · Growth
              </p>
              <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[3.35rem]">
                Take Your Ads Beyond Limits{" "}
                <span className="inline-block origin-center transition-transform duration-500 hover:scale-110" aria-hidden>
                  🚀
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl lg:mx-0">
                Adscora helps you analyze, optimize, and scale your advertising with AI-powered insights.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-500 sm:text-lg lg:mx-0">
                Turn Meta, Google, and other channel performance into clear summaries without drowning in technical jargon.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-xl bg-white px-8 text-base font-semibold text-black shadow-none transition-all hover:bg-white/95 hover:shadow-[0_0_32px_-6px_rgba(139,92,246,0.55)] sm:w-auto"
                >
                  <a href={isAuthenticated ? "/panel" : "/signup"}>
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-white/20 bg-white/[0.03] px-8 text-base text-white backdrop-blur-sm transition-all hover:border-violet-500/40 hover:bg-violet-500/10 sm:w-auto"
                >
                  <a href="/#nasil">See How It Works</a>
                </Button>
              </div>
            </div>

            <div className="relative min-w-0 lg:justify-self-end">
              <div
                className="absolute -inset-8 rounded-3xl opacity-60 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, transparent 50%, rgba(56, 189, 248, 0.12) 100%)",
                }}
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-sm sm:p-8">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  Sample insight
                </div>
                <p className="mt-6 text-sm text-zinc-500">Campaign health</p>
                <p className="mt-1 font-sans text-2xl font-semibold text-white">Strong — 2 quick wins</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 transition-colors hover:border-violet-500/25">
                    <p className="text-xs text-zinc-500">Click-through rate</p>
                    <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-violet-400">
                      <TrendingUp className="h-4 w-4" />
                      +12%
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4 transition-colors hover:border-sky-500/20">
                    <p className="text-xs text-zinc-500">Est. cost / click</p>
                    <p className="mt-1 text-lg font-semibold text-white">₺42</p>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
                  <p className="text-sm font-medium text-white">Suggested next step</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Pause the weakest creative and run a short test with a fresh variant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="nedir" className="scroll-mt-24 border-t border-white/[0.06] bg-black/30 py-16 sm:py-24">
          <div className={shellMainClass}>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-white sm:text-3xl">What is this?</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              An assistant that converts ad account performance into readable summaries. No need to manually decode
              clicks, cost, and conversion metrics one by one.
            </p>
          </div>
        </section>

        <section id="nasil" className="scroll-mt-24 py-16 sm:py-24">
          <div className={shellMainClass}>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-white sm:text-3xl">Who is it for?</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {[
                "SMBs selling online",
                "Teams that want outcomes without ad-manager overhead",
                "Operators who don't want to read long reports every day",
              ].map((line) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-xl border border-white/[0.08] bg-zinc-950/50 p-5 text-sm leading-relaxed text-zinc-400 transition-colors hover:border-violet-500/20 sm:text-base"
                >
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-white/[0.06] py-16 sm:py-24">
          <div className={shellMainClass}>
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <h2 className="font-sans text-2xl font-semibold tracking-tight text-white sm:text-3xl">Plans</h2>
                <p className="mt-3 text-base text-zinc-400 sm:text-lg">
                  Explore pricing for feature tiers, billing details, and upgrade options.
                </p>
              </div>
              <Button
                asChild
                className="h-11 shrink-0 rounded-xl bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
              >
                <a href="/fiyatlar">View pricing</a>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:gap-6">
              {PRICING_PLANS.map((plan) => (
                <a
                  key={plan.id}
                  href="/fiyatlar"
                  className={`group flex flex-col rounded-xl border p-6 transition-all hover:-translate-y-0.5 ${
                    plan.featured
                      ? "border-violet-500/35 bg-violet-500/[0.06] shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]"
                      : "border-white/[0.08] bg-zinc-950/50 hover:border-violet-500/30"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{plan.line}</span>
                  <span className="mt-2 font-sans text-lg font-semibold text-white">{plan.name}</span>
                  <span className="mt-3 font-sans text-2xl font-semibold tabular-nums text-white">
                    {plan.price}
                    <span className="text-sm font-normal text-zinc-500">{plan.period}</span>
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-400">
                    Details
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-black/40 py-16 sm:py-20">
          <div className={`${shellMainClass} text-center`}>
            <p className="font-sans text-xl font-semibold text-white sm:text-2xl">Ready to start?</p>
            <p className="mx-auto mt-3 max-w-lg text-zinc-400">
              Create your account in minutes and get your first AI summary.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 rounded-xl bg-white px-10 text-base font-semibold text-black hover:bg-white/90 hover:shadow-[0_0_32px_-6px_rgba(139,92,246,0.5)]"
            >
              <a href={isAuthenticated ? "/panel" : "/signup"}>
                {isAuthenticated ? "Open Workspace" : "Start Free"}
              </a>
            </Button>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
