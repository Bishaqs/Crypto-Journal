import Link from "next/link";

export const metadata = {
  title: "Impressum — Stargate",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/login"
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          &larr; Back to login
        </Link>

        <h1 className="text-3xl font-bold mt-8 mb-2">Impressum</h1>
        <p className="text-sm text-muted mb-10">
          Legal Notice pursuant to DDG &sect; 5
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Operator
            </h2>
            <p>Benjamin Schwab</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Address
            </h2>
            {/* TODO: Replace with virtual business address (Ladungsfaehige Anschrift) once obtained */}
            <p>
              Address available upon request. Please contact{" "}
              <a
                href="mailto:support@stargate.trade"
                className="text-accent hover:underline"
              >
                support@stargate.trade
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Contact
            </h2>
            <ul className="space-y-2">
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                <a
                  href="mailto:support@stargate.trade"
                  className="text-accent hover:underline"
                >
                  support@stargate.trade
                </a>
              </li>
              <li>
                {/* TODO: Add phone number (required by EU Court of Justice ruling) */}
                <strong className="text-foreground">Phone:</strong>{" "}
                Available upon request via{" "}
                <a
                  href="mailto:support@stargate.trade"
                  className="text-accent hover:underline"
                >
                  support@stargate.trade
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              VAT ID (USt-IdNr.)
            </h2>
            {/* TODO: Update once Gewerbe is registered and VAT status is decided */}
            <p>
              Not applicable &mdash; Kleinunternehmer pursuant to &sect; 19 UStG
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Responsible for Content
            </h2>
            <p className="mb-1">
              Pursuant to DDG &sect; 18 Abs. 2:
            </p>
            <p>Benjamin Schwab</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              EU Online Dispute Resolution
            </h2>
            <p className="mb-3">
              The European Commission provides a platform for online dispute
              resolution:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>
              We are not obligated and not willing to participate in dispute
              resolution proceedings before a consumer arbitration board.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
