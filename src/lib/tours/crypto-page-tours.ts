import type { Tour } from "nextstepjs";

const STEP_DEFAULTS = {
  showControls: true,
  showSkip: true,
  pointerPadding: 10,
  pointerRadius: 12,
  viewportID: "dashboard-viewport",
} as const;

// ─── Simple Mode Pages ──────────────────────────────────────

export const calendarPageTour: Tour = {
  tour: "calendar-page",
  steps: [
    {
      icon: "📅",
      title: "Trading Calendar",
      content: "Your trading calendar. Green = profit, red = loss. Click any day to see that day's trades. Use arrow buttons to navigate months.",
      selector: "#tour-calendar-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Daily P&L Grid",
      content: "Each cell shows your daily P&L. Spot patterns — are certain days of the week consistently green or red? Use this to find your optimal trading schedule.",
      selector: "#tour-calendar-grid",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const analyticsPageTour: Tour = {
  tour: "analytics-page",
  steps: [
    {
      icon: "📈",
      title: "Performance Analytics",
      content: "Deep dive into your performance data. Charts break down your P&L by time period, setup type, and trading pair.",
      selector: "#tour-analytics-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🔍",
      title: "Find Your Edge",
      content: "Analyze your P&L by day of week, by hour, by setup. Find where your edge is strongest and eliminate weak spots with data.",
      selector: "#tour-analytics-charts",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const plansPageTour: Tour = {
  tour: "plans-page",
  steps: [
    {
      icon: "📋",
      title: "Trade Plans",
      content: "Plan trades before executing. Define your entry, stop-loss, and targets. After closing, rate your execution to build discipline.",
      selector: "#tour-plans-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🎯",
      title: "Plan vs Actual",
      content: "Each plan tracks your thesis, risk parameters, and outcome. Compare planned vs actual to see if you're following your own rules.",
      selector: "#tour-plans-list",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

// ─── Intelligence Pages ─────────────────────────────────────

export const insightsPageTour: Tour = {
  tour: "insights-page",
  steps: [
    {
      icon: "🧠",
      title: "Behavioral Insights",
      content: "Data-driven self-awareness. See exactly how your emotions, time of day, and setup types affect your P&L.",
      selector: "#tour-insights-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "😤",
      title: "Emotional P&L",
      content: "Which emotional states lead to profits vs losses? This chart reveals patterns you can't see from individual trades.",
      selector: "#tour-insights-emotion",
      side: "top",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📏",
      title: "Discipline Score",
      content: "Your discipline score over time. Higher process scores = better execution of your trading plan, regardless of P&L outcome.",
      selector: "#tour-insights-discipline",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const aiCoachPageTour: Tour = {
  tour: "ai-coach-page",
  steps: [
    {
      icon: "🤖",
      title: "AI Trading Coach",
      content: "Chat with an AI that has read all your trading data. Ask about patterns, weaknesses, or get specific advice. It knows your win rate, emotions, and habits.",
      selector: "#tour-ai-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "💡",
      title: "Start a Conversation",
      content: "Start with a suggested question or type your own. The AI analyzes your actual trades — not generic advice, but insights specific to YOUR data.",
      selector: "#tour-ai-suggestions",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const reportsPageTour: Tour = {
  tour: "reports-page",
  steps: [
    {
      icon: "📑",
      title: "Weekly Reports",
      content: "Auto-generated weekly summaries of your trading performance. Review your best and worst trades, patterns, and progress.",
      selector: "#tour-reports-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "✅",
      title: "Actionable Review",
      content: "Each report highlights what went well, what didn't, and actionable improvements. Use these for your weekly review ritual.",
      selector: "#tour-reports-content",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

// ─── Tool Pages ─────────────────────────────────────────────

export const marketPageTour: Tour = {
  tour: "market-page",
  steps: [
    {
      icon: "🌐",
      title: "Market Overview",
      content: "Live market data at a glance. Track Fear & Greed Index, Bitcoin dominance, funding rates, and trending coins.",
      selector: "#tour-market-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Check Before Trading",
      content: "Use this before trading to check the macro environment. High fear = potential buying opportunity. Extreme greed = be cautious.",
      selector: "#tour-market-data",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const dcaPageTour: Tour = {
  tour: "dca-page",
  steps: [
    {
      icon: "💰",
      title: "DCA Calculator",
      content: "Dollar-Cost Averaging calculator. See how regular investments grow over time and compare DCA vs lump-sum strategies.",
      selector: "#tour-dca-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "⚙️",
      title: "Set Parameters",
      content: "Set your investment amount, frequency, and expected return. The chart shows your projected portfolio growth over time.",
      selector: "#tour-dca-inputs",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📈",
      title: "DCA vs Lump Sum",
      content: "Blue = DCA strategy, purple = lump sum. DCA reduces timing risk — you buy more when prices are low and less when high.",
      selector: "#tour-dca-chart",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const playbookPageTour: Tour = {
  tour: "playbook-page",
  steps: [
    {
      icon: "📖",
      title: "Trading Playbook",
      content: "Your trading playbook. Document every setup you trade — entry rules, exit rules, stop-loss strategy. This is your trading bible.",
      selector: "#tour-playbook-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🎯",
      title: "Setup Library",
      content: "Each entry is a complete setup recipe. Track which setups are actually profitable by linking them to your trade log. Delete what doesn't work, refine what does.",
      selector: "#tour-playbook-entries",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const riskCalcPageTour: Tour = {
  tour: "risk-calc-page",
  steps: [
    {
      icon: "🧮",
      title: "Risk Calculator",
      content: "Position sizing calculator. Enter your account size, risk %, entry and stop-loss to get exact position size and R-multiple targets.",
      selector: "#tour-risk-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "⚙️",
      title: "Trade Parameters",
      content: "Set your parameters here. The 1% rule means risking no more than 1% of your account on any single trade.",
      selector: "#tour-risk-inputs",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🎯",
      title: "Position Size & Targets",
      content: "Your calculated position size, dollar risk, and R-multiple targets (1R, 2R, 3R). Use these as take-profit levels for consistent risk management.",
      selector: "#tour-risk-results",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const goalsPageTour: Tour = {
  tour: "goals-page",
  steps: [
    {
      icon: "🎯",
      title: "Trading Goals",
      content: "Set monthly trading goals and track progress. Goals can be P&L targets, win rate improvements, or behavioral goals like journaling streaks.",
      selector: "#tour-goals-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Track Progress",
      content: "Each goal shows your current progress. Green = on track, yellow = needs attention, red = behind. Review and update weekly.",
      selector: "#tour-goals-list",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

// ─── Advanced Tool Pages ────────────────────────────────────

export const screenerPageTour: Tour = {
  tour: "screener-page",
  steps: [
    {
      icon: "🔍",
      title: "Token Screener",
      content: "Scan the market for trading opportunities. Filter by volume, price change, market cap, and more to find tokens matching your criteria.",
      selector: "#tour-screener-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📋",
      title: "Scan Results",
      content: "Click any token for details. Use screener results to build your watchlist and trade plans.",
      selector: "#tour-screener-results",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const fundingRatesPageTour: Tour = {
  tour: "funding-rates-page",
  steps: [
    {
      icon: "💱",
      title: "Funding Rates",
      content: "Track perpetual futures funding rates across exchanges. Positive = longs pay shorts, negative = shorts pay longs.",
      selector: "#tour-funding-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "💡",
      title: "Market Sentiment Signal",
      content: "Extreme funding rates signal overleveraged markets. Use this for contrarian trades or to earn funding by taking the opposite side.",
      selector: "#tour-funding-data",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const executionPageTour: Tour = {
  tour: "execution-page",
  steps: [
    {
      icon: "🎯",
      title: "Execution Analysis",
      content: "Analyze your trade execution quality. Compare your entries and exits to optimal prices to find where you're leaving money on the table.",
      selector: "#tour-execution-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Execution Metrics",
      content: "Slippage, timing, and fill quality metrics. Small execution improvements compound into significant P&L gains over hundreds of trades.",
      selector: "#tour-execution-analysis",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const rulesPageTour: Tour = {
  tour: "rules-page",
  steps: [
    {
      icon: "📏",
      title: "Rule Tracker",
      content: "Define your personal trading rules and track compliance. Rules like 'No trading after 2 losses' or 'Always wait for confirmation'.",
      selector: "#tour-rules-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "✅",
      title: "Compliance = Profit",
      content: "Check off rules before each session. Your compliance rate directly correlates with profitability — the data proves it.",
      selector: "#tour-rules-list",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const simulationsPageTour: Tour = {
  tour: "simulations-page",
  steps: [
    {
      icon: "🎲",
      title: "Monte Carlo Simulations",
      content: "Uses your real trade data to project thousands of possible futures. See best case, worst case, and most likely outcomes.",
      selector: "#tour-sim-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📈",
      title: "Fan Chart",
      content: "The fan chart shows probability ranges. Dark band = most likely path. Outer bands = extreme scenarios. Use this to set realistic expectations.",
      selector: "#tour-sim-chart",
      side: "top",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🧠",
      title: "Key Statistics",
      content: "Kelly Criterion shows optimal bet sizing. Probability of ruin tells you if your strategy can survive. These are the numbers that separate gamblers from traders.",
      selector: "#tour-sim-stats",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const taxesPageTour: Tour = {
  tour: "taxes-page",
  steps: [
    {
      icon: "🧾",
      title: "Tax Reports",
      content: "Generate tax reports from your trading data. Calculate realized gains/losses, short-term vs long-term, and export for your accountant.",
      selector: "#tour-taxes-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Tax Summary",
      content: "Your tax summary with total realized P&L, wash sale adjustments, and estimated tax liability. Export as CSV for tax filing.",
      selector: "#tour-taxes-summary",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

// ─── All Crypto Page Tours ──────────────────────────────────

export const allCryptoPageTours: Tour[] = [
  calendarPageTour,
  analyticsPageTour,
  plansPageTour,
  insightsPageTour,
  aiCoachPageTour,
  reportsPageTour,
  marketPageTour,
  dcaPageTour,
  playbookPageTour,
  riskCalcPageTour,
  goalsPageTour,
  screenerPageTour,
  fundingRatesPageTour,
  executionPageTour,
  rulesPageTour,
  simulationsPageTour,
  taxesPageTour,
];
