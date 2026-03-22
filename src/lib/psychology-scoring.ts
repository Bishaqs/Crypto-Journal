// ─── Shared Psychology Scoring Engine ────────────────────────────────────────
// Used by both the in-app Psychology Kickstart and the public Lead Magnet Quiz.

import type { RiskPersonality, DecisionStyle } from "@/lib/types";
import {
  RISK_SCENARIOS,
  MONEY_SCRIPT_QUESTIONS,
  LOSS_AVERSION_SCENARIOS,
  FQ_RISK_SCENARIOS,
  FQ_MONEY_QUESTIONS,
  FQ_LOSS_AVERSION_SCENARIOS,
  type EmotionalRegulationLevel,
  type StressResponse,
} from "@/lib/psychology-questions";

const ALL_RISK_SCENARIOS = [...RISK_SCENARIOS, ...FQ_RISK_SCENARIOS];
const ALL_MONEY_QUESTIONS = [...MONEY_SCRIPT_QUESTIONS, ...FQ_MONEY_QUESTIONS];
const ALL_LOSS_AVERSION = [...LOSS_AVERSION_SCENARIOS, ...FQ_LOSS_AVERSION_SCENARIOS];

// ─── Helpers ────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// ─── Existing Category Scoring (extracted from psychology-profile-wizard) ───

export function computeRiskPersonality(riskResponses: Record<string, number>): RiskPersonality {
  const scores: Record<string, number> = {
    conservative_guardian: 0,
    calculated_risk_taker: 0,
    aggressive_hunter: 0,
    adaptive_chameleon: 0,
  };
  for (const [qId, optIdx] of Object.entries(riskResponses)) {
    const scenario = ALL_RISK_SCENARIOS.find((s) => s.id === qId);
    if (scenario) {
      const option = scenario.options[optIdx];
      for (const [key, val] of Object.entries(option.score)) {
        scores[key] += val;
      }
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as RiskPersonality;
}

export function computeMoneyScripts(moneyResponses: Record<string, number>): {
  avoidance: number;
  worship: number;
  status: number;
  vigilance: number;
} {
  const sums: Record<string, number[]> = { avoidance: [], worship: [], status: [], vigilance: [] };
  for (const q of ALL_MONEY_QUESTIONS) {
    const val = moneyResponses[q.id];
    if (val !== undefined) sums[q.category].push(val);
  }
  return {
    avoidance: Math.round(avg(sums.avoidance) * 10) / 10,
    worship: Math.round(avg(sums.worship) * 10) / 10,
    status: Math.round(avg(sums.status) * 10) / 10,
    vigilance: Math.round(avg(sums.vigilance) * 10) / 10,
  };
}

export function computeDecisionStyle(decisionResponses: Record<string, string>): DecisionStyle {
  const counts: Record<string, number> = { intuitive: 0, analytical: 0, hybrid: 0 };
  for (const val of Object.values(decisionResponses)) {
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as DecisionStyle;
}

export function computeAttachmentScore(attachmentResponses: Record<string, number>): number {
  const vals = Object.values(attachmentResponses);
  return vals.length > 0 ? Math.round(avg(vals) * 10) / 10 : 3;
}

export function computeLossAversion(lossAversionResponses: Record<string, number>): number {
  const entries = Object.entries(lossAversionResponses);
  if (entries.length === 0) return 2.0;
  const multipliers = entries.map(([qId, idx]) => {
    const scenario = ALL_LOSS_AVERSION.find((s) => s.id === qId);
    return scenario ? scenario.options[idx]?.multiplier ?? 2.0 : 2.0;
  });
  return Math.round(avg(multipliers) * 100) / 100;
}

// ─── New Category Scoring ───────────────────────────────────────────────────

export function computeDisciplineScore(disciplineResponses: Record<string, number>): number {
  const vals = Object.values(disciplineResponses);
  return vals.length > 0 ? Math.round(avg(vals) * 10) / 10 : 3;
}

export function computeEmotionalRegulation(
  responses: Record<string, string>
): EmotionalRegulationLevel {
  const levels: EmotionalRegulationLevel[] = ["reactive", "aware", "managed", "mastered"];
  const counts: Record<string, number> = { reactive: 0, aware: 0, managed: 0, mastered: 0 };
  for (const val of Object.values(responses)) {
    if (val in counts) counts[val]++;
  }
  // Return the highest-scoring level; on tie, favor the more regulated one
  let best: EmotionalRegulationLevel = "reactive";
  let bestCount = 0;
  for (const level of levels) {
    if (counts[level] > bestCount) {
      bestCount = counts[level];
      best = level;
    }
  }
  return best;
}

export function computeBiasAwareness(responses: Record<string, string>): number {
  // Score: unbiased/independent/adaptive = high, anchored/sunk_cost/conformist = low
  const scoreMap: Record<string, number> = {
    anchored: 2,
    sunk_cost: 1,
    conformist: 1,
    unbiased: 5,
    independent: 4,
    aware: 4,
    adaptive: 5,
  };
  const vals = Object.values(responses).map((v) => scoreMap[v] ?? 3);
  return vals.length > 0 ? Math.round(avg(vals) * 10) / 10 : 3;
}

export function computeFomoRevengeScore(responses: Record<string, number>): number {
  const vals = Object.values(responses);
  return vals.length > 0 ? Math.round(avg(vals) * 10) / 10 : 3;
}

export function computeStressResponse(responses: Record<string, string>): StressResponse {
  // Single question — just return the value directly
  const val = Object.values(responses)[0];
  if (val === "resilient" || val === "analytical" || val === "emotional" || val === "avoidant") {
    return val;
  }
  return "analytical"; // fallback
}

// ─── Trading Archetype (Quiz Lead Magnet) ───────────────────────────────────

export type TradingArchetype =
  | "disciplined_strategist"
  | "intuitive_risk_taker"
  | "cautious_perfectionist"
  | "emotional_reactor"
  | "adaptive_analyst"
  | "status_driven_competitor"
  | "resilient_survivor"
  | "anxious_overthinker";

export type ArchetypeInfo = {
  id: TradingArchetype;
  name: string;
  description: string;
  strengths: string[];
  blindSpots: string[];
  recommendation: string;
};

export const ARCHETYPES: Record<TradingArchetype, ArchetypeInfo> = {
  disciplined_strategist: {
    id: "disciplined_strategist",
    name: "The Disciplined Strategist",
    description: "You're rule-based, emotionally steady, and methodical. You rarely chase trades and prefer calculated entries with clear risk parameters. Your trading is process-driven, not outcome-driven.",
    strengths: [
      "Strong risk management and position sizing",
      "Emotional consistency across winning and losing streaks",
      "Systematic approach reduces impulsive decisions",
    ],
    blindSpots: [
      "May miss valid opportunities by being overly rigid",
      "Can struggle to adapt when market regime changes",
      "Risk of over-optimization and analysis paralysis",
    ],
    recommendation: "Your discipline is your edge. Focus on building in regular system reviews (monthly) so your rules evolve with the market without losing their structure.",
  },
  intuitive_risk_taker: {
    id: "intuitive_risk_taker",
    name: "The Intuitive Risk-Taker",
    description: "You trust your gut, act quickly, and are comfortable with uncertainty. You see opportunities others miss and aren't afraid to size up when conviction is high. Your best trades come from pattern recognition built through screen time.",
    strengths: [
      "Quick pattern recognition and decisive action",
      "Comfortable with volatility and drawdowns",
      "Can capture outsized moves others are too cautious for",
    ],
    blindSpots: [
      "Impulsive entries that don't meet your own criteria",
      "Overconfidence after winning streaks leads to oversizing",
      "Struggle to distinguish intuition from emotion",
    ],
    recommendation: "Your intuition is real — but it needs guardrails. Journal every trade with a 'gut vs. data' tag so you can measure which source of conviction actually produces better outcomes.",
  },
  cautious_perfectionist: {
    id: "cautious_perfectionist",
    name: "The Cautious Perfectionist",
    description: "You prioritize capital preservation above all else. Every trade must meet strict criteria, and you'd rather miss ten good trades than take one bad one. Your P&L curve is steady but you often feel frustrated by missed opportunities.",
    strengths: [
      "Exceptional capital preservation during drawdowns",
      "High win rate due to selective entries",
      "Low emotional volatility in your trading",
    ],
    blindSpots: [
      "Obsessive P&L checking creates unnecessary anxiety",
      "Perfectionism leads to chronically small position sizes",
      "Fear of being wrong prevents adapting to market changes",
    ],
    recommendation: "Your caution protects you, but it also limits you. Track your 'missed trade' cost by paper-trading the setups you skip — the data may surprise you and help calibrate your risk threshold.",
  },
  emotional_reactor: {
    id: "emotional_reactor",
    name: "The Emotional Reactor",
    description: "Your trading is heavily influenced by how you feel in the moment. Wins make you confident, losses make you desperate. You know your rules but struggle to follow them when emotions are high — especially after losses.",
    strengths: [
      "Deep market awareness and engagement",
      "Strong motivation to improve and learn",
      "Emotional sensitivity can become an early warning system",
    ],
    blindSpots: [
      "Revenge trading after losses (chasing to 'make it back')",
      "FOMO-driven entries on moves you see unfolding without you",
      "Emotional state determines position size more than your system does",
    ],
    recommendation: "Your emotions aren't the enemy — they're unprocessed data. Build a pre-trade check-in: rate your emotional state 1-5 before every trade. Skip any trade where you're above a 3. This alone could transform your results.",
  },
  adaptive_analyst: {
    id: "adaptive_analyst",
    name: "The Adaptive Analyst",
    description: "You're the trader who reads the room. Your decisions blend data with context, and you adjust your approach based on market conditions. You're neither rigidly systematic nor purely intuitive — you're flexible by design.",
    strengths: [
      "Adapts well to changing market conditions",
      "Balances technical analysis with market context",
      "Resistant to cognitive biases through self-awareness",
    ],
    blindSpots: [
      "Flexibility can become indecision in fast markets",
      "Hard to backtest a strategy that's constantly adapting",
      "May lack a clear edge because approach is too variable",
    ],
    recommendation: "Your adaptability is powerful but it needs a home base. Define 2-3 core rules that NEVER change (max loss per day, minimum R:R, etc.) — then adapt everything else freely around those anchors.",
  },
  status_driven_competitor: {
    id: "status_driven_competitor",
    name: "The Status-Driven Competitor",
    description: "Your P&L isn't just numbers — it's your scoreboard. You compare yourself to other traders, feel deeply embarrassed by losses, and are motivated by proving yourself. The competitive fire drives you, but it also distorts your decision-making.",
    strengths: [
      "Strong drive and motivation to improve",
      "Competitive mindset pushes you to study and prepare",
      "High accountability — you care deeply about results",
    ],
    blindSpots: [
      "Taking oversized risks to 'catch up' to others",
      "Hiding losses or avoiding reviewing bad trades",
      "Self-worth tied to P&L creates emotional instability",
    ],
    recommendation: "Redirect the competitive energy: compete against your past self, not other traders. Track your process score (did I follow my rules?) separately from P&L — you'll find that when process improves, profits follow.",
  },
  resilient_survivor: {
    id: "resilient_survivor",
    name: "The Resilient Survivor",
    description: "You've weathered drawdowns, blown accounts, or long losing streaks — and you're still here. Your relationship with loss is healthier than most because you've been through it. You trade with a quiet strength born from experience.",
    strengths: [
      "Strong psychological resilience under pressure",
      "Realistic expectations about market outcomes",
      "Hard-won wisdom about risk management",
    ],
    blindSpots: [
      "Past trauma may make you too conservative",
      "Survivorship focus can prevent aggressive growth",
      "May have normalized mediocre returns as 'good enough'",
    ],
    recommendation: "Your resilience is rare and valuable. Now it's time to rebuild with intention: set quarterly growth targets that push you slightly beyond your comfort zone. You've proven you can survive — now prove you can thrive.",
  },
  anxious_overthinker: {
    id: "anxious_overthinker",
    name: "The Anxious Over-Thinker",
    description: "You analyze everything — twice. You check your P&L constantly, worry about open positions, and struggle to pull the trigger on trades that meet your criteria. Your analytical ability is high, but anxiety turns it into paralysis.",
    strengths: [
      "Thorough preparation and research before trades",
      "Strong risk awareness and loss prevention",
      "Detailed record-keeping and self-analysis",
    ],
    blindSpots: [
      "Analysis paralysis prevents you from taking valid setups",
      "Obsessive checking creates a feedback loop of anxiety",
      "Over-analysis after losses leads to constant system changes",
    ],
    recommendation: "Your mind is your greatest asset AND your biggest obstacle. Set a 'decision deadline' for every setup: analyze for a fixed time (e.g., 5 minutes), then decide. No trade is allowed more than one review. This breaks the analysis loop.",
  },
};

export function computeTradingArchetype(scores: {
  riskPersonality?: RiskPersonality;
  moneyScripts?: { avoidance: number; worship: number; status: number; vigilance: number };
  decisionStyle?: DecisionStyle;
  lossAversion?: number;
  fomoRevengeScore?: number;
  emotionalRegulation?: EmotionalRegulationLevel;
  biasAwareness?: number;
  stressResponse?: StressResponse;
  disciplineScore?: number;
}): TradingArchetype {
  // Weighted scoring across all dimensions to determine best-fit archetype
  const archScores: Record<TradingArchetype, number> = {
    disciplined_strategist: 0,
    intuitive_risk_taker: 0,
    cautious_perfectionist: 0,
    emotional_reactor: 0,
    adaptive_analyst: 0,
    status_driven_competitor: 0,
    resilient_survivor: 0,
    anxious_overthinker: 0,
  };

  // Risk personality mapping
  if (scores.riskPersonality === "conservative_guardian") {
    archScores.cautious_perfectionist += 3;
    archScores.anxious_overthinker += 2;
  } else if (scores.riskPersonality === "calculated_risk_taker") {
    archScores.disciplined_strategist += 3;
    archScores.adaptive_analyst += 2;
  } else if (scores.riskPersonality === "aggressive_hunter") {
    archScores.intuitive_risk_taker += 3;
    archScores.status_driven_competitor += 2;
  } else if (scores.riskPersonality === "adaptive_chameleon") {
    archScores.adaptive_analyst += 2;
    archScores.resilient_survivor += 2;
  }

  // Decision style
  if (scores.decisionStyle === "intuitive") {
    archScores.intuitive_risk_taker += 2;
    archScores.emotional_reactor += 1;
  } else if (scores.decisionStyle === "analytical") {
    archScores.disciplined_strategist += 2;
    archScores.anxious_overthinker += 1;
  } else if (scores.decisionStyle === "hybrid") {
    archScores.adaptive_analyst += 1;
    archScores.resilient_survivor += 1;
  }

  // Money scripts
  if (scores.moneyScripts) {
    if (scores.moneyScripts.status >= 3) {
      archScores.status_driven_competitor += 3;
    }
    if (scores.moneyScripts.vigilance >= 3) {
      archScores.anxious_overthinker += 2;
      archScores.cautious_perfectionist += 1;
    }
    if (scores.moneyScripts.worship >= 3) {
      archScores.emotional_reactor += 1;
      archScores.status_driven_competitor += 1;
    }
    if (scores.moneyScripts.avoidance >= 3) {
      archScores.cautious_perfectionist += 1;
    }
  }

  // FOMO & Revenge (high = emotional reactor)
  if (scores.fomoRevengeScore !== undefined) {
    if (scores.fomoRevengeScore >= 3.5) {
      archScores.emotional_reactor += 3;
    } else if (scores.fomoRevengeScore >= 2.5) {
      archScores.emotional_reactor += 1;
      archScores.intuitive_risk_taker += 1;
    } else if (scores.fomoRevengeScore <= 2.5) {
      archScores.disciplined_strategist += 2;
    }
  }

  // Emotional regulation
  if (scores.emotionalRegulation === "reactive") {
    archScores.emotional_reactor += 3;
  } else if (scores.emotionalRegulation === "aware") {
    archScores.cautious_perfectionist += 1;
  } else if (scores.emotionalRegulation === "managed") {
    archScores.disciplined_strategist += 1;
  } else if (scores.emotionalRegulation === "mastered") {
    archScores.resilient_survivor += 2;
    archScores.disciplined_strategist += 1;
  }

  // Stress response
  if (scores.stressResponse === "resilient") {
    archScores.resilient_survivor += 3;
  } else if (scores.stressResponse === "analytical") {
    archScores.disciplined_strategist += 2;
  } else if (scores.stressResponse === "emotional") {
    archScores.emotional_reactor += 2;
    archScores.anxious_overthinker += 1;
  } else if (scores.stressResponse === "avoidant") {
    archScores.anxious_overthinker += 2;
  }

  // Bias awareness (high = analyst, low = reactor)
  if (scores.biasAwareness !== undefined) {
    if (scores.biasAwareness >= 3.5) {
      archScores.adaptive_analyst += 2;
    } else if (scores.biasAwareness <= 2.5) {
      archScores.emotional_reactor += 1;
    }
  }

  // Discipline (high = strategist, low = reactor)
  if (scores.disciplineScore !== undefined) {
    if (scores.disciplineScore >= 3.5) {
      archScores.disciplined_strategist += 2;
    } else if (scores.disciplineScore <= 2.5) {
      archScores.emotional_reactor += 1;
    }
  }

  // Loss aversion (high = cautious/anxious)
  if (scores.lossAversion !== undefined) {
    if (scores.lossAversion >= 2.5) {
      archScores.cautious_perfectionist += 1;
      archScores.anxious_overthinker += 1;
    } else if (scores.lossAversion <= 1.2) {
      archScores.intuitive_risk_taker += 1;
    }
  }

  // Return archetype with highest score
  return Object.entries(archScores).sort((a, b) => b[1] - a[1])[0][0] as TradingArchetype;
}
