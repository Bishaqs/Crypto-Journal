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
    // ── Step 0: Star-warp intro ──
    {
      id: "warp-intro",
      icon: "🚀",
      title: "Ready for Liftoff?",
      titleKey: "tours.welcome.step0Title",
      content: "Come with me. I'm Nova, and I'll show you everything you need to become a profitable trader.",
      contentKey: "tours.welcome.step0Content",
      layout: "fullscreen",
      transitionEffect: "star-warp",
      showSkip: true,
    },
    // ── Step 1: Welcome splash ──
    {
      id: "welcome-splash",
      icon: "🚀",
      title: "Welcome to Stargate!",
      titleKey: "tours.welcome.step1Title",
      content: "Hey! I'm Nova, your trading companion. Let me show you around. This takes about a minute, and you can skip anytime.",
      contentKey: "tours.welcome.step1Content",
      layout: "fullscreen",
      logoSize: 96,
      showSkip: true,
    },
    // ── Step 2: Dashboard overview ──
    {
      id: "dashboard-overview",
      icon: "🏠",
      title: "Dashboard",
      titleKey: "tours.welcome.step2Title",
      content: "This is home base. Your P&L, win rate, and equity curve all update live as you log trades.",
      contentKey: "tours.welcome.step2Content",
      selector: "#dashboard-viewport",
      layout: "fullscreen",
      sidebarClose: true,
      pointerPadding: 0,
      pointerRadius: 16,
      showSkip: true,
    },
    // ── Step 3: Journal & Planning (entire drawer) ──
    {
      id: "journal-category",
      icon: "📓",
      title: "Journal & Planning",
      content: "Trade Log, Journal, Calendar, and Trade Plans. Log trades, write reflections, and plan entries here.",
      selector: "#tour-drawer-panel",
      layout: "spotlight",
      sidebarCategory: "journal",
      side: "right",
      bubbleAlign: "left",
      pointerPadding: 4,
      pointerRadius: 12,
      showSkip: true,
    },
    // ── Step 4: Analytics & Intelligence (entire drawer) ──
    {
      id: "analytics-category",
      icon: "📈",
      title: "Analytics Hub",
      content: "50+ metrics, emotional insights, and your AI coach. Spot your edge and stop guessing.",
      selector: "#tour-drawer-panel",
      layout: "spotlight",
      sidebarCategory: "analytics",
      side: "right",
      bubbleAlign: "left",
      pointerPadding: 4,
      pointerRadius: 12,
      showSkip: true,
    },
    // ── Step 5: Simple/Advanced toggle ──
    {
      id: "view-toggle",
      icon: "⚡",
      title: "Simple & Advanced Mode",
      titleKey: "tours.welcome.step11Title",
      content: "You're in Simple mode with 6 core tools. Switch to Advanced for prop firm tracking, heat maps, and more.",
      contentKey: "tours.welcome.step11Content",
      selector: "#tour-view-toggle",
      layout: "spotlight",
      side: "right",
      pointerPadding: 4,
      pointerRadius: 12,
      showSkip: true,
    },
    // ── Step 6: Key metrics strip ──
    {
      id: "key-metrics",
      icon: "📊",
      title: "Your Key Metrics",
      titleKey: "tours.welcome.step12Title",
      content: "Win rate, P&L, profit factor, max drawdown. These four numbers tell the whole story.",
      contentKey: "tours.welcome.step12Content",
      selector: "#tour-stats",
      layout: "spotlight",
      sidebarClose: true,
      side: "top",
      viewportID: "dashboard-viewport",
      showSkip: true,
    },
    // ── Step 7: Charts zone ──
    {
      id: "equity-chart",
      icon: "📈",
      title: "Charts",
      titleKey: "tours.welcome.step13Title",
      content: "Your cumulative P&L and daily results. Small steady bars beat big volatile ones every time.",
      contentKey: "tours.welcome.step13Content",
      selector: "#tour-equity",
      layout: "spotlight",
      side: "top",
      viewportID: "dashboard-viewport",
      showSkip: true,
    },
    // ── Step 8: Activity zone ──
    {
      id: "activity-zone",
      icon: "📋",
      title: "Recent Activity",
      content: "Recent trades, streak, and heatmap. Click any row and notice the difference between calm and anxious trades.",
      selector: "#tour-trades-table",
      layout: "spotlight",
      side: "top",
      pointerPadding: 12,
      viewportID: "dashboard-viewport",
      showSkip: true,
    },
    // ── Step 9: Apps launcher ──
    {
      id: "apps-launcher",
      icon: "🧩",
      title: "Apps",
      titleKey: "tours.welcome.step19Title",
      content: "15+ specialized tools — paper trading, strategy backtester, options analysis, and more. All free.",
      contentKey: "tours.welcome.step19Content",
      selector: "#tour-apps",
      layout: "fullscreen",
      appsDropdown: true,
      pointerPadding: 8,
      pointerRadius: 12,
      showSkip: true,
    },
    // ── Step 10: Outro ──
    {
      id: "outro",
      icon: "✅",
      title: "You're All Set!",
      titleKey: "tours.welcome.step20Title",
      content: "Hit Log Trade to record your first one. I'm Nova, click me anytime you need help. Now go trade!",
      contentKey: "tours.welcome.step20Content",
      layout: "fullscreen",
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
