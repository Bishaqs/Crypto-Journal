export function TermsContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-muted">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          1. Beta Program
        </h2>
        <p>
          Traverse is currently in{" "}
          <strong className="text-foreground">beta testing</strong>. The service
          is provided &quot;as-is&quot; for evaluation purposes. Features may
          change, break, or be removed without notice. While we take reasonable
          measures to protect your data, we cannot guarantee uninterrupted
          service or data preservation during the beta period. By using the beta
          version, you acknowledge and accept these limitations.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          2. Not Financial Advice
        </h2>
        <p className="mb-3">
          Traverse is a trade journaling and analytics tool.{" "}
          <strong className="text-foreground">
            Nothing in this application constitutes financial, investment, tax,
            or trading advice.
          </strong>{" "}
          All analytics, AI-generated insights, performance metrics, and
          suggestions are for{" "}
          <strong className="text-foreground">
            informational and educational purposes only
          </strong>
          . You are solely responsible for your trading decisions.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Always consult a qualified financial advisor before making
            investment decisions.
          </li>
          <li>
            Traverse is{" "}
            <strong className="text-foreground">
              not registered with BaFin, the SEC, or any financial regulatory
              authority
            </strong>
            . It is not a licensed financial service provider (
            <em>Finanzdienstleistungsinstitut</em>).
          </li>
          <li>
            Past performance data displayed in the app does not guarantee future
            results.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          3. Minimum Age
        </h2>
        <p>
          You must be at least{" "}
          <strong className="text-foreground">18 years old</strong> to use
          Traverse. By creating an account, you confirm that you are 18 years
          of age or older and have the legal capacity to enter into a binding
          agreement (<em>Geschaeftsfaehigkeit</em> pursuant to &sect;&sect; 104
          ff. BGB).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          4. Exchange API Keys
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You are responsible for creating API keys with{" "}
            <strong className="text-foreground">read-only permissions</strong>.
            Do not grant trade or withdrawal permissions to API keys used with
            Traverse.
          </li>
          <li>
            API keys are encrypted at rest using AES-256-CBC encryption.
            However, you assume the risk of providing your API credentials to
            any third-party service.
          </li>
          <li>
            You may revoke your API keys at any time through your exchange
            account. We recommend revoking keys if you stop using Traverse.
          </li>
          <li>
            Traverse will never execute trades, place orders, or initiate
            withdrawals on your behalf.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          5. Your Data
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You retain ownership of all trade data, journal entries, and notes
            you create in Traverse.
          </li>
          <li>
            You can export your data at any time via the Export feature in
            Settings.
          </li>
          <li>
            We may use anonymized, aggregated data for product improvement.
            Your individual data will never be sold or shared with third
            parties for marketing purposes.
          </li>
          <li>
            For details on how we process your personal data, please refer to
            our Privacy Policy.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          6. AI Features
        </h2>
        <p className="mb-3">
          The AI Coach and insight features send your trade data to third-party
          AI providers (Anthropic, OpenAI, Google) for processing. These
          providers do not retain your data beyond the request.
          AI-generated content may contain errors or inaccuracies and should
          not be relied upon for trading decisions.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            The AI Coach is a{" "}
            <strong className="text-foreground">
              behavioral coaching tool
            </strong>
            , not a financial advisor. It does not recommend buying, selling,
            or holding any financial instrument.
          </li>
          <li>
            AI outputs do not constitute personal recommendations within the
            meaning of MiFID II or the German Securities Trading Act (
            <em>Wertpapierhandelsgesetz &mdash; WpHG</em>).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          7. Tax Reports Disclaimer
        </h2>
        <p className="mb-3">
          Traverse may generate tax-related data exports. These are{" "}
          <strong className="text-foreground">
            automated data preparation tools, not tax advice
          </strong>
          .
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">German users:</strong>{" "}
            Steuerliche Datenaufbereitung &mdash; keine Steuerberatung im Sinne
            des Steuerberatungsgesetzes (StBerG). Fuer individuelle steuerliche
            Fragen wenden Sie sich bitte an einen Steuerberater oder
            Lohnsteuerhilfeverein.
          </li>
          <li>
            <strong className="text-foreground">US users:</strong> Form 8949
            CSV exports are generated for convenience. Always verify with a
            qualified CPA or tax professional before filing.
          </li>
          <li>
            Traverse makes no representations regarding the accuracy or
            completeness of any tax data export. You are solely responsible for
            your tax obligations.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          8. Acceptable Use
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Do not attempt to access other users&apos; data.</li>
          <li>
            Do not abuse API rate limits or attempt to overload the service.
          </li>
          <li>
            Do not use the service for any illegal activity, including money
            laundering or market manipulation.
          </li>
          <li>
            Accounts that violate these terms may be suspended or terminated
            without prior notice.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          9. Restricted Jurisdictions
        </h2>
        <p className="mb-3">
          This service may not be used by persons located in, or residents of,
          countries subject to comprehensive sanctions by the European Union or
          the United States, including but not limited to:{" "}
          <strong className="text-foreground">
            Cuba, Iran, North Korea, Syria, Russia, and Belarus
          </strong>
          .
        </p>
        <p>
          Users are solely responsible for compliance with their local laws
          regarding cryptocurrency and financial instrument trading. Traverse
          makes no representation that the service is appropriate or available
          for use in any particular jurisdiction.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          10. Limitation of Liability
        </h2>
        <p className="mb-3">
          Traverse&apos;s liability for damages is limited as follows, in
          accordance with German civil law (
          <em>Buergerliches Gesetzbuch &mdash; BGB</em>):
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">
              Intent and gross negligence (
              <em>Vorsatz und grobe Fahrlaessigkeit</em>):
            </strong>{" "}
            Unlimited liability.
          </li>
          <li>
            <strong className="text-foreground">
              Slight negligence (<em>leichte Fahrlaessigkeit</em>):
            </strong>{" "}
            Liability only for breach of material contractual obligations (
            <em>Kardinalpflichten</em> &mdash; obligations whose fulfilment is
            essential for the proper performance of the contract and on which
            the user may regularly rely), limited to foreseeable,
            contract-typical damages.
          </li>
          <li>
            No liability for indirect, incidental, or consequential damages,
            including trading losses, except where mandatory law provides
            otherwise.
          </li>
          <li>
            This limitation does{" "}
            <strong className="text-foreground">not</strong> apply to liability
            for injury to life, body, or health (
            <em>Leben, Koerper, Gesundheit</em>), or under the Product
            Liability Act (<em>Produkthaftungsgesetz</em>).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          11. Right of Withdrawal (<em>Widerrufsbelehrung</em>)
        </h2>
        <p className="mb-3">
          As a consumer within the European Union, you have a{" "}
          <strong className="text-foreground">
            14-day right of withdrawal
          </strong>{" "}
          for paid subscriptions, pursuant to &sect; 355 BGB and the Consumer
          Rights Directive (2011/83/EU).
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            The withdrawal period begins on the day of contract conclusion
            (the date of subscription purchase).
          </li>
          <li>
            To exercise your right of withdrawal, send a clear, unambiguous
            declaration (e.g., by email) to{" "}
            <a
              href="mailto:support@traversejournal.com"
              className="text-accent hover:underline"
            >
              support@traversejournal.com
            </a>
            . You may use the model withdrawal form below, but it is not
            mandatory.
          </li>
          <li>
            If you have expressly requested that the service begin during the
            withdrawal period, you shall pay a reasonable amount proportional
            to the services already provided up to the point at which you
            notify us of your withdrawal.
          </li>
        </ul>

        <div className="mt-4 p-4 border border-border rounded-lg bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Model Withdrawal Form
          </h3>
          <p className="text-xs leading-relaxed">
            To: Benjamin Schwab, support@traversejournal.com
            <br />
            <br />
            I hereby give notice that I withdraw from my contract for the
            provision of the following service:
            <br />
            &mdash; Traverse [Pro/Max] subscription
            <br />
            &mdash; Ordered on: [date]
            <br />
            <br />
            Name: _______________
            <br />
            Address: _______________
            <br />
            Date: _______________
            <br />
            Signature: _______________ (only required for paper submissions)
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          12. Dispute Resolution (&sect; 36 VSBG &amp; EU ODR)
        </h2>
        <p className="mb-3">
          In accordance with &sect; 36 of the German Consumer Dispute
          Resolution Act (
          <em>Verbraucherstreitbeilegungsgesetz &mdash; VSBG</em>), we declare:
          We are{" "}
          <strong className="text-foreground">
            neither obligated nor willing
          </strong>{" "}
          to participate in dispute resolution proceedings before a consumer
          arbitration board (<em>Verbraucherschlichtungsstelle</em>).
        </p>
        <p>
          The European Commission provides an Online Dispute Resolution (ODR)
          platform:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline break-all"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          <br />
          Our contact email:{" "}
          <a
            href="mailto:support@traversejournal.com"
            className="text-accent hover:underline"
          >
            support@traversejournal.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          13. Governing Law
        </h2>
        <p>
          These terms are governed by the laws of the{" "}
          <strong className="text-foreground">
            Federal Republic of Germany
          </strong>
          , excluding the UN Convention on Contracts for the International Sale
          of Goods (CISG). For consumers habitually resident in the European
          Union, mandatory consumer protection provisions of your country of
          residence shall apply in addition, insofar as they provide more
          favorable protection.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          14. Changes to These Terms
        </h2>
        <p>
          We may update these terms as the product evolves. Continued use of
          Traverse after changes constitutes acceptance of the updated terms.
          Material changes will be communicated via email or in-app
          notification at least 30 days in advance. If you do not agree with
          the updated terms, you may terminate your account before the changes
          take effect.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          15. Contact
        </h2>
        <p>
          For questions about these terms, contact{" "}
          <a
            href="mailto:support@traversejournal.com"
            className="text-accent hover:underline"
          >
            support@traversejournal.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
