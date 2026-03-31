import { PricingGrid } from "@/components/PricingGrid";
import { SiteLayout, shellMainClass } from "@/components/SiteLayout";
import { getLoginUrl } from "@/const";

export default function Fiyatlar() {
  const loginHref = getLoginUrl();

  return (
    <SiteLayout>
      <main className={`${shellMainClass} pb-24 pt-12 sm:pt-16`}>
        <p className="font-sans text-sm font-semibold text-violet-400/90">Pricing</p>
        <h1 className="font-display mt-2 max-w-3xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          A plan that fits your needs
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          All plans share the same core product; differences are usage limits and advanced capabilities. Upgrade any
          time and start with the free tier without a credit card.
        </p>
        <div className="mt-14">
          <PricingGrid loginHref={loginHref} />
        </div>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          For enterprise quota or invoicing, submit a request from settings after signing in.
        </p>
      </main>
    </SiteLayout>
  );
}
