import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/data/pricing";
import { Check } from "lucide-react";

type Props = {
  loginHref: string;
  className?: string;
};

export function PricingGrid({ loginHref, className = "" }: Props) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {PRICING_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`flex flex-col rounded-xl border p-6 sm:p-8 ${
            plan.featured
              ? "border-emerald-500/50 bg-emerald-500/[0.06] ring-1 ring-emerald-500/20"
              : "border-border bg-card"
          }`}
        >
          {plan.featured && (
            <span className="mb-3 inline-flex w-fit rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              Most popular
            </span>
          )}
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{plan.line}</p>
          <h3 className="font-display mt-1 text-xl font-bold">{plan.name}</h3>
          <p className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums">{plan.price}</span>
            <span className="text-sm text-muted-foreground">{plan.period}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
            {plan.items.map((t) => (
              <li key={t} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant={plan.featured ? "default" : "outline"}
            className={`mt-8 h-11 w-full rounded-lg text-sm font-medium ${
              plan.featured ? "" : "border-border bg-transparent"
            }`}
          >
            <a href={loginHref}>{plan.featured ? "Start with this plan" : "Choose plan"}</a>
          </Button>
        </div>
      ))}
    </div>
  );
}
