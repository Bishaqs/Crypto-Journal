import type { Tour } from "nextstepjs";

const STEP_DEFAULTS = {
  showControls: true,
  showSkip: true,
  pointerPadding: 10,
  pointerRadius: 12,
} as const;

export const stocksDashboardPageTour: Tour = {
  tour: "stocks-dashboard-page",
  steps: [
    {
      icon: "📊",
      title: "Stocks Dashboard",
      content: "Your stock trading command center. Track positions, P&L, win rate, and day trade count. The PDT warning keeps you under the 3-day-trade limit.",
      selector: "#tour-stocks-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📈",
      title: "Key Metrics",
      content: "Key metrics updated in real-time. Day Trades shows your rolling 5-day count — stay under 4 to avoid PDT restrictions with under $25K.",
      selector: "#tour-stocks-stats",
      side: "top",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🏭",
      title: "Sector Breakdown",
      content: "Sector breakdown shows where your profits come from. Diversify or double down — the data shows which sectors you trade best.",
      selector: "#tour-stocks-sector",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const stocksTradesPageTour: Tour = {
  tour: "stocks-trades-page",
  steps: [
    {
      icon: "📋",
      title: "Stock Positions",
      content: "All your stock and options trades in one place. Filter by sector, market session, or search by symbol.",
      selector: "#tour-stock-trades-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🔍",
      title: "Filters",
      content: "Filter trades by sector (Tech, Healthcare, etc.) or session (Pre-Market, Regular, After-Hours) to analyze performance by context.",
      selector: "#tour-stock-trades-filters",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📝",
      title: "Trade Details",
      content: "Click any row to expand full details including position type, options data, notes, emotion tags, and process score.",
      selector: "#tour-stock-trades-table",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const stocksAnalyticsPageTour: Tour = {
  tour: "stocks-analytics-page",
  steps: [
    {
      icon: "📈",
      title: "Stock Analytics",
      content: "Performance analytics for your stock trades. See sector rotation, session performance, and options vs equity comparison.",
      selector: "#tour-stock-analytics-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "🔍",
      title: "Performance Breakdown",
      content: "Compare your win rate across sectors and market sessions. Find which market conditions work best for your strategy.",
      selector: "#tour-stock-analytics-charts",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const stocksWatchlistPageTour: Tour = {
  tour: "stocks-watchlist-page",
  steps: [
    {
      icon: "👀",
      title: "Stock Watchlist",
      content: "Your stock watchlist with live TradingView charts. Track symbols you're watching, set target prices, and get alerts.",
      selector: "#tour-watchlist-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Watchlist Cards",
      content: "Each card shows live price data. Click the chart icon for a TradingView mini chart. Star items to prioritize. Set buy/sell targets for your plan.",
      selector: "#tour-watchlist-cards",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const stocksMarketPageTour: Tour = {
  tour: "stocks-market-page",
  steps: [
    {
      icon: "🌐",
      title: "Stock Market Overview",
      content: "Macro market overview for stock traders. Track major indices, VIX, DXY, forex pairs, and the economic calendar.",
      selector: "#tour-stock-market-header",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📊",
      title: "Indices & VIX",
      content: "S&P 500, NASDAQ, DOW, and VIX at a glance. High VIX = high volatility — adjust position sizes accordingly.",
      selector: "#tour-stock-market-indices",
      side: "bottom",
      ...STEP_DEFAULTS,
    },
    {
      icon: "📅",
      title: "Economic Calendar",
      content: "Economic calendar with FOMC, CPI, NFP dates. These events move markets — plan around them or sit out.",
      selector: "#tour-stock-market-calendar",
      side: "top",
      ...STEP_DEFAULTS,
      showSkip: false,
    },
  ],
};

export const allStockPageTours: Tour[] = [
  stocksDashboardPageTour,
  stocksTradesPageTour,
  stocksAnalyticsPageTour,
  stocksWatchlistPageTour,
  stocksMarketPageTour,
];
