import type { CourseDefinition } from "../types";

export const EMOTIONAL_REGULATION: CourseDefinition = {
  slug: "emotional-regulation",
  title: "Emotional Regulation for Traders",
  description:
    "Move beyond \"control your emotions\" to practical techniques that actually work. From recognizing tilt to building long-term emotional resilience.",
  emoji: "💪",
  category: "mindset",
  difficulty: "intermediate",
  recommendedFor: [
    "emotional_reactor",
    "anxious_overthinker",
    "status_driven_competitor",
  ],
  totalXP: 160,
  published: true,
  lessons: [
    {
      slug: "recognizing-tilt",
      title: "Recognizing Tilt",
      description: "Learn to detect emotional hijacking before it costs you money.",
      readingTime: 6,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "\"Tilt\" is borrowed from poker. It describes a state where emotions — usually frustration or anger — take over your decision-making. You're still making trades, but you're no longer making decisions. Your limbic system (fight-or-flight) has hijacked your prefrontal cortex (rational thinking).\n\n### The Tilt Spectrum\n\nTilt isn't binary. It exists on a spectrum:\n\n1. **Micro-tilt** — Subtle impatience. You enter a trade 5 minutes early because \"close enough.\" You skip your checklist because \"I already know.\"\n\n2. **Moderate tilt** — Obvious emotional trading. Larger than usual positions. Entering trades you wouldn't normally take. Checking P&L every 30 seconds.\n\n3. **Full tilt** — Revenge trading. Doubling down on losers. Abandoning your strategy entirely. This is where accounts get destroyed.\n\n### Physical Warning Signs\n\nYour body knows before your mind does:\n- **Chest tightness** — Anxiety is building\n- **Clenched jaw** — Tension and anger\n- **Rapid heartbeat** — Fight-or-flight activation\n- **Stomach discomfort** — Stress response\n- **Leaning forward** — Over-engagement\n\nThese physical signals are your early warning system. Learn to notice them.",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse's emotion logging and somatic tracking help you build a dataset of your physical warning signs. Over time, you'll see which body sensations predict your worst trades.",
        },
        {
          type: "text",
          content:
            "### The Tilt Journal Exercise\n\nFor the next week, after every trade, note:\n1. Your physical state (body scan: chest, jaw, stomach, shoulders)\n2. Your emotional state (1-10 scale: 1 = totally calm, 10 = completely reactive)\n3. Whether this was a planned trade or an impulse\n\nAfter a week, you'll have a clear picture of your tilt patterns.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "er-1-1",
              question: "Which is an example of micro-tilt?",
              options: [
                "Revenge trading after a big loss",
                "Entering a trade slightly early because you're impatient",
                "Taking a full day off after a loss",
                "Following your trading plan exactly",
              ],
              correctIndex: 1,
              explanation: "Micro-tilt is subtle. Entering slightly early, skipping your checklist, or taking a trade that's 'good enough' are all signs that emotions are starting to influence decisions — even though you feel 'fine.'",
            },
          ],
        },
      ],
    },
    {
      slug: "the-pause-protocol",
      title: "The Pause Protocol",
      description: "A simple technique that prevents 80% of emotional trading mistakes.",
      readingTime: 5,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "The Pause Protocol is the single most effective tool against emotional trading. It's embarrassingly simple — which is exactly why it works.\n\n### The Protocol\n\n**After any loss or emotional trigger:**\n1. **Pause** — Step away from the screen for 5-30 minutes\n2. **Breathe** — 5 deep breaths (4 seconds in, 7 seconds hold, 8 seconds out)\n3. **Ask** — \"Would I take this next trade if I hadn't just experienced [loss/win/FOMO]?\"\n4. **If yes** — Proceed with your normal position size\n5. **If no or unsure** — Skip the trade\n\n### Why It Works\n\nAfter a loss, your amygdala (threat detection center) is activated. It takes 15-20 minutes for cortisol levels to return to baseline. During this window, your risk assessment is compromised.\n\nThe pause gives your brain time to literally calm down chemically. The breathing technique activates your parasympathetic nervous system (rest-and-digest mode).\n\n### The 4-7-8 Breathing Technique\n\n1. Exhale completely\n2. Inhale through nose for 4 seconds\n3. Hold for 7 seconds\n4. Exhale through mouth for 8 seconds\n5. Repeat 4 times\n\nThis isn't meditation or woo-woo. It's physiological. The extended exhale activates your vagus nerve, which directly reduces heart rate and blood pressure.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "Navy SEALs use this exact breathing technique (called \"box breathing\") in combat situations. If it works under enemy fire, it works after a losing trade.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "er-2-1",
              question: "How long does it typically take for cortisol to return to baseline after a stressful event?",
              options: ["2 minutes", "15-20 minutes", "1 hour", "24 hours"],
              correctIndex: 1,
              explanation: "Cortisol levels take roughly 15-20 minutes to normalize after acute stress. This is why a 5-minute break often isn't enough — you feel calmer but your risk assessment is still compromised.",
            },
          ],
        },
      ],
    },
    {
      slug: "traffic-light-system",
      title: "The Traffic Light System",
      description: "A pre-trade emotional readiness framework that prevents trading when you shouldn't.",
      readingTime: 5,
      xpReward: 30,
      content: [
        {
          type: "text",
          content:
            "The Traffic Light System is a simple framework for assessing your emotional readiness before each trading session.\n\n### Green Light — Trade normally\n- Slept 7+ hours\n- No major stressors outside of trading\n- Feeling calm, focused, clear-headed\n- Have a trading plan for the day\n- Daily check-in score: 7+/10\n\n### Yellow Light — Trade with restrictions\n- Slept less than 7 hours\n- Some outside stress (work, personal)\n- Feeling slightly anxious or distracted\n- Reduce position sizes by 50%\n- Only take A+ setups\n- Maximum 2 trades\n\n### Red Light — Don't trade\n- Major emotional event (argument, bad news, extreme excitement)\n- Significantly sleep-deprived\n- Coming off a major loss or winning streak\n- Under the influence of anything\n- Can't focus for 5 minutes straight\n\nA red light day isn't a failure. It's risk management applied to yourself. Professional athletes don't play injured. Professional traders don't trade impaired.",
        },
        {
          type: "callout",
          variant: "warning",
          content: "The most dangerous red-light trigger is euphoria after a big win. Overconfidence causes as much damage as revenge trading. Your judgment is just as impaired when you feel invincible.",
        },
        {
          type: "text",
          content:
            "### Implementing the Traffic Light\n\n1. Use Traverse's Daily Check-in every morning before trading\n2. Rate sleep, mood, and energy honestly\n3. Based on your scores, assign yourself green/yellow/red\n4. Follow the rules for your color — no exceptions\n\nAfter 30 days of this practice, you'll have clear data on which conditions lead to your best and worst trading performance.",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "er-3-1",
              question: "You had a great week with 5 winning trades and feel extremely confident. What light should you give yourself?",
              options: ["Green — you're on a hot streak", "Yellow — overconfidence is a risk", "Red — stop trading immediately", "It depends on sleep and stress levels"],
              correctIndex: 1,
              explanation: "After a winning streak, overconfidence bias is heightened. You're likely to take larger positions, trade lower-quality setups, and ignore risk management. Yellow light: trade with restrictions until the euphoria fades.",
            },
          ],
        },
      ],
    },
    {
      slug: "daily-checkin-practices",
      title: "Daily Check-in Practices",
      description: "Build a pre-market emotional inventory that becomes second nature.",
      readingTime: 5,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "The daily check-in is where all the techniques from this course come together into a single daily practice.\n\n### The 5-Minute Pre-Market Check-in\n\n**Body scan (1 minute):**\nClose your eyes. Scan from head to toes. Notice any tension, discomfort, or unusual sensations. This is your physical baseline.\n\n**Emotional inventory (1 minute):**\nName your current emotion. Not \"fine\" — be specific. Anxious? Excited? Calm? Frustrated about something unrelated to trading? Name it.\n\n**Sleep & energy assessment (30 seconds):**\nRate sleep quality (1-10) and energy level (1-10). These two numbers predict trading performance better than any technical indicator.\n\n**Traffic light assignment (30 seconds):**\nBased on the above: Green, Yellow, or Red.\n\n**Intention setting (2 minutes):**\nWrite one sentence: \"Today I will focus on _____.\" Make it process-oriented, not outcome-oriented. Not \"make $500\" but \"follow my stops on every trade\" or \"only take setups from my playbook.\"",
        },
        {
          type: "callout",
          variant: "tip",
          content: "Traverse's Daily Check-in feature captures mood, energy, sleep, and an intention — all in about 60 seconds. The data feeds directly into your psychology analytics and Nova's coaching context.",
        },
        {
          type: "text",
          content:
            "### The Post-Session Debrief (3 minutes)\n\nAfter your last trade of the day:\n1. Rate your emotional discipline (A through F)\n2. Did you follow your traffic light restrictions?\n3. What was your strongest emotional moment? How did you handle it?\n4. One thing to improve tomorrow\n\nThis closing ritual separates trading from the rest of your life. When the debrief is done, trading is done. No checking charts, no second-guessing, no \"one more trade.\"",
        },
        {
          type: "quiz",
          questions: [
            {
              id: "er-4-1",
              question: "What should your daily trading intention focus on?",
              options: [
                "A specific P&L target",
                "A process or behavior",
                "A number of trades to take",
                "A specific asset to trade",
              ],
              correctIndex: 1,
              explanation: "Process-oriented intentions (\"follow my stops\", \"only take A+ setups\") are within your control. Outcome-oriented goals (\"make $500\") depend on market conditions and can lead to forced trades.",
            },
          ],
        },
      ],
    },
    {
      slug: "long-term-emotional-growth",
      title: "Long-Term Emotional Growth",
      description: "How emotional mastery develops over months and years — and how to accelerate it.",
      readingTime: 5,
      xpReward: 35,
      content: [
        {
          type: "text",
          content:
            "Emotional regulation isn't a skill you master in a week. It develops in stages, and understanding where you are helps you focus on the right things.\n\n### The Four Stages of Emotional Mastery\n\n**Stage 1: Reactive** (Months 1-3)\nEmotions control your trading. You revenge trade, chase FOMO, and move stops. This is normal. Everyone starts here.\n\n*Focus:* Awareness. Just notice when emotions are driving decisions. Don't try to fix everything — just observe.\n\n**Stage 2: Aware** (Months 3-6)\nYou notice emotional states but can't always prevent them from affecting decisions. You catch yourself mid-tilt instead of only seeing it in hindsight.\n\n*Focus:* The Pause Protocol. When you notice tilt, pause. You won't always succeed, but each pause builds the neural pathway.\n\n**Stage 3: Managed** (Months 6-12)\nYou have reliable techniques (pause, breathing, traffic light) and use them consistently. Bad days still happen, but you limit the damage.\n\n*Focus:* Optimization. Use your Traverse data to identify remaining weak spots. Work with Nova to refine your approach.\n\n**Stage 4: Mastered** (Year 1+)\nEmotions are present but rarely override your system. You can observe fear and still execute. You can feel FOMO and still wait.\n\n*Focus:* Teaching. Help others. Explaining what you've learned deepens your own understanding.",
        },
        {
          type: "callout",
          variant: "insight",
          content: "These stages aren't linear. You'll move between them depending on market conditions, life stress, and account size. A drawdown can temporarily push a Stage 3 trader back to Stage 1. That's not failure — it's how growth works.",
        },
        {
          type: "text",
          content:
            "### Accelerating Your Growth\n\n1. **Journal consistently** — You can't improve what you can't measure\n2. **Review your emotion data monthly** — Traverse shows trends over time\n3. **Talk to Nova** — She can spot patterns in your behavior across hundreds of data points\n4. **Be patient with yourself** — Emotional mastery is a months-long process, not a weekend project\n\n### Course Complete\n\nYou now have a complete toolkit:\n- Recognizing tilt (micro, moderate, full)\n- The Pause Protocol (your emergency brake)\n- The Traffic Light System (pre-session readiness)\n- Daily Check-in practices (morning and evening rituals)\n- A roadmap for long-term growth (4 stages)\n\nThe techniques are simple. The challenge is doing them consistently. Start with one: the Pause Protocol after every loss. Build from there. Your Traverse data will show you the improvement.",
        },
      ],
    },
  ],
};
