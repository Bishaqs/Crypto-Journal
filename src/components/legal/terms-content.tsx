export function TermsContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-muted">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          1. Beta Program
        </h2>
        <p>
          Stargate is currently in <strong className="text-foreground">beta testing</strong>.
          The service is provided as-is for evaluation purposes. Features may
          change, break, or be removed without notice. While we take
          reasonable measures to protect your data, we cannot guarantee
          uninterrupted service or data preservation during the beta period.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          2. Not Financial Advice
        </h2>
        <p>
          Stargate is a trade journaling and analytics tool.{" "}
          <strong className="text-foreground">
            Nothing in this application constitutes financial, investment,
            tax, or trading advice.
          </strong>{" "}
          All analytics, AI-generated insights, performance metrics, and
          suggestions are for informational and educational purposes only.
          You are solely responsible for your trading decisions. Always
          consult a qualified financial advisor before making investment
          decisions.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          3. Exchange API Keys
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You are responsible for creating API keys with{" "}
            <strong className="text-foreground">read-only permissions</strong>.
            Do not grant trade or withdrawal permissions to API keys used
            with Stargate.
          </li>
          <li>
            API keys are encrypted at rest using AES-256-CBC encryption.
            However, you assume the risk of providing your API credentials to
            any third-party service.
          </li>
          <li>
            You may revoke your API keys at any time through your exchange
            account. We recommend revoking keys if you stop using Stargate.
          </li>
          <li>
            Stargate will never execute trades, place orders, or initiate
            withdrawals on your behalf.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          4. Your Data
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You retain ownership of all trade data, journal entries, and
            notes you create in Stargate.
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
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          5. AI Features
        </h2>
        <p>
          The AI Coach and insight features send your trade data to
          third-party AI providers (Anthropic, OpenAI, Google) for
          processing. These providers do not retain your data beyond the
          request. AI-generated content may contain errors or inaccuracies
          and should not be relied upon for trading decisions.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          6. Acceptable Use
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
            Accounts that violate these terms may be suspended or terminated.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          7. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by law, Stargate and its operators
          shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of the service,
          including but not limited to: trading losses, data loss, or
          unauthorized access to your exchange accounts. Use of this service
          is at your own risk.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          8. Changes to These Terms
        </h2>
        <p>
          We may update these terms as the product evolves. Continued use of
          Stargate after changes constitutes acceptance of the updated terms.
          Material changes will be communicated via email or in-app
          notification.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          9. Contact
        </h2>
        <p>
          For questions about these terms, contact{" "}
          <a
            href="mailto:support@stargate.trade"
            className="text-accent hover:underline"
          >
            support@stargate.trade
          </a>
          .
        </p>
      </section>
    </div>
  );
}
