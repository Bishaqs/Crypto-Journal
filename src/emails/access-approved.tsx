import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export function AccessApproved() {
  const t = THEMES.dark;

  return (
    <BaseLayout theme="dark" preview="Your access to Traverse Journal has been approved.">
      <Section style={{ textAlign: "center" as const }}>
        <Heading
          as="h1"
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 16px 0",
            letterSpacing: "-0.02em",
          }}
        >
          You&apos;re in.
        </Heading>

        <Text
          style={{
            fontSize: "16px",
            color: t.textMuted,
            margin: "0 0 32px 0",
            lineHeight: "1.6",
          }}
        >
          Your request has been approved. You now have full access to Traverse
          Journal — start logging trades and let AI connect your psychology to
          your P&L.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <EmailButton href="https://traversejournal.com/login">
          Open Traverse
        </EmailButton>
      </Section>

      <EmailFooter />
    </BaseLayout>
  );
}
