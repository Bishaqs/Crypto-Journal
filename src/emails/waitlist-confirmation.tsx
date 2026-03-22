import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

interface WaitlistConfirmationProps {
  position: number;
  voteLink: string;
  discountCode: string;
  referralLink: string;
  referralCode: string;
  quizLink?: string;
  tierName?: string;
  discount?: number;
}

export function WaitlistConfirmation({
  position = 42,
  voteLink = "https://traversejournal.com/waitlist/vote?token=preview",
  discountCode = "TRAVERSE50-PREVIEW",
  referralLink = "https://traversejournal.com/?ref=REF-PREVIEW",
  referralCode = "REF-PREVIEW",
  quizLink = "https://traversejournal.com/quiz?token=preview",
  tierName = "Founding 100",
  discount = 50,
}: WaitlistConfirmationProps) {
  const isFounder = position <= 100;
  const t = THEMES.dark;

  return (
    <BaseLayout
      theme="dark"
      preview={`You're #${position} — ${tierName}. ${discount}% off forever.`}
    >
      <Section style={{ textAlign: "center" as const }}>
        <div
          style={{
            display: "inline-block",
            background: t.accentBg,
            border: `1px solid ${t.accentBorder}`,
            borderRadius: "999px",
            padding: "6px 16px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.2em",
              color: t.accent,
            }}
          >
            {tierName}
          </span>
        </div>

        <Heading
          as="h1"
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
          }}
        >
          You're in.
        </Heading>

        <Text
          style={{
            fontSize: "20px",
            color: t.accent,
            fontWeight: 600,
            margin: "0 0 16px 0",
          }}
        >
          You are #{position} — {tierName}.
        </Text>

        <Text
          style={{
            fontSize: "16px",
            color: t.textMuted,
            margin: "0 0 32px 0",
            lineHeight: "1.6",
          }}
        >
          We're building Traverse because traders are blind to the actual cost of
          their emotional leaks. You now have a front-row seat to fixing that.
        </Text>
      </Section>

      <Section
        style={{
          background: "rgba(103,232,249,0.05)",
          border: `1px solid ${t.accentBorder}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          textAlign: "left" as const,
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            color: t.textMuted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            margin: "0 0 4px 0",
          }}
        >
          Your discount code
        </Text>
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: "22px",
            fontWeight: 700,
            color: t.accent,
            margin: "0 0 16px 0",
            letterSpacing: "0.05em",
          }}
        >
          {discountCode}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Keep this safe. This code automatically activates your {discount}% discount
          when our paid tiers launch.
        </Text>
      </Section>

      {isFounder && (
        <Section
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "32px",
            textAlign: "left" as const,
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: t.text,
              margin: "0 0 8px 0",
            }}
          >
            Shape the Product
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: t.textMuted,
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            As part of the Founding 100, you have exclusive voting rights. You
            decide what we build next. Review the proposals and cast your votes.
          </Text>
          <EmailButton href={voteLink} theme="dark">
            Vote on Features
          </EmailButton>
        </Section>
      )}

      {/* Psychology Quiz */}
      {quizLink && (
        <Section
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            textAlign: "left" as const,
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: t.text,
              margin: "0 0 8px 0",
            }}
          >
            Discover Your Trading Psychology
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: t.textMuted,
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            Take a 3-minute quiz to find out your trading archetype — and get
            personalized insights on your strengths, blind spots, and emotional
            patterns. Your free Trading Psychology Protocol.
          </Text>
          <EmailButton href={quizLink} theme="dark">
            Take the Quiz
          </EmailButton>
        </Section>
      )}

      {/* Referral */}
      <Section
        style={{
          background: "rgba(103,232,249,0.05)",
          border: `1px solid ${t.accentBorder}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px",
          textAlign: "left" as const,
        }}
      >
        <Text
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: t.text,
            margin: "0 0 8px 0",
          }}
        >
          Share & Earn
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: t.textMuted,
            margin: "0 0 16px 0",
            lineHeight: "1.5",
          }}
        >
          Invite a friend to Traverse. When they join the waitlist, you both
          unlock an extra 10% discount — stacking to 55% total off any paid
          plan.
        </Text>
        <Text
          style={{
            fontSize: "12px",
            color: t.textMuted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            margin: "0 0 4px 0",
          }}
        >
          Your referral link
        </Text>
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            color: t.accent,
            margin: "0 0 12px 0",
            wordBreak: "break-all" as const,
          }}
        >
          {referralLink}
        </Text>
        <Text
          style={{
            fontSize: "12px",
            color: t.textMuted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
            margin: "0 0 4px 0",
          }}
        >
          Or share this code
        </Text>
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: "18px",
            fontWeight: 700,
            color: t.accent,
            margin: "0 0 16px 0",
            letterSpacing: "0.05em",
          }}
        >
          {referralCode}
        </Text>
        <EmailButton href={referralLink} theme="dark">
          Share Traverse
        </EmailButton>
      </Section>

      <EmailFooter theme="dark" />
    </BaseLayout>
  );
}

WaitlistConfirmation.PreviewProps = {
  position: 42,
  voteLink: "https://traversejournal.com/waitlist/vote?token=preview",
  discountCode: "TRAVERSE50-ABCD1234",
  referralLink: "https://traversejournal.com/?ref=REF-A1B2C3D4",
  referralCode: "REF-A1B2C3D4",
  quizLink: "https://traversejournal.com/quiz?token=preview",
  tierName: "Founding 100",
  discount: 50,
} as WaitlistConfirmationProps;

export default WaitlistConfirmation;
