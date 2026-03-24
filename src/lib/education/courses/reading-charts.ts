import type { CourseDefinition } from "../types";

export const READING_CHARTS: CourseDefinition = {
  slug: "reading-charts",
  title: "Reading Charts: Technical Analysis Basics",
  description:
    "Charts are a trader's primary tool. Learn to read candlesticks, identify trends, spot support and resistance, and use moving averages and volume to make better decisions.",
  emoji: "📈",
  category: "strategy",
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
  totalXP: 235,
  published: true,
  freeTier: true,
  lessons: [
    {
      slug: "why-charts-matter",
      title: "Why Charts Matter",
      description:
        "Charts aren't just pictures — they're a visual record of every decision made by every market participant.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "A price chart is a visual representation of supply and demand over time. Every candle, every bar, every tick reflects real money being exchanged between real people making real decisions.\n\n### What Charts Tell You\n\nCharts show you three things:\n\n1. **Where price has been** — Historical support, resistance, trends, and patterns.\n2. **Where price is now** — Current momentum, volatility, and market structure.\n3. **Where price might go** — Probabilistic zones based on historical behavior.\n\nCharts don't predict the future. Nothing does. But they help you identify setups where the probability of one outcome is higher than another — and that's all you need.\n\n### Technical Analysis vs. Fundamental Analysis\n\n**Technical analysis** studies price and volume data on charts to identify patterns and trends.\n**Fundamental analysis** studies the underlying value of an asset (earnings, revenue, on-chain metrics).\n\nMany traders use both. But for short-term trading (day trades, swing trades), technical analysis is the primary tool. Price action contains all known information — news, sentiment, institutional positioning — reflected in real-time.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "\"The chart doesn't lie.\" Fundamentals can be manipulated (accounting fraud, fake volume), news can be misleading, and opinions are subjective. But the price paid by real participants with real money is the most honest signal in the market.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-1-1",
              question:
                "What does a price chart fundamentally represent?",
              options: [
                "The company's financial health",
                "The opinions of financial analysts",
                "A visual record of supply and demand — real money decisions by real participants",
                "Future price predictions",
              ],
              correctIndex: 2,
              explanation:
                "Every point on a chart represents a transaction where a buyer and seller agreed on a price. Charts visualize the aggregate of all market participants' decisions over time, making them the most objective record of market behavior.",
            },
          ],
        },
      ],
    },
    {
      slug: "candlestick-basics",
      title: "Candlestick Basics",
      description:
        "The most popular chart type — how to read candlesticks and the patterns they form.",
      readingTime: 7,
      xpReward: 40,
      content: [
        {
          type: "text",
          content:
            "Candlestick charts were invented by Japanese rice traders in the 1700s. They remain the most popular chart type because they pack four data points into a single visual element.\n\n### Anatomy of a Candlestick\n\nEach candle shows price activity over a specific time period (1 minute, 1 hour, 1 day, etc.):\n\n- **Open** — The price at the start of the period.\n- **Close** — The price at the end of the period.\n- **High** — The highest price reached during the period.\n- **Low** — The lowest price reached during the period.\n\nThe thick body shows the range between open and close. The thin lines above and below (called **wicks** or **shadows**) show the high and low.\n\n- **Green/white candle** — Close is higher than open (bullish). Buyers won this period.\n- **Red/black candle** — Close is lower than open (bearish). Sellers won this period.",
        },
        {
          type: "image",
          src: "/education/diagrams/candlestick-basics.svg",
          alt: "Anatomy of bullish and bearish candlesticks showing open, close, high, low, body, and wicks",
          caption:
            "Each candlestick tells a complete story: who won the battle between buyers and sellers in that time period.",
        },
        {
          type: "text",
          content:
            "### Key Single-Candle Patterns\n\n- **Doji** — Open and close are nearly equal. Neither bulls nor bears won. Signals indecision.\n- **Hammer** — Small body at the top, long lower wick. Sellers pushed price down but buyers fought back. Bullish signal at the bottom of a downtrend.\n- **Shooting Star** — Small body at the bottom, long upper wick. Buyers pushed price up but sellers rejected it. Bearish signal at the top of an uptrend.\n- **Marubozu** — Large body with no wicks. Strong conviction in one direction.\n\n### Reading Candle Context\n\nA single candle means nothing in isolation. Context matters:\n- A hammer at the bottom of a 30% decline is significant.\n- A hammer in the middle of a range is noise.\n- A doji after a strong trend signals potential reversal.\n- A doji in a choppy market is just more chop.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "Don't memorize dozens of candlestick patterns. Focus on understanding what each candle tells you about the battle between buyers and sellers. Once you understand the logic, you can interpret any candle without a pattern name.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-2-1",
              question:
                "What does a candle with a small body and a very long lower wick (hammer) indicate?",
              options: [
                "Strong selling pressure with no recovery",
                "Sellers pushed price down but buyers fought back aggressively",
                "The market is closed",
                "Volume was very low",
              ],
              correctIndex: 1,
              explanation:
                "A hammer shows that sellers drove the price significantly lower during the period (long lower wick), but buyers stepped in and pushed it back up near the open (small body at top). At the bottom of a downtrend, this signals potential reversal because sellers are losing their grip.",
            },
          ],
        },
      ],
    },
    {
      slug: "timeframes-explained",
      title: "Timeframes Explained",
      description:
        "1-minute, 4-hour, daily — which timeframe should you use and why multi-timeframe analysis matters.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "The same asset looks completely different depending on which timeframe you're viewing. Bitcoin might be in an uptrend on the daily chart but a downtrend on the 15-minute chart. Neither view is wrong — they're showing different scales of the same price action.\n\n### Common Timeframes\n\n| Timeframe | Best For | Noise Level |\n|-----------|----------|-------------|\n| 1m, 5m | Scalping (seconds to minutes) | Very high |\n| 15m, 30m | Day trading | High |\n| 1h, 4h | Swing trading (days to weeks) | Medium |\n| Daily | Position trading (weeks to months) | Low |\n| Weekly, Monthly | Long-term trend analysis | Very low |\n\n### Choosing Your Timeframe\n\nYour timeframe should match your lifestyle:\n- **Full-time trader** — 5m to 1h charts. Requires screen time.\n- **Part-time trader** — 4h to daily charts. Check 2-3 times per day.\n- **Busy professional** — Daily to weekly charts. Check once per day.\n\nLower timeframes have more noise (random price movement). Higher timeframes show cleaner trends but require more patience.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "Beginners should start with the daily chart. It filters out intraday noise, gives you time to think before acting, and aligns with a healthy routine of checking charts once or twice per day — not every five minutes.",
        },
        {
          type: "text",
          content:
            "### Multi-Timeframe Analysis\n\nProfessional traders don't use just one timeframe. They use at least two:\n\n1. **Higher timeframe** (trend context) — Identify the overall trend direction.\n2. **Lower timeframe** (entry timing) — Find precise entry points within that trend.\n\nExample: The daily chart shows Bitcoin in an uptrend. You drop to the 4-hour chart to find pullbacks to support for entry. You're trading in the direction of the bigger trend while timing your entry on the smaller timeframe.\n\nA common framework:\n- **Day traders:** 1h (trend) + 5m (entry)\n- **Swing traders:** Daily (trend) + 4h (entry)\n- **Position traders:** Weekly (trend) + Daily (entry)",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-3-1",
              question:
                "Why do professional traders use multi-timeframe analysis?",
              options: [
                "To see more candles on screen",
                "To use the higher timeframe for trend direction and the lower timeframe for precise entries",
                "Lower timeframes are always more accurate",
                "It's required by their broker",
              ],
              correctIndex: 1,
              explanation:
                "Multi-timeframe analysis combines the reliability of higher-timeframe trends with the precision of lower-timeframe entries. Trading in the direction of the bigger trend while timing entries on a smaller timeframe significantly improves win rate.",
            },
          ],
        },
      ],
    },
    {
      slug: "support-and-resistance",
      title: "Support & Resistance",
      description:
        "The most important concept in technical analysis — price levels where buying and selling pressure concentrates.",
      readingTime: 7,
      xpReward: 40,
      content: [
        {
          type: "text",
          content:
            "Support and resistance are price levels where the market has historically shown strong buying or selling interest. They're the foundation of almost every trading strategy.\n\n### Support\n\n**Support** is a price level where buying pressure has historically prevented the price from falling further. Think of it as a floor. When price approaches support, buyers step in because they see value at that level.\n\nSupport forms because:\n- Traders who missed a previous bounce set buy orders at that level.\n- Institutional algorithms have buy programs triggered at specific prices.\n- Psychological round numbers ($50,000 BTC, $100 stock) attract natural buying.\n\n### Resistance\n\n**Resistance** is a price level where selling pressure has historically prevented the price from rising further. Think of it as a ceiling. When price approaches resistance, sellers take profit or short.\n\nResistance forms because:\n- Traders who bought higher are waiting to sell at break-even.\n- Profit-taking occurs at previous highs.\n- Round numbers and all-time highs become psychological barriers.",
        },
        {
          type: "image",
          src: "/education/diagrams/support-resistance.svg",
          alt: "Chart showing support and resistance levels with price bouncing between horizontal zones",
          caption:
            "Support acts as a floor (buyers step in), resistance acts as a ceiling (sellers step in). When support breaks, it often becomes resistance — and vice versa.",
        },
        {
          type: "text",
          content:
            "### Key Principles\n\n1. **The more touches, the stronger the level.** A support level that's been tested 5 times is stronger than one tested once.\n2. **Support and resistance are zones, not exact prices.** Don't expect price to bounce at exactly $50,000. Think of a zone: $49,800–$50,200.\n3. **Broken support becomes resistance (and vice versa).** When price breaks below support, that same level often acts as resistance on the way back up. This is called a **role reversal**.\n4. **Volume confirms the level.** High volume bounces off support are more significant than low-volume bounces.\n\n### How to Trade Support and Resistance\n\n- **Buy near support** with a stop loss just below.\n- **Sell near resistance** or take profit as price approaches it.\n- **Wait for breakouts** — when price breaks through resistance with volume, it can signal a strong move higher.\n- **Be cautious of fakeouts** — price briefly breaks a level then reverses. Wait for a candle close beyond the level for confirmation.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-4-1",
              question:
                "When a support level is broken, what does it typically become?",
              options: [
                "It disappears entirely",
                "It becomes resistance",
                "It becomes stronger support",
                "It no longer matters",
              ],
              correctIndex: 1,
              explanation:
                "This is called a 'role reversal.' When price breaks below support, the traders who bought at that level are now underwater. If price rallies back to that level, they sell to break even — creating selling pressure that turns the old support into new resistance.",
            },
          ],
        },
      ],
    },
    {
      slug: "trend-identification",
      title: "Trend Identification",
      description:
        "How to determine whether the market is trending up, trending down, or moving sideways — and why it matters.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "The single most important question you can ask before entering any trade is: **What is the trend?** Trading with the trend is the highest-probability approach in all of technical analysis.\n\n### Defining a Trend\n\n- **Uptrend** — Price makes higher highs (HH) and higher lows (HL). Each pullback holds above the previous low.\n- **Downtrend** — Price makes lower highs (LH) and lower lows (LL). Each rally fails below the previous high.\n- **Sideways/Range** — Price bounces between a defined support and resistance. No clear direction.\n\n### How to Identify Trends\n\n**Method 1: Higher Highs & Higher Lows**\nThe most reliable method. On a daily chart, connect the swing lows. If each low is higher than the previous low, you're in an uptrend.\n\n**Method 2: Moving Average Direction**\nIf price is above the 50-day moving average and the MA is sloping up, the trend is up. More on moving averages in the next lesson.\n\n**Method 3: The Squint Test**\nZoom out. Squint at the chart. Is price generally moving from bottom-left to top-right? Uptrend. Top-left to bottom-right? Downtrend. Flat? Range.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "\"The trend is your friend — until the end.\" This old trading adage captures a critical truth: trading with the trend has the highest win rate, but every trend eventually reverses. The skill is recognizing when a trend is intact vs. when it's breaking down.",
        },
        {
          type: "text",
          content:
            "### Why Trend Matters\n\nIn an uptrend, every pullback is a buying opportunity. In a downtrend, every rally is a selling opportunity. In a range, you buy at support and sell at resistance.\n\nThe mistake beginners make is trying to pick tops and bottoms — buying in a downtrend because \"it's cheap\" or shorting in an uptrend because \"it's gone too far.\" This is called counter-trend trading, and it has a low win rate for a reason: trends persist longer than most people expect.\n\n### When Trends Change\n\nAn uptrend breaks when price makes a **lower low** — falling below the previous pullback. This doesn't mean you should immediately reverse your position, but it does mean the trend is no longer intact. Wait for the new trend to establish before committing capital.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-5-1",
              question: "What defines an uptrend?",
              options: [
                "Price is above $50,000",
                "Price makes higher highs and higher lows",
                "The chart is green",
                "Volume is increasing",
              ],
              correctIndex: 1,
              explanation:
                "An uptrend is defined by a series of higher highs (each peak surpasses the previous one) and higher lows (each pullback holds above the previous pullback). This structure shows consistent buying pressure where demand exceeds supply at each dip.",
            },
          ],
        },
      ],
    },
    {
      slug: "moving-averages",
      title: "Moving Averages",
      description:
        "The most widely used indicator in trading — how to use simple and exponential moving averages.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "A moving average (MA) smooths out price data by calculating the average price over a set number of periods. It filters noise and reveals the underlying trend.\n\n### Simple Moving Average (SMA)\n\nThe SMA adds up closing prices over N periods and divides by N.\n\n**20 SMA** = average closing price of the last 20 candles.\n**50 SMA** = average closing price of the last 50 candles.\n**200 SMA** = average closing price of the last 200 candles.\n\nEach new candle recalculates the average, creating a smooth line that follows price.\n\n### Exponential Moving Average (EMA)\n\nThe EMA gives more weight to recent prices, making it more responsive to current price action. It reacts faster than the SMA but is also more prone to false signals.\n\n### How Traders Use Moving Averages\n\n1. **Trend filter** — If price is above the 200-day MA, the long-term trend is up. Only take long trades. Below it? Only shorts or cash.\n2. **Dynamic support/resistance** — Price often bounces off the 20 or 50 EMA during trends. These act as moving support/resistance levels.\n3. **Crossovers** — When the 50 MA crosses above the 200 MA (\"golden cross\"), it signals a bullish trend shift. When it crosses below (\"death cross\"), it's bearish.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "Moving averages are lagging indicators — they follow price, not predict it. Don't use MA crossovers as your sole entry signal. By the time the 50/200 crossover happens, a significant move has already occurred. Use MAs as context, not as triggers.",
        },
        {
          type: "text",
          content:
            "### Popular MA Setups\n\n| Setup | Use Case |\n|-------|----------|\n| 9/21 EMA | Short-term trend on lower timeframes |\n| 50 SMA | Medium-term trend; institutional benchmark |\n| 200 SMA | Long-term trend; the line Wall Street watches |\n| 20 EMA on daily | Swing trading pullback entries |\n\n### The 200-Day Moving Average\n\nThe 200-day SMA is arguably the most watched indicator in all of finance. Institutional algorithms use it as a dividing line between bull and bear markets. When the S&P 500 falls below its 200-day MA, financial media panics. When it reclaims it, sentiment shifts bullish.\n\nYou don't need to understand why it works — just know that enough large players watch it that it becomes a self-fulfilling prophecy.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-6-1",
              question:
                "What is the main limitation of moving averages?",
              options: [
                "They only work on crypto",
                "They are lagging indicators — they follow price rather than predict it",
                "They require expensive software",
                "They only work on daily timeframes",
              ],
              correctIndex: 1,
              explanation:
                "Moving averages are calculated from past prices, so they inherently lag behind current price action. A crossover signal confirms a trend change that already happened. This is why they're best used as trend filters and context tools, not standalone entry triggers.",
            },
          ],
        },
      ],
    },
    {
      slug: "volume-what-it-tells-you",
      title: "Volume & What It Tells You",
      description:
        "Price tells you what happened. Volume tells you how much conviction was behind it.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Volume is the number of shares, contracts, or coins traded in a given period. It appears as bars at the bottom of your chart. Volume answers a crucial question: **How much conviction is behind this price move?**\n\n### Volume Confirms Price Moves\n\n- **Price up + high volume** = Strong bullish move. Real buying pressure. Likely to continue.\n- **Price up + low volume** = Weak rally. Few participants. Likely to reverse.\n- **Price down + high volume** = Strong selling. Panic or institutional distribution.\n- **Price down + low volume** = Lack of buyers, but not panic selling. Could bounce.\n\n### Volume at Key Levels\n\nVolume is most useful at support and resistance levels:\n- **High-volume bounce off support** = Strong buyers defending the level. Support is holding.\n- **High-volume break through resistance** = Genuine breakout. Likely to continue.\n- **Low-volume break through resistance** = Fakeout risk. Few participants behind the move.\n\nThis is why experienced traders wait for volume confirmation before entering breakout trades.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "A simple volume rule: never trust a breakout on low volume. If price breaks above resistance but volume is below average, wait for a retest of the level with higher volume before entering. Most low-volume breakouts fail.",
        },
        {
          type: "text",
          content:
            "### Volume Patterns to Watch\n\n- **Volume climax** — A sudden spike in volume (3-5x average) often marks the end of a move, not the beginning. When everyone who wants to buy has bought, there are no buyers left.\n- **Volume dry-up** — Decreasing volume during a pullback in an uptrend is healthy. It means sellers are exhausted, and the trend is likely to resume.\n- **Increasing volume on each rally** — In an uptrend, each successive push higher should ideally come with equal or greater volume. Declining volume on new highs warns the trend is weakening.\n\n### Volume in Crypto vs. Stocks\n\nCrypto volume data can be unreliable. Many exchanges report inflated volume through wash trading (trading with yourself). Use data from reputable sources like CoinGecko or CoinMarketCap's adjusted volume. For stocks, volume data is accurate and regulated.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rc-7-1",
              question:
                "Price breaks above a resistance level but volume is well below average. What does this suggest?",
              options: [
                "A guaranteed profitable trade",
                "The breakout is strong and will continue",
                "High risk of a fakeout — few participants are behind the move",
                "Volume doesn't matter for breakouts",
              ],
              correctIndex: 2,
              explanation:
                "A low-volume breakout means few traders are participating in the move above resistance. Without broad participation, the price often falls back below the level (fakeout). Genuine breakouts are accompanied by above-average volume, signaling wide conviction.",
            },
          ],
        },
      ],
    },
  ],
};
