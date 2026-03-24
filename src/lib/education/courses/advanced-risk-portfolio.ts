import type { CourseDefinition } from "../types";

export const ADVANCED_RISK_PORTFOLIO: CourseDefinition = {
  slug: "advanced-risk-portfolio",
  title: "Advanced Risk: Portfolio & Correlation",
  description:
    "Beyond single-trade risk. Learn portfolio construction, correlation analysis, drawdown recovery math, and the risk frameworks used by hedge funds.",
  emoji: "📊",
  category: "risk-management",
  difficulty: "advanced",
  recommendedFor: [
    "disciplined_strategist",
    "cautious_perfectionist",
    "adaptive_analyst",
  ],
  totalXP: 210,
  published: true,
  lessons: [
    {
      slug: "correlation-the-hidden-risk",
      title: "Correlation: The Hidden Risk",
      description: "Why 10 'diversified' crypto positions can behave like one giant bet.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### What Is Correlation?\n\nCorrelation measures how two assets move relative to each other:\n- **+1.0:** Perfect positive correlation — they move identically\n- **0.0:** No correlation — they move independently\n- **-1.0:** Perfect negative correlation — they move opposite\n\n### Why Correlation Matters\n\nDiversification only works when assets are uncorrelated. If all your positions are correlated, your \"diversified\" portfolio is really just one big bet.\n\n**Crypto example:**\n- BTC/ETH correlation: typically 0.85-0.95\n- BTC/SOL correlation: typically 0.75-0.90\n- BTC/DOGE correlation: typically 0.70-0.85\n\nFive crypto positions at 2% risk each looks like 10% total risk. But with correlations above 0.80, your effective risk is more like 8-9% in a single correlated bet.\n\n### Correlation During Crises\n\nHere's the dangerous part: correlations increase during crises. Assets that normally move somewhat independently all crash together. This is called \"correlation convergence\" and it means your risk is highest precisely when you need diversification most.\n\n**2022 example:** Crypto, tech stocks, and growth assets all crashed simultaneously despite normally having moderate correlation. The \"uncorrelated\" portfolio wasn't uncorrelated when it mattered.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "Diversification is a fair-weather friend. The assets you think are uncorrelated often become highly correlated during market stress — exactly when you need diversification to work.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "arp-1-1",
              question: "You have 5 crypto positions, each risking 2%. The average correlation between them is 0.85. What's the most accurate description of your total risk?",
              options: [
                "10% — the risks simply add up",
                "2% — diversification reduces risk",
                "Close to 8-9% — high correlation means the positions behave almost as one bet",
                "0% — the positions cancel each other out",
              ],
              correctIndex: 2,
              explanation: "With 0.85 correlation, the positions move nearly in lockstep. Your '5 separate bets' are effectively one large bet. In a crypto crash, all 5 positions will likely move against you simultaneously.",
            },
          ],
        },
      ],
    },
    {
      slug: "drawdown-math",
      title: "The Mathematics of Drawdowns",
      description: "The exponential math that makes large drawdowns nearly impossible to recover from.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Recovery Problem\n\nDrawdowns and recoveries are asymmetric. The math is unforgiving:\n\n| Drawdown | Return Needed to Recover | Time at 1%/day |\n|----------|-------------------------|----------------|\n| 10% | 11.1% | ~11 days |\n| 20% | 25% | ~25 days |\n| 30% | 42.9% | ~43 days |\n| 40% | 66.7% | ~67 days |\n| 50% | 100% | ~100 days |\n| 70% | 233% | ~233 days |\n| 90% | 900% | ~2.5 years |\n\nThe key insight: past 20%, every additional percentage of drawdown becomes exponentially harder to recover from. This is why preventing large drawdowns is more important than maximizing returns.\n\n### Maximum Drawdown as a Constraint\n\nProfessional fund managers set their maximum acceptable drawdown FIRST, then design their strategy around it.\n\n- **Conservative fund:** 10% max drawdown → limits position sizing, limits number of positions, limits leverage\n- **Moderate fund:** 20% max drawdown → more flexibility, still constrained\n- **Aggressive fund:** 30% max drawdown → high returns potential, high recovery burden\n\n### Your Drawdown Budget\n\nThink of drawdown as a budget:\n- Set your maximum tolerable drawdown (recommended: 15-20% for retail)\n- Divide by the number of uncorrelated risk units\n- This determines your per-unit risk allocation",
        },
        {
          type: "callout",
          variant: "insight",
          content: "A 50% drawdown requires a 100% return to recover. If your edge returns 15% annually, that's nearly 5 years to get back to breakeven. This is why risk management is more important than returns.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "arp-2-1",
              question: "Why is preventing a 40% drawdown more important than achieving a 40% return?",
              options: [
                "It isn't — they're mathematically equivalent",
                "Because a 40% drawdown requires 66.7% return to recover, but a 40% return from breakeven only requires 40% — the asymmetry makes losses more damaging than equivalent gains",
                "Because drawdowns hurt more emotionally",
                "Because of transaction costs",
              ],
              correctIndex: 1,
              explanation: "Losing 40% requires gaining 66.7% just to get back to zero. The asymmetry means each additional percentage of loss costs exponentially more to recover. Preserving capital is mathematically more valuable than growing it by the same percentage.",
            },
          ],
        },
      ],
    },
    {
      slug: "portfolio-construction",
      title: "Portfolio Construction Basics",
      description: "How to build a portfolio of trades that maximizes return while constraining drawdowns.",
      readingTime: 8,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Three Dimensions of Portfolio Risk\n\n**1. Per-trade risk:** How much can you lose on each individual trade (covered in Risk Management Fundamentals)\n\n**2. Portfolio heat:** Total open risk across all positions (covered in Position Sizing Mastery)\n\n**3. Correlation structure:** How your positions interact with each other (this lesson)\n\n### Building Blocks\n\n**Uncorrelated strategies:** The most powerful diversification isn't asset diversification — it's strategy diversification.\n- Trend following + Mean reversion (inversely correlated in ranging markets)\n- Long-term positions + Day trades (different time horizons)\n- Different asset classes (crypto + stocks + commodities)\n\n**Allocation framework:**\n1. Define 2-3 independent strategies or markets\n2. Allocate risk budget to each (e.g., 40% trend following, 40% mean reversion, 20% scalping)\n3. Set per-strategy drawdown limits\n4. If one strategy hits its drawdown limit, pause it — don't redistribute its risk to other strategies\n\n### The Equal Risk Contribution Model\n\nInstead of allocating equal CAPITAL to each strategy, allocate equal RISK:\n- If Strategy A is low-volatility (ATR = 1%), allocate more capital\n- If Strategy B is high-volatility (ATR = 5%), allocate less capital\n- Result: each strategy contributes equally to portfolio risk\n\nThis prevents a single volatile strategy from dominating your portfolio's behavior.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Even within crypto, you can achieve some diversification: BTC (store of value narrative) vs. DeFi tokens (yield narrative) vs. L1 platforms (tech narrative). Same asset class, somewhat different drivers.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "arp-3-1",
              question: "What is more effective for portfolio diversification: holding 10 different cryptos, or running 2 uncorrelated trading strategies?",
              options: [
                "10 different cryptos — more assets means more diversification",
                "2 uncorrelated strategies — strategy diversification is more powerful because crypto assets are highly correlated with each other",
                "They're equally effective",
                "Neither — diversification doesn't work in crypto",
              ],
              correctIndex: 1,
              explanation: "10 cryptos with 0.85 correlation to BTC provide almost no diversification. Two truly uncorrelated strategies (e.g., trend following + mean reversion, or crypto + forex) provide real diversification because they're driven by different market conditions.",
            },
          ],
        },
      ],
    },
    {
      slug: "leverage-and-margin",
      title: "Leverage: The Double-Edged Sword",
      description: "How leverage amplifies everything — gains, losses, emotions, and the speed of account destruction.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### What Leverage Actually Does\n\nLeverage borrows money to increase position size. 10x leverage means a 1% move creates a 10% P&L. This works in both directions.\n\n| Leverage | 5% Price Move | 10% Price Move |\n|----------|--------------|----------------|\n| 1x (no leverage) | ±5% | ±10% |\n| 3x | ±15% | ±30% |\n| 5x | ±25% | ±50% |\n| 10x | ±50% | ±100% (liquidation) |\n| 20x | ±100% (liquidation) | — |\n\n### The Liquidation Problem\n\nAt 10x leverage, a 10% adverse move liquidates your position — you lose 100% of your margin. The exchange doesn't wait for you to decide. It's automatic and irreversible.\n\n### How to Use Leverage Responsibly\n\n**Rule 1: Same dollar risk, smaller capital**\nUse leverage to achieve the same position size with less capital committed, NOT to take larger positions.\n\nExample without leverage: Risk 1% ($100) on $10,000 account, need $5,000 position.\nExample with 5x leverage: Same $100 risk, but only $1,000 margin required.\n\n**Rule 2: Never exceed 3x effective leverage on your total portfolio**\nIf your account is $10,000, your total position value across all trades shouldn't exceed $30,000.\n\n**Rule 3: Wider stops when leveraged**\nLeverage makes noise more dangerous. A normal stop at 2% becomes a 20% margin loss at 10x. Either widen stops or reduce leverage.\n\n**Rule 4: No leverage during high volatility**\nWhen ATR is above its 90th percentile, reduce or eliminate leverage. Volatility + leverage = liquidation.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "At 100x leverage (available on many crypto exchanges), a 1% move liquidates you. This isn't trading — it's a coin flip with a 1% edge to the house. No professional trader uses 100x leverage.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "arp-4-1",
              question: "What is the responsible way to use leverage?",
              options: [
                "Use maximum available leverage to maximize profit potential",
                "Use leverage to achieve the same dollar risk with less capital committed — not to take larger bets",
                "Never use leverage under any circumstances",
                "Only use leverage during high-volatility periods for bigger moves",
              ],
              correctIndex: 1,
              explanation: "Leverage should reduce capital requirements, not increase risk. A $100 risk is a $100 risk whether you achieve it with $5,000 at 1x or $1,000 at 5x. The danger is using leverage to take $500 risks with a $10,000 account.",
            },
          ],
        },
      ],
    },
    {
      slug: "risk-adjusted-returns",
      title: "Risk-Adjusted Returns: Sharpe, Sortino & Beyond",
      description: "Why raw returns are meaningless without context. Learn the metrics that actually measure trading skill.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Raw Returns Are Misleading\n\nTrader A: +50% return, 40% maximum drawdown\nTrader B: +25% return, 8% maximum drawdown\n\nWho's better? Most would say Trader A. But Trader B is far superior — they achieved half the return with one-fifth the risk. Scaled up to equal risk, Trader B would crush Trader A.\n\n### Sharpe Ratio\n\n**Sharpe = (Return - Risk-Free Rate) / Standard Deviation of Returns**\n\nMeasures return per unit of total volatility. Higher is better.\n- Below 0.5: Poor\n- 0.5-1.0: Acceptable\n- 1.0-2.0: Good\n- Above 2.0: Excellent\n- Above 3.0: Suspicious (check for survivorship bias)\n\n### Sortino Ratio\n\nLike Sharpe, but only penalizes DOWNSIDE volatility. Upside volatility (big wins) isn't punished.\n\n**Sortino = (Return - Risk-Free Rate) / Downside Deviation**\n\nGenerally more relevant for traders because we WANT upside volatility.\n\n### Maximum Drawdown & Calmar Ratio\n\n**Calmar Ratio = Annual Return / Maximum Drawdown**\n\nA Calmar of 2.0 means your return is twice your worst drawdown. This is the single most intuitive risk-adjusted metric.\n\n### Why These Matter\n\nRisk-adjusted metrics let you:\n1. Compare strategies fairly (same risk basis)\n2. Identify how much you can scale a strategy (Sharpe tells you the efficiency)\n3. Determine optimal leverage (Kelly-optimal leverage ≈ Sharpe²)\n4. Detect degradation early (Sharpe declining = edge eroding)",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse calculates many of these metrics in your Performance → Metrics page. Focus on your Sortino ratio and maximum drawdown. If your Sortino is above 1.0 with a max drawdown under 15%, you have a solid edge.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "arp-5-1",
              question: "Trader A has +100% return with 60% max drawdown. Trader B has +30% return with 10% max drawdown. Who has a better Calmar ratio?",
              options: [
                "Trader A (100/60 = 1.67)",
                "Trader B (30/10 = 3.0)",
                "They're equal",
                "Can't determine without more data",
              ],
              correctIndex: 1,
              explanation: "Trader B's Calmar ratio (30/10 = 3.0) is nearly double Trader A's (100/60 = 1.67). Trader B achieves their returns much more efficiently. If Trader B increased risk to match Trader A's drawdown, their return would far exceed 100%.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-your-risk-dashboard",
      title: "Building Your Risk Dashboard",
      description: "The daily and weekly risk checks that keep your portfolio healthy long-term.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Your Daily Risk Checklist\n\n**Before trading:**\n- [ ] Total portfolio heat is within limit\n- [ ] No single position exceeds max per-trade risk\n- [ ] Correlation check: not overconcentrated in one sector/asset class\n- [ ] Leverage check: effective portfolio leverage below 3x\n- [ ] Check open P&L — any position approaching your max loss?\n\n**During trading:**\n- [ ] New trade doesn't push heat above maximum\n- [ ] New trade's correlation to existing positions is acceptable\n- [ ] Position size calculated (not guessed)\n\n**End of day:**\n- [ ] Review total exposure\n- [ ] Log any rule violations\n\n### Your Weekly Risk Review\n\n1. **Drawdown status:** Current drawdown from peak. If above 10%, reduce all sizes.\n2. **Risk-adjusted metrics:** Is your rolling Sortino/Sharpe improving or declining?\n3. **Correlation scan:** Any new correlations developing between positions?\n4. **Strategy allocation:** Is each strategy within its risk budget?\n5. **Leverage audit:** Maximum leverage used this week\n\n### Using Traverse for Risk Management\n\n- **Risk Calculator:** Use before every trade for position sizing\n- **Analytics → Running P&L:** Track your equity curve and drawdowns\n- **Performance → Metrics:** Monitor Sharpe, Sortino, max drawdown\n- **Nova:** Ask her to audit your risk exposure weekly\n\n### The Compound Effect of Risk Management\n\nSmall improvements in risk management compound dramatically. Reducing your max drawdown from 30% to 15% over a year doesn't just preserve capital — it preserves your psychological capital, your confidence, and your ability to execute when opportunities arise.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The best traders don't have the best entries. They have the best risk management. Entries determine the direction of a trade. Risk management determines whether you survive long enough for your edge to compound.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "arp-6-1",
              question: "Your portfolio drawdown reaches 12% from peak. What should you do?",
              options: [
                "Trade bigger to recover faster",
                "Add leverage to amplify returns",
                "Reduce all position sizes and only take the highest-conviction setups until the drawdown recovers",
                "Stop trading for a month",
              ],
              correctIndex: 2,
              explanation: "Reducing position sizes during drawdowns limits further damage and preserves capital. Only taking highest-conviction setups improves your win rate during recovery. This is defensive mode — you'll recover more slowly but more reliably.",
            },
          ],
        },
      ],
    },
  ],
};
