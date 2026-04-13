import type { CourseDefinition } from "../types";

export const ORDER_TYPES_EXECUTION: CourseDefinition = {
  slug: "order-types-execution",
  title: "Order Types & Execution",
  description:
    "Master the tools your broker gives you. Market orders, limit orders, stop orders, and advanced types — know when to use each and avoid costly execution mistakes.",
  emoji: "⚡",
  category: "fundamentals",
  difficulty: "beginner",
  recommendedFor: [
    "disciplined_strategist",
    "intuitive_risk_taker",
    "cautious_perfectionist",
    "emotional_reactor",
    "adaptive_analyst",
    "status_driven_competitor",
    "resilient_survivor",
    "anxious_overthinker",
  ],
  totalXP: 155,
  published: true,
  freeTier: true,
  lessons: [
    {
      slug: "market-orders",
      title: "Market Orders",
      description:
        "The simplest order type — buy or sell immediately at the best available price.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "A **market order** tells your broker: \"Buy (or sell) this asset right now, at whatever the current price is.\" It prioritizes speed over price.\n\n### How Market Orders Work\n\nWhen you place a market buy order, the exchange matches you with the lowest-priced sell order on the book. Your order fills almost instantly — usually within milliseconds.\n\n**Example:** Bitcoin's order book shows:\n- Sell at $65,010 — 0.5 BTC\n- Sell at $65,020 — 1.0 BTC\n- Sell at $65,050 — 2.0 BTC\n\nIf you market buy 1.0 BTC, you'd get:\n- 0.5 BTC at $65,010\n- 0.5 BTC at $65,020\n- Average fill: $65,015\n\nNotice you \"ate through\" two price levels. This is called **slippage** — and it's more pronounced with larger orders and thinner order books.\n\n### When to Use Market Orders\n\n- **Exiting a losing trade** — When your stop is hit, you want out NOW. Speed matters more than saving a few cents.\n- **High-liquidity assets** — On BTC, ETH, SPY, or AAPL, the spread is tiny. Market orders cost almost nothing extra.\n- **Fast-moving markets** — When price is moving quickly in your favor, a limit order might not fill.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "Never use market orders on low-liquidity assets. On a small-cap altcoin with a $50 spread, a market order could fill 2-5% away from the displayed price. Use limit orders instead.",
        },
        {
          type: "text",
          content:
            "### The Cost of Market Orders\n\nMarket orders are typically more expensive in two ways:\n\n1. **Higher exchange fees** — Most exchanges charge a higher \"taker\" fee for market orders (0.04-0.10%) vs. a lower \"maker\" fee for limit orders (0.01-0.06%).\n2. **Slippage** — You pay the spread plus any additional slippage from eating through the order book.\n\nFor a single trade, these costs are small. Over hundreds of trades, they compound significantly. Professional traders use limit orders for entries and reserve market orders for emergency exits.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "ot-1-1",
              question: "What does a market order prioritize?",
              options: [
                "Getting the best possible price",
                "Speed of execution — filling immediately at the best available price",
                "Minimizing fees",
                "Waiting for a specific price level",
              ],
              correctIndex: 1,
              explanation:
                "A market order prioritizes immediate execution. You accept the best price currently available rather than waiting for a specific price. This guarantees a fill but not a specific price — making it ideal for urgent exits but expensive for routine entries.",
            },
          ],
        },
      ],
    },
    {
      slug: "limit-orders",
      title: "Limit Orders",
      description:
        "Set your price and wait — limit orders give you control over execution price.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "A **limit order** tells your broker: \"Buy (or sell) this asset only at this price or better.\" It prioritizes price over speed.\n\n### How Limit Orders Work\n\n**Buy limit:** Placed below current price. \"I want to buy Bitcoin, but only if it drops to $62,000.\"\n**Sell limit:** Placed above current price. \"I want to sell my Bitcoin when it reaches $68,000.\"\n\nYour order sits on the order book until someone on the other side matches it. If price never reaches your limit, the order never fills.\n\n### Advantages of Limit Orders\n\n1. **Price control** — You decide exactly what you pay. No slippage surprises.\n2. **Lower fees** — You pay the \"maker\" fee, which is typically 50-75% cheaper than the \"taker\" fee.\n3. **Patience enforcement** — Setting a limit order at your planned entry prevents FOMO buying at market price.\n4. **Works while you sleep** — Set a buy limit at support before bed. If price dips overnight, you're filled automatically.\n\n### When Limit Orders Don't Fill\n\nThe risk of limit orders is **non-fill**. Price might come within $5 of your limit and reverse — you missed the trade entirely. This happens frequently and is the tradeoff for price precision.\n\nSome traders use a hybrid approach: set a limit order at their ideal price, with an alert a few percent above it. If the limit doesn't fill and price starts moving, they evaluate whether to chase with a market order.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "For entries, use limit orders. For emergency exits, use market orders. This simple rule saves you money on the way in and protects you on the way out.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "ot-2-1",
              question:
                "Bitcoin is trading at $65,000. You place a buy limit order at $63,000. When will this order fill?",
              options: [
                "Immediately at $65,000",
                "Only if Bitcoin's price drops to $63,000 or lower",
                "At the end of the trading day",
                "When volume increases",
              ],
              correctIndex: 1,
              explanation:
                "A buy limit order at $63,000 sits on the order book waiting. It will only fill if the price drops to $63,000 or lower. If price never reaches $63,000, the order remains unfilled indefinitely (or until you cancel it or it expires).",
            },
          ],
        },
      ],
    },
    {
      slug: "stop-orders",
      title: "Stop Orders & Stop-Limit Orders",
      description:
        "Your safety net — how stop orders protect you from catastrophic losses.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "A **stop order** (or stop-loss order) automatically sells your position when price drops to a specified level. It's your insurance policy against catastrophic losses.\n\n### How Stop Orders Work\n\nYou buy Bitcoin at $65,000 and set a stop-loss at $63,000. If Bitcoin drops to $63,000, your stop triggers and automatically places a **market order** to sell. You limit your loss to roughly $2,000 per BTC.\n\nWithout the stop: Bitcoin drops to $58,000 while you're sleeping. You wake up to a $7,000 loss per BTC instead of $2,000.\n\n### Stop-Loss vs. Stop-Limit\n\n**Stop-loss (stop-market):** When triggered, becomes a market order. Guarantees execution but not price. In a flash crash, you might get filled at $62,500 instead of $63,000.\n\n**Stop-limit:** When triggered, becomes a limit order. You set both a stop price (trigger) and a limit price (worst acceptable fill). Example: stop at $63,000, limit at $62,800. Guarantees price but NOT execution — if price gaps below $62,800, your order won't fill at all.\n\n### Which to Use?\n\n- **Stop-market** for protection. You MUST get out. A bad fill is better than no fill.\n- **Stop-limit** for planned entries. You want to buy a breakout above $70,000 but only if the price stays below $70,500.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "A stop-limit order can fail to execute during a crash. If price gaps from $63,000 to $60,000 instantly (common during liquidation cascades), a stop-limit with a $62,800 limit won't fill — there are no buyers between your prices. For protective stops, always use stop-market.",
        },
        {
          type: "text",
          content:
            "### Where to Place Your Stop\n\nStop placement is critical. Too tight and you get stopped out by normal volatility. Too wide and your losses are unnecessarily large.\n\n**Common methods:**\n- **Below support** — Place your stop just below the nearest support level. If support breaks, your thesis is wrong.\n- **ATR-based** — Use the Average True Range indicator to set stops based on the asset's actual volatility. Example: stop = entry - (1.5 × ATR).\n- **Percentage-based** — Risk a fixed percentage (1-2%) of your account per trade. Calculate position size from there.\n\nNever move your stop further away from price to \"give the trade more room.\" That's rationalizing a losing position. Only move stops in the direction of profit (trailing stop behavior).",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "ot-3-1",
              question:
                "Why might a stop-limit order fail to protect you during a market crash?",
              options: [
                "Stop-limit orders are not available on most exchanges",
                "If price gaps below your limit price, the order won't execute because there are no buyers at your price",
                "Stop-limit orders only work during market hours",
                "The broker can cancel stop-limit orders",
              ],
              correctIndex: 1,
              explanation:
                "A stop-limit order becomes a limit order when triggered. If the market is falling so fast that price jumps past your limit price (a gap), there are no matching orders and your limit sits unfilled while your position continues losing value. Stop-market orders guarantee execution even during gaps.",
            },
          ],
        },
      ],
    },
    {
      slug: "trailing-stops-oco",
      title: "Trailing Stops & OCO Orders",
      description:
        "Advanced order types that automate your exit strategy — lock in profits and manage both sides of a trade.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "### Trailing Stop Orders\n\nA **trailing stop** follows price in your favor and triggers when price reverses by a specified amount. It lets winners run while automatically locking in profit.\n\n**Example:** You buy Ethereum at $3,000 and set a trailing stop of $150.\n- ETH rises to $3,200 → stop trails to $3,050\n- ETH rises to $3,500 → stop trails to $3,350\n- ETH drops from $3,500 to $3,350 → stop triggers, you sell at ~$3,350\n\nYou captured $350 of profit without manually adjusting your stop. If ETH had continued to $4,000, your stop would have trailed to $3,850.\n\n### Setting Trailing Distance\n\n- **Too tight** (e.g., $50 on ETH) — Normal intraday swings will stop you out prematurely.\n- **Too wide** (e.g., $500 on ETH) — You give back too much profit before the stop triggers.\n- **ATR-based** — Set the trail at 1.5-2x the Average True Range. This adapts to the asset's actual volatility.\n\n### OCO (One-Cancels-the-Other) Orders\n\nAn **OCO** order pairs two orders together: when one fills, the other automatically cancels.\n\nTypical use: You buy Bitcoin at $65,000 and place an OCO:\n- Take profit: sell limit at $68,000\n- Stop loss: sell stop at $63,000\n\nIf price hits $68,000, your take profit fills and the stop-loss cancels. If price hits $63,000 first, the stop fills and the take profit cancels. Either way, your exit is handled automatically.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "OCO orders are the closest thing to \"set and forget\" trading. Once your entry fills, immediately place an OCO with your stop-loss and take-profit. This removes emotional decision-making from your exits.",
        },
        {
          type: "text",
          content:
            "### Bracket Orders\n\nSome brokers offer **bracket orders** — an entry order with attached stop-loss and take-profit that activate simultaneously when the entry fills. This is the professional standard: your risk is defined before you enter the trade.\n\nSequence:\n1. Place limit buy at $64,500 with bracket: stop at $63,500, target at $67,000\n2. Entry fills at $64,500 → stop and target orders go live automatically\n3. No need to manually place exits — they're already active\n\nNot all brokers support brackets, but if yours does, use them for every trade.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "ot-4-1",
              question:
                "You set a trailing stop of $2 on a stock you bought at $50. The stock rises to $58, then drops to $56. What happens?",
              options: [
                "Nothing — the trailing stop is at $48",
                "The stop triggers immediately since $2 is too tight",
                "The stop trailed to $56 ($58 peak - $2) and triggers a sell at approximately $56",
                "Trailing stops don't work on stocks",
              ],
              correctIndex: 2,
              explanation:
                "With a $2 trailing stop on a $50 stock, as price rises to $58, the stop trails to $56. When price drops from $58 to $56, the stop triggers. You lock in roughly $6/share profit ($56 - $50) without manually adjusting anything. The trailing stop only moves up, never down.",
            },
          ],
        },
      ],
    },
    {
      slug: "common-execution-mistakes",
      title: "Common Execution Mistakes",
      description:
        "Expensive errors that even experienced traders make — and how to avoid them.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Knowing order types is only half the battle. The other half is avoiding the execution mistakes that turn good trade ideas into unnecessary losses.\n\n### Mistake 1: Market Ordering Illiquid Assets\n\nPlacing a market order on a small-cap altcoin or penny stock with a $0.05 spread can cost you 2-5% in slippage instantly. Always use limit orders on anything outside the top-tier liquid markets.\n\n### Mistake 2: Fat-Finger Errors\n\nBuying 100 BTC instead of $100 of BTC. Selling instead of buying. Setting a stop at $6,500 instead of $65,000. These errors happen to everyone — including professional traders at banks. The solution: always double-check your order before hitting submit. Many platforms have confirmation dialogs — don't disable them.\n\n### Mistake 3: Forgetting to Set a Stop-Loss\n\n\"I'll watch the screen and exit manually.\" You won't. You'll rationalize, hope, and hold through a loss that doubles. Set the stop-loss at the same time as your entry — not later, not \"once I see how it moves.\"",
        },
        {
          type: "image",
          src: "/education/diagrams/order-types.svg",
          alt: "Comparison diagram of market, limit, stop, and OCO order types showing when each triggers",
          caption:
            "Summary of all order types and when they trigger. Keep this reference handy until order placement becomes second nature.",
        },
        {
          type: "text",
          content:
            "### Mistake 4: Canceling Your Stop-Loss\n\nPrice approaches your stop. You panic and cancel it, hoping for a reversal. Price keeps dropping. Now your $200 loss is $600. The stop exists to protect you from yourself — let it do its job.\n\n### Mistake 5: Over-Leveraging\n\nExchanges offer 10x, 50x, even 125x leverage. At 100x leverage, a 1% move against you liquidates your entire position. High leverage shrinks the distance between your entry and your liquidation price to almost nothing. Keep leverage under 5x until you have years of experience.\n\n### Mistake 6: Not Accounting for Fees\n\nA scalper making 50 trades per day at 0.1% per trade pays 5% of their account in fees daily. That's over 100% per month in fees alone. Before adopting a high-frequency strategy, calculate whether your edge exceeds your fee burden.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "The most expensive execution mistake is also the simplest: not having a plan before you enter. If you don't know your stop, target, and position size before clicking buy, you're not trading — you're gambling with extra steps.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "ot-5-1",
              question:
                "Why is canceling a stop-loss as price approaches it considered one of the worst execution mistakes?",
              options: [
                "Because you'll get charged a cancellation fee",
                "Because it means your original analysis was wrong",
                "Because the stop exists to limit your loss — canceling it removes your protection and lets losses grow unchecked",
                "Because you can't re-place a stop after canceling",
              ],
              correctIndex: 2,
              explanation:
                "When you cancel a stop-loss, you remove the only mechanism protecting you from larger losses. The impulse to cancel comes from hope and loss aversion — the exact emotions that lead to account-destroying drawdowns. Let the stop do its job.",
            },
          ],
        },
      ],
    },
  ],
};
