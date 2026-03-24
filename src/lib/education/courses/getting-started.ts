import type { CourseDefinition } from "../types";

export const GETTING_STARTED: CourseDefinition = {
  slug: "getting-started",
  title: "Getting Started: Your First Steps",
  description:
    "Brand new to trading? Start here. Learn what trading actually is, how to set up safely, and take your first steps without making the common beginner mistakes.",
  emoji: "🚀",
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
  totalXP: 180,
  published: true,
  freeTier: true,
  lessons: [
    {
      slug: "what-is-trading",
      title: "What Is Trading?",
      description: "Trading vs investing, how markets work, and what you're actually doing when you click 'buy'.",
      readingTime: 6,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "Trading is buying and selling financial assets — stocks, crypto, currencies, commodities — with the goal of making a profit from price changes.\n\n### Trading vs. Investing\n\n**Investing** is buying assets to hold for months or years. You believe in the long-term growth of a company or asset. Warren Buffett is an investor.\n\n**Trading** is buying and selling over shorter timeframes — minutes, hours, days, or weeks. You're trying to profit from price movements, regardless of the asset's long-term prospects.\n\nBoth are valid. Many people do both. This platform focuses on trading — the active management of positions based on analysis and strategy.\n\n### What Moves Prices?\n\nPrices move because of **supply and demand**. That's it. Everything else — news, earnings, tweets, technical patterns — influences price only by changing supply and demand.\n\n- More buyers than sellers → price goes up\n- More sellers than buyers → price goes down\n- Equal buyers and sellers → price stays flat\n\n### Your Role as a Trader\n\nYou're trying to predict which way supply and demand will shift — and position yourself accordingly. That's the entire game. Everything you'll learn in this platform is about making better predictions and managing the risk when you're wrong.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "You don't need to be right most of the time. Many profitable traders are wrong on 40-50% of their trades. They make money because their winners are bigger than their losers. Risk management > prediction accuracy.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "gs-1-1",
              question: "What is the fundamental difference between trading and investing?",
              options: [
                "Trading is riskier",
                "Trading focuses on shorter-term price movements; investing focuses on long-term growth",
                "Investing is only for stocks",
                "Trading requires more money",
              ],
              correctIndex: 1,
              explanation: "The core difference is time horizon. Traders profit from short-term price movements (minutes to weeks), while investors hold for months to years based on long-term growth potential. Risk levels depend on the individual's approach, not the activity itself.",
            },
          ],
        },
      ],
    },
    {
      slug: "brokers-and-exchanges",
      title: "Brokers & Exchanges: Where You Trade",
      description: "The difference between brokers and exchanges, how to choose one, and what to watch out for.",
      readingTime: 7,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "### What Is an Exchange?\n\nAn exchange is where buyers and sellers meet to trade. The New York Stock Exchange (NYSE), NASDAQ, Binance, Coinbase — these are all exchanges. They maintain the **order book** — a list of all buy and sell orders waiting to be matched.\n\n### What Is a Broker?\n\nA broker is your gateway to the exchange. You can't walk into the NYSE and buy stocks directly. You need a broker — an intermediary that executes your orders on the exchange.\n\n**Traditional brokers (stocks):** Interactive Brokers, TD Ameritrade, Robinhood, eToro\n**Crypto exchanges (act as both broker and exchange):** Binance, Coinbase, Kraken, Bybit\n\n### How to Choose\n\n**For stocks:**\n- Low or zero commissions\n- Regulated in your country\n- Good charting tools\n- Fast execution\n- Customer support\n\n**For crypto:**\n- Proof of reserves (can they cover withdrawals?)\n- Trading fees (maker/taker fee structure)\n- Available trading pairs\n- Security track record\n- Withdrawal options\n\n### What to Watch Out For\n\n1. **Hidden fees** — Some brokers charge zero commissions but have wide spreads (the gap between buy and sell price). This is a hidden cost.\n2. **Leverage traps** — Some platforms offer 100x leverage by default. This is not for beginners.\n3. **Custodial risk** — \"Not your keys, not your coins\" applies to crypto. Consider withdrawing to a personal wallet.\n4. **Regulatory status** — Unregulated brokers can freeze your funds or shut down without recourse.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "Never deposit money you can't afford to lose. Start with a small amount — enough that losing it would be uncomfortable but not devastating. You can always add more once you're consistently profitable.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "gs-2-1",
              question: "What is the role of a broker?",
              options: [
                "To store your money safely",
                "To act as an intermediary that executes your buy/sell orders on exchanges",
                "To give you trading advice",
                "To guarantee your trades will be profitable",
              ],
              correctIndex: 1,
              explanation: "A broker is your access point to exchanges. They receive your order (buy 10 shares of Apple) and execute it on the exchange where buyers and sellers are matched. They charge fees or commissions for this service.",
            },
          ],
        },
      ],
    },
    {
      slug: "paper-trading",
      title: "Paper Trading: Practice Without Risk",
      description: "Why you should NEVER start with real money, and how to use paper trading effectively.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "Paper trading (also called demo trading or simulated trading) lets you practice with fake money in real market conditions. The charts are real, the prices are real — but the money isn't.\n\n### Why Paper Trade First?\n\n1. **Learn the platform** — Every broker has different interfaces, order types, and tools. Make your button-clicking mistakes with fake money.\n2. **Test your strategy** — Does your approach actually work in live markets? Paper trading lets you find out without financial pain.\n3. **Build discipline** — Develop your routine, checklist, and journal habit before real money amplifies your emotions.\n\n### How Long to Paper Trade?\n\nMinimum: 30 trades over 2-4 weeks. But there's a catch — paper trading doesn't teach you about emotions. Losing fake money doesn't feel like losing real money. So paper trading validates your strategy, not your psychology.\n\n### The Paper → Real Transition\n\n1. Paper trade until you're consistently following your rules (30+ trades)\n2. Switch to real money with the SMALLEST possible position size\n3. Trade this tiny size for 50+ trades\n4. Only increase size after proving you can follow your rules with real money on the line\n\nThe jump from paper to real is where most beginners struggle. Their strategy worked on paper but their emotions sabotage them with real money. Start tiny to minimize this shock.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Traverse's simulator lets you practice trades without risking real money. Use it to test strategies and build your journal habit before going live.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "gs-3-1",
              question: "What is the main limitation of paper trading?",
              options: [
                "The charts aren't realistic",
                "You can't learn order types",
                "It doesn't teach you about emotional responses to real money losses",
                "Paper trading is too slow",
              ],
              correctIndex: 2,
              explanation: "Paper trading validates your strategy but not your psychology. Losing $500 of fake money feels nothing like losing $500 of real money. This is why starting with very small real positions after paper trading is critical — it introduces emotions gradually.",
            },
          ],
        },
      ],
    },
    {
      slug: "your-first-trade",
      title: "Your First Trade: Step by Step",
      description: "A complete walkthrough of placing your first trade — from analysis to execution to review.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Before You Trade: The Pre-Flight Checklist\n\n1. **Choose your asset** — Pick one asset to start with. Just one. Master it before adding others. For crypto: BTC. For stocks: SPY or a large-cap stock you understand.\n2. **Decide your position size** — Maximum 1% of your account at risk. If you have $1,000, risk no more than $10.\n3. **Set your stop loss** — Before entering, decide where you'll exit if wrong. Write it down.\n4. **Set your target** — Where will you take profit? Aim for at least 2x your risk (1:2 R:R minimum).\n\n### Placing the Trade\n\n1. Open your broker/exchange\n2. Select your asset\n3. Choose order type: **Limit order** for a specific price, **Market order** for immediate execution\n4. Enter your position size\n5. Set your stop loss order\n6. Set your take profit order\n7. Double-check everything\n8. Click buy/sell\n\n### After the Trade\n\nWhether you won or lost:\n1. Log the trade in Traverse — symbol, entry, exit, emotion, notes\n2. Write one sentence: \"What did I learn from this trade?\"\n3. Grade your process (not the outcome): Did you follow your plan?\n\nThis log-and-review habit is more valuable than any strategy. It's how you improve.",
        },
        {
          type: "image",
          src: "/education/diagrams/risk-reward-ratio.svg",
          alt: "Risk-to-Reward Ratio diagram showing a 1:3 setup",
          caption: "Always aim for at least 1:2 risk-to-reward on your first trades.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "gs-4-1",
              question: "What should you decide BEFORE entering any trade?",
              options: [
                "How much profit you want to make today",
                "Your entry, stop loss, target, and position size",
                "Which influencer recommended this trade",
                "How long you'll hold the position",
              ],
              correctIndex: 1,
              explanation: "Every trade needs a complete plan before execution: entry price, stop loss (where you exit if wrong), target (where you take profit), and position size (how much to risk). Without all four, you're gambling, not trading.",
            },
          ],
        },
      ],
    },
    {
      slug: "common-beginner-mistakes",
      title: "The 7 Most Expensive Beginner Mistakes",
      description: "Learn from others' failures so you don't have to pay the same tuition.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Mistake 1: Trading Without a Plan\n\"I'll just see what happens.\" — This is how accounts die. Every trade needs an entry, stop, target, and size defined BEFORE you click buy.\n\n### Mistake 2: Risking Too Much Per Trade\nBetting 10-20% of your account on one trade means 5 losses = account destroyed. Risk 1-2% maximum. Boring? Yes. Survival? Also yes.\n\n### Mistake 3: No Stop Loss\n\"I'll watch it and exit manually.\" You won't. When the trade moves against you, your brain manufactures reasons to hold. Set the stop. Make it automatic.\n\n### Mistake 4: Chasing FOMO\nThe asset just pumped 50%. Everyone on Twitter is celebrating. You buy at the top. This is called \"buying someone else's exit.\" If you missed the move, wait for the next setup.\n\n### Mistake 5: Revenge Trading\nYou lost. You're angry. You immediately enter a bigger trade to \"make it back.\" This is how a $100 loss becomes a $500 loss. Walk away after a loss. Come back tomorrow.\n\n### Mistake 6: Too Many Trades\nMore trades ≠ more profit. Each trade has a cost (commissions + spread), and each trade is an opportunity for an emotional mistake. Quality over quantity.\n\n### Mistake 7: Not Journaling\nIf you don't record your trades, you can't improve. Your memory is biased — you'll remember the winners and forget the patterns that caused losses. Journal every single trade.",
        },
        {
          type: "image",
          src: "/education/diagrams/drawdown-recovery.svg",
          alt: "Drawdown recovery table showing asymmetric math",
          caption: "This is why Mistake #2 (risking too much) is so dangerous.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Every one of these mistakes is emotional, not intellectual. You probably already know you shouldn't revenge trade. The challenge is doing the right thing when your emotions are screaming. That's what this platform helps you with.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "gs-5-1",
              question: "An asset just pumped 40% and everyone on social media is excited. What should you do?",
              options: [
                "Buy immediately before it goes higher",
                "Wait — FOMO buying at the top after a big move is one of the most expensive beginner mistakes",
                "Short it immediately",
                "Buy with maximum leverage",
              ],
              correctIndex: 1,
              explanation: "Chasing a 40% pump means you're buying excitement, not a setup. The people posting gains bought BEFORE the move. You'd be buying their exit. Wait for the next setup with a proper entry, stop, and target.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-good-habits",
      title: "Building Good Habits from Day 1",
      description: "The daily habits that separate traders who survive from traders who quit.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "### The 5 Non-Negotiable Habits\n\n**1. Daily Check-in (2 minutes)**\nBefore trading: rate your mood, energy, and sleep. If any are below 6/10, trade smaller or skip the day. Traverse's Daily Check-in does this automatically.\n\n**2. Pre-Trade Checklist (30 seconds)**\nBefore every trade: Entry? Stop? Target? Size? If any is missing, don't enter.\n\n**3. Trade Logging (1 minute)**\nAfter every trade: log it in Traverse. Symbol, entry, exit, emotion, one sentence of notes. This takes 60 seconds and builds the dataset that will define your edge.\n\n**4. Daily Review (5 minutes)**\nEnd of day: How many trades? How many followed the plan? What was your best and worst decision? Grade yourself A through F on process.\n\n**5. Weekly Review (15 minutes)**\nEvery weekend: Win rate, average R:R, biggest mistake, one thing to improve next week. Traverse automates most of this.\n\n### The Compound Effect\n\nThese 5 habits take about 25 minutes per day. After 30 days, you have 30 daily check-ins, every trade logged, 30 daily reviews, and 4 weekly reviews. This is more self-awareness data than most traders accumulate in a year.\n\nAfter 90 days, you have a genuine Edge Profile — a statistical picture of your strengths, weaknesses, and patterns. No course, no guru, no indicator can give you this. It comes exclusively from your own data.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Start with habit #3 (trade logging) only. Once that's automatic, add the daily check-in. Build one habit at a time. Trying to do all five on day one is a recipe for doing none of them by day seven.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "gs-6-1",
              question: "How much time per day do the 5 core trading habits take?",
              options: [
                "2 hours",
                "About 25 minutes total",
                "1 hour minimum",
                "They take the whole trading session",
              ],
              correctIndex: 1,
              explanation: "All 5 habits combined take about 25 minutes — 2 min check-in, 30 sec pre-trade checklist (per trade), 1 min trade log, 5 min daily review. This small daily investment compounds into massive self-awareness over weeks and months.",
            },
          ],
        },
      ],
    },
  ],
};
