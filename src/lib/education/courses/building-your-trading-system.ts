import type { CourseDefinition } from "../types";

export const BUILDING_YOUR_TRADING_SYSTEM: CourseDefinition = {
  slug: "building-your-trading-system",
  title: "Building Your Trading System",
  description:
    "Move from discretionary chaos to systematic consistency. Design a rules-based trading system that fits your personality, schedule, and risk tolerance.",
  emoji: "🏗️",
  category: "strategy",
  difficulty: "intermediate",
  recommendedFor: [
    "disciplined_strategist",
    "adaptive_analyst",
    "resilient_survivor",
  ],
  totalXP: 250,
  published: true,
  lessons: [
    {
      slug: "discretionary-vs-systematic",
      title: "Discretionary vs. Systematic Trading",
      description: "Why 'I'll just feel it out' is the most expensive strategy in trading.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Spectrum\n\nTrading approaches exist on a spectrum:\n\n**Fully discretionary:** No rules. Every decision is made in the moment based on intuition, chart reading, and \"feel.\" Maximum flexibility, minimum consistency.\n\n**Rules-guided discretionary:** You have rules, but you override them when it \"feels right.\" This is where most retail traders live — and it's the danger zone.\n\n**Systematic discretionary:** Clear rules for everything, but human judgment decides whether market conditions warrant trading at all. This is the sweet spot for most traders.\n\n**Fully systematic:** Algorithm. No human intervention. High consistency but requires programming skills and extensive backtesting.\n\n### Why Pure Discretion Fails\n\n1. **Inconsistency:** Your decisions change based on mood, sleep, and recent results\n2. **No data:** If every trade is different, you can't measure what works\n3. **Bias amplification:** Every cognitive bias operates at full power\n4. **No improvement path:** Without rules, you can't identify what to fix\n\n### The Goal of This Course\n\nMove you from wherever you are on the spectrum toward \"systematic discretionary\" — clear rules that you follow, with the human judgment to know when conditions aren't right.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The best traders in the world aren't the most creative. They're the most boring. They do the same thing, the same way, every single day. Consistency IS the edge.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-1-1",
              question: "Why is 'rules-guided discretionary' (having rules but overriding them by feel) dangerous?",
              options: [
                "Because rules are always wrong",
                "Because overriding rules means every cognitive bias operates at full power when it matters most",
                "Because it's too rigid",
                "Because it requires too much knowledge",
              ],
              correctIndex: 1,
              explanation: "Having rules but overriding them is worse than having no rules — it gives the illusion of discipline while allowing biases to take over precisely when emotions are highest (the moments you override).",
            },
          ],
        },
      ],
    },
    {
      slug: "defining-your-edge",
      title: "Defining Your Edge",
      description: "What is an edge, how do you find one, and how do you know when you have one?",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### What Is an Edge?\n\nAn edge is a statistical advantage — a situation where the probability of a favorable outcome is higher than random chance, or where the average payoff exceeds the average cost.\n\n**Edge = (Win Rate × Average Win) - (Loss Rate × Average Loss)**\n\nIf this number is positive over a large sample, you have an edge.\n\n### Where Edges Come From\n\n1. **Technical patterns** — Price action setups that work slightly more than 50% of the time with favorable R:R\n2. **Time-based advantages** — Trading at specific times (London open, US close) when certain patterns are more reliable\n3. **Instrument-specific behavior** — Understanding how a specific asset moves (BTC weekend volatility, gold during FOMC)\n4. **Psychological edges** — Simply being more disciplined than the average participant gives you an edge\n5. **Information edges** — Understanding on-chain data, COT reports, or sector flows better than consensus\n\n### How Many Trades to Confirm an Edge\n\n- 30 trades: Meaningless (too much noise)\n- 100 trades: Suggestive (beginning of a pattern)\n- 200 trades: Reasonable confidence\n- 500+ trades: Statistically robust\n\nYour Traverse Edge Profile needs at least 50-100 trades to show reliable patterns. Below that, any pattern you see might be random.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "Backtesting results are NOT confirmation of an edge. A strategy that looks great in backtesting can fail forward because of overfitting, transaction costs, slippage, and the psychological reality of executing with real money.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-2-1",
              question: "You tested a strategy on 25 trades and it has a 68% win rate. Should you go live with full size?",
              options: [
                "Yes — 68% is a strong win rate",
                "No — 25 trades is far too small to confirm an edge. The 68% could easily be random variance",
                "Yes, but with smaller positions",
                "Only if the R:R is above 1:2",
              ],
              correctIndex: 1,
              explanation: "25 trades is statistically meaningless. With that sample size, a random 50/50 strategy could easily show 68% by chance. You need 100-200+ trades before you can have reasonable confidence that a pattern is real, not noise.",
            },
          ],
        },
      ],
    },
    {
      slug: "entry-rules",
      title: "Designing Entry Rules",
      description: "Create specific, repeatable entry criteria that remove ambiguity from your trading.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Entry Rule Framework\n\nEvery entry needs three things:\n\n**1. Setup (What you're looking for)**\nA specific chart pattern or condition. Not \"bullish price action\" — that's subjective. Something like: \"Price bounces off the 200 EMA with a bullish engulfing candle on the 4H chart.\"\n\n**2. Trigger (When to enter)**\nThe specific event that says \"enter NOW.\" Usually the close of a confirmation candle, a break above/below a specific level, or a volume spike.\n\n**3. Filter (When NOT to enter)**\nConditions that invalidate the setup. Examples: don't enter against the higher timeframe trend, don't enter within 30 minutes of major news, don't enter if RSI is already overbought.\n\n### Writing Your Rules\n\nGood rules are:\n- **Specific:** \"Close above the 50 EMA on the daily chart\" not \"price is bullish\"\n- **Binary:** Either the condition is met or it isn't. No \"kind of\" or \"close enough\"\n- **Observable:** Based on data you can see, not feelings\n- **Limited:** 3-5 conditions maximum. More than that and you'll never find a trade\n\n### The Playbook Approach\n\nDon't have one set of rules for all situations. Build a playbook of 2-4 setups, each with its own entry rules. Traverse's Playbook feature is designed for exactly this.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Before entering any trade, you should be able to complete this sentence: \"I'm entering this trade because [setup] was confirmed by [trigger] while [filter] conditions are met.\" If you can't fill in all three, you don't have a valid entry.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-3-1",
              question: "What's wrong with the entry rule: 'Enter when the chart looks bullish'?",
              options: [
                "Nothing — intuition is important in trading",
                "It's too specific",
                "It's too subjective and ambiguous — different traders will interpret 'looks bullish' differently, and your own interpretation changes based on your mood",
                "It doesn't include a stop loss",
              ],
              correctIndex: 2,
              explanation: "\"Looks bullish\" is subjective. On a good day, everything looks bullish. After a loss, nothing does. Entry rules must be specific, binary (yes/no), and observable — so they work the same way regardless of your emotional state.",
            },
          ],
        },
      ],
    },
    {
      slug: "exit-rules",
      title: "Designing Exit Rules",
      description: "Entries get you into trades. Exits determine your profit. Most traders spend 90% of their time on the wrong one.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Why Exits Matter More Than Entries\n\nTwo traders enter the same trade at the same price. One exits at +2R, the other at -3R. Same entry, completely different outcome. Exits determine:\n- How much you make when you're right\n- How much you lose when you're wrong\n- Your average R:R ratio — the foundation of profitability\n\n### The Three Exit Types\n\n**1. Stop Loss (Protective Exit)**\nPre-determined. Set before entry. Non-negotiable.\n- Technical: Below support, below pattern low\n- ATR-based: 2× ATR below entry\n- Never move further away from entry\n\n**2. Take Profit (Target Exit)**\nWhere you plan to exit a winner.\n- Fixed R:R target (e.g., always exit at 2R)\n- Technical target (next resistance, Fibonacci extension)\n- Trailing stop (lock in profits as trade moves in your favor)\n\n**3. Time Stop**\nExit if the trade hasn't moved in your direction after X hours/days.\n- Prevents dead money sitting in sideways trades\n- Typical: 3-5 days for swing trades, 1-4 hours for day trades\n\n### Scaling Out vs. All-Out\n\n**All-out:** Simple. Exit entire position at one level. Easier to track, easier to backtest.\n\n**Scaling out:** Exit 50% at 1R, trail stop on remaining 50%. More complex but can capture bigger moves.\n\nFor beginners: start with all-out at a fixed R:R target. Add complexity later with data.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The single most impactful change most traders can make: define your exit BEFORE you enter. If you don't know where you're getting out, you don't have a trade plan — you have a hope.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-4-1",
              question: "What is a 'time stop' and why is it useful?",
              options: [
                "A stop loss that triggers at a specific time of day",
                "Exiting a trade that hasn't moved in your direction after a predetermined period — it prevents capital from sitting idle in dead trades",
                "A limit on how long you trade each day",
                "A stop loss based on time-weighted average price",
              ],
              correctIndex: 1,
              explanation: "A time stop exits a trade that's going nowhere. If your swing trade hasn't moved after 5 days, your thesis is likely wrong. Time stops free up capital and mental energy for better opportunities.",
            },
          ],
        },
      ],
    },
    {
      slug: "trade-management-rules",
      title: "Trade Management Rules",
      description: "What to do DURING a trade — trailing stops, scaling, and the art of doing nothing.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Hardest Part of Trading\n\nYou're in a trade. It's going your way. Do you:\na) Move your stop to breakeven?\nb) Take partial profit?\nc) Let it ride to your target?\nd) Close it because you're scared of giving back gains?\n\nWithout pre-defined management rules, this decision is made by your emotions — and emotions make terrible trade managers.\n\n### Trade Management Framework\n\n**Rule 1: Move stop to breakeven after 1R of profit**\nThis eliminates risk while keeping upside. Simple and effective.\n\n**Rule 2: Trail your stop using a defined method**\n- Swing lows (for longs): move stop below each new swing low\n- ATR trail: stop = price minus 2× ATR, recalculated daily\n- Moving average trail: stop follows the 20 EMA\n\n**Rule 3: Don't add to losers**\nAveraging down is tempting but it's doubling your bet when the market is proving you wrong.\n\n**Rule 4: Only add to winners if planned**\nScaling in to winning positions can be powerful, but only with pre-defined rules (e.g., add 50% at 1R, move stop on entire position to breakeven).\n\n### The Art of Doing Nothing\n\nThe most underrated trade management rule: do nothing. You entered with a plan. Your stop is set. Your target is defined. Now leave it alone.\n\nChecking your trade every 5 minutes doesn't make it move faster. It just gives your emotional brain opportunities to override your rational plan.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Set alerts at your stop and target levels instead of watching the chart. This removes the temptation to micromanage. Your plan is set — let it work.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-5-1",
              question: "Your trade is up 1.5R. You have no pre-defined management rules. What's the biggest risk right now?",
              options: [
                "The trade reversing to a loss",
                "Not making enough profit",
                "Making an emotional decision — without rules, whatever you do will be driven by fear or greed in the moment",
                "Transaction costs",
              ],
              correctIndex: 2,
              explanation: "Without pre-defined rules, every management decision during a live trade is made under emotional pressure. You might sell too early (fear) or hold too long (greed). The solution: define your management rules before you enter, not during.",
            },
          ],
        },
      ],
    },
    {
      slug: "backtesting-and-forward-testing",
      title: "Testing Your System",
      description: "How to validate your trading system before risking real money — and common testing traps.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Testing Sequence\n\n**Step 1: Backtest (Historical data)**\nGo through past charts and apply your rules mechanically. Record every trade.\n- Minimum 100 trades across different market conditions\n- Include bull markets, bear markets, and ranging periods\n- Track: win rate, average R:R, max consecutive losses, max drawdown\n\n**Step 2: Paper trade (Live data, fake money)**\nApply your rules in real-time but with simulated money.\n- Minimum 30 trades over 2-4 weeks\n- This tests execution, not just the strategy\n- Are you actually following the rules? Or skipping entries and overriding exits?\n\n**Step 3: Small live (Real money, small size)**\nTrade with real money but at 25% of your target position size.\n- Minimum 50 trades\n- This tests the psychological element: real losses feel different\n- Only increase size after 50+ trades match backtest expectations\n\n### Common Testing Traps\n\n**Overfitting:** Tweaking rules to fit historical data perfectly. If your backtest requires 7 specific conditions to enter, you've overfitted. Simpler systems are more robust.\n\n**Survivorship bias:** Only testing on assets that exist today. Assets that went to zero aren't in your dataset.\n\n**Hindsight leak:** Unconsciously using information you wouldn't have had at the time (e.g., knowing a support level \"holds\" because you can see the bounce).\n\n**Sample bias:** Testing only in bull markets or only on one asset. Your system needs to work across conditions.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "If your backtest shows a 90% win rate with 5:1 R:R, something is wrong. Either you've overfitted, leaked hindsight, or made a calculation error. Real trading edges are modest: 55-65% win rate with 1.5-2.5:1 R:R is excellent.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-6-1",
              question: "Your backtest shows amazing results. What should you do next?",
              options: [
                "Go live immediately with full position sizes",
                "Paper trade for 30+ trades to test real-time execution before risking real money",
                "Add more conditions to make the backtest even better",
                "Share the results on social media",
              ],
              correctIndex: 1,
              explanation: "Backtests can be misleading due to overfitting, hindsight leak, and execution assumptions. Paper trading tests whether you can actually follow the rules in real-time, with live price action and real emotions.",
            },
          ],
        },
      ],
    },
    {
      slug: "system-maintenance",
      title: "System Maintenance & Evolution",
      description: "Your system isn't set-and-forget. Learn when to adjust, when to stay the course, and when to start over.",
      readingTime: 6,
      xpReward: 40,
      content: [
        {
          type: "text",
          content:
            "### When to Review Your System\n\n**Monthly review:** Check performance metrics against expectations. Is win rate, R:R, and drawdown within expected ranges?\n\n**After 100 new trades:** Recalculate all statistics. Compare to your initial backtest. Significant deviations warrant investigation.\n\n**After market regime change:** If the market shifts from trending to ranging (or vice versa), review which setups are working and which aren't.\n\n### When to Adjust\n\n**Do adjust when:**\n- 100+ new trades show a statistically significant deviation from backtested performance\n- A specific setup has stopped working (win rate dropped below profitability threshold)\n- Market structure has fundamentally changed (new regulations, asset class maturation)\n\n**Don't adjust when:**\n- You've had 3-5 losing trades (normal variance)\n- You \"feel\" like something is wrong (use data, not feelings)\n- Someone on Twitter has a better strategy (grass is always greener)\n\n### The Evolution Framework\n\nMake ONE change at a time. Track the impact for 50+ trades before making another change. Multiple simultaneous changes make it impossible to know what helped or hurt.\n\n### Know When to Walk Away\n\nIf your system has been unprofitable for 200+ trades with no clear fixable cause, it may be time to start over. Not every strategy works forever. Markets evolve. Your system should too — but sometimes evolution means extinction and rebirth, not tweaking.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The most common system failure isn't a bad strategy — it's the trader making unauthorized changes during drawdowns. Your system's biggest threat is you.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "byts-7-1",
              question: "Your system has lost on 4 consecutive trades. You want to change your entry rules. Should you?",
              options: [
                "Yes — 4 losses means the system is broken",
                "No — 4 trades is normal variance. Review at 100+ trades, not 4",
                "Yes, but only small changes",
                "Stop trading entirely",
              ],
              correctIndex: 1,
              explanation: "4 consecutive losses is well within normal variance for any strategy. A 55% win rate strategy will have 4-loss streaks regularly. Changing rules based on 4 trades is recency bias in action. Wait for statistically meaningful data (100+ trades).",
            },
          ],
        },
      ],
    },
  ],
};
