import type { CourseDefinition } from "../types";

export const COGNITIVE_BIAS_DEEP_DIVE: CourseDefinition = {
  slug: "cognitive-bias-deep-dive",
  title: "Cognitive Bias Deep Dive",
  description:
    "Go beyond the basics. Master the 7 most expensive cognitive biases in trading — with detection techniques, real-world examples, and personalized debiasing strategies.",
  emoji: "🔍",
  category: "psychology",
  difficulty: "intermediate",
  recommendedFor: [
    "cautious_perfectionist",
    "anxious_overthinker",
    "adaptive_analyst",
  ],
  totalXP: 245,
  published: true,
  lessons: [
    {
      slug: "anchoring-in-trading",
      title: "Anchoring: The Price You Can't Forget",
      description: "How an irrelevant number controls your decisions without you realizing it.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Anchoring is the tendency to rely too heavily on the first piece of information you encounter when making decisions. In trading, your anchor is usually a previous price.\n\n### How Anchoring Shows Up\n\n**\"It was at $70K last week, so $65K is cheap.\"** — No. $65K is the current price. Whether it's cheap depends on fundamentals and technicals, not what it was last week.\n\n**\"My average entry is $50, I can't sell below that.\"** — Your entry price is irrelevant to the market. It doesn't know or care what you paid.\n\n**\"This stock was $200 before the crash, it's a steal at $80.\"** — Maybe. Or maybe $200 was overvalued and $80 is still expensive.\n\n### The Research\n\nKahneman and Tversky (1974) showed that even obviously random anchors influence decisions. Spin a wheel, get 65, then ask \"Is the percentage of African nations in the UN greater or less than 65%?\" People anchored to the random number gave higher estimates than those who saw 10.\n\nIn trading, your anchors aren't random — they're previous prices, analyst targets, and your own entry prices. This makes them harder to recognize as biases.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "Your entry price is the most dangerous anchor. It makes you hold losers (\"I'll sell when I get back to breakeven\") and sell winners too early (\"I'm up 20% from my entry, that's enough\"). The market doesn't know your entry price.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-1-1",
              question: "You bought BTC at $60,000. It drops to $55,000. You decide to hold because 'it'll come back to my entry.' Which bias is this?",
              options: ["Confirmation bias", "Loss aversion", "Anchoring to your entry price", "Sunk cost fallacy"],
              correctIndex: 2,
              explanation: "You're anchored to $60,000 — your entry price. The market's future direction has nothing to do with what you paid. Your entry price is your bias, not a support level.",
            },
          ],
        },
      ],
    },
    {
      slug: "disposition-effect",
      title: "The Disposition Effect: Selling Winners, Holding Losers",
      description: "The most profitable bias to fix — and most traders don't even know they have it.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "The disposition effect is the tendency to sell winning positions too early and hold losing positions too long. It's the single most common bias in trading, and fixing it alone can dramatically improve your results.\n\n### Why It Happens\n\nTwo forces combine:\n\n1. **Loss aversion** — Losses feel 2x worse than equivalent gains feel good. So you avoid realizing losses by holding losers.\n2. **Gain satisfaction** — A bird in the hand. When you're up, the fear of losing your unrealized gain pushes you to lock it in early.\n\nResult: You cut your winners at +5% and let your losers run to -20%. Even with a good strategy, this math guarantees long-term losses.\n\n### The Data Is Brutal\n\nOdean (1998) studied 10,000 retail trading accounts. Traders were 50% more likely to sell a winning position than a losing one. The winners they sold went on to outperform the losers they held by an average of 3.4% over the next year.\n\n### How to Detect It in Your Data\n\nCheck in Traverse:\n- Average winning trade size vs. average losing trade size\n- If your average loser is significantly larger than your average winner, you likely have the disposition effect\n- Check your hold time: do you hold losers longer than winners?",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse's MFE/MAE analysis directly reveals disposition effect. If your MAE (Maximum Adverse Excursion) is consistently much larger than your MFE (Maximum Favorable Excursion), you're holding losers longer than winners.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-2-1",
              question: "Your average winning trade is +$150 and your average losing trade is -$400. What does this likely indicate?",
              options: [
                "You have a good strategy but bad entries",
                "The disposition effect — you're cutting winners early and letting losers run",
                "You need tighter stop losses",
                "The market is too volatile for your strategy",
              ],
              correctIndex: 1,
              explanation: "A large disparity between average win and average loss (especially when the loss is much bigger) is the hallmark of the disposition effect. You're locking in small gains quickly but allowing losses to grow, hoping they'll reverse.",
            },
          ],
        },
      ],
    },
    {
      slug: "recency-and-availability-bias",
      title: "Recency & Availability Bias",
      description: "Why your last 3 trades matter more to your brain than your last 300.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Recency Bias\n\nRecent events carry more weight than they should. Three wins in a row? You feel invincible — position sizes creep up, setup criteria relax. Three losses? You become overly cautious, skip valid setups, or question your entire strategy.\n\nYour last 3 trades are a tiny sample. Your last 200 trades are statistically meaningful. But your brain treats them as equally important.\n\n### Availability Bias\n\nEvents that are easy to recall feel more common. If you vividly remember getting wrecked by a short squeeze, you'll overestimate the probability of short squeezes — even if they're rare.\n\n**In trading:**\n- A viral Twitter post about a 1000x altcoin makes you overestimate your own chances of finding one\n- A memorable crash makes you overestimate crash probability for months afterward\n- One spectacular setup type that worked memorably overshadows hundreds of boring-but-profitable setups\n\n### The Fix\n\n**For recency bias:** Always check your last 50+ trades before making strategy changes. Three losses isn't a broken strategy — it might be normal variance.\n\n**For availability bias:** Use data, not memory. Your Traverse analytics show actual frequencies. How often do your setups actually work? Don't guess — look.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The antidote to both biases is the same: data over memory. Your journal exists precisely because human memory is biased. Trust the spreadsheet, not the highlight reel in your head.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-3-1",
              question: "You had 3 losing trades in a row and want to completely change your strategy. Before making changes, what should you check first?",
              options: [
                "Ask other traders what they think",
                "Your last 50-100 trades for actual win rate and R:R statistics",
                "Financial news to see if the market changed",
                "Your indicators and signals",
              ],
              correctIndex: 1,
              explanation: "Three trades is far too small a sample to evaluate a strategy. Check your last 50-100 trades for statistically meaningful data. A 3-trade losing streak is normal for any strategy — your actual win rate over a large sample is what matters.",
            },
          ],
        },
      ],
    },
    {
      slug: "overconfidence-dunning-kruger",
      title: "Overconfidence & the Dunning-Kruger Effect",
      description: "Why beginners think they know everything and experts doubt themselves — and what this means for your risk.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Overconfidence Bias\n\nOverconfidence is the gap between how good you think you are and how good you actually are. In trading, it manifests as:\n\n- **Illusion of control:** \"I can read the market.\" (No one can read the market consistently.)\n- **Planning fallacy:** \"This trade will definitely work.\" (No trade is certain.)\n- **Calibration error:** When you're 90% confident, you're right about 70% of the time.\n\n### The Dunning-Kruger Effect in Trading\n\n**Beginner (0-50 trades):** Mount Stupid. You've had a few winners, read a few books. You think trading is easier than it is.\n\n**Intermediate (50-500 trades):** Valley of Despair. You've experienced real losses. You realize how much you don't know. This is actually progress.\n\n**Competent (500-2000 trades):** Slope of Enlightenment. You have enough data to know your actual edge. Confidence is now data-driven, not ego-driven.\n\n**Expert (2000+ trades):** Plateau of Sustainability. You know what you know AND what you don't know. You're appropriately calibrated.\n\n### Why This Matters for Risk\n\nOverconfident traders:\n- Size positions based on conviction (\"I'm sure about this one\")\n- Skip stop losses (\"It won't go against me\")\n- Overtrade (\"I see setups everywhere\")\n- Ignore contradictory evidence (\"That bearish signal doesn't apply here\")",
        },
        {
          type: "callout",
          variant: "warning",
          content: "The most dangerous phase is the first 50 trades — especially if they're profitable. Early success in a bull market creates the illusion of skill. The Dunning-Kruger peak is where accounts get blown up.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-4-1",
              question: "A trader with 30 profitable trades in a bull market decides to go full-time and max out their position sizes. Which phase of Dunning-Kruger are they in?",
              options: [
                "Expert — they have a proven track record",
                "Competent — 30 trades is enough to prove an edge",
                "Mount Stupid — early success in favorable conditions isn't proof of skill",
                "Valley of Despair — they're about to learn a hard lesson",
              ],
              correctIndex: 2,
              explanation: "30 trades in a bull market is far too small a sample, in conditions that flatter everyone. This is peak Dunning-Kruger — maximum confidence with minimum experience. The bear market will be a painful education.",
            },
          ],
        },
      ],
    },
    {
      slug: "sunk-cost-and-endowment",
      title: "Sunk Cost & Endowment Effect",
      description: "Why you value what you own more than what you don't — and how it keeps you in losing trades.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### The Sunk Cost Fallacy\n\n\"I've already lost $500 on this trade, I can't sell now.\"\n\nThe $500 is gone. It's a sunk cost. The only question that matters: if you had no position, would you enter this trade right now, at this price, with this information?\n\nIf the answer is no, holding is just throwing good money after bad.\n\n### The Endowment Effect\n\nYou value things you own more than identical things you don't own. In trading:\n- You overvalue your current positions simply because they're yours\n- You set higher sell prices for positions you hold than you'd pay to buy the same asset\n- You resist closing positions because it feels like \"giving something up\"\n\n### The \"Would I Buy It Today?\" Test\n\nFor every open position, ask weekly: \"If I had no position and saw this chart today, at this price, would I enter?\"\n\n- **Yes:** Keep the position\n- **No:** Close it, regardless of your entry price or how much you've lost\n- **Maybe:** Reduce the position by half\n\nThis test strips away sunk costs, anchoring to your entry, and the endowment effect. It's brutally simple and brutally effective.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Try this exercise: cover your P&L column in your Traverse trade log. Look only at the chart and current price. Would you enter these positions today? You'll be surprised how many you'd skip.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-5-1",
              question: "You're down 30% on a position. The fundamentals have deteriorated. You hold because 'I've already lost so much, it would be stupid to sell now.' What's the correct response?",
              options: [
                "Hold — selling at a 30% loss would lock in the loss",
                "Average down — buy more at the lower price to improve your average",
                "Ask: 'Would I buy this asset today at this price?' If no, sell — the 30% loss is already gone regardless of what you do",
                "Wait for breakeven, then sell",
              ],
              correctIndex: 2,
              explanation: "The 30% loss is a sunk cost — it's gone whether you sell or hold. The only question is: is this the best use of your remaining capital? If you wouldn't buy it today, your money is better deployed elsewhere.",
            },
          ],
        },
      ],
    },
    {
      slug: "hindsight-and-outcome-bias",
      title: "Hindsight & Outcome Bias",
      description: "Why judging decisions by results — instead of process — makes you a worse trader.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "### Hindsight Bias\n\n\"I knew it was going to drop.\" No, you didn't. You had a vague feeling, which you now reconstruct as certainty because you know the outcome.\n\nHindsight bias distorts your learning. If you think you \"knew\" what was going to happen, you don't analyze what you actually knew at the time of the decision. You miss the real lesson.\n\n### Outcome Bias\n\n**Bad process + good outcome ≠ good decision**\n\nIf you YOLO your entire account into a random altcoin and it 10x's, that was still a terrible decision. The outcome doesn't validate the process.\n\n**Good process + bad outcome ≠ bad decision**\n\nIf you followed your rules, sized correctly, set your stop, and lost — that was a GOOD decision. The market is probabilistic. Good decisions lose sometimes.\n\n### Why This Matters\n\nTraders who judge by outcomes:\n- Repeat bad processes that happened to work (until they don't)\n- Abandon good processes that happened to lose (and miss the edge)\n- Never develop a reliable system because they constantly change based on recent results\n\n### The Fix\n\nIn your Traverse journal, grade every trade on PROCESS, not P&L:\n- Did I follow my entry criteria? (yes/no)\n- Did I size correctly? (yes/no)\n- Did I follow my stop/target plan? (yes/no)\n- Process score: count of yes answers\n\nA losing trade with 3/3 on process is an A. A winning trade with 0/3 on process is an F.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The best traders in the world lose 40-50% of their trades. If you judge every loss as a mistake, you'll never trust any system long enough for the edge to show up.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-6-1",
              question: "You followed your rules perfectly but lost money on a trade. How should you grade this trade?",
              options: [
                "F — you lost money",
                "C — the process was good but the result was bad",
                "A — perfect process execution, the outcome is irrelevant to the grade",
                "Incomplete — need more data to grade it",
              ],
              correctIndex: 2,
              explanation: "Process is the only thing you control. A trade with perfect process execution is an A, regardless of outcome. Grading by outcome trains you to fear losses and chase wins — both destructive behaviors.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-your-debiasing-toolkit",
      title: "Building Your Debiasing Toolkit",
      description: "A practical system for catching and correcting biases in real-time, using your own data.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "You now know 7 major biases. The challenge is catching them in the moment — when your emotional brain is in charge and your rational brain is offline.\n\n### The Pre-Trade Bias Checklist\n\nBefore every trade, ask:\n1. **Anchoring:** Am I fixated on a specific price? Would I take this trade if I didn't know the previous high/low?\n2. **Disposition:** Am I entering to \"make back\" a previous loss, or because this setup has genuine merit?\n3. **Recency:** Am I overreacting to my last few trades? What does my 50-trade data say?\n4. **Overconfidence:** On a scale of 1-10, how confident am I? If > 8, reduce size.\n5. **Sunk cost:** Am I holding any positions just because \"I've already lost too much to sell\"?\n\n### Weekly Bias Review\n\nEvery weekend in your Traverse journal:\n- Tag your 3 worst trades with the bias that caused them\n- Look for repeating biases across weeks\n- Adjust your checklist to emphasize your personal weak spots\n\n### Ask Nova\n\nNova has access to your full trading history. Ask her:\n- \"Do I show signs of disposition effect?\"\n- \"Am I anchoring to any prices in my recent trades?\"\n- \"What biases are most evident in my last 50 trades?\"\n\nShe can spot patterns across hundreds of data points that you'd never see yourself.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Print your top 3 biases on a sticky note next to your screen. Before every trade, glance at it. This 2-second habit prevents more losses than any indicator.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "cbd-7-1",
              question: "What is the single most effective way to detect cognitive biases in your own trading?",
              options: [
                "Read more books about behavioral economics",
                "Use your journal data to identify repeating patterns and tag trades with the biases that caused them",
                "Trade smaller positions",
                "Follow traders who don't have biases",
              ],
              correctIndex: 1,
              explanation: "Knowledge about biases is necessary but not sufficient. The most effective debiasing tool is your own data — tagging trades with the biases that influenced them reveals YOUR personal patterns, not theoretical ones.",
            },
          ],
        },
      ],
    },
  ],
};
