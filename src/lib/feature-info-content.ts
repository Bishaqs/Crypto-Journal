export interface FeatureInfo {
  title: string;
  tagline: string;
  description: string;
  capabilities: string[];
  valueProp: string;
}

export const FEATURE_INFO: Record<string, FeatureInfo> = {
  "paper-trading": {
    title: "Paper Trading",
    tagline: "Risk-free execution practice on real market data",
    description:
      "Practice placing trades on actual historical crypto price data without risking a single dollar. The simulator replays real 1-minute and 5-minute candles from any date, letting you place market, limit, stop, and bracket orders exactly as you would on a live exchange.",
    capabilities: [
      "Place market, limit & stop orders on real historical candles",
      "Choose any crypto pair and historical date to replay",
      "Adjustable playback speed from 1x to 20x",
      "Real-time P&L tracking with full session stats",
      "Keyboard shortcuts for rapid execution practice",
    ],
    valueProp:
      "Most traders lose money because they haven't practiced enough. Paper trading lets you build muscle memory for entries, exits, and position management \u2014 so when real money is on the line, your execution is automatic, not emotional.",
  },

  "multi-chart": {
    title: "Multi-Chart Trading",
    tagline: "Trade 4 markets simultaneously on synced timelines",
    description:
      "Monitor and trade up to 4 crypto pairs at once on perfectly synchronized historical charts. Each panel has its own order book and position tracker, while playback advances all charts together \u2014 just like watching multiple screens on a real trading desk.",
    capabilities: [
      "4 synchronized chart panels with independent positions",
      "Keyboard-driven panel switching (1\u20134) and quick orders (B/S)",
      "Combined session P&L across all pairs",
      "Shared playback controls for all panels",
      "Practice correlation and spread trading strategies",
    ],
    valueProp:
      "Real markets don't move in isolation. Training on multiple pairs simultaneously teaches you to spot correlations, manage attention across instruments, and build the multi-tasking skills that separate profitable traders from one-chart amateurs.",
  },

  "multi-simulator": {
    title: "Multi Simulator",
    tagline: "Compare risk scenarios with Monte Carlo analysis",
    description:
      "Run up to 4 Monte Carlo simulations side by side using your actual trade history. Each scenario tests a different risk-per-trade percentage, showing you the probability distribution of outcomes \u2014 from best case to worst case \u2014 so you can find the optimal position sizing for your strategy.",
    capabilities: [
      "Up to 4 parallel scenarios with custom risk percentages",
      "500 randomized simulations per scenario",
      "Median equity curves overlaid on a single chart",
      "Probability of profit, probability of ruin, and max drawdown stats",
      "Uses your real trade data for realistic projections",
    ],
    valueProp:
      "Position sizing is the single biggest determinant of long-term profitability. Most traders guess their risk per trade. This tool removes the guesswork \u2014 showing you exactly how different risk levels change your probability of blowing up vs growing your account.",
  },

  "options-simulator": {
    title: "Options Simulator",
    tagline: "Practice options trading with a simulated order book",
    description:
      "Build and manage options positions using a Black-Scholes simulated chain. Browse calls and puts across multiple strike prices, adjust implied volatility and days to expiry, and stage orders before submitting \u2014 exactly like a real options trading platform.",
    capabilities: [
      "Full call/put chain with bid/ask pricing",
      "Adjustable implied volatility, DTE, and strike range",
      "Market and limit order types",
      "Stage orders before committing \u2014 review before you submit",
      "Position summary with Greeks exposure",
    ],
    valueProp:
      "Options are powerful but unforgiving. One wrong leg in a spread can flip your risk profile. This simulator lets you practice reading chains, building multi-leg positions, and understanding how IV and time decay affect your P&L \u2014 all without paying tuition to the market.",
  },

  seasonality: {
    title: "Seasonality Analysis",
    tagline: "Spot historical patterns in monthly and weekly returns",
    description:
      "Analyze how any crypto asset has performed by month, day of week, and year using historical price data. Seasonality analysis reveals recurring patterns \u2014 like which months tend to be bullish, which weekdays see the most selling pressure, and how the current year compares to previous cycles.",
    capabilities: [
      "Monthly returns breakdown with historical averages",
      "Day-of-week performance analysis",
      "Year-over-year heatmap comparison",
      "Normalized yearly price overlay for cycle comparison",
      "Adjustable lookback period from 1 to 5+ years",
    ],
    valueProp:
      "Markets have rhythms. Bitcoin's historical tendency to rally in Q4, altcoin weakness in September, stronger Mondays \u2014 these patterns aren't guarantees, but they give you a statistical edge in timing your entries and exits.",
  },
};
