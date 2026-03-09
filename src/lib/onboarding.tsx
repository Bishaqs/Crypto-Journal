"use client";

import type { TourDef as Tour } from "./tour-context";

export const TOUR_KEY_PREFIX = "stargate-tour-";

// Backward compat — existing users who completed old tour skip everything
export const LEGACY_ONBOARDING_KEY = "stargate-onboarding-complete";

export function isTourComplete(tourName: string): boolean {
  if (typeof window === "undefined") return true;
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
    // ── Step 0: Pre-warp intro ──
    {
      icon: "🚀",
      title: "Ready for Liftoff?",
      titleKey: "tours.welcome.step0Title",
      content:
        "Come with me. I'm Nova, and I'll show you everything you need to become a profitable trader.",
      contentKey: "tours.welcome.step0Content",
      presentation: "centered",
      transitionEffect: "star-warp",
      showControls: true,
      showSkip: true,
    },
    // ── Step 1: Welcome (big logo) ──
    {
      icon: "🚀",
      title: "Welcome to Stargate!",
      titleKey: "tours.welcome.step1Title",
      content:
        "Hey! I'm Nova, your trading companion. Let me show you around. This takes about 2 minutes, and you can skip anytime.",
      contentKey: "tours.welcome.step1Content",
      presentation: "centered",
      logoSize: 96,
      showControls: true,
      showSkip: true,
    },
    // ── Step 2: Dashboard overview (highlight viewport) ──
    {
      icon: "🏠",
      title: "Dashboard",
      titleKey: "tours.welcome.step2Title",
      content:
        "This is home base. Your P&L, win rate, and equity curve all update live as you log trades.",
      contentKey: "tours.welcome.step2Content",
      selector: "#dashboard-viewport",
      presentation: "centered",
      showControls: true,
      showSkip: true,
      pointerPadding: 0,
      pointerRadius: 16,
    },
    // ── Steps 3-10: Sidebar items (attached mode, guide flies to each) ──
    {
      icon: "📊",
      title: "Trade Log",
      titleKey: "tours.welcome.step3Title",
      content:
        "Every trade lands here. You can filter by date, emotion, or coin. Click any row to see the full picture.",
      contentKey: "tours.welcome.step3Content",
      selector: "#tour-trades",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "📓",
      title: "Journal",
      titleKey: "tours.welcome.step4Title",
      content:
        "Write daily reflections. What went well, what went sideways. Over time you'll spot patterns in your own thinking.",
      contentKey: "tours.welcome.step4Content",
      selector: "#tour-journal",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "📅",
      title: "Calendar",
      titleKey: "tours.welcome.step5Title",
      content:
        "Green day, red day, at a glance. You'll quickly see if Mondays are good or Fridays are bad.",
      contentKey: "tours.welcome.step5Content",
      selector: "#tour-calendar",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "📋",
      title: "Trade Plans",
      titleKey: "tours.welcome.step6Title",
      content:
        "Plan before you trade. Set your entry, target, and stop. After the trade, rate how well you followed the plan.",
      contentKey: "tours.welcome.step6Content",
      selector: "#tour-plans",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "🏆",
      title: "Achievements",
      titleKey: "tours.welcome.step7Title",
      content:
        "Earn badges for your trading milestones — journal streaks, win rates, risk management. Track your growth as a trader.",
      contentKey: "tours.welcome.step7Content",
      selector: "#tour-achievements",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "📈",
      title: "Analytics",
      titleKey: "tours.welcome.step8Title",
      content:
        "50+ metrics. P&L by hour, by setup, by pair. Stop guessing and start knowing where your edge is.",
      contentKey: "tours.welcome.step8Content",
      selector: "#tour-analytics",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "🧠",
      title: "Insights",
      titleKey: "tours.welcome.step9Title",
      content:
        "How do your emotions affect your P&L? Which moods lead to your best trades? This page has the answers.",
      contentKey: "tours.welcome.step9Content",
      selector: "#tour-insights",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "🤖",
      title: "AI Coach",
      titleKey: "tours.welcome.step10Title",
      content:
        "Ask it anything about your trading. For a personal AI coach, connect your own API key in Settings — your data stays secure and private.",
      contentKey: "tours.welcome.step10Content",
      selector: "#tour-ai",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    {
      icon: "⚡",
      title: "Simple & Advanced Mode",
      titleKey: "tours.welcome.step11Title",
      content:
        "You're in Simple mode with 6 core tools. Switch to Advanced for prop firm tracking, Monte Carlo sims, heat maps, and more.",
      contentKey: "tours.welcome.step11Content",
      selector: "#tour-view-toggle",
      presentation: "attached",
      side: "right",
      showControls: true,
      showSkip: true,
      pointerPadding: 4,
      pointerRadius: 12,
    },
    // ── Steps 11-17: Dashboard content (attached, guide flies to each element) ──
    {
      icon: "📊",
      title: "Your Key Metrics",
      titleKey: "tours.welcome.step12Title",
      content:
        "Win rate, P&L, profit factor, max drawdown. These four numbers tell the whole story. They update as you trade.",
      contentKey: "tours.welcome.step12Content",
      selector: "#tour-stats",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
    },
    {
      icon: "📈",
      title: "Equity Curve",
      titleKey: "tours.welcome.step13Title",
      content:
        "Your cumulative P&L over time. A rising line means you have an edge. Sharp drops show your drawdowns.",
      contentKey: "tours.welcome.step13Content",
      selector: "#tour-equity",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
    },
    {
      icon: "📊",
      title: "Daily P&L",
      titleKey: "tours.welcome.step14Title",
      content:
        "Each bar is one day. Green above zero means profit. Small steady bars beat big volatile ones every time.",
      contentKey: "tours.welcome.step14Content",
      selector: "#tour-pnl-chart",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
    },
    {
      icon: "📋",
      title: "Recent Trades",
      titleKey: "tours.welcome.step15Title",
      content:
        "Your latest trades with P&L and emotion tags. Click any row and notice the difference between calm and anxious trades.",
      contentKey: "tours.welcome.step15Content",
      selector: "#tour-trades-table",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
      pointerPadding: 12,
    },
    {
      icon: "🔥",
      title: "Journaling Streak",
      titleKey: "tours.welcome.step16Title",
      content:
        "Like a Duolingo streak, but for trading. Journal every day and watch the data compound.",
      contentKey: "tours.welcome.step16Content",
      selector: "#tour-streak",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
    },
    {
      icon: "🗓️",
      title: "Calendar Heatmap",
      titleKey: "tours.welcome.step17Title",
      content:
        "Green means profit, red means loss, gray means no trades. You can spot hot streaks at a glance.",
      contentKey: "tours.welcome.step17Content",
      selector: "#tour-heatmap-mini",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
    },
    {
      icon: "🤖",
      title: "AI Insights",
      titleKey: "tours.welcome.step18Title",
      content:
        "Nova summarizes your recent trading patterns: streaks, emotional tendencies, and hidden leaks. Check here for quick insights without asking.",
      contentKey: "tours.welcome.step18Content",
      selector: "#tour-ai-summary",
      side: "top",
      presentation: "attached",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
    },
    // ── Step 18: Apps launcher (highlight header button + auto-open dropdown) ──
    // Uses "centered" so the speech bubble doesn't overlap the dropdown panel
    {
      icon: "🧩",
      title: "Apps",
      titleKey: "tours.welcome.step19Title",
      content:
        "15+ specialized tools — paper trading, strategy backtester, options analysis, seasonality charts, P&L deep dives, and more. All free.",
      contentKey: "tours.welcome.step19Content",
      selector: "#tour-apps",
      presentation: "centered",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    // ── Step 19: Floating outro ──
    {
      icon: "✅",
      title: "You're All Set!",
      titleKey: "tours.welcome.step20Title",
      content:
        "Hit Log Trade to record your first one. Every page has its own mini-tour on first visit. I'm Nova, click me anytime you need help. Now go trade!",
      contentKey: "tours.welcome.step20Content",
      presentation: "centered",
      showControls: true,
      showSkip: false,
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
        "The journal is your accountability partner. Write daily reflections on your trading mindset, what went well, and what you'd do differently.",
      selector: "#journal-header",
      side: "bottom",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "✏️",
      title: "Create a Note",
      content:
        "Click here to start a new entry. Pick a template — Pre-trade, Post-trade, Loss Review, or Win Analysis — or write freestyle. Consistency beats perfection.",
      selector: "#tour-new-note",
      side: "bottom",
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🏷️",
      title: "Tags & Search",
      content:
        "Tag your entries by emotion, setup, or lesson. Use search and filters to find patterns. Over time you'll spot recurring themes in your thinking.",
      selector: "#journal-header",
      side: "bottom",
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
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
      viewportID: "dashboard-viewport",
      showControls: true,
      showSkip: false,
      pointerPadding: 10,
      pointerRadius: 12,
    },
  ],
};

// ─── All Tours Array ───────────────────────────────────────────

import { allCryptoPageTours } from "./tours/crypto-page-tours";
import { allStockPageTours } from "./tours/stock-page-tours";

export const allTours: Tour[] = [
  welcomeTour,
  tradesPageTour,
  journalPageTour,
  propFirmPageTour,
  heatmapsPageTour,
  riskAnalysisPageTour,
  ...allCryptoPageTours,
  ...allStockPageTours,
];

// Backward-compatible aliases for committed onboarding-tour.tsx
export const onboardingTour = allTours;
export const ONBOARDING_KEY = LEGACY_ONBOARDING_KEY;
