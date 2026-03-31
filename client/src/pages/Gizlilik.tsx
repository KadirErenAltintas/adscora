import { SiteLayout, shellMainClass } from "@/components/SiteLayout";

export default function Gizlilik() {
  return (
    <SiteLayout>
      <main className={`${shellMainClass} pb-24 pt-12 sm:pt-16`}>
        <article className="mx-auto max-w-3xl">
          <p className="font-display text-sm font-semibold text-emerald-400/90">Legal</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Last updated: {new Date().getFullYear()}
          </p>

          <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <h2 className="font-display text-lg font-bold text-foreground">1. Overview</h2>
            <p>
              Adscora ("the service") helps you analyze ad performance. This page summarizes which data we process
              and how we protect it.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">2. Data We Collect</h2>
            <p>
              We may process basic account details (e.g., email, name), workspace and campaign-related data, usage
              logs, and support messages you send in the app.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">3. Purpose of Processing</h2>
            <p>
              Data is used to operate the service, maintain security, run analytics and AI features, and comply with
              legal obligations.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">4. Storage and Security</h2>
            <p>
              Data is protected with industry-standard safeguards against unauthorized access. It is deleted or
              anonymized when no longer needed or when legal retention periods expire.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">5. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, delete, or object to processing.
              You can submit requests through in-app support.
            </p>

            <h2 className="font-display mt-8 text-lg font-bold text-foreground">6. Contact</h2>
            <p>
              For questions, contact us from the settings area after signing in. This page may be updated over time;
              we may show in-app notices for major changes.
            </p>
          </section>
        </article>
      </main>
    </SiteLayout>
  );
}
