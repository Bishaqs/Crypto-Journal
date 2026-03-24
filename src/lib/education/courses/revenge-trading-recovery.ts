import type { CourseDefinition } from "../types";

export const REVENGE_TRADING_RECOVERY: CourseDefinition = {
  slug: "revenge-trading-recovery",
  title: "Revenge Trading & Tilt Recovery",
  description:
    "The #1 account killer. Understand why revenge trading happens, how to catch yourself in the act, and build a personal protocol to break the cycle permanently.",
  emoji: "🔥",
  category: "mindset",
  difficulty: "beginner",
  recommendedFor: [
    "emotional_reactor",
    "intuitive_risk_taker",
    "anxious_overthinker",
  ],
  totalXP: 170,
  published: true,
  lessons: [
    {
      slug: "anatomy-of-revenge-trading",
      title: "Anatomy of a Revenge Trade",
      description: "What happens in your brain during the 60 seconds between a loss and the next click.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "A revenge trade follows a predictable neurological sequence. Understanding this sequence is the first step to interrupting it.\n\n### The 60-Second Spiral\n\n**Second 0-5: The Loss.** Your stop gets hit. Cortisol floods your bloodstream. Your amygdala fires — threat detected.\n\n**Second 5-15: The Anger.** \"That shouldn't have happened.\" \"The market is wrong.\" Your prefrontal cortex (rational thinking) is already losing the battle to your limbic system (emotions).\n\n**Second 15-30: The Justification.** \"I know this market. It's going to reverse. I'll enter with double size to make it back.\" Your brain is literally manufacturing reasons to act.\n\n**Second 30-60: The Click.** Position opened. Bigger than usual. No plan. No stop. You're not trading anymore — you're gambling.\n\n### Why Your Brain Betrays You\n\nThe urge to revenge trade isn't weakness — it's evolutionary. Your brain treats financial loss like physical danger. The fight-or-flight response kicks in, and \"fight\" in trading means \"trade harder.\" The problem is that this response evolved for tiger attacks, not chart patterns.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Revenge trading isn't a strategy problem. It's a neuroscience problem. You're not making bad decisions — your brain is making decisions FOR you, without consulting the rational part.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rtr-1-1",
              question: "Why does the urge to revenge trade feel so compelling and hard to resist?",
              options: [
                "Because traders lack discipline",
                "Because the amygdala triggers a fight-or-flight response that hijacks rational thinking",
                "Because the market really is wrong",
                "Because of insufficient strategy knowledge",
              ],
              correctIndex: 1,
              explanation: "The amygdala interprets financial loss as a threat and triggers the fight-or-flight response. This floods the brain with cortisol and adrenaline, hijacking the prefrontal cortex (rational decision-making). It's biology, not weakness.",
            },
          ],
        },
      ],
    },
    {
      slug: "your-personal-triggers",
      title: "Identifying Your Personal Triggers",
      description: "Not all losses trigger revenge trading. Learn which specific situations are YOUR danger zones.",
      readingTime: 7,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Not every loss leads to revenge trading. Certain patterns and circumstances are more dangerous than others — and they're different for each trader.\n\n### Common Trigger Patterns\n\n**1. The \"Almost\" Loss**\nTrade was profitable, you moved your stop to breakeven, got stopped out, then the price ran to your original target. This feels worse than a normal loss because you \"had it and lost it.\"\n\n**2. The Streak Breaker**\nYou had 5 winners in a row, then take a loss. The loss breaks your streak narrative, and your ego demands you \"restore\" it immediately.\n\n**3. The Stupid Mistake**\nYou violated your own rules — entered too early, sized too big, ignored your checklist. The frustration is directed at yourself, which is more potent than frustration at the market.\n\n**4. The Big Win Reversal**\nYou were up $500, got greedy, didn't take profit, and it reversed to a $200 loss. You lost $700 of *mental profit*.\n\n**5. The External Pressure**\nBad day at work, argument with partner, sleep-deprived. You're already emotionally compromised before the loss even happens.\n\n### Finding YOUR Triggers\n\nLook at your Traverse data:\n1. Filter for your worst days (biggest losses)\n2. Check: what happened BEFORE the worst trade of each day?\n3. Look for patterns: time of day, day of week, preceding win/loss streak, emotion logged",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Ask Nova to analyze your revenge trading patterns. She has access to your emotion logs, trade sequences, and timing data — she can spot triggers you can't see yourself.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rtr-2-1",
              question: "Which type of loss typically feels WORST psychologically and is most likely to trigger revenge trading?",
              options: [
                "A normal stop-loss hit",
                "A small position that expires worthless",
                "A trade that was profitable, then reversed to a loss",
                "A loss on a paper trading account",
              ],
              correctIndex: 2,
              explanation: "A profitable trade that reverses to a loss creates the most intense frustration because you experienced the gain and then lost it. The brain processes this as losing twice — once for the actual loss, and once for the 'profit' you had.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-circuit-breaker-protocol",
      title: "The Circuit Breaker Protocol",
      description: "A concrete, step-by-step system to stop yourself BEFORE the revenge trade happens.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Knowing revenge trading is bad doesn't stop it. You need a system — a set of automatic rules that activate when you're most vulnerable.\n\n### The Circuit Breaker System\n\n**Level 1: The Loss (automatic)**\n- After ANY loss: start a 5-minute timer\n- During this 5 minutes: no new trades. Period.\n- Use this time: deep breaths (4-7-8 technique), body scan, drink water\n\n**Level 2: Two Consecutive Losses**\n- 15-minute mandatory break\n- Leave the screen physically\n- Write one sentence in your Traverse journal: \"What am I feeling right now?\"\n- Before re-entering: check your Traffic Light (Green/Yellow/Red)\n\n**Level 3: Daily Loss Limit Hit**\n- You're done for the day. Non-negotiable.\n- Set this limit BEFORE the session starts (typically 3-5% of account)\n- Close all charts. Do something completely unrelated to markets\n\n### Why Timers Work\n\nYour cortisol spike peaks at 3-5 minutes after a stressful event. By forcing a 5-minute delay, you're waiting for the neurochemical storm to pass. By 15 minutes, your prefrontal cortex regains control.\n\nThe timer isn't willpower. It's a structural barrier between your emotional brain and the trading platform.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "\"I'll just check the chart during my break\" — NO. Checking the chart reactivates the emotional cycle. The break only works if it's a REAL break. Phone face-down. Walk outside.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rtr-3-1",
              question: "Why is a 5-minute timer after a loss more effective than just telling yourself 'I won't revenge trade'?",
              options: [
                "It gives you time to find a better trade",
                "It creates a structural barrier that doesn't rely on willpower — which is depleted when you're emotional",
                "It's more professional",
                "It lets you analyze the previous trade",
              ],
              correctIndex: 1,
              explanation: "Willpower is a limited resource, and it's at its lowest when you're emotionally compromised. A timer creates a physical barrier that doesn't require willpower. It takes the decision out of your hands during the window when your judgment is worst.",
            },
          ],
        },
      ],
    },
    {
      slug: "recovery-after-a-tilt-day",
      title: "Recovery After a Tilt Day",
      description: "You revenge traded. The damage is done. Here's how to recover — financially and psychologically.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "It happened. You revenge traded. You lost more than planned. Now what?\n\n### Step 1: Stop the Bleeding (Day 0)\n- Close all positions. Every single one.\n- Calculate the actual damage — don't guess, look at the real number\n- Write it down in your Traverse journal. No sugarcoating.\n\n### Step 2: Decompress (Day 0-1)\n- Do NOT trade the next day. This is mandatory, not optional.\n- Exercise, sleep, do something physical\n- Talk to someone — but NOT about \"making it back\"\n\n### Step 3: Post-Mortem (Day 1-2)\nIn your journal, answer honestly:\n1. What was the trigger? (Use your trigger list from Lesson 2)\n2. At what point did you know it was revenge? Be specific.\n3. What would you do differently?\n4. What circuit breaker level failed?\n\n### Step 4: Adjust and Return (Day 2-3)\n- Reduce your position sizes by 50% for the next week\n- Set a TIGHT daily loss limit (half your normal)\n- Trade only your highest-conviction setups\n- After 5 consecutive disciplined trading days, gradually restore normal sizing\n\n### The Most Important Thing\n\nOne tilt day doesn't define you. Every professional trader has had tilt episodes. What separates professionals from amateurs isn't avoiding tilt forever — it's how fast they recover and what they learn from it.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The post-mortem is more valuable than any trading strategy. Each tilt episode, analyzed honestly, makes the next one less likely. Your Traverse journal is building a personal map of your psychological danger zones.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rtr-4-1",
              question: "After a tilt day, what should you do with your position sizes when you return to trading?",
              options: [
                "Trade normal sizes to prove you've recovered",
                "Trade bigger to recover losses faster",
                "Cut sizes by 50% for a week, then gradually restore",
                "Only paper trade for a month",
              ],
              correctIndex: 2,
              explanation: "Reducing sizes by 50% serves two purposes: it limits potential damage if you're still emotionally compromised, and it rebuilds confidence through disciplined execution at lower stakes. A week of clean trading at half size is worth more than jumping straight back in.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-long-term-immunity",
      title: "Building Long-Term Immunity",
      description: "How to make revenge trading progressively less likely over months of deliberate practice.",
      readingTime: 6,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "You can't eliminate the urge to revenge trade. But you can build a system where it rarely wins.\n\n### The Three Defenses\n\n**Defense 1: Structural Barriers**\n- Circuit breaker rules (already in place from Lesson 3)\n- Daily loss limits in your Traverse Rules Tracker\n- Remove the ability to change position size mid-session (pre-calculate sizes before the session)\n\n**Defense 2: Emotional Fitness**\n- Daily check-in before trading (Traffic Light System)\n- Regular exercise (reduces baseline cortisol by 20-30%)\n- Adequate sleep (sleep-deprived traders are 3x more likely to tilt)\n- Journaling — not about trades, about feelings\n\n**Defense 3: Identity Shift**\nStop thinking \"I'm trying to not revenge trade.\" Start thinking \"I'm a disciplined trader who follows my process.\"\n\nThe difference is subtle but powerful. The first frame is about resisting temptation. The second frame makes temptation irrelevant — it's just not who you are.\n\n### Track Your Progress\n\nIn Traverse, tag trades with whether they were planned or impulsive. Over months, track the ratio. A healthy target:\n- Month 1: 70% planned, 30% impulsive\n- Month 3: 85% planned, 15% impulsive\n- Month 6: 95% planned, 5% impulsive\n- Month 12+: 98%+ planned\n\nProgress isn't linear. But the trend should be clear.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "The ultimate defense against revenge trading isn't willpower or rules — it's identity. When you genuinely see yourself as a disciplined process-driven trader, revenge trading becomes incongruent with who you are. This takes months, not days.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "rtr-5-1",
              question: "What is the most powerful long-term defense against revenge trading?",
              options: [
                "Better chart analysis",
                "Strict rules and penalties",
                "An identity shift from 'resisting temptation' to 'I'm a disciplined trader'",
                "Trading with less money",
              ],
              correctIndex: 2,
              explanation: "Rules and barriers are essential in the short term, but the most durable defense is an identity shift. When discipline becomes who you ARE rather than what you DO, the temptation to revenge trade fades because it conflicts with your self-image.",
            },
          ],
        },
      ],
    },
  ],
};
