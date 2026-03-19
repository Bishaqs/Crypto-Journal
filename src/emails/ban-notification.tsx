import { Heading, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailFooter } from "./components/email-footer";

interface BanNotificationProps {
  email: string;
  reason?: string;
}

export function BanNotification({
  email = "user@example.com",
  reason,
}: BanNotificationProps) {
  const t = THEMES.light;

  return (
    <BaseLayout theme="light" preview="Your Traverse Journal account has been closed.">
      <Heading
        as="h1"
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: t.text,
          marginBottom: "16px",
        }}
      >
        Account Closed
      </Heading>

      <Text
        style={{
          fontSize: "15px",
          color: "#444",
          lineHeight: "1.6",
          marginBottom: "16px",
        }}
      >
        Your Traverse Journal account associated with <strong>{email}</strong>{" "}
        has been closed by an administrator.
      </Text>

      {reason && (
        <Section
          style={{
            background: t.surface,
            borderLeft: `3px solid ${t.accent}`,
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "0 8px 8px 0",
          }}
        >
          <Text style={{ fontSize: "14px", color: "#555", margin: 0 }}>
            <strong>Reason:</strong> {reason}
          </Text>
        </Section>
      )}

      <Text
        style={{
          fontSize: "15px",
          color: "#444",
          lineHeight: "1.6",
          marginBottom: "24px",
        }}
      >
        If you believe this was a mistake, please contact us at{" "}
        <Link
          href="mailto:support@traversejournal.com"
          style={{ color: t.accent, textDecoration: "none" }}
        >
          support@traversejournal.com
        </Link>
        .
      </Text>

      <EmailFooter theme="light" />
    </BaseLayout>
  );
}

BanNotification.PreviewProps = {
  email: "user@example.com",
  reason: "Violation of terms of service",
} as BanNotificationProps;

export default BanNotification;
