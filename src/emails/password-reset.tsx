import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

interface PasswordResetProps {
  resetLink: string;
}

export function PasswordReset({
  resetLink = "https://traversejournal.com/reset-password?code=preview",
}: PasswordResetProps) {
  const t = THEMES.light;

  return (
    <BaseLayout theme="light" preview="Reset your Traverse Journal password.">
      <Heading
        as="h1"
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: t.text,
          marginBottom: "16px",
        }}
      >
        Password Reset
      </Heading>

      <Text
        style={{
          fontSize: "15px",
          color: "#444",
          lineHeight: "1.6",
          marginBottom: "24px",
        }}
      >
        We received a request to reset your password. Click the button below to
        choose a new password.
      </Text>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href={resetLink} theme="light">
          Reset Password
        </EmailButton>
      </Section>

      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "13px", color: t.textMuted, margin: 0 }}>
          This link expires in 1 hour. If you didn't request a password reset,
          you can safely ignore this email — your password won't change.
        </Text>
      </Section>

      <EmailFooter theme="light" />
    </BaseLayout>
  );
}

PasswordReset.PreviewProps = {
  resetLink: "https://traversejournal.com/reset-password?code=preview-token",
} as PasswordResetProps;

export default PasswordReset;
