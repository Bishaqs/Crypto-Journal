// ─── Deep Quiz Scoring Engine ───────────────────────────────────────────────
// Produces a nuanced profile per archetype from deep quiz answers

import type { MiniArchetype } from "./mini-quiz-archetypes";
import type { DeepQuizQuestion } from "./deep-quiz-questions";

export type CategoryScore = {
  category: string;
  label: string;
  score: number; // 1-4 average
  level: "critical" | "developing" | "solid" | "strong";
};

export type DeepProfile = {
  archetype: MiniArchetype;
  overallScore: number; // 1-4 average across all categories
  overallLevel: "beginner" | "developing" | "intermediate" | "advanced";
  categories: CategoryScore[];
  topStrength: string;
  biggestGap: string;
  advice: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  triggers: "Trigger Awareness",
  coping: "Recovery & Coping",
  risk_behavior: "Risk Management",
  self_awareness: "Self-Awareness",
  growth: "Growth Mindset",
};

function getLevel(score: number): CategoryScore["level"] {
  if (score < 1.75) return "critical";
  if (score < 2.5) return "developing";
  if (score < 3.25) return "solid";
  return "strong";
}

function getOverallLevel(score: number): DeepProfile["overallLevel"] {
  if (score < 1.75) return "beginner";
  if (score < 2.5) return "developing";
  if (score < 3.25) return "intermediate";
  return "advanced";
}

// ─── Archetype-specific advice ──────────────────────────────────────────────

const ARCHETYPE_ADVICE: Record<MiniArchetype, Record<CategoryScore["level"], string[]>> = {
  architect: {
    critical: [
      "Your system confidence is overriding reality. Start logging every time your model says 'hold' and the trade would have been better closed at -$X.",
      "Run a 'Model vs. Reality' audit on your last 20 trades. Compare predicted R/R to actual R/R. The gap is your blind spot.",
      "Set a hard rule: if a trade is down 2R regardless of what your model says, you exit. The model doesn't have a 'wrong' clause — you need to add one.",
    ],
    developing: [
      "You're starting to see the gap between backtest and live results. Track your 'model override' rate — how often you deviate from the system, and whether those deviations help or hurt.",
      "Simplify: try trading with 2 indicators instead of 5 for one week. More complexity doesn't always mean more edge.",
    ],
    solid: [
      "Your analytical edge is real. Focus on flexibility — the best systems have explicit 'this model is wrong' exit criteria.",
      "Consider adding a 'regime detector' that tells you when your model's assumptions no longer hold.",
    ],
    strong: [
      "You've evolved past rigid systems. Keep refining the boundary between 'trust the model' and 'override the model' — that line IS your real edge.",
    ],
  },
  tilt: {
    critical: [
      "Implement a mandatory 15-minute break after any loss over 1R. No exceptions. Set a phone timer that physically separates you from the screen.",
      "Set a daily loss limit at 2R total. When you hit it, the trading day is over. Treat this like a hard rule, not a guideline.",
      "Track your 'post-loss trade' results separately. You'll likely find they have a 20-30% lower win rate than your planned trades.",
    ],
    developing: [
      "You recognize the revenge pattern but struggle to stop it. Try this: after a loss, write ONE sentence about what you feel before your next trade. This engages the prefrontal cortex and weakens the cortisol hijack.",
      "Your best trades come when you're calm. Structure your day so the highest-probability setups come BEFORE your emotional risk window.",
    ],
    solid: [
      "Your awareness is strong. Refine your post-loss protocol — the difference between 'I know I should stop' and 'I have a system that stops me' is the gap between knowing and doing.",
      "Track your cortisol triggers by time of day. Most tilt traders have a 2-3 hour window where 80% of revenge trades happen.",
    ],
    strong: [
      "You've built real emotional discipline. The next edge: use your fast pattern recognition as a feature, not a bug — your speed becomes an advantage when the impulse is managed.",
    ],
  },
  librarian: {
    critical: [
      "Start a Missed Trade Log today. Track every setup you see but don't take. After 2 weeks, calculate the hypothetical P&L. Making opportunity cost visible is the fastest way to break analysis paralysis.",
      "Set a 'decision timer': 5 minutes from seeing a setup to entering or passing. No extensions. The goal is action, not perfection.",
      "Lower your entry criteria from 10/10 to 7/10. Track the results. You'll likely find 7/10 setups perform almost identically to 10/10 ones.",
    ],
    developing: [
      "Your analysis IS your edge — the problem isn't the analysis, it's the execution gap. Try 'paper trigger' entries: set alerts at your entry price and see how often the setup works without your interference.",
      "Reduce your watchlist to 5 assets. Fewer options = less analysis paralysis = more action.",
    ],
    solid: [
      "You're taking more trades. Optimize your confirmation process — the fastest path from 'setup spotted' to 'position entered' is your competitive advantage now.",
      "Consider a 'minimum trade' rule: take at least 1 trade per day (even tiny size) to build the execution muscle.",
    ],
    strong: [
      "Your analysis + execution combination is powerful. Focus on scaling up — your missed trade rate is probably low enough to start increasing position sizes on high-conviction setups.",
    ],
  },
  paper_hand: {
    critical: [
      "Hide your P&L during trades. Seriously. Trade the chart, not the number. Most platforms let you minimize the P&L display.",
      "Try partial exits: close 50% at 1R, let the other 50% ride to your full target. This gives you the 'locking in profit' feeling while leaving upside alive.",
      "Track your average R-multiple on winners vs. losers. If winners average 0.4R and losers average 1.0R, your exits are the problem, not your entries.",
    ],
    developing: [
      "You know you exit too early. Start with one simple change: move your stop to breakeven at 1R instead of closing the entire position.",
      "Reframe profit: +$200 on a trade with a $600 target isn't 'profit' — it's 33% of the plan. Would you leave a job after doing 33% of the work?",
    ],
    solid: [
      "Your win rate is probably excellent. The next step is ensuring your winners are at least 1.5x the size of your losers. Track R-multiples religiously.",
      "Practice 'set and forget' on 1 trade per week: enter, set stop and target, walk away. Don't touch it.",
    ],
    strong: [
      "You've developed exit discipline. The real edge now: letting your biggest conviction trades run past 2R. Your initial target might be conservative.",
    ],
  },
  chameleon: {
    critical: [
      "Pick ONE strategy. Trade it for 50 trades minimum before evaluating. Create a checklist: 'I will not switch systems until I have 50 completed trades with this one.'",
      "Stop consuming trading content for 2 weeks. No YouTube, no CT, no new strategy posts. You have enough knowledge — you need execution, not information.",
      "Track your strategy switches. Write down why you switch each time. After a month, you'll see the pattern: it's rarely because the system failed.",
    ],
    developing: [
      "Your intuition IS real — but it needs a framework. Try this: use your gut to FILTER setups, but use your system to ENTER them. Gut says 'this feels good' + system confirms = trade.",
      "Set a 'minimum sample size' rule: no strategy changes until 30 completed trades. Pin this to your monitor.",
    ],
    solid: [
      "You've learned to stick with strategies longer. Now optimize: track your gut calls separately from system trades. After 50+ data points, you'll know exactly when to trust your intuition.",
      "Boredom management is your key challenge. Find a way to stay engaged during flat periods that doesn't involve changing your system.",
    ],
    strong: [
      "Your adaptability is now a strength, not a weakness. The edge: you can read regime changes faster than pure systematic traders. Use that as a feature.",
    ],
  },
  degen: {
    critical: [
      "Install a 60-second delay between opening your trading app and being able to place a trade. Use that time to run through a 3-point checklist: Is this on my watchlist? Do I have a stop? Is my size correct?",
      "Delete trading apps from your phone. Trade only from desktop, during planned hours. Removing access removes impulse.",
      "Track the correlation between your trade timing and social media activity. Trades made within 5 minutes of a CT browse have dramatically worse results.",
    ],
    developing: [
      "You're aware of the impulse pattern. Try 'planned degen' — allocate 10% of your account to impulse trades, 90% to planned ones. Review monthly which performed better.",
      "Before any trade, answer this out loud: 'Is this a setup or a feeling?' If you can't name the setup, don't trade.",
    ],
    solid: [
      "Your awareness is growing. Next: build a 'pre-flight checklist' that runs before every trade. 3 items max. If any item fails, no trade.",
      "Track your 'impulse win rate' vs. 'planned win rate.' The data will make the argument for you.",
    ],
    strong: [
      "You've channeled the degen energy productively. Your speed and fearlessness is a real edge — in the RIGHT setups. Keep the intensity, refine the filter.",
    ],
  },
  diamond_hand: {
    critical: [
      "For every position, answer this question weekly: 'Would I buy this at today's price with today's information?' If the answer is no, you're holding out of sunk cost, not conviction.",
      "Create a 'thesis journal' for each position. Write down your original buy thesis, and list 3 conditions that would invalidate it. Check these monthly.",
      "Track fundamental changes separately from price changes. Price going down is not a reason to sell. The CEO leaving, TVL collapsing, or regulation changing IS.",
    ],
    developing: [
      "You've started differentiating patience from denial. Next step: add position-size rules. Even if you hold, reduce size when fundamentals weaken.",
      "Review your biggest holding losses. For each one: would a 'sell if thesis breaks' rule have saved you? The answer builds the case for exit criteria.",
    ],
    solid: [
      "Your conviction is becoming evidence-based. Keep refining: the best diamond hands know WHEN to fold. That's not weakness — it's sophistication.",
      "Consider a 'position review day' monthly where you re-evaluate every holding from scratch as if you didn't own it.",
    ],
    strong: [
      "Your holding discipline combined with exit criteria makes you powerful. The edge: you hold through noise that shakes others out, but exit when the signal actually changes.",
    ],
  },
  lurker: {
    critical: [
      "Start with $10 trades. Not $100, not $50 — $10. The goal isn't profit, it's building the neural pathway for execution. Press the button. Every day.",
      "Track your market predictions for 2 weeks WITHOUT trading. Just log 'bullish/bearish' on setups. After 2 weeks, review accuracy. This builds evidence that your reads are real.",
      "Set a 'minimum execution' goal: 1 trade per day, any size. The trade matters less than the act of committing.",
    ],
    developing: [
      "You're starting to take small trades. Increase size very gradually — 10%, not 100%. Each increase should feel slightly uncomfortable but not paralyzing.",
      "Use limit orders set in advance (during calm analysis) to bypass the in-the-moment freeze. Let your calm self make the decision, not your scared self.",
    ],
    solid: [
      "Your execution rate is improving. Focus on sizing up now — the next growth phase is going from '$50 trades' to 'real position sizes' that match your analysis quality.",
      "Your market read accuracy is probably higher than you think. Trust the data you've been collecting.",
    ],
    strong: [
      "You've broken through the action barrier. Your intuition + execution is a rare combination. Most traders have one or the other — you have both.",
    ],
  },
};

// ─── Main scoring function ──────────────────────────────────────────────────

export function scoreDeepQuiz(
  archetype: MiniArchetype,
  answers: Record<string, number>,
  questions: DeepQuizQuestion[],
): DeepProfile {
  // Group scores by category
  const categoryScores: Record<string, number[]> = {};

  for (const q of questions) {
    const score = answers[q.id];
    if (score === undefined) continue;
    if (!categoryScores[q.category]) categoryScores[q.category] = [];
    categoryScores[q.category].push(score);
  }

  // Compute per-category averages
  const categories: CategoryScore[] = Object.entries(categoryScores).map(([cat, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      score: Math.round(avg * 10) / 10,
      level: getLevel(avg),
    };
  });

  // Sort by score to find strength and gap
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const topStrength = sorted[0]?.label ?? "Self-Awareness";
  const biggestGap = sorted[sorted.length - 1]?.label ?? "Trigger Awareness";

  // Overall
  const allScores = categories.map((c) => c.score);
  const overallScore = allScores.length > 0
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : 2;
  const overallLevel = getOverallLevel(overallScore);

  // Pick advice based on the weakest category level
  const weakestLevel = sorted[sorted.length - 1]?.level ?? "developing";
  const advice = ARCHETYPE_ADVICE[archetype]?.[weakestLevel] ?? [];

  return {
    archetype,
    overallScore,
    overallLevel,
    categories,
    topStrength,
    biggestGap,
    advice,
  };
}
