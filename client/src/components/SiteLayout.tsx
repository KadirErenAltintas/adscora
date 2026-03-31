import { AdscoraLockup, AdscoraMark } from "@/components/AdscoraLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import type { ReactNode } from "react";

const shellMainClass =
  "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12 xl:px-16";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen bg-black font-sans text-foreground antialiased selection:bg-violet-500/30 selection:text-white">
      {/* Premium ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% -30%, rgba(139, 92, 246, 0.18), transparent 55%),
            radial-gradient(ellipse 70% 50% at 100% 10%, rgba(56, 189, 248, 0.1), transparent 50%),
            radial-gradient(ellipse 50% 40% at 0% 80%, rgba(99, 102, 241, 0.08), transparent 45%),
            #000000
          `,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }}
      />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/75 backdrop-blur-xl">
        <div className={`${shellMainClass} flex h-16 items-center justify-between gap-4`}>
          <a href="/" className="group min-w-0 shrink transition-opacity hover:opacity-90">
            <AdscoraLockup className="transition-transform duration-300 group-hover:scale-[1.02]" />
          </a>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <a
              href="/#nedir"
              className="hidden px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
            >
              What is it?
            </a>
            <a
              href="/#nasil"
              className="hidden px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
            >
              How it works
            </a>
            <a
              href="/fiyatlar"
              className="hidden px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
            >
              Pricing
            </a>
            <a
              href="/gizlilik"
              className="hidden px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline"
            >
              Privacy
            </a>
            {isAuthenticated ? (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-white/15 bg-white/[0.03] text-sm transition-colors hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                <a href="/panel">Workspace</a>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="h-9 rounded-lg text-sm text-muted-foreground hover:text-foreground">
                  <a href="/login">Sign in</a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-lg bg-white px-4 text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.5)]"
                >
                  <a href="/signup">Sign up</a>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {children}

      <footer className="mt-auto border-t border-white/[0.06] bg-black/40">
        <div className={`${shellMainClass} flex flex-col justify-between gap-8 py-12 sm:flex-row`}>
          <div>
            <div className="flex items-center gap-2">
              <AdscoraMark className="h-8 w-8 shrink-0" />
              <span className="font-sans text-lg font-semibold text-foreground">Adscora</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Analyze, optimize, and scale your advertising with AI-powered insights.
            </p>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/#nedir" className="transition-colors hover:text-foreground">
                    What is it?
                  </a>
                </li>
                <li>
                  <a href="/fiyatlar" className="transition-colors hover:text-foreground">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/login" className="transition-colors hover:text-foreground">
                    Sign in
                  </a>
                </li>
                <li>
                  <a href="/signup" className="transition-colors hover:text-foreground">
                    Sign up
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/gizlilik" className="transition-colors hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/kosullar" className="transition-colors hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className={`${shellMainClass} border-t border-white/[0.06] py-6 text-xs text-muted-foreground`}>
          © {new Date().getFullYear()} Adscora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export { shellMainClass };
