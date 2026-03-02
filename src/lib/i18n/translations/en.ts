const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    next: "Next",
    continue: "Continue",
    skip: "Skip",
    close: "Close",
    done: "Done",
    loading: "Loading...",
    saving: "Saving...",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    export: "Export",
    import: "Import",
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    logOut: "Log Out",
    version: "Stargate v0.1",
  },

  onboarding: {
    step1Title: "Let's get to know you",
    step1Subtitle: "This helps us personalize your experience",
    yourName: "Your name",
    namePlaceholder: "What should we call you?",
    experience: "Trading experience",
    beginner: "Beginner",
    beginnerDesc: "Just getting started",
    intermediate: "Intermediate",
    intermediateDesc: "1-3 years trading",
    advanced: "Advanced",
    advancedDesc: "3+ years, consistent",
    professional: "Professional",
    professionalDesc: "Full-time trader",

    step2Title: "What do you trade?",
    step2Subtitle: "We'll customize your experience",
    crypto: "Crypto",
    cryptoDesc: "BTC, ETH, alts",
    stocks: "Stocks",
    stocksDesc: "Equities, options",
    both: "Both",
    bothDesc: "Multi-asset",

    step3Title: "How will you log trades?",
    step3Subtitle: "You can always change this later",
    manual: "Log Manually",
    manualDesc: "Enter trades yourself — full control over every field",
    csvImport: "Import CSV",
    csvImportDesc: "Upload trades from your exchange or another journal",

    step4Title: "You're all set!",
    step4Subtitle: "Here's what to do first",
    firstTradeTitle: "Log your first trade",
    firstTradeDesc: "Click 'Log Trade' on the dashboard. It takes 30 seconds.",
    tagEmotionsTitle: "Tag your emotions",
    tagEmotionsDesc: "Were you calm, anxious, or FOMOing? Be honest — the data helps.",
    rateProcessTitle: "Rate your process",
    rateProcessDesc: "After closing, score your execution 1-10. This is your real edge metric.",

    goToDashboard: "Go to Dashboard",
    skipOnboarding: "Skip onboarding",
    language: "Language",
  },

  sidebar: {
    dashboard: "Dashboard",
    tradeLog: "Trade Log",
    journal: "Journal",
    calendar: "Calendar",
    analytics: "Analytics",
    tradePlans: "Trade Plans",
    achievements: "Achievements",
    positions: "Positions",
    watchlist: "Watchlist",
    settings: "Settings",
    admin: "Admin",

    // Sections
    performanceAnalysis: "Performance & Analysis",
    intelligence: "Intelligence",
    marketTools: "Market & Tools",
    tools: "Tools",
    discipline: "Discipline",
    reports: "Reports",

    // Sub-sections
    performance: "Performance",
    exitAnalysis: "Exit Analysis",
    breakdownViews: "Breakdown Views",
    summaries: "Summaries",
    dateViews: "Date Views",

    // Analysis items
    runningPnl: "Running PnL Analysis",
    tradeCount: "Trade Count",
    volume: "Volume",
    commissionsFees: "Commissions/Fees",

    // Performance items
    tradeExpectancy: "Trade Expectancy",
    rValue: "R-Value",
    hitRatio: "Hit Ratio",
    profitFactor: "Profit Factor",
    mfeMae: "MFE / MAE",
    relativeVolume: "Relative Volume",
    returnsDistribution: "Returns Distribution",
    trendAnalysis: "Trend Analysis",
    technicalAnalysis: "Technical Analysis",
    metrics: "Metrics",

    // Exit Analysis items
    exitPnl: "Exit PnL",
    exitEfficiency: "Exit Efficiency",
    exitTime: "Exit Time",
    eodExitPnl: "EOD Exit PnL",
    eodEfficiency: "EOD Efficiency",
    multiTimeframe: "Multi-Timeframe",

    // Breakdown items
    tagGroups: "Tag Groups",
    sectors: "Sectors",
    treemapSymbol: "Treemap: Symbol",
    treemapSector: "Treemap: Sector",
    treemapTags: "Treemap: Tags",

    // Summary items
    accountsStatistics: "Accounts Statistics",
    tagGroupsStatistics: "Tag Groups Statistics",
    openTradesSummary: "Open Trades Summary",

    // Date views
    dayGrouped: "Day Grouped",
    calendarGrouped: "Calendar Grouped",

    // Intelligence items
    insights: "Insights",
    aiCoach: "AI Coach",
    weeklyReports: "Weekly Reports",

    // Market & Tools items
    marketOverview: "Market Overview",
    tokenScreener: "Token Screener",
    heatMaps: "Heat Maps",
    derivatives: "Derivatives",
    dcaCalculator: "DCA Calculator",
    riskCalculator: "Risk Calculator",
    playbook: "Playbook",
    optionsAnalysis: "Options Analysis",
    goals: "Goals",

    // Discipline items
    ruleTracker: "Rule Tracker",
    execution: "Execution",
    riskAnalysis: "Risk Analysis",
    propFirm: "Prop Firm",

    // Reports items
    taxReports: "Tax Reports",
    simulations: "Simulations",

    // Mode toggle
    simple: "Simple",
    full: "Advanced",

    // Asset context
    cryptoLabel: "Crypto",
    stocksLabel: "Stocks",
    stockUpgradeMsg: "Stock tracking requires the Stocks add-on or Max plan.",
    upgradeNow: "Upgrade now",

    // Logout
    logOutConfirmTitle: "Log Out?",
    logOutConfirmMsg: "Are you sure you want to log out?",
  },

  dashboard: {
    overview: "Overview",
    sampleData: "Sample data — log a trade to begin",
    positionsInRange: "{count} positions in range",
    logTrade: "Log Trade",

    // Advanced metrics
    advancedMetrics: "Advanced Metrics",
    sharpeRatio: "Sharpe Ratio",
    expectancy: "Expectancy",
    profitFactor: "Profit Factor",
    maxDrawdown: "Max Drawdown",
    positionSizing: "Position Sizing",
    basedOnKelly: "Based on Kelly Criterion",
    rrRatio: "R:R Ratio",
    fullKelly: "Full Kelly",
    halfKelly: "Half Kelly",
    suggested: "Suggested",
    stressTest: "Stress-test in Monte Carlo",
    quickInsight: "Quick Insight",
    stressTestEdge: "Stress-test your edge",

    // Greeting
    gm: "gm",
  },

  settings: {
    title: "Settings",
    account: "Account",
    connectedAccounts: "Connected Accounts",
    tradingAccounts: "Trading Accounts",
    globalSettings: "Global Settings",
    subscription: "Subscription",
    referrals: "Referrals",
    exportData: "Export Data",

    // General section
    general: "General",
    appPreferences: "App-wide preferences.",
    timezone: "Timezone",
    displayCurrency: "Display Currency",
    defaultDateRange: "Default Date Range",
    language: "Language",

    // Date ranges
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last90Days: "Last 90 days",
    lastYear: "Last year",
    allTime: "All time",

    // Tax
    taxAccounting: "Tax & Accounting",
    taxAccountingDesc: "Set your cost basis calculation method.",
    costBasisMethod: "Cost Basis Method",

    // Risk
    riskManagement: "Risk Management",
    riskManagementDesc: "Set trading limits and guardrails.",
    maxDailyLoss: "Max Daily Loss ($)",
    maxDrawdown: "Max Drawdown (%)",
    maxPositionSize: "Max Position Size (% of account)",

    saveGlobal: "Save Global Settings",
  },

  quickAction: {
    title: "Quick Actions",
    logTrade: "Log Trade",
    importCsv: "Import CSV",
    addNote: "Add Note",
    exportCsv: "Export CSV",
    resync: "Resync",
  },

  emotion: {
    title: "Quick Emotion Log",
    intensity: "Intensity",
    quickNote: "Quick note (optional)...",
    logFeeling: "Log Feeling",
    goodToTrade: "Good to trade",
    caution: "Proceed with caution",
    stepAway: "Step away",
  },
} as const;

export default en;

// Flatten keys for type-safe dot-path access
type FlattenKeys<T, Prefix extends string = ""> = T extends Record<string, unknown>
  ? { [K in keyof T & string]: FlattenKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`> }[keyof T & string]
  : Prefix;

export type TranslationKeys = FlattenKeys<typeof en>;
