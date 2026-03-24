import type { CourseDefinition } from "../types";

export const UNDERSTANDING_MARKETS: CourseDefinition = {
  slug: "understanding-markets",
  title: "Understanding Markets & Exchanges",
  description:
    "Learn how financial markets actually work — from stock exchanges to crypto DEXs, how prices form, when markets are open, and who you're really trading against.",
  emoji: "🏛️",
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
  totalXP: 190,
  published: true,
  freeTier: true,
  lessons: [
    {
      slug: "stock-markets-explained",
      title: "Stock Markets Explained",
      description:
        "How stock exchanges work, what shares represent, and why millions of people trade them every day.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "A stock market is a marketplace where shares of publicly traded companies are bought and sold. When you buy a share of Apple, you own a tiny fraction of the company — its profits, its assets, and its future.\n\n### How Stocks Get Listed\n\nCompanies go public through an **Initial Public Offering (IPO)**. They sell shares to raise capital, and those shares then trade on an exchange like the NYSE or NASDAQ. After the IPO, the company doesn't directly profit from share price changes — the trading happens between investors.\n\n### Major Stock Exchanges\n\n- **NYSE (New York Stock Exchange)** — The world's largest by market cap. Home to blue chips like Berkshire Hathaway, JPMorgan, and Walmart.\n- **NASDAQ** — Tech-heavy. Home to Apple, Microsoft, Tesla, and most growth stocks.\n- **LSE (London Stock Exchange)** — Europe's largest. Trades in GBP.\n- **TSE (Tokyo Stock Exchange)** — Asia's largest. Home to Toyota, Sony, and SoftBank.\n\n### What You're Actually Trading\n\nWhen you buy 10 shares of Tesla at $200, you're not buying from Tesla. You're buying from another trader who wants to sell at $200. The exchange matches buyers and sellers automatically through an order book.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "You don't need to understand corporate finance to trade stocks. Many successful traders focus purely on price action and technical analysis. But knowing what a stock represents helps you interpret news and earnings reports.",
        },
        {
          type: "text",
          content:
            "### Key Stock Market Concepts\n\n- **Market Cap** — Total value of all shares. Apple's market cap exceeds $3 trillion.\n- **Dividends** — Some companies pay shareholders a portion of profits quarterly.\n- **Indices** — The S&P 500, Dow Jones, and NASDAQ Composite track groups of stocks to measure overall market health.\n- **Sectors** — Stocks are grouped into sectors (tech, healthcare, energy, etc.). Sectors rotate in and out of favor.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "um-1-1",
              question:
                "When you buy shares of a company on the stock market, who are you buying from?",
              options: [
                "The company itself",
                "The stock exchange",
                "Another trader or investor who wants to sell",
                "The government",
              ],
              correctIndex: 2,
              explanation:
                "After a company's IPO, shares trade between investors on the secondary market. The exchange simply matches buyers with sellers — it doesn't own or sell the shares itself.",
            },
          ],
        },
      ],
    },
    {
      slug: "crypto-markets-explained",
      title: "Crypto Markets Explained",
      description:
        "How cryptocurrency exchanges differ from traditional markets, and what makes crypto trading unique.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Cryptocurrency markets operate on fundamentally different infrastructure than traditional stock markets. Instead of regulated exchanges with market makers in suits, crypto runs on blockchain networks and digital order books that never close.\n\n### Centralized Exchanges (CEXs)\n\nCEXs like Binance, Coinbase, and Kraken work similarly to stock brokers. You deposit funds, place orders, and the exchange matches them. Your crypto is held in the exchange's wallets — you trust them with custody.\n\n**Pros:** Fast execution, high liquidity, familiar interface, fiat on-ramps.\n**Cons:** Custodial risk (FTX collapse), KYC requirements, potential withdrawal freezes.\n\n### Decentralized Exchanges (DEXs)\n\nDEXs like Uniswap, Jupiter, and dYdX let you trade directly from your own wallet using smart contracts. No intermediary holds your funds.\n\n**Pros:** Self-custody, permissionless, no KYC, transparent.\n**Cons:** Higher fees (gas), lower liquidity for small tokens, smart contract risk, no customer support.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "The FTX collapse in 2022 wiped out billions in customer funds held on a centralized exchange. The lesson: never keep more on an exchange than you're actively trading. Move long-term holdings to a hardware wallet.",
        },
        {
          type: "text",
          content:
            "### What Makes Crypto Unique\n\n- **24/7 trading** — No market close, no weekends. Prices move while you sleep.\n- **High volatility** — 10% daily swings are normal. This creates opportunity and risk.\n- **Global and permissionless** — Anyone with internet can participate.\n- **Thousands of assets** — From BTC and ETH to micro-cap altcoins. Most altcoins will go to zero.\n- **Leverage widely available** — Exchanges offer 10x-125x leverage. This is how accounts get liquidated in minutes.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "um-2-1",
              question:
                "What is the key difference between a centralized exchange (CEX) and a decentralized exchange (DEX)?",
              options: [
                "CEXs are faster",
                "DEXs have better customer support",
                "On a CEX, the exchange holds your funds; on a DEX, you trade directly from your own wallet",
                "DEXs only trade Bitcoin",
              ],
              correctIndex: 2,
              explanation:
                "The fundamental difference is custody. A CEX holds your crypto in their wallets (custodial), while a DEX lets you trade directly from your personal wallet using smart contracts (non-custodial). This affects security, privacy, and counterparty risk.",
            },
          ],
        },
      ],
    },
    {
      slug: "forex-commodities-overview",
      title: "Forex & Commodities Overview",
      description:
        "The world's largest and oldest markets — where currencies and raw materials are traded.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "### Forex: The $7.5 Trillion Daily Market\n\nThe foreign exchange (forex) market is the world's largest financial market. Over $7.5 trillion changes hands every single day. Forex trading means buying one currency while selling another — currencies always trade in pairs.\n\n**Major pairs** (most liquid, lowest spreads):\n- EUR/USD — Euro vs. US Dollar\n- GBP/USD — British Pound vs. US Dollar\n- USD/JPY — US Dollar vs. Japanese Yen\n- USD/CHF — US Dollar vs. Swiss Franc\n\nWhen you buy EUR/USD at 1.0850, you're paying $1.085 for each Euro. If it rises to 1.0900, you profit from the 50-pip move.\n\n### Commodities: Trading Physical Goods\n\nCommodities are raw materials — things you can touch. They're traded on futures exchanges like the CME (Chicago Mercantile Exchange).\n\n**Hard commodities** (mined): Gold, silver, crude oil, natural gas.\n**Soft commodities** (grown): Wheat, coffee, sugar, cotton.\n\nMost retail traders access commodities through CFDs (Contracts for Difference) or ETFs rather than trading actual futures contracts, which require larger accounts and have expiration dates.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "Gold often rises when stock markets fall — traders treat it as a 'safe haven.' Understanding these correlations helps you read the bigger picture, even if you only trade one asset class.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "um-3-1",
              question: "What does it mean to 'buy EUR/USD'?",
              options: [
                "You are selling Euros and buying US Dollars",
                "You are buying Euros and selling US Dollars",
                "You are buying both currencies",
                "You are buying a European stock",
              ],
              correctIndex: 1,
              explanation:
                "In forex, currencies always trade in pairs. Buying EUR/USD means you are buying Euros (base currency) and simultaneously selling US Dollars (quote currency). You profit if the Euro strengthens against the Dollar.",
            },
          ],
        },
      ],
    },
    {
      slug: "how-prices-move",
      title: "How Prices Move: Bid, Ask, Spread & Liquidity",
      description:
        "The mechanics behind every price movement — understanding the order book, spreads, and why liquidity matters.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Every time you see a price on a chart, you're actually seeing two prices: the **bid** and the **ask**.\n\n### Bid and Ask\n\n- **Bid** — The highest price someone is willing to pay right now (what you get when you sell).\n- **Ask** — The lowest price someone is willing to accept right now (what you pay when you buy).\n- **Spread** — The gap between bid and ask. This is a real cost of trading.\n\nExample: Bitcoin shows a bid of $64,990 and an ask of $65,010. The spread is $20. If you buy at $65,010 and immediately sell, you'd lose $20 per BTC — the spread.\n\n### The Order Book\n\nBehind the bid and ask is the **order book** — a live list of all pending buy and sell orders at various prices. It looks like a ladder:\n\n```\nSell orders (asks):  $65,050 — 2.5 BTC\n                     $65,030 — 1.2 BTC\n                     $65,010 — 0.8 BTC  ← Best ask\n------- SPREAD -------\n                     $64,990 — 1.1 BTC  ← Best bid\nBuy orders (bids):   $64,970 — 3.0 BTC\n                     $64,950 — 5.2 BTC\n```",
        },
        {
          type: "text",
          content:
            "### Liquidity: Why It Matters\n\n**Liquidity** is how easily you can buy or sell without moving the price. High liquidity means tight spreads and minimal slippage. Low liquidity means wide spreads and your order can move the price against you.\n\n**High liquidity:** BTC, ETH, EUR/USD, Apple stock. Spreads are pennies. You can trade millions without significantly moving the price.\n\n**Low liquidity:** Small-cap altcoins, penny stocks, exotic forex pairs. Spreads can be 1-5%. A $10,000 order might move the price 2-3%.\n\n### Slippage\n\nSlippage is the difference between the price you expected and the price you actually got. It happens when the market moves between the time you place your order and when it's executed, or when your order is large relative to available liquidity.\n\nIn fast-moving markets (news events, liquidation cascades), slippage can be severe. A stop loss at $100 might execute at $97 if there aren't enough buyers at $100.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "Slippage is invisible until it hits you. Always check the spread before trading, especially on smaller assets. If the spread is more than 0.1% of the price, your edge needs to be large enough to overcome that cost on every trade.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "um-4-1",
              question:
                "Bitcoin shows a bid of $64,990 and an ask of $65,010. What is the spread?",
              options: ["$64,990", "$65,010", "$20", "$130,000"],
              correctIndex: 2,
              explanation:
                "The spread is the difference between the ask (what you pay to buy) and the bid (what you receive when you sell). $65,010 - $64,990 = $20. This $20 per BTC is the minimum cost of executing a round-trip trade.",
            },
          ],
        },
      ],
    },
    {
      slug: "market-hours-sessions",
      title: "Market Hours & Sessions",
      description:
        "When markets are open, why timing matters, and how global sessions overlap to create peak trading windows.",
      readingTime: 5,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "### Stock Market Hours\n\nStock markets have fixed trading hours:\n\n- **NYSE/NASDAQ:** 9:30 AM – 4:00 PM Eastern (Mon–Fri)\n- **Pre-market:** 4:00 AM – 9:30 AM Eastern (lower liquidity)\n- **After-hours:** 4:00 PM – 8:00 PM Eastern (lower liquidity)\n- **LSE (London):** 8:00 AM – 4:30 PM GMT\n- **TSE (Tokyo):** 9:00 AM – 3:00 PM JST\n\nMost volume and volatility occurs in the first and last hour of the regular session. The middle of the day ('lunch lull') tends to be quiet.\n\n### Forex Sessions\n\nForex trades 24 hours, 5 days a week. It's split into three major sessions:\n\n- **Asian session** (Tokyo): 7 PM – 4 AM Eastern\n- **European session** (London): 3 AM – 12 PM Eastern\n- **American session** (New York): 8 AM – 5 PM Eastern\n\nThe **London–New York overlap** (8 AM – 12 PM Eastern) is the most liquid and volatile window in forex. Most professional forex traders focus on this overlap.\n\n### Crypto: Always Open\n\nCrypto markets never close. This is both a feature and a risk — prices can move dramatically over weekends and holidays when traditional markets are closed.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "If you trade crypto, weekend volatility can be extreme due to lower liquidity. Consider reducing position sizes or tightening stops over weekends, especially if you can't monitor your positions.",
        },
        {
          type: "text",
          content:
            "### Why Timing Matters\n\nThe same asset behaves differently at different times:\n\n- **Market open** — High volatility, gaps from overnight news, wide spreads that narrow quickly.\n- **Mid-session** — Lower volatility, tighter ranges, fewer setups.\n- **Market close** — Volume picks up as institutions adjust positions.\n- **News events** — Fed announcements, earnings reports, and CPI data create predictable volatility spikes.\n\nPick a session that fits your schedule and learn its personality. Consistency beats coverage — it's better to master one session than to trade all of them poorly.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "um-5-1",
              question:
                "When is the most liquid and volatile period in forex trading?",
              options: [
                "The Asian session (Tokyo hours)",
                "The London–New York overlap (8 AM – 12 PM Eastern)",
                "Weekends",
                "After 8 PM Eastern",
              ],
              correctIndex: 1,
              explanation:
                "The London–New York overlap (8 AM – 12 PM Eastern) is when the two largest forex trading centers are both active. This produces the highest volume, tightest spreads, and strongest trends of the day.",
            },
          ],
        },
      ],
    },
    {
      slug: "market-participants",
      title: "Types of Market Participants",
      description:
        "Retail traders, institutions, market makers, and algorithms — know who you're up against.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Understanding who else is in the market helps you understand why prices move the way they do.\n\n### Retail Traders (You)\n\nIndividual traders using personal accounts. Retail typically accounts for 10-25% of daily stock volume and a larger share of crypto. Retail traders tend to be trend followers, FOMO-driven, and emotional during drawdowns.\n\n### Institutional Investors\n\nHedge funds, mutual funds, pension funds, and endowments. They manage billions and move markets. When a hedge fund buys $500 million of a stock, it takes days to fill the order without spiking the price. They use algorithms to slice large orders into thousands of small ones.\n\n### Market Makers\n\nFirms like Citadel Securities and Virtu Financial that provide liquidity by always offering both a bid and ask price. They profit from the spread — buying at the bid and selling at the ask, thousands of times per second. Market makers don't care about direction; they profit from volume.\n\n### High-Frequency Traders (HFTs)\n\nAlgorithmic systems that execute trades in microseconds. They exploit tiny price differences across exchanges (arbitrage), front-run large orders, and provide liquidity. They account for over 50% of US equity volume.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "You can't compete with institutions on speed or capital. Your edge as a retail trader is flexibility — you can enter and exit small positions instantly, sit in cash with no pressure, and wait for the best setups without reporting to investors.",
        },
        {
          type: "text",
          content:
            "### Whales (Crypto-Specific)\n\nIn crypto, 'whales' are large holders — often early adopters or venture funds — who can move the market with a single transaction. On-chain analysis tools like Whale Alert and Arkham Intelligence track these movements.\n\nWhen a whale deposits 10,000 BTC to an exchange, it often signals an intent to sell. When they withdraw to cold storage, it signals long-term holding.\n\n### How This Affects You\n\nYou don't need to outsmart institutions. You need to:\n1. **Avoid being their liquidity** — Don't chase breakouts with tight stops that get hunted.\n2. **Trade with them, not against them** — Follow institutional flow when you can identify it.\n3. **Use your size advantage** — You can enter and exit positions in seconds. A fund managing $10 billion can't.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "um-6-1",
              question:
                "What is the primary advantage retail traders have over institutional investors?",
              options: [
                "More capital",
                "Better technology",
                "Flexibility — ability to enter/exit quickly and sit in cash without pressure",
                "Access to insider information",
              ],
              correctIndex: 2,
              explanation:
                "Retail traders can move in and out of positions instantly, hold 100% cash with no pressure, and wait indefinitely for the best setups. Institutional fund managers must stay invested, report quarterly, and take days to fill large orders. Flexibility is your edge.",
            },
          ],
        },
      ],
    },
  ],
};
