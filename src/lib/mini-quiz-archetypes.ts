// ─── 2×2×2 Trading Archetype Framework ──────────────────────────────────────
// 3 binary dimensions → 8 unique archetypes
// Based on Behavioral Finance, Neuroeconomics & Decision Science

export type MiniArchetype =
  | "architect"
  | "tilt"
  | "librarian"
  | "paper_hand"
  | "chameleon"
  | "degen"
  | "diamond_hand"
  | "lurker";

export type Dimension = "decision_engine" | "risk_appetite" | "emotional_pattern";

export type DecisionEnginePole = "analytical" | "intuitive";
export type RiskAppetitePole = "aggressive" | "conservative";
export type EmotionalPatternPole = "controlled" | "reactive";

export type DimensionScores = {
  decision_engine: DecisionEnginePole;
  risk_appetite: RiskAppetitePole;
  emotional_pattern: EmotionalPatternPole;
};

export type MiniArchetypeInfo = {
  id: MiniArchetype;
  name: string;
  emoji: string;
  tagline: string;
  corePattern: string;
  howTheyTrade: string;
  strengths: string[];
  blindSpots: string[];
  triggerSituation: string;
  selfTalk: string;
  traverseFeature: string;
  shareDescription: string;
  ctaHook: string;
  dimensions: DimensionScores;
  recommendations: string[];
  avoid: string[];
};

// ─── Archetype Lookup Matrix ────────────────────────────────────────────────
// Key: `${decision_engine}_${risk_appetite}_${emotional_pattern}`

const ARCHETYPE_MATRIX: Record<string, MiniArchetype> = {
  analytical_aggressive_controlled: "architect",
  analytical_aggressive_reactive: "tilt",
  analytical_conservative_controlled: "librarian",
  analytical_conservative_reactive: "paper_hand",
  intuitive_aggressive_controlled: "chameleon",
  intuitive_aggressive_reactive: "degen",
  intuitive_conservative_controlled: "diamond_hand",
  intuitive_conservative_reactive: "lurker",
};

// ─── 8 Archetype Profiles ──────────────────────────────────────────────────

export const MINI_ARCHETYPES: Record<MiniArchetype, MiniArchetypeInfo> = {
  architect: {
    id: "architect",
    name: "The Architect",
    emoji: "📐",
    tagline: "The system is perfect. Until it isn't.",
    corePattern:
      "You build complex systems, backtest obsessively, and trust data over market noise. Your brain rewards being right more than being profitable: when your model confirms, dopamine spikes on the prediction match, not the profit.",
    howTheyTrade:
      "4 monitors, 3 indicators per chart, and a spreadsheet calculating R/R to two decimal places. You take the trade at 3.2:1 R/R. It goes against you. 50 points, 100 points. You don't close because 'the invalidation level hasn't been hit yet.' End of day: -$2,400 on a trade you should have closed at -$800.",
    strengths: [
      "Systematic thinking that produces consistent edge",
      "Emotional detachment from individual trades",
      "Risk management frameworks most traders lack",
    ],
    blindSpots: [
      "Can't admit when the model is wrong",
      "Confuses backtest results with live reality",
      "Doubles down instead of cutting when the system says 'hold'",
    ],
    triggerSituation:
      "A trade that meets every criterion and still loses. Your model said long, the market went short. Cognitive dissonance kicks in, and you double the position instead of closing.",
    selfTalk: "The data doesn't lie. The market is irrational, not me.",
    traverseFeature:
      "Expectation vs. Reality Dashboard: shows the gap between your backtest performance and real performance, forcing you to see model blind spots instead of rationalizing them.",
    shareDescription:
      "I'm The Architect. I trust my system more than the market. My edge is precision, my blind spot is admitting the model can be wrong.",
    ctaHook:
      "Your system is strong, but do you know where it breaks? The deep quiz maps your exact model-failure triggers.",
    dimensions: {
      decision_engine: "analytical",
      risk_appetite: "aggressive",
      emotional_pattern: "controlled",
    },
    recommendations: [
      "Journal every trade and track what your model predicted vs. what happened",
      "Set a hard 'model wrong' threshold: if drawdown exceeds 2x expected, close",
      "Review your worst 5 trades monthly and look for pattern-override situations",
      "Paper trade any new strategy for 30 trades before going live",
    ],
    avoid: [
      "Adding to losing positions just because 'the system says hold'",
      "Running more than 3 indicators (complexity ≠ edge)",
      "Skipping stop losses because 'the invalidation level is further'",
    ],
  },

  tilt: {
    id: "tilt",
    name: "The Tilt",
    emoji: "🔥",
    tagline: "Sharp enough to read the market. Too sharp not to cut yourself.",
    corePattern:
      "You're analytical enough to know what's right, but emotional enough to ignore it after a loss. Cortisol spikes during volatility and disconnects your prefrontal cortex from your amygdala: you HAVE the analysis, but cortisol shuts it off.",
    howTheyTrade:
      "Morning: clean trade by the plan, +$600. Midday: unexpected loss, -$400. Still net positive. But your brain registers the loss 2x stronger than the gain. 2:07 PM: you open a revenge trade with double position size. No setup, no plan. 2:23 PM: -$1,800 on the day.",
    strengths: [
      "Fast pattern recognition under pressure",
      "Strong analytical foundation when calm",
      "Reaction speed that becomes a real edge once managed",
    ],
    blindSpots: [
      "Confuses the energy of loss with a signal to act",
      "Revenge trades after breaking a winning streak",
      "'I feel strong' = cortisol, not competence",
    ],
    triggerSituation:
      "A loss after a winning streak. You expected 'today I'm hot,' but the first loss breaks the narrative and revenge mode activates.",
    selfTalk: "I'm getting that money back. Right now.",
    traverseFeature:
      "Cortisol Cooldown Timer: forces a 15-minute pause after losses over X%. Plus post-loss pattern analysis showing your actual win rate on trades taken within 30 minutes of a loss.",
    shareDescription:
      "I'm The Tilt. I have the analysis, but one loss flips the switch. My edge is speed, my blind spot is revenge trading.",
    ctaHook:
      "You already know your pattern. The deep quiz reveals your exact cortisol triggers and which loss sizes flip the switch.",
    dimensions: {
      decision_engine: "analytical",
      risk_appetite: "aggressive",
      emotional_pattern: "reactive",
    },
    recommendations: [
      "Implement a 15-minute cooldown rule after any loss over 1%",
      "Track your win rate on trades taken within 30 min of a loss vs. all other trades",
      "Set a daily loss limit: when hit, close the platform for the day",
      "Write down your emotional state before every trade (1-word check-in)",
    ],
    avoid: [
      "Trading within 30 minutes of a loss (your cortisol is still elevated)",
      "Increasing position size after a losing trade",
      "Trading during high emotional states (anger, frustration, excitement)",
    ],
  },

  librarian: {
    id: "librarian",
    name: "The Librarian",
    emoji: "📚",
    tagline: "Waiting for the perfect trade. The perfect trade isn't waiting for you.",
    corePattern:
      "Your dopamine system is calibrated for safety: every uncertainty is coded as a threat, not an opportunity. Your brain chooses 'no trade' because not acting feels safer than acting with 70% probability. You analyze every scenario until the opportunity is gone.",
    howTheyTrade:
      "Watchlist with 47 assets. Screener running 24/7. You see BTC at $62K with a clean higher-low setup. Check RSI, okay. MACD, okay. Volume, hmm, slightly low. Two hours later: BTC is at $64.8K and you're still checking your third indicator. Notebook full of 'almost-trades.'",
    strengths: [
      "Deep market understanding that's often better than profitable traders",
      "Rarely makes mistakes when actually trading",
      "Analytical depth most traders can't match",
    ],
    blindSpots: [
      "Measures success in 'losses avoided' instead of 'gains realized'",
      "Opportunity cost of non-trades is the biggest hidden loss",
      "One missing criterion becomes the reason not to trade, every time",
    ],
    triggerSituation:
      "A setup that meets 9 of 10 criteria. That one missing criterion becomes the reason not to trade. Every single time.",
    selfTalk: "I need one more confirmation. Better to miss a good trade than take a bad one.",
    traverseFeature:
      "Missed Trade Log: tracks setups you saw but DIDN'T take and shows their hypothetical outcomes. Makes opportunity cost visible instead of invisible.",
    shareDescription:
      "I'm The Librarian. I see every setup but take almost none. My edge is analysis, my blind spot is the trades I never take.",
    ctaHook:
      "Your analysis is sharp, but how much are your non-trades actually costing you? The deep quiz calculates your invisible losses.",
    dimensions: {
      decision_engine: "analytical",
      risk_appetite: "conservative",
      emotional_pattern: "controlled",
    },
    recommendations: [
      "Log every setup you see but DON'T take, and track hypothetical P&L for 30 days",
      "Create a 'good enough' checklist: if 7/10 criteria met, you MUST enter",
      "Start with minimum position size to reduce the emotional weight of entry",
      "Set a weekly 'minimum trades taken' target (even 2-3 per week)",
    ],
    avoid: [
      "Adding more indicators to an already-validated system",
      "Waiting for the 'perfect' entry that never comes",
      "Measuring success in 'losses avoided' instead of 'opportunities taken'",
    ],
  },

  paper_hand: {
    id: "paper_hand",
    name: "The Paper Hand",
    emoji: "🧻",
    tagline: "Sees the winner. Takes the profit. Way too early.",
    corePattern:
      "Your analytical brain says 'hold to target.' Your amygdala says 'THE CANDLE IS TURNING RED, GET OUT NOW.' In gains, you become risk-averse, taking the small certain win over the uncertain bigger one. You're the embodiment of Prospect Theory.",
    howTheyTrade:
      "Buy ETH at $3,200 with target $3,600 and stop at $3,050. ETH runs to $3,380. +$180 unrealized. A 5-min candle turns red. Heart beats faster. Close at $3,370. ETH runs to $3,580. This happens on 7 of 10 trades. Your win rate is 65%. Your profitability is negative.",
    strengths: [
      "Capital preservation: your account survives when others get liquidated",
      "High win rate that becomes profitable with proper exit management",
      "Natural risk awareness that protects against blow-ups",
    ],
    blindSpots: [
      "Winners are always smaller than losers (avg winner 0.4R vs. 1.0R loser)",
      "Pain is invisible: you never see big red losses, just many small green wins that don't add up",
      "The DIRECTION of P&L triggers the exit, not the absolute value",
    ],
    triggerSituation:
      "Unrealized profit starts shrinking. +$200 becomes +$180 becomes +$160. The direction of the P&L, not the amount, triggers the exit.",
    selfTalk: "Profit is profit. Better safe than greedy.",
    traverseFeature:
      "Trailing Stop Adherence Score: measures how often you take your planned exit vs. emotional exit. Plus R-Multiple Tracker showing your average winner vs. loser size.",
    shareDescription:
      "I'm The Paper Hand. 65% win rate but still not profitable. My edge is survival, my blind spot is cutting winners too early.",
    ctaHook:
      "Your win rate is already high. The deep quiz identifies exactly which emotional triggers make you exit too early.",
    dimensions: {
      decision_engine: "analytical",
      risk_appetite: "conservative",
      emotional_pattern: "reactive",
    },
    recommendations: [
      "Set profit targets BEFORE entering, and write them down physically",
      "Use trailing stops instead of manual exits to remove the emotion",
      "Track your average R-multiple: winners vs. losers size ratio",
      "Practice holding one trade to full target per week (just one)",
    ],
    avoid: [
      "Looking at P&L direction while in a trade. Focus on levels, not the number",
      "Closing a trade because a single candle turned red",
      "Taking profit before your stop-loss distance has been matched (< 1R winner)",
    ],
  },

  chameleon: {
    id: "chameleon",
    name: "The Chameleon",
    emoji: "🦎",
    tagline: "Your gut is your edge. And your biggest risk.",
    corePattern:
      "Your intuitive brain recognizes patterns faster than conscious analysis. 11 million bits/sec unconsciously vs. 40 bits/sec consciously. You have real intuition, but confuse it with impulse. Your dopamine rewards 'action' instead of 'right action.'",
    howTheyTrade:
      "Monday: swing trading with moving averages. Wednesday: 'This isn't working.' Switch to order flow. Friday: 'I have a feeling about SOL.' Ignore the setup, buy SOL on gut feeling. SOL pumps +15%. 'See? My instinct is better than any system.' 6 different strategies in 3 months. None with enough sample size to be statistically meaningful.",
    strengths: [
      "Reads market sentiment faster than any chart",
      "Adaptability that turns into real edge with discipline",
      "Pattern recognition that most systematic traders lack",
    ],
    blindSpots: [
      "Confuses boredom with a bad system",
      "Switches systems because dopamine craves novelty, not because the system failed",
      "3 losers in a row = 'the system is broken' (statistically meaningless sample)",
    ],
    triggerSituation:
      "A drawdown of 5+ trades. Not because of the money, but because the frequency of losses kills trust in the system. 3 losers in a row = 'time to switch.'",
    selfTalk: "I have a feeling about this trade. This time it's different.",
    traverseFeature:
      "System Loyalty Score: tracks how long you stick with a strategy. Plus win rate by system with minimum sample size warning: 'You abandoned Strategy X after 12 trades. Statistically, you need at least 50.'",
    shareDescription:
      "I'm The Chameleon. I switch systems faster than the market switches direction. My edge is intuition, my blind spot is never sticking long enough to prove it works.",
    ctaHook:
      "Your intuition might be real, but is it intuition or just dopamine? The deep quiz separates your actual edge from the noise.",
    dimensions: {
      decision_engine: "intuitive",
      risk_appetite: "aggressive",
      emotional_pattern: "controlled",
    },
    recommendations: [
      "Commit to one strategy for 50 trades minimum before switching",
      "Track 'system loyalty score': how many trades before you abandon a strategy",
      "When the urge to switch hits, journal WHY: boredom or evidence?",
      "Separate 'intuition trades' from 'system trades' in your journal",
    ],
    avoid: [
      "Switching strategies after fewer than 20 trades",
      "Confusing boredom with a broken system",
      "Running multiple unrelated strategies simultaneously",
    ],
  },

  degen: {
    id: "degen",
    name: "The Degen",
    emoji: "🎰",
    tagline: "Lives for the chaos trade. Dies by it.",
    corePattern:
      "You don't trade FOR profit. you trade for the RUSH. Dopamine deficit drives compulsive action-seeking. The crypto market IS a variable ratio schedule, like a slot machine, every trade could be the 100x. Your brain can't tell the difference between a good trade and an exciting one.",
    howTheyTrade:
      "3 AM. Twitter is exploding about a new token. No chart check, no research: market buy at $0.47. Token pumps to $0.62. +32% unrealized. Don't close. 'This goes to $1.' Token falls to $0.08. -83%. Next day: new token on Twitter. The loop isn't stupidity, it's neurochemical addiction.",
    strengths: [
      "Fearless entry while others are still analyzing",
      "Speed advantage in fast-moving markets",
      "Comfortable with volatility that paralyzes most traders",
    ],
    blindSpots: [
      "Can't distinguish signal from noise: both feel equally exciting",
      "Dopamine makes no difference between 'good trade' and 'exciting trade'",
      "Social media hype + fast price action = irresistible cocktail",
    ],
    triggerSituation:
      "High volatility + social media hype. Price is moving fast, Twitter is loud, CT says 'SEND IT.' The combination of tribe reward and hunt reward is irresistible for your dopamine system.",
    selfTalk: "This is the trade. NOW or never. LFG.",
    traverseFeature:
      "Impulse Trade Detector: flags trades placed within 60 seconds of opening the app. Plus social sentiment correlation showing trades correlated with high CT hype have a 23% win rate vs. 51% on calm trades.",
    shareDescription:
      "I'm The Degen. I live for the 3 AM chaos trade and the dopamine rush of clicking 'buy' before checking the chart.",
    ctaHook:
      "You know the rush. The deep quiz reveals exactly which triggers hijack your decision-making and how much they actually cost you.",
    dimensions: {
      decision_engine: "intuitive",
      risk_appetite: "aggressive",
      emotional_pattern: "reactive",
    },
    recommendations: [
      "Implement a 60-second delay rule: wait 60 seconds after seeing a setup before clicking buy",
      "Track where you found each trade idea: if it came from Twitter/CT, flag it",
      "Set a daily trade limit (max 3) and stop after hitting it",
      "Compare your win rate on impulsive trades vs. planned trades (the data will shock you)",
    ],
    avoid: [
      "Trading in the first 60 seconds after opening the app",
      "Acting on social media hype without checking a chart first",
      "Trading between midnight and 6 AM when decision quality drops sharply",
    ],
  },

  diamond_hand: {
    id: "diamond_hand",
    name: "The Diamond Hand",
    emoji: "💎",
    tagline: "Your conviction is your strength. And your prison.",
    corePattern:
      "Traders sell winners 4x more often than losers. You're the extreme: you hold losers not because you can't see the loss, but because you're emotionally BOUND to the position. Every day you hold is another commitment. 'I've held this long, giving up now would be a waste.'",
    howTheyTrade:
      "Bought BTC at $69K. It fell to $16K. Never sold, not because of a plan, but because selling would have made the loss 'real.' Two years later: BTC at $100K, feels validated. But you did the same with LUNA. And FTT. Survivorship bias masks a destructive habit as 'patience.'",
    strengths: [
      "Emotional stability and conviction in a market full of noise",
      "Patience that becomes a real competitive advantage with proper frameworks",
      "Ability to weather drawdowns that shake out most traders",
    ],
    blindSpots: [
      "Can't distinguish 'patience' from 'denial': both feel identical",
      "Survivorship bias: remembers BTC recovery, forgets LUNA & FTT",
      "The moment selling is rational is exactly when the brain resists most",
    ],
    triggerSituation:
      "An asset you've held for months starts fundamentally weakening. Not the price drop, but the moment where SELLING is the rational option. That's when your brain resists hardest.",
    selfTalk: "I believe in this project. Short-term fluctuations are noise.",
    traverseFeature:
      "Conviction vs. Evidence Score: tracks fundamental changes (team departures, TVL drops, regulatory news) and compares them to your holding decision. Forces you to answer: 'Would you open this position TODAY at the current price?'",
    shareDescription:
      "I'm The Diamond Hand: my conviction is unshakable, even when it should shake. My edge is patience, my blind spot is confusing it with denial.",
    ctaHook:
      "Conviction is powerful, but only when backed by evidence. The deep quiz maps where your patience crosses into denial.",
    dimensions: {
      decision_engine: "intuitive",
      risk_appetite: "conservative",
      emotional_pattern: "controlled",
    },
    recommendations: [
      "Ask yourself weekly: 'Would I open this position TODAY at the current price?'",
      "Track fundamental changes (team departures, TVL drops) alongside price",
      "Set a 'time-based stop': if your thesis hasn't played out in X weeks, reassess",
      "Separate your identity from your positions: you are not your portfolio",
    ],
    avoid: [
      "Holding a position just because selling 'makes the loss real'",
      "Using survivorship bias to justify holding (BTC recovered ≠ everything recovers)",
      "Ignoring fundamental deterioration because the price 'might come back'",
    ],
  },

  lurker: {
    id: "lurker",
    name: "The Lurker",
    emoji: "👁️",
    tagline: "Sees every trade. Takes none.",
    corePattern:
      "Unlike The Librarian (who over-analyzes), you don't act because the FEAR OF THE WRONG TRADE is stronger than the DESIRE FOR THE RIGHT ONE. Your brain hates uncertainty more than pain, but you also have the fear of regret on top. You FEEL the market, want to trade, and freeze.",
    howTheyTrade:
      "Open the app. SOL at $148. 'That's going to $160.' Place a limit at $145. SOL drops to $146.50 and bounces. Limit not filled. SOL runs to $163. Next day: 'Okay, market buy this time.' Cursor over the button. Heart pounds. 'What if it drops right after I buy?' Close the app. A week later: your non-trade would have been +22%. Actual P&L: $0.00.",
    strengths: [
      "Market feel: you see moves before they happen",
      "Intuition that's real but has no execution mechanism",
      "Zero blow-up risk (your account always survives)",
    ],
    blindSpots: [
      "P&L is always $0, never loses money, so the problem 'doesn't feel that bad'",
      "Opportunity cost is the real loss but it's invisible on every statement",
      "The act of committing, pressing the button, is the trigger, not any specific setup",
    ],
    triggerSituation:
      "Every trade. Literally every one. The moment of commitment, pressing the button, is the trigger. It's not a specific setup, it's the act of taking action itself.",
    selfTalk: "Next time. Next setup. When I'm more sure.",
    traverseFeature:
      "Intuition Scorecard: log your gut feelings about setups (bullish/bearish/neutral) and Traverse tracks hypothetical outcomes WITHOUT you taking the trade. Builds confidence through proof: 'Your intuition was correct 67% of the time. You have an edge. Now use it.'",
    shareDescription:
      "I'm The Lurker: I see every winning trade and take none. My edge is market feel, my blind spot is the button I can never press.",
    ctaHook:
      "Your intuition might already be profitable: you just don't know it yet. The deep quiz builds your confidence map and shows where your gut is actually right.",
    dimensions: {
      decision_engine: "intuitive",
      risk_appetite: "conservative",
      emotional_pattern: "reactive",
    },
    recommendations: [
      "Log every gut feeling about a setup (bullish/bearish/neutral) WITHOUT trading",
      "After 30 logged predictions, check your accuracy: you likely have real edge",
      "Start with the smallest position your broker allows, just to practice committing",
      "Set one 'must-take trade per week' rule: if your top setup appears, you execute",
    ],
    avoid: [
      "Setting limit orders slightly too aggressive so they 'just miss' (unconscious avoidance)",
      "Spending more time watching than doing. Set a max 'chart time' without a trade",
      "Telling yourself 'next time' more than twice in a row",
    ],
  },
};

// ─── Scoring ────────────────────────────────────────────────────────────────

import type { QuizQuestion } from "./mini-quiz-questions";

/**
 * Weighted scoring: each answer option has a weight (1 = leaning, 2 = strong).
 * Supports both single-select (string) and multi-select (string[]) answers.
 */
export function computeMiniArchetype(
  answers: Record<string, string | string[]>,
  questions: QuizQuestion[],
): { archetype: MiniArchetype; dimensions: DimensionScores } {
  const tallies: Record<Dimension, Record<string, number>> = {
    decision_engine: { analytical: 0, intuitive: 0 },
    risk_appetite: { aggressive: 0, conservative: 0 },
    emotional_pattern: { controlled: 0, reactive: 0 },
  };

  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer) continue;

    // Multi-select: array of option IDs. Single-select: one option ID.
    const selectedIds = Array.isArray(answer) ? answer : [answer];

    for (const optId of selectedIds) {
      const option = q.options.find((o) => o.id === optId);
      if (!option) continue;
      tallies[q.dimension][option.pole] += option.weight;
    }
  }

  const dimensions: DimensionScores = {
    decision_engine:
      tallies.decision_engine.analytical >= tallies.decision_engine.intuitive
        ? "analytical"
        : "intuitive",
    risk_appetite:
      tallies.risk_appetite.aggressive >= tallies.risk_appetite.conservative
        ? "aggressive"
        : "conservative",
    emotional_pattern:
      tallies.emotional_pattern.controlled >= tallies.emotional_pattern.reactive
        ? "controlled"
        : "reactive",
  };

  const key = `${dimensions.decision_engine}_${dimensions.risk_appetite}_${dimensions.emotional_pattern}`;
  const archetype = ARCHETYPE_MATRIX[key] ?? "architect";

  return { archetype, dimensions };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const ALL_ARCHETYPES = Object.keys(MINI_ARCHETYPES) as MiniArchetype[];

export function isValidArchetype(slug: string): slug is MiniArchetype {
  return slug in MINI_ARCHETYPES;
}
