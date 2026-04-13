import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

interface WaitlistVerificationProps {
  confirmLink: string;
}

export function WaitlistVerification({
  confirmLink = "https://traversejournal.com/waitlist/confirm?token=preview",
}: WaitlistVerificationProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout theme="dark" preview="Confirm your email to secure your waitlist spot.">
      <Section style={{ textAlign: "center" as const, padding: "40px 0 24px" }}>
        <Heading
          as="h1"
          style={{
            color: t.text,
            fontSize: "28px",
            fontWeight: 700,
            margin: "0 0 16px",
          }}
        >
          One more step.
        </Heading>
        <Text
          style={{
            color: t.textMuted,
            fontSize: "16px",
            lineHeight: "1.6",
            margin: "0 0 32px",
          }}
        >
          Click the button below to confirm your email and secure your spot on
          the Traverse waitlist.
        </Text>
        <EmailButton href={confirmLink}>Confirm My Email</EmailButton>
        <Text
          style={{
            color: t.textMuted,
            fontSize: "13px",
            lineHeight: "1.5",
            margin: "24px 0 0",
          }}
        >
          This link expires in 30 days. If you didn&apos;t sign up for
          Traverse, you can safely ignore this email.
        </Text>
      </Section>
      <EmailFooter />
    </BaseLayout>
  );
}
