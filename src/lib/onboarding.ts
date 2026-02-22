import type { Tour } from "nextstepjs";

export const ONBOARDING_KEY = "stargate-onboarding-complete";

export const onboardingTour: Tour[] = [
  {
    tour: "welcome",
    steps: [
      {
        icon: "🚀",
        title: "Welcome to Stargate!",
        content:
          "This is your trading command center — see your P&L, win rate, and equity curve at a glance. Let's take a quick tour.",
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
          "All your trades in one place. Filter by emotion, date, source (CEX/DEX), and more. Click any trade to expand details.",
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
          "Write daily reflections, track your mindset, and review your trading process. The journal is your accountability partner.",
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
          "See your trading days at a glance. Green = profit, red = loss. Spot patterns in your performance over time.",
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
          "Deep dive into your performance — P&L by day, by hour, by setup type. Find your edge and eliminate weak spots.",
        selector: "#tour-analytics",
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
          "Get AI-powered insights based on your trading patterns. Ask questions, get personalized recommendations.",
        selector: "#tour-ai",
        side: "right",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: "⚙️",
        title: "Settings",
        content:
          "Connect your exchange, customize your theme, manage wallets, and configure your subscription.",
        selector: "#tour-settings",
        side: "right",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 12,
      },
      {
        icon: "✅",
        title: "You're All Set!",
        content:
          "Start logging trades to unlock insights. The more data you add, the smarter Stargate gets. Happy trading!",
        selector: "#tour-home",
        side: "right",
        showControls: true,
        showSkip: false,
        pointerPadding: 8,
        pointerRadius: 12,
      },
    ],
  },
];
