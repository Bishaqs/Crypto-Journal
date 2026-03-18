export function PrivacyContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-muted">
      <p className="text-xs text-muted">
        Last updated: March 14, 2026
      </p>

      {/* 1. Controller Identity — Art. 13(1)(a) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          1. Controller Identity
        </h2>
        <p className="mb-2">
          The controller responsible for data processing on this platform
          within the meaning of the General Data Protection Regulation (GDPR)
          is:
        </p>
        <ul className="list-none pl-0 space-y-1">
          <li>
            <strong className="text-foreground">Name:</strong> Benjamin Schwab
          </li>
          <li>
            <strong className="text-foreground">Address:</strong>{" "}
            Gesch&auml;ftsadresse &mdash; see Impressum for current address
          </li>
          <li>
            <strong className="text-foreground">Email:</strong>{" "}
            <a
              href="mailto:support@traversejournal.com"
              className="text-accent hover:underline"
            >
              support@traversejournal.com
            </a>
          </li>
          <li>
            <strong className="text-foreground">Phone:</strong> See Impressum
          </li>
        </ul>
      </section>

      {/* 2. Data Protection Contact — Art. 13(1)(b) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          2. Data Protection Contact
        </h2>
        <p>
          We are not required to appoint a Data Protection Officer (DPO) under
          Art. 37 GDPR, as we employ fewer than 20 persons constantly engaged
          in automated data processing (cf. &sect; 38 BDSG). For all
          data-protection inquiries, please contact us at{" "}
          <a
            href="mailto:support@traversejournal.com"
            className="text-accent hover:underline"
          >
            support@traversejournal.com
          </a>
          .
        </p>
      </section>

      {/* 3. Purposes and Legal Bases — Art. 13(1)(c)(d) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          3. Purposes and Legal Bases of Processing
        </h2>
        <p className="mb-3">
          We process your personal data for the following purposes, each
          matched to its legal basis under Art. 6(1) GDPR:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border">
            <thead>
              <tr className="bg-muted/20">
                <th className="text-left p-2 border-b border-border text-foreground font-semibold">
                  Processing Activity
                </th>
                <th className="text-left p-2 border-b border-border text-foreground font-semibold">
                  Legal Basis
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-2">
                  Account creation (email, authentication)
                </td>
                <td className="p-2">
                  Art. 6(1)(b) &mdash; contract performance
                </td>
              </tr>
              <tr>
                <td className="p-2">Trade data storage and analytics</td>
                <td className="p-2">
                  Art. 6(1)(b) &mdash; contract performance
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  Journal notes and behavioral logs (emotions, confidence,
                  daily check-ins)
                </td>
                <td className="p-2">
                  Art. 6(1)(b) &mdash; contract performance
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  Exchange API key storage (encrypted AES-256-CBC)
                </td>
                <td className="p-2">
                  Art. 6(1)(b) &mdash; contract performance
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  AI Coach (data sent to Anthropic / OpenAI / Google for
                  analysis)
                </td>
                <td className="p-2">
                  Art. 6(1)(a) &mdash; explicit consent
                </td>
              </tr>
              <tr>
                <td className="p-2">Leaderboard / public profile</td>
                <td className="p-2">
                  Art. 6(1)(a) &mdash; consent (opt-in)
                </td>
              </tr>
              <tr>
                <td className="p-2">Shared trades</td>
                <td className="p-2">
                  Art. 6(1)(a) &mdash; consent
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  Server logs (timestamps, request paths)
                </td>
                <td className="p-2">
                  Art. 6(1)(f) &mdash; legitimate interest (security and
                  debugging)
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  Transactional emails (account verification, password reset)
                </td>
                <td className="p-2">
                  Art. 6(1)(b) &mdash; contract performance
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  Gamification data (XP, achievements, cosmetics, coins)
                </td>
                <td className="p-2">
                  Art. 6(1)(b) &mdash; contract performance
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Where processing is based on consent (Art. 6(1)(a)), you may
          withdraw your consent at any time with effect for the future. See
          Section 8 below for details.
        </p>
      </section>

      {/* 4. What We Collect */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          4. What We Collect
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Account information:</strong>{" "}
            Email address and authentication credentials (managed by Supabase
            Auth). If you sign in with Google OAuth, we receive your email
            address and profile name.
          </li>
          <li>
            <strong className="text-foreground">Trade data:</strong> Trade
            entries you log manually, import from CSV files, or sync from
            connected exchanges, including prices, quantities, timestamps,
            notes, tags, emotions, and process scores.
          </li>
          <li>
            <strong className="text-foreground">Journal entries:</strong>{" "}
            Notes, tags, trade links, and annotations you create within the
            journaling feature.
          </li>
          <li>
            <strong className="text-foreground">Behavioral data:</strong>{" "}
            Emotions, confidence ratings, daily check-ins, and daily plans
            you submit to track your trading psychology.
          </li>
          <li>
            <strong className="text-foreground">
              Exchange API credentials:
            </strong>{" "}
            If you connect a cryptocurrency exchange, we store your API key
            and secret. These are encrypted at rest using AES-256-CBC with
            per-field random initialization vectors (IVs). We only request
            read-only access and never execute trades on your behalf.
          </li>
          <li>
            <strong className="text-foreground">Gamification data:</strong>{" "}
            Levels, XP, achievements, cosmetics, badges, coins, and related
            progress data generated through your use of the platform.
          </li>
          <li>
            <strong className="text-foreground">Server logs:</strong>{" "}
            Timestamps and request paths for debugging and security purposes.
            We do not use third-party analytics trackers.
          </li>
        </ul>
      </section>

      {/* 5. Recipients / Sub-Processors — Art. 13(1)(e) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          5. Recipients and Sub-Processors
        </h2>
        <p className="mb-3">
          We share your data with the following third-party service providers
          only to the extent necessary to operate the platform:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Supabase</strong> &mdash;
            Database hosting and user authentication (hosted on AWS
            infrastructure).
          </li>
          <li>
            <strong className="text-foreground">Vercel</strong> &mdash;
            Application hosting and deployment.
          </li>
          <li>
            <strong className="text-foreground">
              Anthropic, OpenAI, Google Gemini
            </strong>{" "}
            &mdash; AI Coach features. Your trade data is sent per-request
            for analysis. Data is not retained by these providers beyond the
            individual API request.
          </li>
          <li>
            <strong className="text-foreground">Upstash</strong> &mdash; Rate
            limiting infrastructure for API endpoint protection.
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> &mdash;
            Transactional email delivery (account verification, password
            reset).
          </li>
          <li>
            <strong className="text-foreground">
              CoinGecko / CryptoCompare
            </strong>{" "}
            &mdash; Market data APIs for price information. No user data is
            sent to these services.
          </li>
        </ul>
      </section>

      {/* 6. International Data Transfers — Art. 13(1)(f) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          6. International Data Transfers
        </h2>
        <p className="mb-2">
          Your data is transferred to and processed in the United States,
          where our sub-processors operate. We ensure adequate safeguards for
          these transfers in accordance with Chapter V GDPR:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">
              EU&ndash;US Data Privacy Framework (DPF):
            </strong>{" "}
            For sub-processors certified under the DPF (including Vercel,
            OpenAI, Google, and AWS/Supabase), we rely on the adequacy
            decision of the European Commission.
          </li>
          <li>
            <strong className="text-foreground">
              Standard Contractual Clauses (SCCs):
            </strong>{" "}
            For providers not certified under the DPF, we rely on EU Standard
            Contractual Clauses pursuant to Commission Implementing Decision
            (EU) 2021/914.
          </li>
        </ul>
        <p className="mt-2">
          Details regarding specific transfer safeguards are available upon
          request at{" "}
          <a
            href="mailto:support@traversejournal.com"
            className="text-accent hover:underline"
          >
            support@traversejournal.com
          </a>
          .
        </p>
      </section>

      {/* 7. Data Retention — Art. 13(2)(a) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          7. Data Retention
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">
              Account and trade data:
            </strong>{" "}
            Retained for as long as your account is active.
          </li>
          <li>
            <strong className="text-foreground">Server logs:</strong>{" "}
            Retained for 90 days, then automatically purged.
          </li>
          <li>
            <strong className="text-foreground">After account deletion:</strong>{" "}
            All data is purged within 30 days of your deletion request.
            Database backups containing residual data are purged within 90
            days.
          </li>
          <li>
            <strong className="text-foreground">
              AI conversation data:
            </strong>{" "}
            Not retained by AI providers beyond the individual API request.
          </li>
        </ul>
      </section>

      {/* 8. Your Rights — Art. 13(2)(b)(c)(d) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          8. Your Rights Under GDPR
        </h2>
        <p className="mb-3">
          You have the following rights regarding your personal data. To
          exercise any of these rights, contact us at{" "}
          <a
            href="mailto:support@traversejournal.com"
            className="text-accent hover:underline"
          >
            support@traversejournal.com
          </a>{" "}
          or use the in-app controls described below.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">
              Right of access (Art. 15):
            </strong>{" "}
            You can export all your data via the Export feature in Settings.
            You may also request a complete copy of your personal data from
            us.
          </li>
          <li>
            <strong className="text-foreground">
              Right to rectification (Art. 16):
            </strong>{" "}
            You can edit your trades and journal entries directly within the
            application at any time.
          </li>
          <li>
            <strong className="text-foreground">
              Right to erasure (Art. 17):
            </strong>{" "}
            You can delete your account and all associated data from Settings
            &gt; Legal &amp; Privacy.
          </li>
          <li>
            <strong className="text-foreground">
              Right to restriction of processing (Art. 18):
            </strong>{" "}
            You may request that we restrict the processing of your data in
            certain circumstances (e.g., while we verify accuracy of
            contested data).
          </li>
          <li>
            <strong className="text-foreground">
              Right to data portability (Art. 20):
            </strong>{" "}
            Your trade data can be exported as CSV and JSON at any time via
            Settings.
          </li>
          <li>
            <strong className="text-foreground">
              Right to object (Art. 21):
            </strong>{" "}
            You have the right to object to processing based on legitimate
            interest (Art. 6(1)(f)), in particular server log processing.
          </li>
          <li>
            <strong className="text-foreground">
              Right to withdraw consent (Art. 7(3)):
            </strong>{" "}
            Where processing is based on your consent (AI Coach, leaderboard,
            shared trades), you may withdraw consent at any time in Settings.
            Withdrawal does not affect the lawfulness of processing carried
            out prior to withdrawal.
          </li>
          <li>
            <strong className="text-foreground">
              Right to lodge a complaint:
            </strong>{" "}
            You have the right to lodge a complaint with a supervisory
            authority. In Germany, this is the Landesbeauftragte(r)
            f&uuml;r Datenschutz und Informationsfreiheit of your Bundesland.
            You may also contact the supervisory authority in the EU/EEA
            member state of your habitual residence, place of work, or place
            of the alleged infringement.
          </li>
        </ul>
      </section>

      {/* 9. Automated Decision-Making — Art. 13(2)(f) */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          9. Automated Decision-Making
        </h2>
        <p>
          The AI Coach feature analyzes your trading data to provide
          behavioral coaching insights and pattern recognition. This
          processing does not constitute automated decision-making with legal
          or similarly significant effects within the meaning of Art. 22
          GDPR. All AI outputs are informational suggestions only &mdash; no
          decisions regarding your account, access, or any legal matter are
          made automatically.
        </p>
      </section>

      {/* 10. Cookies and Local Storage — ePrivacy / TTDSG */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          10. Cookies and Local Storage
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Strictly necessary:</strong>{" "}
            Authentication cookies (Supabase session tokens) and security
            cookies required for the platform to function. These are set
            without consent as permitted under &sect; 25(2) TTDSG.
          </li>
          <li>
            <strong className="text-foreground">Functional:</strong> Theme
            preferences, UI state, and onboarding progress stored in
            localStorage. These are only set with your consent.
          </li>
          <li>
            <strong className="text-foreground">
              No tracking or advertising:
            </strong>{" "}
            We do not use third-party tracking cookies, advertising cookies,
            or any form of cross-site tracking.
          </li>
        </ul>
        <p className="mt-2">
          Details are provided in the cookie consent banner displayed on your
          first visit.
        </p>
      </section>

      {/* 11. Data Security — Art. 32 */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          11. Data Security
        </h2>
        <p className="mb-3">
          We implement appropriate technical and organisational measures
          pursuant to Art. 32 GDPR to ensure a level of security appropriate
          to the risk:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Encryption in transit:</strong>{" "}
            All data is transmitted over HTTPS with TLS 1.3.
          </li>
          <li>
            <strong className="text-foreground">Encryption at rest:</strong>{" "}
            Exchange API credentials are encrypted using AES-256-CBC with
            per-field random initialization vectors. The encryption key is
            stored server-side only and never exposed to the client.
          </li>
          <li>
            <strong className="text-foreground">
              Row Level Security (RLS):
            </strong>{" "}
            Enforced at the database level, ensuring each user can only
            access their own data.
          </li>
          <li>
            <strong className="text-foreground">Authentication:</strong> All
            API routes require authentication. Admin operations require
            additional owner verification.
          </li>
          <li>
            <strong className="text-foreground">Rate limiting:</strong>{" "}
            Sensitive API endpoints are rate-limited to prevent abuse.
          </li>
        </ul>
      </section>

      {/* 12. Changes to This Policy */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          12. Changes to This Policy
        </h2>
        <p>
          We may update this privacy policy from time to time. Material
          changes will be communicated via email or in-app notification.
          Continued use of the platform after notification constitutes
          acceptance of the updated policy. We encourage you to review this
          page periodically.
        </p>
      </section>

      {/* 13. Contact */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          13. Contact
        </h2>
        <p>
          For all privacy-related inquiries, data subject requests, or
          complaints, contact us at{" "}
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
