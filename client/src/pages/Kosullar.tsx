import { SiteLayout, shellMainClass } from "@/components/SiteLayout";

export default function Kosullar() {
  return (
    <SiteLayout>
      <main className={`${shellMainClass} pb-24 pt-12 sm:pt-16`}>
        <article className="mx-auto max-w-3xl">
          <p className="font-display text-sm font-semibold text-emerald-400/90">Legal</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Last updated: {new Date().getFullYear()}
          </p>

          <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <h2 className="font-display text-lg font-bold text-foreground">1. Acceptance of Service</h2>
            <p>
              By using Adscora, you confirm that you have read and accepted these terms. You may not use the service
              in ways that violate laws or the rights of others.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">2. Account</h2>
            <p>
              You are responsible for keeping your sign-in credentials secure. If you notice suspicious activity, you
              must notify us promptly.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">3. AI Outputs</h2>
            <p>
              Analysis and recommendations are predictive guidance. You should not make financial or ad decisions based
              solely on AI output. Final decisions remain your responsibility.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">4. Billing</h2>
            <p>
              Paid plans are subject to the pricing and terms shown at checkout. Price or feature changes may be
              announced in advance.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">5. Service Changes</h2>
            <p>
              We may temporarily or permanently modify or discontinue the service due to maintenance, updates, or legal
              requirements.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">6. Limitation of Liability</h2>
            <p>
              The service is provided "as is". Our liability for direct or indirect damages, data loss, or third-party
              platform outages is limited to the maximum extent permitted by law.
            </p>
          </section>
        </article>
      </main>
    </SiteLayout>
  );
}
