export function PrivacyContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-muted">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          1. What We Collect
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Account information:</strong>{" "}
            Email address and authentication credentials (managed by Supabase
            Auth). If you sign in with Google, we receive your email and
            profile name.
          </li>
          <li>
            <strong className="text-foreground">Trade data:</strong> Trade
            entries you log manually or import from CSV files, including
            prices, quantities, timestamps, and notes.
          </li>
          <li>
            <strong className="text-foreground">Exchange API keys:</strong>{" "}
            If you connect a cryptocurrency exchange, we store your API key
            and secret. These are encrypted at rest using AES-256-CBC with
            unique initialization vectors per credential. We only request
            read-only access and never execute trades on your behalf.
          </li>
          <li>
            <strong className="text-foreground">Journal entries:</strong>{" "}
            Notes, tags, and annotations you create within the journaling
            feature.
          </li>
          <li>
            <strong className="text-foreground">Usage data:</strong> We do
            not use third-party analytics trackers. Basic server logs
            (timestamps, request paths) are retained for debugging.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          2. How We Use Your Data
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide the trading journal and analytics features.</li>
          <li>
            To sync trade history from connected exchanges (read-only API
            calls).
          </li>
          <li>
            To power AI-assisted insights when you use the AI Coach feature.
            Your trade data is sent to AI providers (Anthropic, OpenAI, or
            Google) for processing. No data is retained by these providers
            beyond the request.
          </li>
          <li>To send transactional emails (password reset, account verification).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          3. How We Protect Your Data
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            All data is transmitted over HTTPS (TLS 1.3).
          </li>
          <li>
            Exchange API credentials are encrypted using AES-256-CBC with
            per-field random initialization vectors before storage. The
            encryption key is stored server-side only and never exposed to
            the client.
          </li>
          <li>
            Row Level Security (RLS) is enforced at the database level,
            ensuring each user can only access their own data.
          </li>
          <li>
            All API routes require authentication. Admin operations require
            additional owner verification.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          4. Third-Party Services
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Supabase:</strong> Database
            and authentication (hosted in AWS).
          </li>
          <li>
            <strong className="text-foreground">Vercel:</strong> Application
            hosting and deployment.
          </li>
          <li>
            <strong className="text-foreground">CoinGecko / CryptoCompare:</strong>{" "}
            Market data APIs for price information. No user data is sent to
            these services.
          </li>
          <li>
            <strong className="text-foreground">AI Providers:</strong>{" "}
            Anthropic, OpenAI, and Google Gemini for AI Coach features. Trade
            data is sent per-request and not stored by these providers.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          5. Data Retention and Deletion
        </h2>
        <p>
          Your data is retained for as long as your account is active. You
          can delete your account and all associated data from the Legal &amp;
          Privacy section in Settings. We will process deletion requests
          within 30 days.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          6. Your Rights
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Access:</strong> You can
            export all your trade data via the Export feature in Settings.
          </li>
          <li>
            <strong className="text-foreground">Deletion:</strong> You can
            delete your account and all data from the Legal &amp; Privacy
            section in Settings.
          </li>
          <li>
            <strong className="text-foreground">Portability:</strong> Trade
            data can be exported as CSV at any time.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          7. Contact
        </h2>
        <p>
          For privacy-related questions, contact{" "}
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
