import type { CourseDefinition } from "../types";

export const MARKET_PSYCHOLOGY: CourseDefinition = {
  slug: "market-psychology",
  title: "Market Psychology & Crowd Behavior",
  description:
    "Understand how markets move by understanding the people trading them. Fear cycles, greed cycles, market structure psychology, and how to position when the crowd is wrong.",
  emoji: "🌊",
  category: "psychology",
  difficulty: "advanced",
  recommendedFor: [
    "adaptive_analyst",
    "disciplined_strategist",
    "status_driven_competitor",
  ],
  totalXP: 210,
  published: true,
  lessons: [
    {
      slug: "markets-are-people",
      title: "Markets Are People",
      description: "Behind every candle is a human making an emotional decision. Understanding this changes everything.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "A price chart isn't a random line. It's the aggregate emotional state of thousands of people making decisions under uncertainty. Every candle represents real humans feeling fear, greed, hope, and regret.\n\n### The Composite Trader\n\nImagine combining every market participant into one person — the \"composite trader.\" This person:\n- Buys at the top (when euphoria peaks)\n- Sells at the bottom (when despair peaks)\n- Chases breakouts that fail and ignores breakouts that work\n- Is consistently wrong at turning points\n\nThis is who you're trading against. If you can understand what the composite trader is feeling at any given moment, you have an edge.\n\n### Price as Emotion\n\n**Sharp rally on high volume:** Excitement and FOMO. Late buyers are piling in. Smart money is distributing.\n\n**Slow grind up on declining volume:** Complacency. Price rises but conviction is weak. Vulnerable to reversal.\n\n**Panic sell on massive volume:** Capitulation. The last weak hands are exiting. Often near a bottom — but it can go lower.\n\n**Tight range after a big move:** Indecision. Neither side has conviction. Energy is building for the next move.\n\nLearning to read these emotional signatures in price action is the foundation of market psychology.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "\"The market is a device for transferring money from the impatient to the patient.\" — Warren Buffett. Patience is a psychological edge, not just a virtue.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "mp-1-1",
              question: "A stock rallies 20% in two days on massive volume. What is the crowd likely feeling, and what might this signal?",
              options: [
                "Confidence — the rally is confirmed by volume and will continue",
                "FOMO and euphoria — late buyers are piling in, which often signals a short-term top as smart money distributes",
                "Indifference — volume doesn't matter",
                "Fear — high volume means sellers are panicking",
              ],
              correctIndex: 1,
              explanation: "Sharp rallies on massive volume often represent peak euphoria — the point where the last buyers enter. High volume at the top means everyone who wanted to buy has already bought. With no remaining buyers, the path of least resistance is down.",
            },
          ],
        },
      ],
    },
    {
      slug: "fear-greed-cycle",
      title: "The Fear-Greed Cycle",
      description: "The predictable emotional cycle that drives every bull and bear market. Learn where you are in it.",
      readingTime: 8,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Markets move in cycles, and these cycles are driven by predictable emotional phases. Understanding where the market is in this cycle gives you a framework for decision-making.\n\n### The Emotional Cycle of Markets\n\n**1. Disbelief** — \"This rally won't last.\" After a major bottom, most people are still bearish. Early adopters buy, but the majority is skeptical.\n\n**2. Hope** — \"Maybe this is real.\" More buyers enter. Price breaks resistance levels. Media starts covering the rally.\n\n**3. Optimism** — \"This is definitely going up.\" Mainstream investors enter. Volume increases. \"I should buy more.\"\n\n**4. Excitement** — \"This is incredible!\" Social media explodes. Your Uber driver mentions buying Bitcoin. Everyone is an expert.\n\n**5. Euphoria** — \"To the moon!\" Maximum financial risk. Leverage is high. Valuations are absurd. \"This time is different.\" **This is where professional money sells.**\n\n**6. Anxiety** — \"Is this a dip or something worse?\" First significant drop. \"Buy the dip\" mentality.\n\n**7. Denial** — \"It'll come back.\" The narrative hasn't changed but the price has.\n\n**8. Fear** — \"This is bad.\" The drop accelerates. Margin calls. Forced selling.\n\n**9. Despair** — \"I'm never trading again.\" Capitulation. **This is where professional money buys.**\n\n**10. Depression** — \"Markets are rigged.\" Low volume. Low interest. The bottom forms in silence, not in headlines.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "\"Be fearful when others are greedy, and greedy when others are fearful.\" — Buffett. This is psychologically brutal because it means buying when everything feels hopeless and selling when everything feels amazing.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "mp-2-1",
              question: "At which phase of the emotional cycle does maximum financial risk typically occur?",
              options: ["Hope", "Optimism", "Euphoria", "Anxiety"],
              correctIndex: 2,
              explanation: "Euphoria is maximum risk because everyone who will buy has already bought (no remaining buyers), leverage is at highs, and valuations are disconnected from fundamentals. This is where smart money sells to the euphoric crowd.",
            },
          ],
        },
      ],
    },
    {
      slug: "contrarian-thinking",
      title: "Contrarian Thinking",
      description: "When to go against the crowd — and when the crowd is actually right.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Contrarian Edge\n\nThe crowd is right during trends but wrong at turning points. This distinction is crucial — mindless contrarianism is just as dangerous as mindless following.\n\n**When to be contrarian:**\n- Extreme sentiment readings (Fear & Greed index at extremes)\n- Record leverage or record short interest\n- Unanimous consensus (\"Everyone knows it's going up/down\")\n- Media saturation (when your non-trading friends ask about markets)\n\n**When the crowd is RIGHT:**\n- During the middle of strong trends\n- When fundamentals clearly support the direction\n- When institutional money (not just retail) confirms the move\n\n### Measuring Crowd Sentiment\n\n**Quantitative tools:**\n- Fear & Greed Index (CNN, Crypto alternatives)\n- Put/Call ratios (options market fear/greed)\n- Funding rates (crypto perpetuals)\n- Social media sentiment (cautionary — easy to manipulate)\n\n**Qualitative signals:**\n- Magazine cover indicator (when TIME/Bloomberg covers crypto, the top is near)\n- Cocktail party indicator (when amateurs talk about trading, euphoria is here)\n- Capitulation signals (\"I'm done with crypto forever\" posts go viral)\n\n### The Implementation\n\nContrarian trading doesn't mean blindly buying when others sell. It means:\n1. Monitor sentiment indicators\n2. When sentiment hits extremes, START looking for setups in the opposite direction\n3. Use your technical system to time the entry\n4. The sentiment extreme is the context; your entry rules are the execution",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Track sentiment indicators in your Traverse journal alongside your trades. Over time, you'll build a personal dataset of how sentiment extremes correlate with turning points in the assets you trade.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "mp-3-1",
              question: "When should you be contrarian?",
              options: [
                "Always — the crowd is always wrong",
                "Never — follow the trend",
                "At sentiment extremes when the crowd becomes unanimously bullish or bearish — but NOT during the middle of strong trends",
                "Only during bear markets",
              ],
              correctIndex: 2,
              explanation: "The crowd is right during trends (the middle) but wrong at extremes (turning points). Contrarian positioning only works when sentiment has reached an extreme — and even then, you need technical confirmation for timing.",
            },
          ],
        },
      ],
    },
    {
      slug: "liquidity-and-market-makers",
      title: "Liquidity, Market Makers & Stop Hunts",
      description: "How institutional players use retail psychology against you — and how to avoid being the liquidity.",
      readingTime: 8,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### You Are the Liquidity\n\nLarge traders can't simply buy or sell — they need someone on the other side. Retail traders provide that liquidity, and institutional players know exactly where retail stops and entries cluster.\n\n### Where Stops Cluster\n\nRetail traders place stops at predictable levels:\n- Just below round numbers ($50,000, $100)\n- Just below obvious support levels\n- At the exact same distance (\"I always use a 2% stop\")\n- Below recent swing lows (textbook technical analysis)\n\n### The Stop Hunt Pattern\n\n1. Price approaches a well-known support level\n2. Price breaks below support — triggering a cascade of stop losses\n3. Volume spikes as stops are hit (retail sells into institutional buys)\n4. Price quickly reverses back above support\n5. The \"liquidity sweep\" is complete — institutions bought at the best price\n\nThis isn't conspiracy theory. It's market mechanics. Large players need liquidity, and they find it where stops are densely clustered.\n\n### How to Protect Yourself\n\n1. **Don't place stops at obvious levels.** If everyone's stop is at $49,900, put yours at $49,500 or use a wider ATR-based stop.\n2. **Wait for the sweep.** If you see a sharp break below support followed by immediate reversal, that's often a buying opportunity — not a breakdown.\n3. **Reduce size instead of tightening stops.** A wider stop with a smaller position gives you the same dollar risk with less chance of getting hunted.\n4. **Don't chase breakouts.** Many \"breakouts\" are liquidity grabs designed to trigger entries, then reverse.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "If your stops consistently get hit right before the market reverses in your favor, you're likely placing stops at the same levels as the crowd — making yourself easy liquidity for larger players.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "mp-4-1",
              question: "Why do 'stop hunts' happen?",
              options: [
                "Because the market is manipulated by a single entity",
                "Because large traders need liquidity, and retail stop clusters provide it — breaking below stops triggers selling that institutions buy into",
                "Because stop losses don't work",
                "Because technical analysis is fake",
              ],
              correctIndex: 1,
              explanation: "Stop hunts are a liquidity mechanism. Large buyers can't fill big orders without someone selling to them. Retail stops provide that selling pressure. The price drops below support → stops trigger → retail sells → institutions buy the cheap fills → price reverses.",
            },
          ],
        },
      ],
    },
    {
      slug: "narrative-psychology",
      title: "Narratives & Story-Driven Markets",
      description: "Markets don't trade on facts — they trade on stories. Learn to read, use, and distrust narratives.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Markets Trade on Stories\n\nFacts are boring. Stories are compelling. Markets move not because of data, but because of the STORY people tell about data.\n\n**Example:** Unemployment drops from 4.2% to 3.8%. \n- **Bullish narrative:** \"Economy is strong! Risk-on!\"\n- **Bearish narrative:** \"Fed will raise rates to cool the hot economy. Risk-off.\"\n\nSame data point. Opposite conclusions. Which narrative wins depends on what the market wants to believe at that moment — which depends on where we are in the fear-greed cycle.\n\n### Narrative Life Cycle\n\n**1. Emergence:** A new story appears. \"AI will change everything.\" Early believers buy.\n\n**2. Adoption:** The story gains traction. Media amplifies it. Prices rise, which \"confirms\" the narrative.\n\n**3. Peak consensus:** \"Everyone knows\" the narrative. Prices are fully extended. The story is priced in.\n\n**4. Disillusionment:** Reality doesn't match the story. Or a new story emerges. Prices decline.\n\n**5. Death or evolution:** The narrative either dies (\"NFTs are the future\" → dead) or evolves (\"AI will change everything\" → \"Only AI companies with real revenue will survive\").\n\n### How to Use Narratives\n\n1. **Identify the dominant narrative** — What story is the market telling right now?\n2. **Assess the life cycle** — Is it early (opportunity) or peak consensus (danger)?\n3. **Watch for narrative shifts** — When the story changes, price follows. Often with a delay.\n4. **Don't fight the narrative** — Until it breaks. Trade with the story during phases 1-3. Reduce exposure at phase 3-4.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "\"When everyone is thinking the same, no one is thinking.\" — George Patton. Peak consensus is peak danger — not because the narrative is wrong, but because there's no one left to buy the story.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "mp-5-1",
              question: "A narrative has reached 'peak consensus' — every analyst agrees, every headline confirms it. What does this signal?",
              options: [
                "The trend is strong and will continue",
                "It's safe to enter because everyone agrees",
                "Maximum danger — the story is fully priced in and there are no remaining buyers to push prices higher",
                "Nothing — narratives don't affect prices",
              ],
              correctIndex: 2,
              explanation: "Peak consensus means everyone who believes the story has already bought. With no remaining buyers, any crack in the narrative — even a small one — triggers selling. 'Priced in' means the upside potential from this story is exhausted.",
            },
          ],
        },
      ],
    },
    {
      slug: "reading-the-crowd-in-practice",
      title: "Reading the Crowd in Practice",
      description: "Putting it all together — a practical framework for incorporating market psychology into your trading.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Your Market Psychology Framework\n\nCombine everything you've learned into a practical process:\n\n**Step 1: Identify the emotional phase**\nWhere are we in the fear-greed cycle? Use quantitative indicators (Fear & Greed Index, funding rates) and qualitative signals (media tone, social media sentiment).\n\n**Step 2: Map the narrative**\nWhat's the dominant story? What phase is it in? Is it emerging (opportunity) or consensus (danger)?\n\n**Step 3: Read the crowd positioning**\nWhere are retail stops? Where is leverage concentrated? What does options open interest tell you?\n\n**Step 4: Apply to your system**\nUse market psychology as a FILTER, not an entry signal:\n- Green light: Your setup + psychology supports direction\n- Yellow light: Your setup fires but psychology is neutral → reduce size\n- Red light: Your setup fires but psychology strongly opposes it (extreme sentiment, peak narrative) → skip or reverse\n\n### Practical Examples\n\n**Example 1:** Your technical system signals a long on BTC. Funding rates are extremely positive (crowded long). Sentiment is euphoric. **Decision:** Skip or reduce size — the crowd is overly bullish.\n\n**Example 2:** Your system signals a long on BTC. Sentiment is fearful. Funding rates are negative. Everyone is calling for a crash. **Decision:** Take the trade with full conviction — psychology supports the contrarian setup.\n\n### The Meta-Lesson\n\nMarket psychology isn't about predicting the future. It's about understanding the emotional environment in which you're trading — and adjusting your behavior accordingly. It's the difference between swimming with the current and swimming against it.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Add a 'Market Sentiment' field to your Traverse daily check-in. Rate it 1-10 (1 = extreme fear, 10 = extreme greed). Over months, you'll see how your own sentiment correlates with market turning points.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "mp-6-1",
              question: "How should you use market psychology in your trading system?",
              options: [
                "As your primary entry signal — only trade based on sentiment",
                "Ignore it — only use technical analysis",
                "As a filter that adjusts your confidence and sizing when your technical system generates a signal",
                "Only check sentiment after you've already entered a trade",
              ],
              correctIndex: 2,
              explanation: "Market psychology works best as a filter, not a signal. Your technical system tells you WHAT to trade. Psychology tells you HOW CONFIDENT to be. When technicals and psychology align, trade with full size. When they conflict, reduce exposure or skip.",
            },
          ],
        },
      ],
    },
  ],
};
