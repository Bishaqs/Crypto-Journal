import type { CourseDefinition } from "../types";

export const JOURNAL_MASTERY: CourseDefinition = {
  slug: "journal-mastery",
  title: "Journal Mastery",
  description:
    "Your journal is your edge. Learn what to track, how to review, and how to turn raw data into consistent improvement.",
  emoji: "📝",
  category: "journaling",
  difficulty: "beginner",
  recommendedFor: [
    "cautious_perfectionist",
    "adaptive_analyst",
    "disciplined_strategist",
  ],
  totalXP: 140,
  published: true,
  lessons: [
    {
      slug: "why-journal",
      title: "Why Journaling Is Your Edge",
      description: "The case for journaling — backed by data, psychology, and the habits of every top trader.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "Ask any consistently profitable trader what separates them from when they started. They won't say \"a better indicator\" or \"a secret strategy.\" They'll say self-awareness.\n\nA trading journal is the engine of self-awareness. It turns subjective feelings into objective data. It shows you patterns you can't see in the moment. And over time, it builds an Edge Profile that is uniquely yours.\n\n### What a Journal Does\n\n**Short-term:** Forces you to slow down, think about your decisions, and articulate your reasoning. This alone improves decision quality.\n\n**Medium-term:** Reveals patterns. You'll discover that you overtrade on Mondays, that your best setups are pullbacks, that you tilt after 3pm.\n\n**Long-term:** Creates an irreplaceable dataset. After 200+ trades, your journal contains a statistical picture of your trading DNA — strengths, weaknesses, biases, and edges.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "\"The palest ink is better than the strongest memory.\" — Chinese proverb. Your memory of a trade is biased. Your journal is not.",
        },
        {
          type: "text",
          content:
            "### The Data Lock-In Effect\n\nAfter months of consistent journaling, your journal becomes irreplaceable. The patterns it reveals — your best timeframes, your worst biases, your emotional triggers — can't be rebuilt from scratch. This is your edge.\n\nTraverse captures this automatically: every trade, every emotion, every decision. All you need to do is log consistently.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "jm-1-1",
              question: "What is the primary long-term benefit of a trading journal?",
              options: [
                "Proving your trades to others",
                "Tax documentation",
                "Building a unique dataset that reveals your personal edge",
                "Tracking P&L",
              ],
              correctIndex: 2,
              explanation: "While a journal helps with all of these, the true long-term value is the irreplaceable dataset that reveals YOUR specific patterns, biases, and edges — information no indicator or strategy can provide.",
            },
          ],
        },
      ],
    },
    {
      slug: "what-to-journal",
      title: "What to Journal",
      description: "The essential fields that turn a trade log into a performance-improvement tool.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Not all journal entries are equal. Logging just the ticker and P&L is a trade log, not a journal. Here's what actually drives improvement.\n\n### The Must-Have Fields\n\n**1. Setup Type** — What pattern or signal triggered this trade? (Breakout, pullback, reversal, etc.) Tagging setups lets you discover which setups actually work for you.\n\n**2. Entry & Exit Reasoning** — One sentence each. Not \"it looked good\" — specific reasons. \"Price bounced off the 200 EMA with increasing volume.\"\n\n**3. Emotion at Entry** — How did you feel? Confident? Anxious? Rushed? This single data point, tracked consistently, reveals the correlation between your emotional state and trade outcomes.\n\n**4. Planned Stop & Target** — What was the plan *before* you entered? Did you follow it?\n\n**5. Post-Trade Review** — What did you learn? What would you do differently? This is where growth happens.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse captures most of these automatically. The emotion field on your trade form takes 2 seconds. The post-trade note takes 30 seconds. That's all it takes.",
        },
        {
          type: "text",
          content:
            "### The Power of Tags\n\nTags are the secret weapon of journaling. They let you slice your data in ways that reveal hidden patterns.\n\n**Useful tags:**\n- Setup type (breakout, pullback, mean-reversion)\n- Market condition (trending, ranging, volatile)\n- Time of day (morning, afternoon, evening)\n- Conviction level (high, medium, low)\n- Following rules? (yes, no)\n\nAfter 50+ trades with consistent tagging, your Traverse analytics will show you exactly which combinations produce your best results.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "jm-2-1",
              question: "Which field provides the most unique insight that only a journal can reveal?",
              options: ["Entry price", "P&L", "Emotion at entry", "Trade duration"],
              correctIndex: 2,
              explanation: "Entry price, P&L, and duration can all be pulled from exchange data. Emotion at entry is subjective and can only be captured in the moment. It's the data point that bridges psychology and performance.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-the-habit",
      title: "Building the Habit",
      description: "How to make journaling automatic — not another thing on your to-do list.",
      readingTime: 5,
      xpReward: 25,
      content: [
        {
          type: "text",
          content:
            "The biggest challenge with journaling isn't knowing what to write — it's doing it consistently. Here's how to make it stick.\n\n### The 2-Minute Rule\n\nWhen starting a new habit, make it take less than 2 minutes. For journaling:\n- Log the trade immediately after closing (Traverse makes this quick)\n- Add one emoji for emotion\n- Write one sentence about why you entered\n\nThat's it. You can always add more detail later, but the minimum is 2 minutes.\n\n### Trigger Stacking\n\nAttach journaling to an existing habit:\n- Close a trade → immediately log it\n- Finish your trading session → write your daily note\n- Morning coffee → review yesterday's journal\n\n### The Streak Effect\n\nTraverse tracks your journaling streak. Once you have a 7-day streak, the thought of breaking it becomes painful. This is loss aversion working *for* you instead of against you.\n\nDon't aim for perfection. Aim for consistency. A simple entry every day beats a detailed one once a week.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Set a phone alarm 15 minutes before market close. That's your cue to journal today's trades. After 2 weeks, you won't need the alarm.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "jm-3-1",
              question: "What's the best approach to building a journaling habit?",
              options: [
                "Write detailed 500-word entries from day one",
                "Start with 2-minute minimal entries and build from there",
                "Journal only after winning trades",
                "Journal once a week in bulk",
              ],
              correctIndex: 1,
              explanation: "The 2-minute rule lowers the barrier to entry. Consistency matters more than detail. Once the habit is established, you'll naturally start adding more depth.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-review-process",
      title: "The Review Process",
      description: "How to extract actionable insights from your journal — daily, weekly, and monthly.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "Writing in your journal is step one. The real value comes from *reviewing* it. Without review, your journal is a diary. With review, it's a performance-improvement system.\n\n### Daily Review (2 minutes)\n\nAt the end of each trading day:\n1. Count wins vs. losses\n2. Check: did I follow my rules on every trade?\n3. Identify the best and worst decision of the day\n4. Rate the day A through F on *process*, not P&L\n\n### Weekly Review (15 minutes)\n\nEvery weekend:\n1. Look at your win rate and average R:R\n2. Identify your best setup of the week\n3. Find your worst trade — what triggered it?\n4. Check your emotion patterns: any correlation between mood and performance?\n5. Set one specific goal for next week\n\n### Monthly Review (30 minutes)\n\nFirst weekend of each month:\n1. Review your equity curve — trend up, down, or flat?\n2. Analyze your top 3 and bottom 3 trades\n3. Check for behavioral trends (are biases improving?)\n4. Update your trading rules if needed\n5. Celebrate progress — even small improvements compound",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse's Weekly Reports and Recaps automate much of this analysis. Nova can generate a personalized review highlighting patterns you might miss.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "jm-4-1",
              question: "What should you grade yourself on in your daily review?",
              options: ["Total P&L", "Win rate", "Process adherence", "Number of trades"],
              correctIndex: 2,
              explanation: "Process adherence (following your rules) is the only metric you fully control. P&L is influenced by market conditions. Good process with bad results is okay — it means your edge will show up over time.",
            },
          ],
        },
      ],
    },
    {
      slug: "from-data-to-edge",
      title: "From Data to Edge",
      description: "How to use your journal data to build a real, quantifiable trading edge.",
      readingTime: 5,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "After 50+ trades with consistent journaling, you have enough data to start finding your edge. An edge isn't a magic indicator — it's a repeatable pattern where your probability of success is statistically better than random.\n\n### Finding Your Edge\n\n**Step 1: Filter by setup type.** Look at each setup tag separately. Which setups have the best win rate? Which have the best R:R?\n\n**Step 2: Add time filters.** Do you trade better in the morning or afternoon? On certain days of the week?\n\n**Step 3: Add emotion filters.** What's your win rate when you enter feeling confident vs. anxious? Most traders are shocked by this data.\n\n**Step 4: Combine.** Your edge might be: \"Pullback setups on BTC, entered during London session, when I'm feeling calm.\" That's specific. That's data-driven. That's your edge.\n\n### Building Your Edge Profile\n\nTraverse's Edge Profile page synthesizes all of this automatically. It shows you:\n- Your best and worst setups\n- Your optimal trading times\n- Your emotional sweet spots\n- Your ideal position sizes\n\nThis profile is unique to you. No course, no indicator, no guru can give you this. It comes exclusively from your own data.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Your Edge Profile is the ultimate product of journaling. After 200+ trades, it represents years of pattern discovery. This is your competitive advantage.",
        },
        {
          type: "text",
          content:
            "### What You've Learned\n\nYou now understand:\n- Why journaling is the foundation of trading improvement\n- What fields to capture for maximum insight\n- How to build the habit with minimal friction\n- How to review at daily, weekly, and monthly intervals\n- How to extract a data-driven edge from your journal\n\nThe only thing left is to do it. Every trade. Every day. Your future self will thank you.",
        },
      ],
    },
  ],
};
