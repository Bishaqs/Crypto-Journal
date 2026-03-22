import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout, THEMES } from "./components/base-layout";
import { EmailButton } from "./components/email-button";
import { EmailFooter } from "./components/email-footer";
import type { TradingArchetype } from "@/lib/psychology-scoring";

export interface NurtureDay7Props {
  archetypeName: string;
  archetype: string;
  scores: Record<string, unknown>;
  unsubscribeUrl: string;
}

const TECHNIQUES: Record<TradingArchetype, string[]> = {
  disciplined_strategist: [
    "Schedule a monthly 'rule audit' — review your last 20 trades and check which rules you followed vs. broke. Your discipline is strong but rules need updating.",
    "Add a 'confidence score' (1-5) to every trade entry. Track whether high-confidence trades actually perform better — your system may have hidden edges you don't realize.",
    "Set a 'flexibility budget': 10% of your trades can be taken outside your normal criteria. This prevents over-rigidity while keeping your core structure intact.",
  ],
  intuitive_risk_taker: [
    "Before every trade, write one sentence: 'My gut says X because Y.' This trains your pattern recognition from unconscious to conscious — and helps you distinguish intuition from impulse.",
    "After every losing trade, wait 30 minutes before your next entry. Use the time to journal what you felt. Most of your worst trades come from the emotional rebound zone.",
    "Size your 'intuition trades' at 50% of your 'system trades' until you've tracked 50 of each. Then compare — let the data tell you whether your gut is truly an edge or a leak.",
  ],
  cautious_perfectionist: [
    "Track your 'missed trade cost' — paper-trade the top 3 setups you skipped each week. After a month, the data shows whether your filter is saving or costing you.",
    "Set a daily 'courage trade' challenge: one trade per day that meets 80% of your criteria instead of 100%. This gradually expands your comfort zone without abandoning your standards.",
    "Stop checking P&L mid-session. Set it to update only at end of day. The constant checking feeds anxiety and makes every small loss feel catastrophic.",
  ],
  emotional_reactor: [
    "Build a 'traffic light' pre-trade check: Green (calm, clear) = full size. Yellow (slightly activated) = half size. Red (emotional, reactive) = no trade. Check before EVERY entry.",
    "After any loss, set a physical timer for 15 minutes. No trading, no chart-checking. Walk, breathe, or journal. This breaks the revenge cycle at its root.",
    "End every trading day with a 2-sentence journal: 'Today I felt [emotion] because [trigger]. Tomorrow I will [action].' This builds the self-awareness muscle over time.",
  ],
  adaptive_analyst: [
    "Define 3 non-negotiable rules that NEVER change regardless of market conditions. Everything else can flex — but these anchors prevent adaptive drift from becoming chaos.",
    "Keep a 'strategy log' — every time you switch approaches, note why. After 30 entries, you'll see whether your adaptations are smart reads or reactive noise.",
    "At the end of each week, write: 'This week I adapted [X] because [Y], and it worked/didn't work.' This turns unconscious adaptation into a learnable skill.",
  ],
  status_driven_competitor: [
    "Delete all social media comparisons for 30 days. Unfollow traders who post P&L. Your performance anxiety drops dramatically when the scoreboard disappears.",
    "Create a 'process scorecard': rate yourself 1-5 on rule-following, risk management, and emotional control BEFORE looking at P&L. Compete against your process, not your money.",
    "Tell one trusted person your actual trading results — including the losses. Shame loses its power when brought into the light. Hiding losses makes them repeat.",
  ],
  resilient_survivor: [
    "Set a quarterly goal that's 10% beyond your comfort zone. Not a moonshot — just slightly more than 'survival mode.' Your resilience can carry more than you think.",
    "Document your drawdown recovery patterns: what worked, what didn't, how long it took. This turns past pain into a reusable playbook for future stress.",
    "Allow yourself one 'aggressive' week per month where you trade your full conviction. Your survival instincts will protect you — and you might discover an edge you've been suppressing.",
  ],
  anxious_overthinker: [
    "Set a 5-minute analysis cap for any single setup. After 5 minutes: either take it or skip it. The second analysis round rarely adds value but always adds anxiety.",
    "Make ONE trading decision before the market opens: define your setup, entry, stop, and target. Then execute mechanically. Pre-market decisions remove in-session overthinking.",
    "Track how many times you modify a trade after entry (move stops, change targets, add/remove). Set a goal: maximum 1 modification per trade. Forced simplicity reduces anxiety.",
  ],
};

export function NurtureDay7({ archetypeName, archetype, unsubscribeUrl }: NurtureDay7Props) {
  const t = THEMES.dark;
  const techniques = TECHNIQUES[archetype as TradingArchetype] ?? TECHNIQUES.emotional_reactor;

  return (
    <BaseLayout preview={`3 techniques for ${archetypeName} traders`}>
      <Section style={{ textAlign: "center" as const, marginBottom: "32px" }}>
        <Heading
          as="h1"
          style={{ fontSize: "22px", fontWeight: 700, color: t.text, margin: "0 0 12px 0" }}
        >
          3 techniques for {archetypeName} traders
        </Heading>
        <Text style={{ fontSize: "14px", color: t.textMuted, margin: 0, lineHeight: "1.6" }}>
          Based on your psychology profile, here are three concrete actions
          you can implement starting today.
        </Text>
      </Section>

      {techniques.map((technique, i) => (
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
            Technique #{i + 1}
          </Text>
          <Text style={{ fontSize: "13px", color: t.text, margin: 0, lineHeight: "1.6" }}>
            {technique}
          </Text>
        </Section>
      ))}

      <Section style={{ marginTop: "24px", marginBottom: "24px" }}>
        <Text style={{ fontSize: "14px", color: t.text, lineHeight: "1.6", margin: 0 }}>
          The difference between traders who improve and those who don&apos;t isn&apos;t intelligence
          or strategy — it&apos;s consistent self-tracking. Traverse makes this automatic.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginBottom: "24px" }}>
        <EmailButton href="https://traversejournal.com">Start Tracking for Free</EmailButton>
      </Section>

      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </BaseLayout>
  );
}

export default NurtureDay7;
