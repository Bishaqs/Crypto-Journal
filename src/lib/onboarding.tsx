"use client";

import type { Tour } from "nextstepjs";

export const TOUR_KEY_PREFIX = "stargate-tour-";

// Backward compat — existing users who completed old tour skip everything
export const LEGACY_ONBOARDING_KEY = "stargate-onboarding-complete";

export function isTourComplete(tourName: string): boolean {
  if (typeof window === "undefined") return true;
  // Legacy users skip all tours
  if (localStorage.getItem(LEGACY_ONBOARDING_KEY)) return true;
  return localStorage.getItem(TOUR_KEY_PREFIX + tourName) === "true";
}

export function markTourComplete(tourName: string): void {
  localStorage.setItem(TOUR_KEY_PREFIX + tourName, "true");
}

// ─── Welcome Tour ──────────────────────────────────────────────
// Auto-starts on first login, walks through navigation + dashboard

export const welcomeTour: Tour = {
  tour: "welcome",
  steps: [
    {
      icon: "🚀",
      title: "Welcome to Stargate!",
      content:
        "Your trading command center. Let's take a quick tour — it takes less than 2 minutes. You can skip anytime.",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🏠",
      title: "Dashboard",
      content:
        "Your home base. See your P&L, win rate, equity curve, and recent trades at a glance. Everything updates in real-time as you log trades.",
      selector: "#tour-home",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📊",
      title: "Trade Log",
      content:
        "All your trades in one place. Filter by emotion, date, source (CEX/DEX), and more. Click any trade to expand full details including notes and tags.",
      selector: "#tour-trades",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📓",
      title: "Journal",
      content:
        "Write daily reflections on your trading. Use templates, tag emotions, and track your mindset over time. Consistent journaling is what separates pros from gamblers.",
      selector: "#tour-journal",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📅",
      title: "Calendar",
      content:
        "See your trading days at a glance. Green = profit, red = loss. Spot patterns in your performance — are Mondays your best day? Do you overtrade on Fridays?",
      selector: "#tour-calendar",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📈",
      title: "Analytics",
      content:
        "Deep dive into 50+ metrics. P&L by hour, by day, by setup type. Find your edge and eliminate weak spots with data, not guesswork.",
      selector: "#tour-analytics",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📋",
      title: "Trade Plans",
      content:
        "Plan trades before executing. Set your entry, target, and stop-loss. After closing, rate your execution. This builds discipline over time.",
      selector: "#tour-plans",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🧠",
      title: "Insights",
      content:
        "Discover how your emotions affect your P&L. See which emotional states lead to your best — and worst — trades. Data-driven self-awareness.",
      selector: "#tour-insights",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🤖",
      title: "AI Coach",
      content:
        "Chat with an AI that reads your trading patterns. Ask questions like 'What's my biggest leak?' or 'How can I improve my entries?' and get personalized answers.",
      selector: "#tour-ai",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "⚡",
      title: "Simple & Advanced Mode",
      content:
        "You're in Simple mode with 6 core tools. Toggle to Advanced to unlock 12+ pro tools: Prop Firm Tracker, Monte Carlo Simulations, Heat Maps, Risk Analysis, Tax Reports, and more.",
      selector: "#tour-view-toggle",
      side: "top",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📊",
      title: "Your Key Metrics",
      content:
        "Win rate, total P&L, profit factor, and max drawdown — the four numbers that define your trading performance. These update automatically as you log trades.",
      selector: "#tour-stats",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 16,
    },
    {
      icon: "📈",
      title: "Equity Curve",
      content:
        "Your cumulative P&L over time. A rising curve = consistent edge. Sharp drops reveal drawdown periods. This is the single most important chart for any trader.",
      selector: "#tour-equity",
      side: "top",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 16,
    },
    {
      icon: "📊",
      title: "Daily P&L",
      content:
        "Each bar = one trading day's profit or loss. Green bars above zero = profitable days. Look for consistency — small steady gains beat big volatile swings.",
      selector: "#tour-pnl-chart",
      side: "top",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 16,
    },
    {
      icon: "📋",
      title: "Recent Trades",
      content:
        "Your latest trades with P&L, emotion tags, and process scores. Click any row to see full details. Use this to spot patterns — are you more profitable when calm?",
      selector: "#tour-trades-table",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 16,
    },
    {
      icon: "🔥",
      title: "Journaling Streak",
      content:
        "Like Duolingo, but for trading. Journal every day to keep your streak alive. Consistency compounds — the data you log today powers tomorrow's insights.",
      selector: "#tour-streak",
      side: "left",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🗓️",
      title: "Calendar Heatmap",
      content:
        "A quick visual of your recent trading days. Green = profit, red = loss, gray = no trades. At a glance, you can see if you're in a hot streak or cold spell.",
      selector: "#tour-heatmap-mini",
      side: "left",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🤖",
      title: "AI Insights",
      content:
        "AI-powered analysis of your recent trading patterns, updated automatically. No need to ask — it watches for patterns and surfaces actionable insights.",
      selector: "#tour-ai-summary",
      side: "left",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "✅",
      title: "You're All Set!",
      content:
        "Hit the Log Trade button to record your first trade. The more data you add, the smarter Stargate gets. Each page has its own quick tour when you visit it for the first time. Happy trading!",
      side: "bottom",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 16,
    },
  ],
};

// ─── Page-Specific Tours ───────────────────────────────────────
// These trigger on first visit to each page

export const tradesPageTour: Tour = {
  tour: "trades-page",
  steps: [
    {
      icon: "📊",
      title: "Your Trade Log",
      content:
        "This is where all your trades live. Every trade you log appears here with full details — entry/exit prices, P&L, emotion tags, process scores, and notes.",
      selector: "#trades-header",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🔍",
      title: "Filtering & Search",
      content:
        "Filter trades by date, emotion, setup type, or search by symbol. Use this to answer questions like 'How do I perform when I'm anxious?' or 'What's my win rate on BTC?'",
      selector: "#trades-filters",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📝",
      title: "Trade Details",
      content:
        "Click any trade row to expand it. You'll see your notes, tags, and can edit any field. Tag emotions honestly — this data powers your Insights and AI Coach.",
      selector: "#trades-table",
      side: "top",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 12,
    },
  ],
};

export const journalPageTour: Tour = {
  tour: "journal-page",
  steps: [
    {
      icon: "📓",
      title: "Your Trading Journal",
      content:
        "The journal is your accountability partner. Write daily reflections on your trading mindset, what went well, and what you'd do differently. Over time, you'll spot recurring patterns in your thinking.",
      selector: "#journal-header",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "✍️",
      title: "Rich Text Editor",
      content:
        "Write with full formatting — bold, lists, headings, and more. Use templates to structure your entries consistently. The best journals are honest, not perfect.",
      selector: "#journal-editor",
      side: "top",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 12,
    },
  ],
};

export const propFirmPageTour: Tour = {
  tour: "prop-firm-page",
  steps: [
    {
      icon: "🔥",
      title: "What is a Prop Firm Challenge?",
      content:
        "Proprietary trading firms (prop firms) fund traders who can prove their skill. You trade a demo account with strict rules — if you hit the profit target without breaking rules, you get funded with real capital. Common firms: FTMO, TopStep, The5ers, FundedNext.",
      selector: "#prop-firm-header",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "📏",
      title: "The Rules You Must Follow",
      content:
        "Every challenge has strict rules: Daily Loss Limit (max you can lose in one day), Max Drawdown (total account loss limit), Profit Target (how much you must make), and Min/Max Trading Days. Break any rule = challenge failed. This tracker monitors all of them in real-time.",
      selector: "#prop-firm-rules",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      icon: "⚡",
      title: "Preset Configurations",
      content:
        "We've pre-loaded rules for the most popular firms (FTMO, TopStep, The5ers, E8Markets, FundedNext). Select your firm, enter your account size, and the tracker auto-configures all limits. You can also create custom rules.",
      selector: "#prop-firm-presets",
      side: "top",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 12,
    },
  ],
};

export const heatmapsPageTour: Tour = {
  tour: "heatmaps-page",
  steps: [
    {
      icon: "🗺️",
      title: "Performance Heat Maps",
      content:
        "Heat maps show your P&L as a color-coded grid — rows are days of the week (Mon–Sun), columns are hours of the day (0–23). Green cells = profit, red cells = loss. Darker colors = larger amounts. Use this to find your optimal trading hours.",
      selector: "#heatmap-grid",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      icon: "💡",
      title: "How to Read It",
      content:
        "Look for clusters of green — that's your edge. If Tuesday mornings are always green and Friday afternoons are red, you know when to trade and when to step away. The best traders don't trade more — they trade at the right times.",
      selector: "#heatmap-grid",
      side: "top",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 12,
    },
  ],
};

export const riskAnalysisPageTour: Tour = {
  tour: "risk-analysis-page",
  steps: [
    {
      icon: "📉",
      title: "MAE — Max Adverse Excursion",
      content:
        "MAE measures the worst point of each trade — how far it moved against you before you closed it. High MAE on winning trades means you're enduring unnecessary drawdowns. Use this to tighten your stop-losses: if most winners never dip below -2%, why is your stop at -5%?",
      selector: "#risk-mae-section",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      icon: "📈",
      title: "MFE — Max Favorable Excursion",
      content:
        "MFE measures the best point of each trade — how far it moved in your favor before you closed it. If your MFE is consistently much higher than your actual exit, you're leaving money on the table by taking profits too early. Use this to set better take-profit targets.",
      selector: "#risk-mfe-section",
      side: "bottom",
      showControls: true,
      showSkip: true,
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      icon: "🎯",
      title: "R-Multiples",
      content:
        "R-multiples normalize every trade by your initial risk. If you risked $100 and made $200, that's a +2R trade. If you lost $100, that's -1R. This lets you compare trades fairly regardless of position size. Aim for an average R above +0.5. A system with +0.3R average and 50% win rate is already profitable.",
      selector: "#risk-r-multiples",
      side: "top",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 12,
    },
  ],
};

// ─── All Tours Array ───────────────────────────────────────────

export const allTours: Tour[] = [
  welcomeTour,
  tradesPageTour,
  journalPageTour,
  propFirmPageTour,
  heatmapsPageTour,
  riskAnalysisPageTour,
];

// Backward-compatible aliases for committed onboarding-tour.tsx
export const onboardingTour = allTours;
export const ONBOARDING_KEY = LEGACY_ONBOARDING_KEY;
