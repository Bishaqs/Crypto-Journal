import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";

export interface NurtureDay10Props {
  unsubscribeUrl: string;
}

export function NurtureDay10({ unsubscribeUrl }: NurtureDay10Props) {
  const t = THEMES.dark;

  const features = [
    {
      title: "Nova AI Coach",
      description: "An AI that knows your psychology profile, remembers your patterns across sessions, and coaches you based on proven frameworks (Kahneman, Douglas, Jung). Not generic advice — insights specific to YOUR blind spots.",
    },
    {
      title: "Emotion-to-P&L Tracking",
      description: "Tag every trade with your emotional state. Over time, Traverse shows you which emotions correlate with wins, losses, and revenge trades — turning gut feelings into measurable data.",
    },
    {
      title: "Psychology Profile Evolution",
      description: "Your trading psychology isn't static. Traverse tracks how your risk personality, loss aversion, and emotional regulation evolve over months — showing you concrete proof that you're growing.",
    },
    {
      title: "Pattern Detection",
      description: "Automatic detection of revenge trading, FOMO entries, streak-based behavior changes, and emotional cascades. Traverse sees the patterns you can't see yourself.",
    },
  ];

  return (
    <BaseLayout preview="How Traverse tracks your psychology over time">
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text style={{ fontSize: "48px", margin: "0 0 8px 0" }}>&#128200;</Text>
        <Heading
          as="h1"
          style={{ fontSize: "22px", fontWeight: 700, color: t.text, margin: "0 0 12px 0" }}
        >
          Your quiz was a snapshot. Traverse is the movie.
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0, lineHeight: "1.6" }}>
          The psychology quiz showed you who you are today as a trader.
          But psychology changes with experience, market conditions, and life events.
          Here&apos;s how Traverse tracks that evolution.
        </Text>
      </Section>

      {features.map((feature, i) => (
        <Section
          key={i}
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "12px",
          }}
        >
          <Text style={{ fontSize: "14px", fontWeight: 700, color: t.accent, margin: "0 0 8px 0" }}>
            {feature.title}
          </Text>
          <Text style={{ fontSize: "13px", color: t.text, margin: 0, lineHeight: "1.6" }}>
            {feature.description}
          </Text>
        </Section>
      ))}

      <Section style={{ textAlign: "center" as const, marginTop: "24px", marginBottom: "24px" }}>
        <EmailButton href="https://traversejournal.com">Try Traverse Free</EmailButton>
      </Section>

      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

export default NurtureDay10;
