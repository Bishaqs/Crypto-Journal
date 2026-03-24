import type { CourseDefinition } from "../types";

export const FUNDAMENTAL_ANALYSIS: CourseDefinition = {
  slug: "fundamental-analysis",
  title: "Fundamental Analysis for Traders",
  description:
    "Charts show you what happened. Fundamentals show you why. Learn to read earnings reports, on-chain metrics, macro data, and separate real news from noise.",
  emoji: "🔬",
  category: "strategy",
  difficulty: "beginner",
  recommendedFor: [
    "adaptive_analyst",
    "disciplined_strategist",
    "cautious_perfectionist",
  ],
  totalXP: 195,
  published: true,
  lessons: [
    {
      slug: "what-moves-prices-beyond-charts",
      title: "What Moves Prices Beyond Charts",
      description:
        "The forces behind price movements that don't show up on a candlestick chart.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Technical analysis tells you where price is and where it's been. Fundamental analysis asks a different question: **Is this asset worth what people are paying for it?**\n\n### The Two Schools\n\n**Technical analysts** believe that all known information is already reflected in the price. They study charts exclusively.\n\n**Fundamental analysts** believe that markets misprice assets regularly. They study the underlying value — earnings, revenue, on-chain activity, macroeconomics — to find assets trading above or below their true worth.\n\nIn practice, the best traders use both. Technicals for timing, fundamentals for direction and conviction.\n\n### The Fundamental Edge\n\nFundamental analysis shines in three scenarios:\n\n1. **Earnings surprises** — A company reports revenue 20% above expectations. The stock gaps up 15% at open. No chart pattern predicted this.\n2. **Macro shifts** — The Federal Reserve signals rate cuts. Stocks rally for months. The catalyst was economic data, not a support bounce.\n3. **Narrative changes** — Ethereum transitions to proof-of-stake, reducing energy use by 99.95%. The fundamental investment thesis changes overnight.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "Fundamentals drive long-term direction. Technicals drive short-term timing. A stock can be fundamentally undervalued but keep dropping for months. Knowing the fundamentals gives you conviction to hold through drawdowns — but only if your risk management allows it.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "fa-1-1",
              question:
                "How do fundamental analysis and technical analysis complement each other?",
              options: [
                "They don't — you should only use one",
                "Fundamentals provide direction and conviction; technicals provide entry timing",
                "Technicals are for stocks; fundamentals are for crypto",
                "Fundamental analysis replaces the need for stop losses",
              ],
              correctIndex: 1,
              explanation:
                "The strongest approach combines both. Fundamental analysis helps you decide what to trade and which direction (is this asset undervalued or overvalued?), while technical analysis helps you decide when to enter and exit (where are support, resistance, and momentum?).",
            },
          ],
        },
      ],
    },
    {
      slug: "earnings-revenue-stocks",
      title: "Earnings & Revenue for Stocks",
      description:
        "The quarterly reports that move stock prices more than any technical pattern.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Public companies report their financial results every quarter. These earnings reports are the single biggest price movers for individual stocks.\n\n### Key Metrics in an Earnings Report\n\n**Revenue (top line)** — Total money the company earned. Growing revenue means more customers or higher prices.\n\n**Earnings Per Share (EPS)** — Net profit divided by shares outstanding. This is the number Wall Street cares about most. If analysts expected $1.50 EPS and the company reports $1.80, that's a \"beat\" — typically bullish.\n\n**Revenue Growth Rate** — Year-over-year percentage increase. For growth stocks (tech), this matters more than absolute profit. A company growing revenue 40% YoY might justify a high valuation even without profits.\n\n**Forward Guidance** — What the company expects for the next quarter and year. Often more important than the current quarter's results. A company can beat on EPS but crash if forward guidance is weak.\n\n### The Expectations Game\n\nEarnings don't move stock prices. **Surprises** move stock prices. If everyone expects Apple to report $1.50 EPS and it reports $1.50, the stock barely moves. The expectation was already priced in.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "Holding through earnings is gambling. Even strong companies can drop 10-20% on an earnings report if guidance disappoints. Many traders close positions before earnings and re-enter after the volatility settles. If you hold through earnings, reduce your position size.",
        },
        {
          type: "text",
          content:
            "### Earnings Calendar\n\nEarnings season happens four times per year (roughly January, April, July, October). Use an earnings calendar (available on most broker platforms or sites like earningswhispers.com) to know when your stocks report.\n\n### What to Watch\n\n1. **EPS vs. consensus estimate** — Beat or miss?\n2. **Revenue vs. estimate** — Revenue beats are harder to manipulate than earnings beats.\n3. **Guidance** — Is the company raising or lowering expectations for next quarter?\n4. **Margins** — Is the company becoming more or less profitable per dollar of revenue?\n5. **Conference call tone** — Management's language on the earnings call often reveals more than the numbers themselves.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "fa-2-1",
              question:
                "A company beats its EPS estimate by 10%, but lowers guidance for next quarter. What typically happens to the stock?",
              options: [
                "It rises because the company beat expectations",
                "Nothing — earnings and guidance cancel out",
                "It often drops — forward guidance carries more weight than a current-quarter beat",
                "It depends entirely on the chart pattern",
              ],
              correctIndex: 2,
              explanation:
                "Forward guidance tells the market where the company is heading. A current-quarter beat is backward-looking, while lowered guidance signals future weakness. The stock market is forward-looking by nature, so weak guidance often outweighs a current-quarter beat.",
            },
          ],
        },
      ],
    },
    {
      slug: "on-chain-metrics-crypto",
      title: "On-Chain Metrics for Crypto",
      description:
        "Blockchain data gives crypto traders a unique fundamental layer that traditional markets don't have.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Unlike stocks, cryptocurrency transactions happen on public blockchains. Every transfer, every wallet balance, every smart contract interaction is visible. This creates a unique fundamental analysis layer.\n\n### Key On-Chain Metrics\n\n**Active Addresses** — The number of unique wallets transacting daily. Rising active addresses = growing network usage. Like daily active users for a tech company.\n\n**Exchange Inflows/Outflows** — When BTC flows into exchanges, holders may be preparing to sell. When BTC flows out of exchanges to cold storage, holders are accumulating for the long term. Net outflows from exchanges are historically bullish.\n\n**Hash Rate (Bitcoin)** — The total computing power securing the network. Rising hash rate means miners are investing in infrastructure — bullish long-term signal.\n\n**Total Value Locked (DeFi)** — The amount of crypto deposited in DeFi protocols. Rising TVL indicates growing trust and utility. Falling TVL can signal capital flight or protocol risk.\n\n**Stablecoin Supply** — Increasing stablecoin supply on exchanges means dry powder waiting to buy. It's like cash on the sidelines for the crypto market.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "Free on-chain tools: Glassnode (BTC/ETH analytics), DefiLlama (TVL across all chains), Dune Analytics (custom queries), Arkham Intelligence (wallet tracking). Start with exchange flow data — it's the most actionable on-chain metric for traders.",
        },
        {
          type: "text",
          content:
            "### MVRV Ratio — A Valuation Tool for Bitcoin\n\nThe **Market Value to Realized Value (MVRV)** ratio compares Bitcoin's market cap to its realized cap (the value of all coins at the price they last moved).\n\n- **MVRV > 3.0** — Market is overheated. Most holders are in significant profit. Historically precedes major corrections.\n- **MVRV < 1.0** — Market is deeply undervalued. Most holders are at a loss. Historically marks bottoms.\n- **MVRV ~ 1.0-2.0** — Fair value zone. Neutral territory.\n\nThis is one of the most reliable long-term valuation metrics in crypto. It won't time the exact top or bottom, but it tells you which zone the market is in.\n\n### The Crypto-Specific Edge\n\nTraditional stock traders can't see who's buying and selling in real-time. Crypto traders can. When a known whale moves 5,000 BTC to Coinbase, the market reacts. This transparency is a fundamental advantage if you know how to read it.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "fa-3-1",
              question:
                "Large amounts of Bitcoin flowing OUT of exchanges to cold storage typically signals what?",
              options: [
                "Panic selling is imminent",
                "Exchanges are going bankrupt",
                "Long-term accumulation — holders are removing supply from the market, a historically bullish signal",
                "Bitcoin's network is failing",
              ],
              correctIndex: 2,
              explanation:
                "When Bitcoin moves from exchanges to cold storage wallets, it means holders are removing coins from liquid supply (they're not planning to sell soon). This reduces available supply on exchanges. Historically, sustained net exchange outflows have preceded bull markets.",
            },
          ],
        },
      ],
    },
    {
      slug: "macro-factors",
      title: "Macro Factors: The Fed, CPI & Employment",
      description:
        "The macroeconomic forces that drive all markets — interest rates, inflation, and employment data.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Macroeconomics is the biggest force in financial markets. A single Federal Reserve decision can move trillions of dollars across every asset class simultaneously. Even if you only trade crypto, macro matters.\n\n### The Federal Reserve & Interest Rates\n\nThe Fed controls the federal funds rate — the interest rate banks charge each other for overnight loans. This rate ripples through the entire economy.\n\n**Rate hikes (higher rates):**\n- Borrowing becomes expensive → less business investment → slower growth\n- Bonds become more attractive (higher yield) → money flows out of stocks\n- Stronger dollar → pressure on commodities and international stocks\n- Risk assets (crypto, growth stocks) sell off\n\n**Rate cuts (lower rates):**\n- Cheap money flows into risk assets → stocks and crypto rally\n- Bonds become less attractive → money moves into equities\n- Weaker dollar → commodities rise\n- Growth stocks outperform\n\n### CPI (Consumer Price Index) — The Inflation Number\n\nReleased monthly by the Bureau of Labor Statistics. It measures the average change in prices consumers pay for goods and services.\n\n- **CPI higher than expected** → More rate hikes likely → Bearish for stocks and crypto\n- **CPI lower than expected** → Rate cuts more likely → Bullish for risk assets\n- **CPI in line with expectations** → Muted reaction; focus shifts to other data",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "Markets don't react to data — they react to surprises. If everyone expects 3.2% CPI and it prints 3.2%, the market barely moves. But if it prints 3.5%, the sell-off is swift. The distance between expectation and reality drives price action, not the number itself.",
        },
        {
          type: "text",
          content:
            "### Employment Data\n\n**Non-Farm Payrolls (NFP)** — Released first Friday of each month. Shows how many jobs the US economy added. Strong jobs = strong economy = Fed less likely to cut rates. The market reaction depends on what the Fed is currently focused on.\n\n**Unemployment Rate** — Percentage of the workforce looking but not finding jobs. Rising unemployment can be bullish for stocks if it means the Fed will cut rates to stimulate growth (\"bad news is good news\").\n\n### The Economic Calendar\n\nEvery serious trader checks the economic calendar daily. Key dates to know:\n\n- **FOMC meetings** (8 per year) — Interest rate decisions\n- **CPI release** (monthly) — Inflation data\n- **NFP** (first Friday each month) — Jobs data\n- **GDP** (quarterly) — Economic growth\n- **PCE** (monthly) — The Fed's preferred inflation gauge\n\nAvoid opening new positions 30 minutes before major data releases. Volatility spikes are unpredictable and spreads widen dramatically.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "fa-4-1",
              question:
                "CPI comes in higher than expected. What is the most likely market reaction?",
              options: [
                "Stocks and crypto rally on the good news",
                "No reaction — CPI is irrelevant",
                "Stocks and crypto sell off because higher inflation means the Fed is more likely to raise or hold rates higher",
                "Only bonds are affected",
              ],
              correctIndex: 2,
              explanation:
                "Higher-than-expected CPI means inflation is stickier than anticipated. The Fed is more likely to keep rates high (or raise them), which is bearish for risk assets like stocks and crypto. Higher rates make borrowing expensive and bonds more attractive relative to equities.",
            },
          ],
        },
      ],
    },
    {
      slug: "news-vs-noise",
      title: "News vs. Noise",
      description:
        "Most financial news is designed to generate clicks, not inform your trading. Learn to filter signal from noise.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "Financial media publishes thousands of articles per day. Twitter has millions of opinions. YouTube thumbnails promise 1000x gains. The vast majority is noise that will actively harm your trading if you act on it.\n\n### What Qualifies as Signal\n\n**Signal** — Information that changes the fundamental value or structural dynamics of an asset:\n- FOMC rate decisions and meeting minutes\n- Earnings reports and guidance changes\n- Regulatory actions (SEC lawsuits, ETF approvals, legislation)\n- Major protocol upgrades (Ethereum merge, Bitcoin halving)\n- Material corporate events (mergers, CEO changes, fraud)\n\n**Noise** — Information that generates emotional reactions but has no lasting price impact:\n- Influencer opinions and price predictions\n- \"Analysts say Bitcoin will hit $X\" headlines\n- Daily narratives explaining why the market moved (these are written after the fact)\n- Telegram/Discord group \"alpha\" (usually exit liquidity)\n- Minor news recycled as breaking content",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "\"When the shoeshine boy gives you stock tips, it's time to sell.\" — Joe Kennedy. When everyone you know is talking about an asset, the smart money has already positioned. Widespread media attention on any single asset is a contrarian sell signal more often than a buy signal.",
        },
        {
          type: "text",
          content:
            "### The News Trading Trap\n\nBy the time you read news, the market has already priced it in. Algorithms parse headlines in milliseconds. Institutional traders have the information before the article is published. If you're reacting to a CNBC headline, you're the last to know.\n\n### A Better Approach\n\n1. **Check the economic calendar** — Know what data is coming and when.\n2. **Read the actual source** — Fed statements, SEC filings, company 10-Ks. Not summaries.\n3. **Watch the price reaction** — A stock drops on \"bad\" news then immediately recovers? The news wasn't as bad as people thought, or it was already priced in.\n4. **Limit your sources** — 2-3 high-quality sources beat 20 mediocre ones. Bloomberg, Reuters, and the official data sources are sufficient.\n5. **Set a news schedule** — Check news at fixed times (morning, evening), not every 10 minutes. Reactive trading is losing trading.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "fa-5-1",
              question:
                "A stock drops 5% on a negative earnings report but recovers all losses by end of day. What does this price action suggest?",
              options: [
                "The earnings were actually good",
                "A market glitch occurred",
                "The negative news was likely already priced in — the initial drop was weak sellers being absorbed by stronger buyers",
                "The news was fake",
              ],
              correctIndex: 2,
              explanation:
                "When price drops on bad news but quickly recovers, it signals that the bad news was already expected (priced in) and the sellers were overwhelmed by buyers viewing the dip as an opportunity. This price action is often more bullish than a stock that barely reacts to good news.",
            },
          ],
        },
      ],
    },
    {
      slug: "combining-fundamental-technical",
      title: "Combining Fundamental & Technical Analysis",
      description:
        "How to use both disciplines together for higher-conviction trades.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "The strongest trade setups occur when fundamental and technical analysis point in the same direction. This is called **confluence** — multiple independent reasons to take the same trade.\n\n### The Confluence Framework\n\n**Step 1: Fundamental Thesis**\nDecide the direction based on fundamentals:\n- \"The Fed is likely to cut rates → bullish for growth stocks\"\n- \"Bitcoin halving in 3 months → reduced supply → bullish long-term\"\n- \"Company X beat earnings and raised guidance → bullish\"\n\n**Step 2: Technical Timing**\nUse charts to find the best entry:\n- Wait for a pullback to support within the fundamental uptrend\n- Look for a bullish candlestick pattern (hammer, engulfing) at a key level\n- Confirm with volume and moving average alignment\n\n**Step 3: Execute with Risk Management**\n- Entry: at the technical level that confirms your thesis\n- Stop: below the level that invalidates both your technical and fundamental thesis\n- Target: at the next major resistance or based on your risk-reward ratio\n\n### Example: Combining Both\n\nYou analyze Apple stock:\n- **Fundamental:** Revenue growing 12% YoY, services segment expanding, 3 consecutive earnings beats.\n- **Technical:** Stock pulled back to the 50-day moving average, which has held as support 4 times this year. RSI at 40 (not overbought).\n- **Trade:** Buy at the 50-day MA ($185), stop at $178 (below previous swing low), target $200 (previous resistance).\n\nYou now have multiple independent reasons for the trade. If only one discipline supported it, your conviction — and position size — should be smaller.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "When fundamentals and technicals disagree, step aside. For example, if a company has great earnings but the chart is in a clear downtrend, something else is driving price down. Don't force a trade when the signals conflict — there will always be another setup.",
        },
        {
          type: "text",
          content:
            "### Common Combination Strategies\n\n| Strategy | Fundamental Filter | Technical Entry |\n|----------|-------------------|------------------|\n| Earnings momentum | Beat estimates + raised guidance | Breakout above pre-earnings high |\n| Macro rotation | Fed pivot to rate cuts | Buy growth ETF at 200-day MA |\n| Crypto cycle | Post-halving, exchange outflows | Weekly RSI above 50, breakout from range |\n| Value dip-buying | Strong balance sheet, high free cash flow | Price at multi-month support |\n\n### Journal Your Reasoning\n\nTraverse lets you log both your fundamental thesis and technical entry for every trade. Over time, you'll see which combinations produce your best trades — and which fundamental catalysts you misread. This feedback loop is how analysis skills compound.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "fa-6-1",
              question:
                "What should you do when your fundamental and technical analysis disagree?",
              options: [
                "Always trust fundamentals",
                "Always trust technicals",
                "Step aside — conflicting signals mean uncertainty, and there will be other setups",
                "Double your position size to average out the uncertainty",
              ],
              correctIndex: 2,
              explanation:
                "When fundamentals say buy but the chart says sell (or vice versa), you lack the confluence that produces high-conviction trades. The best approach is to wait until both align. There's no penalty for skipping uncertain setups — capital preservation is always the priority.",
            },
          ],
        },
      ],
    },
  ],
};
