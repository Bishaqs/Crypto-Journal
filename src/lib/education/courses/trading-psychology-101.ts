import type { CourseDefinition } from "../types";

export const TRADING_PSYCHOLOGY_101: CourseDefinition = {
  slug: "trading-psychology-101",
  title: "Trading Psychology 101",
  description:
    "Understand why your mind is your biggest edge — and your biggest risk. Learn the cognitive biases, emotional patterns, and mental frameworks that separate consistently profitable traders from the rest.",
  emoji: "🧠",
  category: "psychology",
  difficulty: "beginner",
  recommendedFor: [
    "emotional_reactor",
    "anxious_overthinker",
    "intuitive_risk_taker",
  ],
  totalXP: 150,
  published: true,
  lessons: [
    {
      slug: "what-is-trading-psychology",
      title: "What Is Trading Psychology?",
      description:
        "Why 90% of trading success is mental — and what that actually means for your daily practice.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "Trading psychology isn't some abstract concept reserved for Wall Street professionals. It's the collection of mental habits, emotional responses, and decision-making patterns that determine whether you execute your strategy — or abandon it at the worst possible moment.\n\nMost traders spend 90% of their time on strategy and 10% on psychology. The profitable ones do the opposite.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "Mark Douglas, author of *Trading in the Zone*, put it simply: \"The best traders aren't afraid. They're not afraid because they have developed attitudes that give them the greatest degree of mental flexibility.\"",
        },
        {
          type: "text",
          content:
            "### Why This Matters Right Now\n\nEvery trade you take is a psychological event. You're making decisions under uncertainty with real money on the line. Your brain wasn't designed for this — it evolved to avoid predators and find food, not to hold a losing position because the setup is still valid.\n\n### The Three Pillars of Trading Psychology\n\n**1. Self-Awareness** — Knowing your emotional triggers, cognitive biases, and behavioral patterns. This is what your Traverse journal helps you build.\n\n**2. Emotional Regulation** — Not eliminating emotions (impossible), but managing them so they don't hijack your decision-making.\n\n**3. Process Discipline** — Following your rules consistently, especially when it's uncomfortable. Your best trades will often feel wrong in the moment.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "Start noticing your emotional state before, during, and after trades. Traverse's emotion logging captures this automatically — review your patterns in the Psychology section.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "tp101-1-1",
              question:
                "What percentage of trading success is typically attributed to psychology?",
              options: ["10%", "50%", "90%", "100%"],
              correctIndex: 2,
              explanation:
                "While numbers vary, most professional traders and trading psychologists agree that psychology accounts for roughly 90% of trading success. Strategy matters, but execution is everything.",
            },
          ],
        },
      ],
    },
    {
      slug: "cognitive-biases-in-trading",
      title: "Cognitive Biases in Trading",
      description:
        "Your brain is lying to you. Learn the 5 biases that cost traders the most money.",
      readingTime: 7,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Daniel Kahneman won a Nobel Prize for proving that humans are systematically irrational. We don't just make random errors — we make *predictable* errors. In trading, these predictable errors have names.\n\n### 1. Confirmation Bias\n\nYou see what you want to see. If you're bullish on Bitcoin, you'll unconsciously seek out bullish analysis and dismiss bearish signals. This is the #1 reason traders hold losers too long.\n\n**How to fight it:** Before entering a trade, write down specifically what would prove you wrong. If that condition is met, exit. No negotiation.",
        },
        {
          type: "callout",
          variant: "warning",
          content:
            "If you find yourself searching for reasons to stay in a losing trade, confirmation bias is already running the show.",
        },
        {
          type: "text",
          content:
            "### 2. Loss Aversion\n\nLosing $100 feels roughly twice as painful as gaining $100 feels good. This asymmetry causes traders to:\n- Hold losers too long (hoping they'll come back)\n- Cut winners too early (locking in gains before they disappear)\n- Avoid taking trades with good setups (fear of another loss)\n\n### 3. Recency Bias\n\nYour last few trades disproportionately affect your next decision. Three losses in a row? You become overly cautious. Three wins? You become reckless.\n\n**How to fight it:** Focus on your last 50 trades, not your last 3. Your Traverse analytics show your *actual* edge over time.\n\n### 4. Anchoring\n\nYou fixate on a specific price. \"BTC was at $70K last week, so $65K is cheap.\" But $65K isn't cheap — it's just lower than your anchor. The market doesn't care what the price was yesterday.\n\n### 5. Sunk Cost Fallacy\n\nYou hold a losing position because you've \"already lost so much.\" The money you've lost is gone. The only question that matters: would you enter this same trade today, at this price, with this information?",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "tp101-2-1",
              question:
                "Which bias causes traders to hold losing positions too long, hoping they'll recover?",
              options: [
                "Recency bias",
                "Loss aversion",
                "Anchoring",
                "Availability bias",
              ],
              correctIndex: 1,
              explanation:
                "Loss aversion makes losses feel twice as painful as equivalent gains feel good. This asymmetry drives traders to avoid realizing losses by holding losers, hoping for a recovery.",
            },
            {
              id: "tp101-2-2",
              question:
                "What's the best defense against confirmation bias?",
              options: [
                "Read more analysis",
                "Follow expert traders",
                "Define your exit conditions before entering",
                "Trade smaller positions",
              ],
              correctIndex: 2,
              explanation:
                "Pre-defining what would prove you wrong removes the temptation to rationalize. When that condition is met, you exit — no negotiation with your biased brain.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-emotion-performance-loop",
      title: "The Emotion-Performance Loop",
      description:
        "How emotions create self-reinforcing cycles — both positive and negative — and how to break the destructive ones.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Emotions in trading aren't random. They follow predictable loops that reinforce themselves. Understanding these loops is the first step to breaking the destructive ones.\n\n### The Revenge Trading Loop\n\n1. **Loss** → Frustration, anger\n2. **Emotional decision** → Larger position to \"make it back\"\n3. **Bigger loss** → More frustration\n4. **Repeat** → Account damage\n\nThis loop is the single most common way traders blow up accounts. It's not about one bad trade — it's about the chain reaction that follows.\n\n### The FOMO Loop\n\n1. **Miss a move** → Fear of missing out\n2. **Chase entry** → Enter at bad price\n3. **Stop hit** → Loss\n4. **Price continues** → Even more FOMO\n5. **Chase again** → Bigger loss\n\n### The Confidence Loop (Positive)\n\n1. **Good process** → Followed rules\n2. **Win or disciplined loss** → Trust in system grows\n3. **More discipline** → Better entries, better exits\n4. **Compound results** → Real confidence (not ego)\n\nNotice: the positive loop starts with *process*, not with *winning*. You can have a good process and still lose on individual trades.",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "The difference between a professional and an amateur isn't the number of losses — it's what happens after a loss. Pros follow their process. Amateurs enter the revenge loop.",
        },
        {
          type: "text",
          content:
            "### Breaking Destructive Loops\n\n**The Circuit Breaker Rule:** After two consecutive losses, stop trading for at least 30 minutes. Walk away from the screen. This is non-negotiable.\n\n**The Journal Check:** Before any trade that follows a loss, open your Traverse journal and write one sentence about why you're taking this trade. If you can't articulate a clear reason, you're in a loop.\n\n**The Daily Cap:** Set a maximum number of trades per day. When you hit it, you're done. This prevents the 15-trade revenge spiral.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "tp101-3-1",
              question:
                "What starts the positive confidence loop?",
              options: [
                "A winning streak",
                "Good process and following rules",
                "A large profitable trade",
                "Positive market conditions",
              ],
              correctIndex: 1,
              explanation:
                "Real trading confidence comes from trusting your process, not from winning. You can lose on individual trades and still build confidence if you followed your rules.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-mental-resilience",
      title: "Building Mental Resilience",
      description:
        "Practical daily habits that build the mental toughness to execute consistently, even during drawdowns.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Mental resilience isn't something you're born with. It's a skill you build through deliberate practice — just like reading charts or managing risk.\n\n### The Pre-Market Routine\n\nEvery consistently profitable trader has a routine. Not because they're superstitious, but because routines reduce decision fatigue and set your emotional baseline.\n\n**A simple pre-market routine:**\n1. Check your Traverse daily check-in (mood, energy, sleep quality)\n2. Review yesterday's trades — not the P&L, the *process*\n3. Identify today's key levels and setups\n4. Set your daily trade limit\n5. Write one sentence: \"Today I will focus on...\"\n\nThis takes 10 minutes. It prevents hours of reactive, emotional trading.",
        },
        {
          type: "callout",
          variant: "tip",
          content:
            "Use Traverse's Daily Check-in feature before your trading session. Tracking your mood and sleep quality over time reveals which conditions lead to your best and worst decisions.",
        },
        {
          type: "text",
          content:
            "### The Drawdown Mindset\n\nDrawdowns are inevitable. Even the best strategies have losing streaks. The question isn't *if* you'll experience a drawdown — it's *how* you'll respond.\n\n**During a drawdown:**\n- Reduce position sizes (don't increase to \"make it back\")\n- Narrow your setup criteria (only take A+ setups)\n- Review your last 50 trades for pattern changes\n- Talk to your Traverse AI coach Nova — she can spot patterns you can't\n\n### The Growth Mindset for Traders\n\n**Fixed mindset:** \"I'm a bad trader. I keep losing.\"\n**Growth mindset:** \"This drawdown is showing me a weakness in my approach. What can I learn?\"\n\nEvery loss contains information. Your Traverse journal captures that information. Your job is to review it, learn from it, and adjust. That's the entire game.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "tp101-4-1",
              question:
                "What should you do with position sizes during a drawdown?",
              options: [
                "Increase them to recover faster",
                "Keep them the same to stay consistent",
                "Reduce them until confidence returns",
                "Stop trading entirely",
              ],
              correctIndex: 2,
              explanation:
                "Reducing position sizes during a drawdown limits damage while you identify what's changed. It also reduces the emotional pressure on each trade, helping you think more clearly.",
            },
          ],
        },
      ],
    },
    {
      slug: "your-psychology-action-plan",
      title: "Your Psychology Action Plan",
      description:
        "Turn everything you've learned into a concrete daily practice. Your personal trading psychology protocol.",
      readingTime: 5,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Knowledge without action is entertainment. Let's turn what you've learned into a daily practice.\n\n### Your Daily Psychology Checklist\n\n**Before Trading:**\n- [ ] Complete Traverse daily check-in\n- [ ] Review yesterday's journal entries\n- [ ] Rate your emotional readiness (1-10). Below 6? Reduce size or skip today\n- [ ] Set maximum trade count for the day\n\n**During Trading:**\n- [ ] Log emotion with every trade entry (Traverse captures this)\n- [ ] After a loss: 30-minute circuit breaker before next trade\n- [ ] Check your body — tight chest, clenched jaw? You're tilting\n\n**After Trading:**\n- [ ] Write one journal entry about today's emotional performance\n- [ ] Grade yourself on process, not P&L (A through F)\n- [ ] Identify one thing to improve tomorrow",
        },
        {
          type: "callout",
          variant: "insight",
          content:
            "The traders who succeed aren't the smartest or the most talented. They're the most self-aware. This checklist builds self-awareness through repetition.",
        },
        {
          type: "text",
          content:
            "### Your Bias Alert System\n\nCreate a personal list of your top 3 biases (from Lesson 2). Write them on a sticky note next to your screen. Before every trade, scan the list:\n\n- Am I seeing what I want to see? (Confirmation bias)\n- Am I holding because I can't accept the loss? (Loss aversion)\n- Am I overconfident because of recent wins? (Recency bias)\n\nIf the answer to any of these is \"maybe\" — that's a yes.\n\n### What's Next\n\nYou've completed Trading Psychology 101. You now understand:\n- Why psychology is the dominant factor in trading\n- The 5 biases that cost traders the most\n- How emotional loops work — and how to break them\n- Daily habits that build resilience\n\nApply this knowledge. Use Traverse to track your emotional patterns. Talk to Nova when you feel stuck. And remember: the goal isn't to eliminate emotions. It's to trade *with* them, not *against* them.",
        },
      ],
    },
  ],
};
