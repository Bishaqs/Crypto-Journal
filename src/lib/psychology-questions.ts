// ─── Shared Psychology Question Bank ────────────────────────────────────────
// Used by both the in-app Psychology Kickstart and the public Lead Magnet Quiz.
// Each question has a `quizEligible` flag — true = included in the 20-question quiz.

import type { RiskPersonality, DecisionStyle } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type RiskScenarioOption = {
  label: string;
  score: Record<RiskPersonality, number>;
};

export type RiskScenario = {
  id: string;
  question: string;
  options: RiskScenarioOption[];
  quizEligible: boolean;
};

export type MoneyScriptQuestion = {
  id: string;
  category: "avoidance" | "worship" | "status" | "vigilance";
  text: string;
  quizEligible: boolean;
};

export type DecisionStyleQuestion = {
  id: string;
  text: string;
  options: { label: string; score: DecisionStyle }[];
  quizEligible: boolean;
};

export type AttachmentQuestion = {
  id: string;
  text: string;
  quizEligible: boolean;
};

export type LossAversionScenario = {
  id: string;
  question: string;
  options: { label: string; multiplier: number }[];
  quizEligible: boolean;
};

export type ScenarioQuestion = {
  id: string;
  question: string;
  options: { label: string; value: string }[];
  quizEligible: boolean;
};

export type LikertQuestion = {
  id: string;
  text: string;
  quizEligible: boolean;
};

// ─── Category 1: Risk Personality (6 questions) ─────────────────────────────

export const RISK_SCENARIOS: RiskScenario[] = [
  {
    id: "risk_1",
    quizEligible: true,
    question: "You're in a trade that's up 2R. The setup suggests it could go to 5R, but there's a clear resistance level. You:",
    options: [
      { label: "Take profit now — 2R is 2R", score: { conservative_guardian: 3, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "Close half, trail stop on the rest", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 2 } },
      { label: "Hold the full position with a breakeven stop", score: { conservative_guardian: 0, calculated_risk_taker: 2, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Depends on market conditions today", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_2",
    quizEligible: true,
    question: "You've had 3 consecutive losses. Your next A+ setup appears. You:",
    options: [
      { label: "Skip it — wait until tomorrow for a fresh start", score: { conservative_guardian: 3, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "Take it at reduced size (half normal)", score: { conservative_guardian: 2, calculated_risk_taker: 3, aggressive_hunter: 0, adaptive_chameleon: 2 } },
      { label: "Take it at full size — each trade is independent", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Check my emotional state first, then decide", score: { conservative_guardian: 1, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_3",
    quizEligible: true,
    question: "A trade you didn't take would have been a 10R winner. You feel:",
    options: [
      { label: "Relieved I stuck to my rules — that wasn't my setup", score: { conservative_guardian: 3, calculated_risk_taker: 2, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "I analyze what I missed to improve my system", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 2 } },
      { label: "Frustrated — I need to be more aggressive", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Curious — maybe I should widen my criteria sometimes", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_4",
    quizEligible: true,
    question: "Your maximum acceptable drawdown before you stop trading is:",
    options: [
      { label: "5% of account — preserve capital above all", score: { conservative_guardian: 3, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "10-15% — standard risk management", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 2 } },
      { label: "20%+ — big drawdowns are part of big returns", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 0 } },
      { label: "It depends on current market volatility", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_5",
    quizEligible: false,
    question: "Before entering a trade, you spend the most time on:",
    options: [
      { label: "Risk management — where's my stop, what's my max loss", score: { conservative_guardian: 3, calculated_risk_taker: 2, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "The math — R:R ratio, probability, expected value", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 1 } },
      { label: "The opportunity — how much I could make", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Context — what's the market doing, what's the setup quality", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_6",
    quizEligible: false,
    question: "If you could describe your ideal trading style in one word:",
    options: [
      { label: "Safe", score: { conservative_guardian: 3, calculated_risk_taker: 0, aggressive_hunter: 0, adaptive_chameleon: 0 } },
      { label: "Systematic", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "Bold", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 0 } },
      { label: "Flexible", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 0, adaptive_chameleon: 3 } },
    ],
  },
];

// ─── Category 2: Money Scripts (12 Likert questions) ────────────────────────

export const MONEY_SCRIPT_QUESTIONS: MoneyScriptQuestion[] = [
  // Avoidance
  { id: "ma_1", category: "avoidance", text: "I feel guilty when I have a profitable trading day", quizEligible: true },
  { id: "ma_2", category: "avoidance", text: "Taking money from the market feels wrong somehow", quizEligible: false },
  { id: "ma_3", category: "avoidance", text: "I don't deserve to make money this easily", quizEligible: false },
  // Worship
  { id: "mw_1", category: "worship", text: "If I could just hit my P&L target, all my problems would be solved", quizEligible: true },
  { id: "mw_2", category: "worship", text: "I think about potential trading profits constantly", quizEligible: true },
  { id: "mw_3", category: "worship", text: "More money from trading would make me happier", quizEligible: false },
  // Status
  { id: "ms_1", category: "status", text: "My P&L defines my worth as a trader and as a person", quizEligible: true },
  { id: "ms_2", category: "status", text: "I compare my returns to other traders frequently", quizEligible: false },
  { id: "ms_3", category: "status", text: "I feel embarrassed about my losses", quizEligible: false },
  // Vigilance
  { id: "mv_1", category: "vigilance", text: "I must never have a red day", quizEligible: false },
  { id: "mv_2", category: "vigilance", text: "I check my P&L obsessively throughout the day", quizEligible: true },
  { id: "mv_3", category: "vigilance", text: "I worry about my open positions even when not trading", quizEligible: false },
];

// ─── Category 3: Decision Style (4 questions) ──────────────────────────────

export const DECISION_STYLE_QUESTIONS: DecisionStyleQuestion[] = [
  { id: "ds_1", quizEligible: true, text: "When I see a trade setup, my first reaction is:", options: [
    { label: "A gut feeling about direction", score: "intuitive" },
    { label: "Opening charts and checking indicators", score: "analytical" },
    { label: "It depends on the situation", score: "hybrid" },
  ]},
  { id: "ds_2", quizEligible: true, text: "I make my best trades when:", options: [
    { label: "I trust my instincts and act quickly", score: "intuitive" },
    { label: "I follow my rules exactly", score: "analytical" },
    { label: "I balance my gut with the data", score: "hybrid" },
  ]},
  { id: "ds_3", quizEligible: false, text: "Before entering a trade, I need:", options: [
    { label: "A strong conviction — I feel it in my body", score: "intuitive" },
    { label: "All criteria met — checklist complete", score: "analytical" },
    { label: "A mix of good data and good feeling", score: "hybrid" },
  ]},
  { id: "ds_4", quizEligible: false, text: "When a trade goes against me, I:", options: [
    { label: "Know instinctively when to cut", score: "intuitive" },
    { label: "Hit my stop loss no matter what", score: "analytical" },
    { label: "Reassess based on what's changed", score: "hybrid" },
  ]},
];

// ─── Category 4: Position Attachment (3 Likert questions) ───────────────────

export const ATTACHMENT_QUESTIONS: AttachmentQuestion[] = [
  { id: "at_1", text: "When a trade is in profit, I find it hard to close it because it might go higher", quizEligible: false },
  { id: "at_2", text: "I feel physically uncomfortable closing a losing position", quizEligible: false },
  { id: "at_3", text: "Once I enter a trade, I feel like it's 'mine' and I'm attached to the outcome", quizEligible: false },
];

// ─── Category 5: Loss Aversion (3 scenarios) ───────────────────────────────

export const LOSS_AVERSION_SCENARIOS: LossAversionScenario[] = [
  {
    id: "la_1",
    quizEligible: false,
    question: "Which would you prefer?",
    options: [
      { label: "Guaranteed $500 profit", multiplier: 1.0 },
      { label: "50% chance of $1,100 profit, 50% chance of nothing", multiplier: 2.2 },
    ],
  },
  {
    id: "la_2",
    quizEligible: true,
    question: "Which bothers you more?",
    options: [
      { label: "Losing $100 bothers me about as much as gaining $100 pleases me", multiplier: 1.0 },
      { label: "Losing $100 bothers me about as much as gaining $200 pleases me", multiplier: 2.0 },
      { label: "Losing $100 bothers me about as much as gaining $300 pleases me", multiplier: 3.0 },
    ],
  },
  {
    id: "la_3",
    quizEligible: false,
    question: "You have two open trades. Trade A is up $200, Trade B is down $200. You must close one. You:",
    options: [
      { label: "Close the winner — lock in the profit", multiplier: 2.5 },
      { label: "Close the loser — cut the loss", multiplier: 1.5 },
      { label: "Check which has the better risk/reward going forward", multiplier: 1.0 },
    ],
  },
];

// ─── Category 7: Trading Discipline (2 Likert questions) ───────────────────

export const DISCIPLINE_QUESTIONS: LikertQuestion[] = [
  { id: "td_1", text: "I stick to my pre-trade plan even when the market tempts me to deviate", quizEligible: true },
  { id: "td_2", text: "I have clear rules for when to stop trading for the day, and I follow them", quizEligible: false },
];

// ─── Category 8: Emotional Regulation (2 scenario questions) ────────────────

export type EmotionalRegulationLevel = "reactive" | "aware" | "managed" | "mastered";

export const EMOTIONAL_REGULATION_QUESTIONS: ScenarioQuestion[] = [
  {
    id: "er_1",
    quizEligible: true,
    question: "After a significant loss, your first instinct is to:",
    options: [
      { label: "Enter another trade immediately to make it back", value: "reactive" },
      { label: "Check social media to see if others lost too", value: "aware" },
      { label: "Analyze what went wrong before doing anything", value: "managed" },
      { label: "Step away, follow my cool-down protocol", value: "mastered" },
    ],
  },
  {
    id: "er_2",
    quizEligible: true,
    question: "When you notice yourself getting emotionally activated during a trade, you:",
    options: [
      { label: "Let the emotion guide my decision — it's useful data", value: "reactive" },
      { label: "Try to ignore it and focus on the numbers", value: "aware" },
      { label: "Acknowledge it but stick to my rules", value: "managed" },
      { label: "Have a specific protocol: breathe, label the emotion, reassess", value: "mastered" },
    ],
  },
];

// ─── Category 9: Cognitive Bias Awareness (2 scenario questions) ────────────

export const BIAS_AWARENESS_QUESTIONS: ScenarioQuestion[] = [
  {
    id: "ba_1",
    quizEligible: true,
    question: "You bought at $100, it dropped to $80, then recovered to $95. You:",
    options: [
      { label: "Wait for it to get back to $100 — I need to break even", value: "anchored" },
      { label: "Evaluate the current setup as if I just found it", value: "unbiased" },
      { label: "Feel relieved it's recovering and hold on tighter", value: "sunk_cost" },
      { label: "Depends on my original thesis — has anything changed?", value: "adaptive" },
    ],
  },
  {
    id: "ba_2",
    quizEligible: true,
    question: "Three people in your trading group are bullish on a setup. You normally wouldn't trade it. You:",
    options: [
      { label: "Take the trade — they're usually right", value: "conformist" },
      { label: "Skip it — my rules are my rules", value: "independent" },
      { label: "Feel the pull but stick to my criteria", value: "aware" },
      { label: "Use their conviction as one data point among many", value: "adaptive" },
    ],
  },
];

// ─── Category 10: FOMO & Revenge Trading (2 Likert questions) ──────────────

export const FOMO_REVENGE_QUESTIONS: LikertQuestion[] = [
  { id: "fr_1", text: "When I see a big move happening without me, I feel a strong urge to jump in", quizEligible: true },
  { id: "fr_2", text: "After a loss, I often find myself taking another trade quickly to 'make it back'", quizEligible: true },
];

// ─── Category 11: Journaling & Self-Reflection (1 question) ────────────────

export type JournalingStyle = "detailed" | "quick_notes" | "mental" | "none";

export const JOURNALING_QUESTION: ScenarioQuestion = {
  id: "jr_1",
  quizEligible: false,
  question: "How do you currently review your trades?",
  options: [
    { label: "Detailed journal with emotions, setup notes, and screenshots", value: "detailed" },
    { label: "Quick notes — just the basics (ticker, P&L, brief comment)", value: "quick_notes" },
    { label: "Mental review — I think about it but don't write it down", value: "mental" },
    { label: "I don't review my trades", value: "none" },
  ],
};

// ─── Category 12: Stress Response Under Drawdown (1 scenario) ──────────────

export type StressResponse = "resilient" | "analytical" | "emotional" | "avoidant";

export const STRESS_RESPONSE_QUESTION: ScenarioQuestion = {
  id: "sr_1",
  quizEligible: true,
  question: "You're in a 10% account drawdown over 2 weeks. Which best describes your response?",
  options: [
    { label: "Drawdowns happen — I stick to my process and trust the edge", value: "resilient" },
    { label: "I reduce size, review every trade, and look for what changed", value: "analytical" },
    { label: "I feel anxious, check my account constantly, and struggle to sleep", value: "emotional" },
    { label: "I stop trading entirely and avoid looking at my account", value: "avoidant" },
  ],
};

// ─── Kickstart Step Definitions ─────────────────────────────────────────────

export const KICKSTART_STEPS = [
  "Risk Personality (1/2)",
  "Risk Personality (2/2)",
  "Money Scripts (1/2)",
  "Money Scripts (2/2)",
  "Decision Style & Journaling",
  "Attachment & FOMO",
  "Loss Aversion",
  "Emotional Regulation & Stress",
  "Cognitive Biases & Discipline",
  "Self-Concept",
] as const;

// ─── Quiz-Eligible Question IDs ─────────────────────────────────────────────

export function getQuizQuestionIds(): string[] {
  const ids: string[] = [];
  for (const q of RISK_SCENARIOS) if (q.quizEligible) ids.push(q.id);
  for (const q of MONEY_SCRIPT_QUESTIONS) if (q.quizEligible) ids.push(q.id);
  for (const q of DECISION_STYLE_QUESTIONS) if (q.quizEligible) ids.push(q.id);
  for (const q of LOSS_AVERSION_SCENARIOS) if (q.quizEligible) ids.push(q.id);
  for (const q of EMOTIONAL_REGULATION_QUESTIONS) if (q.quizEligible) ids.push(q.id);
  for (const q of BIAS_AWARENESS_QUESTIONS) if (q.quizEligible) ids.push(q.id);
  for (const q of FOMO_REVENGE_QUESTIONS) if (q.quizEligible) ids.push(q.id);
  if (STRESS_RESPONSE_QUESTION.quizEligible) ids.push(STRESS_RESPONSE_QUESTION.id);
  return ids;
}
