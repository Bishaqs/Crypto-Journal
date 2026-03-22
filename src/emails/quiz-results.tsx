import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";
import type { ArchetypeInfo } from "@/lib/psychology-scoring";

export interface QuizResultsProps {
  archetypeInfo: ArchetypeInfo;
  scores: Record<string, unknown>;
  unsubscribeUrl: string;
}

export function QuizResults({ archetypeInfo, unsubscribeUrl }: QuizResultsProps) {
  const t = THEMES.dark;

  return (
    <BaseLayout preview={`Your Trading Psychology: ${archetypeInfo.name}`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Text style={{ fontSize: "48px", margin: "0 0 8px 0" }}>&#129504;</Text>
        <Heading
          as="h1"
          style={{ fontSize: "24px", fontWeight: 700, color: t.text, margin: "0 0 8px 0" }}
        >
          {archetypeInfo.name}
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0, lineHeight: "1.6" }}>
          {archetypeInfo.description}
        </Text>
      </Section>

      {/* Strengths */}
      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <Text style={{ fontSize: "14px", fontWeight: 700, color: t.accent, margin: "0 0 12px 0" }}>
          Your Strengths
        </Text>
        {archetypeInfo.strengths.map((s, i) => (
          <Text key={i} style={{ fontSize: "13px", color: t.text, margin: "0 0 8px 0", lineHeight: "1.5" }}>
            &#10003; {s}
          </Text>
        ))}
      </Section>

      {/* Blind Spots */}
      <Section
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <Text style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b", margin: "0 0 12px 0" }}>
          Your Blind Spots
        </Text>
        {archetypeInfo.blindSpots.map((s, i) => (
          <Text key={i} style={{ fontSize: "13px", color: t.text, margin: "0 0 8px 0", lineHeight: "1.5" }}>
            &#9888; {s}
          </Text>
        ))}
      </Section>

      {/* Recommendation */}
      <Section
        style={{
          background: "rgba(0,180,216,0.08)",
          border: `1px solid rgba(0,180,216,0.2)`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "14px", fontWeight: 700, color: t.accent, margin: "0 0 8px 0" }}>
          Your Action Step
        </Text>
        <Text style={{ fontSize: "13px", color: t.text, margin: 0, lineHeight: "1.6" }}>
          {archetypeInfo.recommendation}
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href="https://traversejournal.com">Explore Traverse Journal</EmailButton>
      </Section>

      <Text style={{ fontSize: "12px", color: t.textMuted, textAlign: "center" as const, lineHeight: "1.5" }}>
        Over the next 2 weeks, we&apos;ll send you personalized insights based on your psychology profile.
        Traverse Journal tracks these patterns over time so you can see real improvement.
      </Text>

      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

export default QuizResults;
