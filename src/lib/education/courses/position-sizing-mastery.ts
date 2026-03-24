import type { CourseDefinition } from "../types";

export const POSITION_SIZING_MASTERY: CourseDefinition = {
  slug: "position-sizing-mastery",
  title: "Position Sizing Mastery",
  description:
    "Go beyond the basics. Learn Kelly Criterion, volatility-adjusted sizing, portfolio heat, and the math that professional fund managers use to size every trade.",
  emoji: "📐",
  category: "strategy",
  difficulty: "intermediate",
  recommendedFor: ["intuitive_risk_taker", "status_driven_competitor"],
  totalXP: 210,
  published: true,
  lessons: [
    {
      slug: "why-sizing-is-your-edge",
      title: "Why Sizing Is Your Edge",
      description: "Two traders, same strategy, different sizing — wildly different results.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Here's a paradox: two traders can use the exact same strategy, take the exact same trades, and one makes money while the other goes broke. The difference? Position sizing.\n\nPosition sizing isn't about how much you *can* risk. It's about how much you *should* risk to maximize long-term growth while surviving inevitable drawdowns.\n\n### The Van Tharp Experiment\n\nDr. Van Tharp gave 50 traders the same set of trades (predetermined outcomes). The only variable: how much each trader bet per trade. Results ranged from +400% to -100% (total wipeout). Same trades. Different sizing. Completely different outcomes.\n\n### Why Most Traders Size Wrong\n\n1. **Emotion-based sizing** — \"I'm really confident\" = bigger position. Confidence is a feeling, not a statistical edge.\n2. **Round number sizing** — \"I'll just buy 1 BTC\" regardless of stop distance or account size.\n3. **Revenge sizing** — Doubling up after a loss to \"make it back.\" The fastest path to account destruction.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Position sizing is the only variable that determines whether a winning strategy actually makes money. A profitable strategy with bad sizing loses. A mediocre strategy with optimal sizing can still compound.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "psm-1-1",
              question: "In Van Tharp's experiment, what was the only variable that differed between traders?",
              options: ["The strategy", "The market conditions", "Position sizing", "Risk tolerance"],
              correctIndex: 2,
              explanation: "All traders received the same predetermined trades. The only variable was how much each trader chose to bet per trade. Results ranged from +400% to total wipeout.",
            },
          ],
        },
      ],
    },
    {
      slug: "fixed-fractional-method",
      title: "The Fixed Fractional Method",
      description: "The foundation of professional risk management — risking a fixed percentage per trade.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "The fixed fractional method is the most widely used position sizing approach among professional traders. You risk a fixed percentage of your current account equity on each trade.\n\n### The Formula\n\n**Position Size = (Account × Risk%) / Risk Per Unit**\n\nWhere Risk Per Unit = Entry Price - Stop Loss Price\n\n### Example\n\n- Account: $25,000\n- Risk per trade: 1.5% = $375\n- Entry: $100 (stock)\n- Stop loss: $95 (5% below entry)\n- Risk per unit: $5\n- Position size: $375 / $5 = 75 shares = $7,500 position\n\n### Why It Works\n\n**Self-correcting:** After a drawdown, your account is smaller, so 1.5% is a smaller dollar amount. You naturally reduce size when losing. After a winning streak, your account is larger, so you naturally increase size. The math compounds.\n\n**Survivable:** At 1% risk per trade, you can lose 50 consecutive trades and still have 60% of your account. At 2%, 50 losses leaves you with 36%. Choose your percentage based on your strategy's maximum expected losing streak.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Most professionals use 0.5% to 2% risk per trade. If you're unsure, start at 1%. You can always increase once you have 100+ trades of data proving your edge.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "psm-2-1",
              question: "Why does the fixed fractional method naturally reduce risk during drawdowns?",
              options: [
                "It uses stop losses",
                "The percentage stays the same but the account is smaller, so the dollar amount decreases",
                "It limits the number of trades per day",
                "It adjusts the stop loss distance",
              ],
              correctIndex: 1,
              explanation: "1% of $25,000 is $250. After a drawdown to $20,000, 1% is only $200. The percentage is constant, but the dollar risk automatically decreases with your account — providing a built-in safety mechanism.",
            },
          ],
        },
      ],
    },
    {
      slug: "kelly-criterion",
      title: "The Kelly Criterion",
      description: "The mathematically optimal bet size — and why you should use half of it.",
      readingTime: 8,
      xpReward: 40,
      content: [
        {
          type: "text",
          content:
            "The Kelly Criterion was developed by John Kelly at Bell Labs in 1956. It calculates the mathematically optimal fraction of your capital to risk, given your win rate and payoff ratio.\n\n### The Formula\n\n**Kelly% = W - (1-W) / R**\n\nWhere:\n- W = Win rate (as a decimal, e.g., 0.55 for 55%)\n- R = Win/Loss ratio (average win ÷ average loss)\n\n### Example\n\n- Win rate: 55% (W = 0.55)\n- Average win: $300, Average loss: $200 (R = 1.5)\n- Kelly% = 0.55 - (0.45 / 1.5) = 0.55 - 0.30 = 0.25 = 25%\n\n### Why You Should Never Use Full Kelly\n\nFull Kelly maximizes long-term growth but creates enormous drawdowns. Professional traders use \"Half Kelly\" or \"Quarter Kelly\":\n\n- **Full Kelly (25%):** Maximum growth, but 50%+ drawdowns are common\n- **Half Kelly (12.5%):** 75% of the growth, dramatically smoother equity curve\n- **Quarter Kelly (6.25%):** Very smooth curve, still solid returns\n\nThe reduction in growth is small. The reduction in drawdowns is massive.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "The Kelly Criterion requires ACCURATE win rate and R:R estimates. If your estimates are off, Full Kelly can be catastrophic. This is the strongest argument for Half Kelly — it's robust against estimation errors.",
        },
        {
          type: "text",
          content:
            "### When Kelly Doesn't Apply\n\n- **Few trades:** Need 100+ trades to estimate W and R reliably\n- **Non-stationary edge:** Markets change. Your win rate from 2024 may not apply in 2025\n- **Correlated bets:** Kelly assumes independent bets. If all your trades are in crypto, they're correlated\n- **Psychological limits:** If Kelly says 15% but you can't sleep at night, use less",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "psm-3-1",
              question: "Why do professional traders typically use Half Kelly instead of Full Kelly?",
              options: [
                "Full Kelly is illegal for retail traders",
                "Half Kelly provides 75% of the growth with dramatically smaller drawdowns",
                "Full Kelly only works for stocks, not crypto",
                "Half Kelly is faster to calculate",
              ],
              correctIndex: 1,
              explanation: "Half Kelly sacrifices only about 25% of the theoretical growth rate but reduces drawdowns dramatically. The slightly lower return is well worth the much smoother equity curve and psychological comfort.",
            },
          ],
        },
      ],
    },
    {
      slug: "volatility-adjusted-sizing",
      title: "Volatility-Adjusted Sizing",
      description: "Use ATR to automatically size larger in calm markets and smaller in volatile ones.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "A 2% stop on Bitcoin when it's moving 5% daily is very different from a 2% stop when it's moving 1% daily. Volatility-adjusted sizing accounts for this.\n\n### ATR-Based Position Sizing\n\nATR (Average True Range) measures how much an asset typically moves per period. Use it to set stops and size positions:\n\n**Stop Distance = N × ATR**\nTypically N = 2 or 3 (2 ATRs below entry for a long)\n\n**Position Size = (Account × Risk%) / (N × ATR)**\n\n### Example\n\n- Account: $50,000, Risk: 1% = $500\n- BTC price: $60,000, 14-day ATR: $2,000\n- Stop distance: 2 × $2,000 = $4,000 below entry\n- Position size: $500 / $4,000 = 0.125 BTC = $7,500\n\nIf volatility doubles (ATR = $4,000):\n- Stop distance: 2 × $4,000 = $8,000\n- Position size: $500 / $8,000 = 0.0625 BTC = $3,750\n\nYour dollar risk stays constant ($500), but position size automatically halves. The market got riskier, so you got smaller.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Volatility-adjusted sizing means you're taking the same RISK in every trade, even though market conditions change. This is the difference between risking 1% of your account and risking 1% of your account in volatility-adjusted terms.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "psm-4-1",
              question: "What happens to your position size when ATR doubles?",
              options: [
                "It doubles",
                "It stays the same",
                "It halves",
                "It depends on the trend",
              ],
              correctIndex: 2,
              explanation: "When ATR doubles, the stop distance doubles, so your position size halves to maintain the same dollar risk. This is the self-correcting nature of volatility-adjusted sizing.",
            },
          ],
        },
      ],
    },
    {
      slug: "portfolio-heat",
      title: "Portfolio Heat: Total Risk Exposure",
      description: "Individual trade risk is necessary but not sufficient — you need to manage total portfolio risk.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "You can risk 1% per trade and still blow up your account. How? By having 20 correlated trades open simultaneously. That's 20% risk in a single market move.\n\n### What Is Portfolio Heat?\n\nPortfolio heat = the total open risk across all positions if every stop gets hit simultaneously.\n\n**Portfolio Heat = Sum of (Risk per trade) for all open positions**\n\n### Maximum Heat Guidelines\n\n- **Conservative:** 5% max portfolio heat\n- **Moderate:** 10% max portfolio heat\n- **Aggressive:** 15% max portfolio heat\n\n### Correlation Matters\n\n5 crypto positions at 2% each = 10% heat on paper. But if crypto crashes, all 5 lose simultaneously. Your *effective* heat is higher.\n\n**Rule of thumb:** Treat correlated positions as a single position for heat calculations. 5 crypto trades = 1 crypto bet × 5.\n\n### Practical Application\n\nBefore entering a new trade:\n1. Calculate your current portfolio heat\n2. Add the proposed trade's risk\n3. If total exceeds your max heat → skip or reduce size\n4. Track this in your Traverse journal",
        },
        {
          type: "callout",
          variant: "warning",
          content: "The most common cause of large drawdowns isn't a single bad trade — it's too many correlated trades hitting stops at the same time. Portfolio heat is how you prevent this.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "psm-5-1",
              question: "You have 4 crypto trades open, each risking 2%. What is your effective portfolio heat, and why might it be higher than 8%?",
              options: [
                "It's exactly 8% because each trade risks 2%",
                "It's lower than 8% due to diversification",
                "It's effectively higher than 8% because crypto positions are correlated — they'll likely all move together",
                "It depends on the stop loss distance",
              ],
              correctIndex: 2,
              explanation: "While the nominal heat is 8% (4 × 2%), crypto assets are highly correlated. In a market crash, all 4 positions hit stops simultaneously. Your effective risk is much closer to a single 8% bet than four independent 2% bets.",
            },
          ],
        },
      ],
    },
    {
      slug: "sizing-for-different-strategies",
      title: "Sizing for Different Strategies",
      description: "Scalping, swing trading, and position trading each demand different sizing approaches.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Your position sizing should match your strategy's characteristics. A scalper and a position trader have fundamentally different sizing needs.\n\n### Scalping (Minutes to Hours)\n- **Stop distance:** Tight (0.1-0.5% of price)\n- **Position size:** Larger (because stops are close)\n- **Risk per trade:** 0.25-0.5% (many trades per day)\n- **Key concern:** Transaction costs eat into small gains\n\n### Day Trading (Hours)\n- **Stop distance:** Moderate (0.5-2% of price)\n- **Position size:** Standard fixed fractional\n- **Risk per trade:** 0.5-1%\n- **Key concern:** Daily loss limit (stop after 3% daily drawdown)\n\n### Swing Trading (Days to Weeks)\n- **Stop distance:** Wide (2-5% of price, often ATR-based)\n- **Position size:** Smaller (wider stops = less units)\n- **Risk per trade:** 1-2%\n- **Key concern:** Overnight/weekend gap risk\n\n### Position Trading (Weeks to Months)\n- **Stop distance:** Very wide (5-15% or structural levels)\n- **Position size:** Small\n- **Risk per trade:** 1-2%\n- **Key concern:** Portfolio heat, adding to winners",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Match your sizing to your strategy, not your confidence. A swing trader should never use scalping-size positions — the wider stops will create massive losses when hit.",
        },
        {
          type: "text",
          content:
            "### Your Sizing Framework\n\nBased on what you've learned:\n1. Choose your method: Fixed fractional for most, volatility-adjusted for advanced\n2. Set your risk %: Match to your strategy type\n3. Calculate every trade: Use Traverse's Risk Calculator\n4. Track portfolio heat: Never exceed your maximum\n5. Review monthly: Is your actual risk matching your planned risk?\n\nThe best traders are boringly consistent with sizing. It's not glamorous, but it's what keeps them in the game.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "psm-6-1",
              question: "Why do scalpers typically risk a smaller percentage per trade than swing traders?",
              options: [
                "Scalping is less profitable",
                "They take many more trades per day, so the total daily risk compounds faster",
                "Scalping is harder",
                "The markets are more volatile for scalpers",
              ],
              correctIndex: 1,
              explanation: "A scalper might take 20-50 trades per day. At 1% risk each, that's 20-50% potential daily risk. By using 0.25-0.5% per trade, the total daily exposure stays manageable even with high trade frequency.",
            },
          ],
        },
      ],
    },
  ],
};
