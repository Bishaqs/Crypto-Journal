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

    // Guide speech (per step)
    speech0: "Welcome to Stargate! I'm Nova, your trading companion. Let's get you set up.",
    speech1WithName: "Nice to meet you, {name}! How long have you been trading?",
    speech1NoName: "What should I call you?",
    speech2: "How do you trade?",
    speech3: "Where do you execute your trades?",
    speech4: "What instruments do you trade?",
    speech5: "What do you want to achieve with Stargate?",
    speech6: "Almost done! Let's personalize your experience.",
    speech7: "Last one — how did you find us?",

    // Intro cinematic
    welcomeTitle: "Welcome to Stargate",
    tapToSkip: "tap to skip",

    // Step indicator + navigation
    stepOf: "Step {current} of {total}",
    navBack: "Back",
    navContinue: "Continue",
    letsGo: "Let's Go",
    letsGoFinal: "Let's Go!",

    // Step 1: Experience
    experienceLevel: "Experience Level",
    newbie: "Newbie",
    newbieDesc: "Just starting",
    climbing: "Climbing",
    climbingDesc: "1-2 years",
    ninja: "Ninja",
    ninjaDesc: "3-5 years",
    monk: "Monk",
    monkDesc: "5+ years",

    // Step 2: Account type
    personal: "Personal",
    personalDesc: "Trading with your own capital",
    propFirm: "Prop Firm",
    propFirmDesc: "Trading a funded account",
    notStarted: "Not Started",
    notStartedDesc: "Still exploring trading",

    // Step 3: Broker
    selectBroker: "Select your broker",
    otherBroker: "Other / Not listed",

    // Step 5: Goals
    journalTrades: "Journal Trades",
    analyze: "Analyze",
    backtest: "Backtest",
    learn: "Learn",

    // Step 6: Risk
    riskTolerance: "Risk Tolerance",
    safe: "Safe",
    moderate: "Moderate",
    aggressive: "Aggressive",
    preferredAnalytics: "Preferred Analytics (optional)",

    // Step 7: Referral
    aFriend: "A Friend",
    other: "Other",
  },

  sidebar: {
    dashboard: "Dashboard",
    tradeLog: "Trade Log",
    journal: "Journal",
    calendar: "Calendar",
    analytics: "Analytics",
    tradePlans: "Trade Plans",
    quests: "Quests",
    achievements: "Achievements",
    leaderboard: "Leaderboard",
    positions: "Positions",
    watchlist: "Watchlist",
    settings: "Settings",
    admin: "Admin",
    importExport: "Import / Export",
    feedback: "Feedback",
    helpCenter: "Help Center",

    // Sections
    performanceAnalysis: "Performance & Analysis",
    intelligence: "Intelligence",
    marketTools: "Market & Tools",
    tools: "Tools",
    compete: "Compete",
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
    monthlyRecap: "Monthly Recap",

    // Market & Tools items
    marketOverview: "Market Overview",
    marketNews: "Market News",
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
    whatIf: "What If",

    // Mode toggle
    focus: "Focus",
    simple: "Simple",
    full: "Advanced",
    psychology: "Psychology",

    // Asset context
    cryptoLabel: "Crypto",
    stocksLabel: "Stocks",
    commoditiesLabel: "Commodities",
    forexLabel: "Forex",
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
    quickTrade: "Quick Trade",
    logTrade: "Log Trade",
    importCsv: "Import CSV",
    addNote: "Add Note",
    exportCsv: "Export CSV",
    resync: "Resync",
    stockTrade: "Stock Trade",
    whatIf: "What If",
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

  tours: {
    skipTour: "Skip tour",
    welcome: {
      step0Title: "Ready for Liftoff?",
      step0Content: "Come with me. I'm Nova, and I'll show you everything you need to become a profitable trader.",
      step1Title: "Welcome to Stargate!",
      step1Content: "Hey! I'm Nova, your trading companion. Let me show you around. This takes about 2 minutes, and you can skip anytime.",
      step2Title: "Dashboard",
      step2Content: "This is home base. Your P&L, win rate, and equity curve all update live as you log trades.",
      step3Title: "Trade Log",
      step3Content: "Every trade lands here. You can filter by date, emotion, or coin. Click any row to see the full picture.",
      step4Title: "Journal",
      step4Content: "Write daily reflections. What went well, what went sideways. Over time you'll spot patterns in your own thinking.",
      step5Title: "Calendar",
      step5Content: "Green day, red day, at a glance. You'll quickly see if Mondays are good or Fridays are bad.",
      step6Title: "Trade Plans",
      step6Content: "Plan before you trade. Set your entry, target, and stop. After the trade, rate how well you followed the plan.",
      step7Title: "Achievements",
      step7Content: "Earn badges for your trading milestones — journal streaks, win rates, risk management. Track your growth as a trader.",
      step8Title: "Analytics",
      step8Content: "50+ metrics. P&L by hour, by setup, by pair. Stop guessing and start knowing where your edge is.",
      step9Title: "Insights",
      step9Content: "How do your emotions affect your P&L? Which moods lead to your best trades? This page has the answers.",
      step10Title: "AI Coach",
      step10Content: "Ask it anything about your trading. For a personal AI coach, connect your own API key in Settings — your data stays secure and private.",
      step11Title: "Simple & Advanced Mode",
      step11Content: "You're in Simple mode with 6 core tools. Switch to Advanced for prop firm tracking, Monte Carlo sims, heat maps, and more.",
      step12Title: "Your Key Metrics",
      step12Content: "Win rate, P&L, profit factor, max drawdown. These four numbers tell the whole story. They update as you trade.",
      step13Title: "Equity Curve",
      step13Content: "Your cumulative P&L over time. A rising line means you have an edge. Sharp drops show your drawdowns.",
      step14Title: "Daily P&L",
      step14Content: "Each bar is one day. Green above zero means profit. Small steady bars beat big volatile ones every time.",
      step15Title: "Recent Trades",
      step15Content: "Your latest trades with P&L and emotion tags. Click any row and notice the difference between calm and anxious trades.",
      step16Title: "Journaling Streak",
      step16Content: "Like a Duolingo streak, but for trading. Journal every day and watch the data compound.",
      step17Title: "Calendar Heatmap",
      step17Content: "Green means profit, red means loss, gray means no trades. You can spot hot streaks at a glance.",
      step18Title: "AI Insights",
      step18Content: "Nova summarizes your recent trading patterns: streaks, emotional tendencies, and hidden leaks. Check here for quick insights without asking.",
      step19Title: "Apps",
      step19Content: "15+ specialized tools — paper trading, strategy backtester, options analysis, seasonality charts, P&L deep dives, and more. All free.",
      step20Title: "You're All Set!",
      step20Content: "Hit Log Trade to record your first one. Every page has its own mini-tour on first visit. I'm Nova, click me anytime you need help. Now go trade!",
    },
  },
} as const;

export default en;

// Flatten keys for type-safe dot-path access
type FlattenKeys<T, Prefix extends string = ""> = T extends Record<string, unknown>
  ? { [K in keyof T & string]: FlattenKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`> }[keyof T & string]
  : Prefix;

export type TranslationKeys = FlattenKeys<typeof en>;
