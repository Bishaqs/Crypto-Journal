import type { CourseDefinition } from "../types";

export const RISK_MANAGEMENT_FUNDAMENTALS: CourseDefinition = {
  slug: "risk-management-fundamentals",
  title: "Risk Management Fundamentals",
  description:
    "Risk management isn't optional — it's the entire game. Learn position sizing, stop losses, and the frameworks that keep professional traders in the game for decades.",
  emoji: "🛡️",
  category: "risk-management",
  difficulty: "beginner",
  recommendedFor: [
    "intuitive_risk_taker",
    "status_driven_competitor",
    "resilient_survivor",
  ],
  totalXP: 155,
  published: true,
  lessons: [
    {
      slug: "why-risk-management-is-everything",
      title: "Why Risk Management Is Everything",
      description: "The one skill that separates traders who survive from those who blow up.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "Here's a counterintuitive truth: the best traders in the world are wrong more often than they're right. Many profitable traders have a win rate below 50%. They survive — and thrive — because of risk management.\n\n### The Math of Ruin\n\nIf you lose 50% of your account, you need a 100% return just to break even. Not 50% — *100%*. This asymmetry is why risk management is the single most important skill in trading.\n\n| Loss | Recovery Needed |\n|------|-----------------|\n| 10% | 11.1% |\n| 25% | 33.3% |\n| 50% | 100% |\n| 75% | 300% |\n| 90% | 900% |\n\nOne bad week without risk management can undo months of profitable trading.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "\"Risk comes from not knowing what you're doing.\" — Warren Buffett. In trading, risk comes from not *managing* what you're doing.",
        },
        {
          type: "text",
          content:
            "### The Professional Approach\n\nProfessional traders think in terms of risk first, reward second. Before asking \"how much can I make?\", they ask:\n\n1. How much can I lose on this trade?\n2. Can I afford that loss?\n3. What's my risk-to-reward ratio?\n\nIf the answers aren't satisfactory, they don't take the trade — no matter how good the setup looks.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rm-1-1",
              question: "If you lose 50% of your trading account, what return do you need to break even?",
              options: ["50%", "75%", "100%", "150%"],
              correctIndex: 2,
              explanation: "A 50% loss requires a 100% gain to recover. $10,000 → $5,000 (50% loss) → need to double $5,000 back to $10,000 (100% gain).",
            },
          ],
        },
      ],
    },
    {
      slug: "position-sizing",
      title: "Position Sizing",
      description: "The most important calculation in trading — how much to risk per trade.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Position sizing answers one question: *How big should this trade be?* The answer isn't \"as big as possible\" or \"whatever feels right.\" It's a calculation.\n\n### The Percentage Risk Model\n\nThe most common approach: risk a fixed percentage of your account on each trade. Most professionals use 1-2%.\n\n**Example:**\n- Account: $10,000\n- Risk per trade: 1% = $100\n- Entry: $50,000 (BTC)\n- Stop loss: $49,000 (2% below entry)\n- Risk per unit: $1,000\n- Position size: $100 / $1,000 = 0.1 BTC ($5,000 position)\n\nThe formula:\n\n**Position Size = (Account × Risk%) / (Entry - Stop Loss)**\n\nNotice: your position size is determined by your stop loss placement. Wider stops = smaller positions. Tighter stops = larger positions (but more likely to get stopped out).",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse's Risk Calculator does this math for you. Enter your account size, risk percentage, entry, and stop — it calculates your position size instantly.",
        },
        {
          type: "text",
          content:
            "### Why 1-2%?\n\nAt 1% risk per trade, you can lose 20 trades in a row and still have 82% of your account. At 5% risk per trade, 20 losses leaves you with only 36%. At 10%, you're at 12%.\n\nThe 1-2% rule isn't conservative — it's survival.\n\n### Position Sizing Mistakes\n\n1. **Sizing based on conviction** — \"I'm really confident, so I'll go bigger.\" Your confidence is a feeling, not an edge.\n2. **Averaging down without a plan** — Adding to losers increases your risk, not your reward.\n3. **Ignoring correlation** — 5 trades in crypto at 2% each isn't 2% risk. If crypto crashes, all 5 lose simultaneously. That's 10% risk.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rm-2-1",
              question: "You have a $20,000 account and want to risk 1%. Your stop loss is $200 below your entry. What's your max position size?",
              options: ["$200", "$1,000", "$2,000", "$20,000"],
              correctIndex: 1,
              explanation: "Risk amount = $20,000 × 1% = $200. Position size = $200 / $200 per unit risk = 1 unit. If each unit costs $1,000, your position size is $1,000.",
            },
          ],
        },
      ],
    },
    {
      slug: "stop-losses",
      title: "Stop Losses: Your Safety Net",
      description: "How to place stops that protect your capital without getting you stopped out unnecessarily.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "A stop loss is your pre-committed exit point if the trade goes against you. It's not optional — it's the foundation of everything we discussed in the previous lessons.\n\n### Types of Stop Losses\n\n**Technical stops** — Based on chart structure. Below support, below a trendline, below a key moving average. These are the best because they invalidate your thesis.\n\n**Percentage stops** — A fixed percentage below entry (e.g., 2%). Simple but doesn't account for market structure.\n\n**Volatility stops** — Based on ATR (Average True Range). Wider stops in volatile markets, tighter in calm markets. Adapts automatically.\n\n**Time stops** — If the trade hasn't moved in your direction within X hours/days, exit. Dead money is expensive.\n\n### Stop Placement Rules\n\n1. **Set your stop before entering** — Not after. The stop determines your position size.\n2. **Never move stops further away** — This is the emotional brain negotiating. Moving stops closer (trailing) is fine.\n3. **Accept that stops get hit** — A stop hit is your risk management working. It's a feature, not a bug.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "\"I'll just watch it and exit manually if it goes bad\" — This is not a stop loss. This is hoping. Hoping is not a strategy.",
        },
        {
          type: "text",
          content:
            "### Mental Stops vs. Hard Stops\n\nA mental stop is a price level where you plan to exit. A hard stop is an actual order on the exchange.\n\n**Use hard stops when:**\n- You can't watch the market 24/7\n- You've ever moved a mental stop (be honest)\n- You're trading with leverage\n\nThe best stop is the one you actually follow.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rm-3-1",
              question: "When should you move your stop loss further away from entry?",
              options: ["When the trade is going against you", "When volatility increases", "Never", "When you're confident it will recover"],
              correctIndex: 2,
              explanation: "Moving a stop further away increases your risk beyond what you originally planned. This is almost always an emotional decision. Move stops closer (trailing) as the trade moves in your favor, never further away.",
            },
          ],
        },
      ],
    },
    {
      slug: "risk-reward-ratio",
      title: "The Risk-to-Reward Ratio",
      description: "Why winning less than half your trades can still make you profitable.",
      readingTime: 5,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "The risk-to-reward ratio (R:R) compares what you risk to what you expect to gain. It's the relationship between your stop loss and your take profit.\n\n### Understanding R:R\n\n- **1:1** — Risk $100 to make $100\n- **1:2** — Risk $100 to make $200\n- **1:3** — Risk $100 to make $300\n\nWith a 1:3 R:R, you only need to win 25% of your trades to break even. With a 1:2, you need 33%. With a 1:1, you need 50%.\n\n### The Minimum R:R\n\nMost professional traders won't take a trade with less than 1:2 R:R. Some insist on 1:3 or higher. The higher the R:R, the fewer winners you need.\n\n### R:R in Practice\n\n**Setting your take profit:**\n1. Identify the next resistance/support level\n2. Calculate the distance from entry to that level\n3. Compare to the distance from entry to your stop\n4. If the ratio is less than 1:2, skip the trade or find a better entry\n\n### Common R:R Mistakes\n\n1. **Unrealistic targets** — A 1:10 R:R looks great, but if the target never gets hit, it's worthless.\n2. **Moving take profits** — Greed says \"let it run.\" Sometimes that's right. But having a plan and following it matters more.\n3. **Ignoring probability** — A 1:3 trade that wins 10% of the time is worse than a 1:1 trade that wins 60% of the time.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse automatically calculates your realized R:R on every trade. Check your Performance → Expectancy page to see if your actual R:R matches your planned R:R.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rm-4-1",
              question: "With a 1:3 risk-to-reward ratio, what win rate do you need to break even?",
              options: ["25%", "33%", "50%", "75%"],
              correctIndex: 0,
              explanation: "At 1:3 R:R, each win makes 3R and each loss costs 1R. To break even: wins × 3R = losses × 1R. With a 25% win rate: 25 wins × 3 = 75R gained, 75 losses × 1 = 75R lost. Break even.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-your-risk-framework",
      title: "Building Your Risk Framework",
      description: "Combine everything into a personal risk management system you'll actually follow.",
      readingTime: 5,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "A risk framework is your personal set of rules that governs every trade. Write yours down. Print it out. Put it next to your screen.\n\n### Your Risk Framework Template\n\n**Per-Trade Rules:**\n- Maximum risk per trade: ____% (recommended: 1-2%)\n- Minimum R:R ratio: ____ (recommended: 1:2)\n- Stop loss type: ____ (technical / percentage / volatility)\n- Maximum position size: ____% of account\n\n**Per-Day Rules:**\n- Maximum trades per day: ____\n- Maximum daily loss: ____% (recommended: 3-5%)\n- After ____ consecutive losses, stop for the day\n\n**Per-Week/Month Rules:**\n- Maximum weekly drawdown: ____% (recommended: 5-10%)\n- If weekly drawdown is hit: reduce position sizes by 50% next week\n- Monthly review: compare planned risk vs. actual risk",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The best risk framework is the one you follow. A simple framework followed consistently beats a complex one you ignore when stressed.",
        },
        {
          type: "text",
          content:
            "### Implementing in Traverse\n\n1. **Risk Calculator** — Use it before every trade to size your position\n2. **Trade Log** — Record your planned stop and target with every entry\n3. **Rules Tracker** — Set up your risk rules and track daily compliance\n4. **Weekly Reports** — Review your actual risk metrics vs. your framework\n5. **Nova** — Ask her to analyze your risk behavior patterns\n\n### What You've Learned\n\nYou now understand:\n- Why risk management is the #1 priority\n- How to size positions using the percentage risk model\n- How to place and manage stop losses\n- How risk-to-reward ratios determine required win rates\n- How to build a personal risk framework\n\nThe next step: apply this to your next trade. Open Traverse, use the Risk Calculator, set your stop *before* entering. Track your compliance in the Rules Tracker.",
        },
      ],
    },
  ],
};
