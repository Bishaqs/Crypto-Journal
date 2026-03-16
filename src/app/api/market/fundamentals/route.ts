import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Company profiles for 20 popular stocks
const COMPANY_PROFILES: Record<string, {
  name: string; exchange: string; sector: string; industry: string;
  website: string; description: string;
  basePrice: number; marketCap: number; revenue2021: number;
  revenueGrowth: number; grossMargin: number; operatingMargin: number;
  netMargin: number; totalAssets: number; totalLiabilities: number;
  cash: number; longTermDebt: number; sharesOut: number;
  dividendYield: number; beta: number;
}> = {
  AAPL: {
    name: "Apple Inc", exchange: "NASDAQ", sector: "Technology", industry: "Consumer Electronics",
    website: "https://www.apple.com", description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables, home and accessories.",
    basePrice: 195, marketCap: 3.01e12, revenue2021: 365.8e9,
    revenueGrowth: 0.08, grossMargin: 0.44, operatingMargin: 0.30,
    netMargin: 0.26, totalAssets: 351e9, totalLiabilities: 287e9,
    cash: 29e9, longTermDebt: 98e9, sharesOut: 15.4e9,
    dividendYield: 0.005, beta: 1.28,
  },
  MSFT: {
    name: "Microsoft Corp", exchange: "NASDAQ", sector: "Technology", industry: "Software — Infrastructure",
    website: "https://www.microsoft.com", description: "Microsoft Corporation develops and supports software, services, devices, and solutions worldwide. Segments include Intelligent Cloud, Productivity and Business Processes, and More Personal Computing.",
    basePrice: 415, marketCap: 3.08e12, revenue2021: 168.1e9,
    revenueGrowth: 0.15, grossMargin: 0.69, operatingMargin: 0.42,
    netMargin: 0.36, totalAssets: 411e9, totalLiabilities: 198e9,
    cash: 34e9, longTermDebt: 47e9, sharesOut: 7.43e9,
    dividendYield: 0.007, beta: 0.89,
  },
  AMZN: {
    name: "Amazon.com Inc", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Internet Retail",
    website: "https://www.amazon.com", description: "Amazon.com Inc. engages in the retail sale of consumer products, advertising, and subscription services through online and physical stores. It operates through North America, International, and AWS segments.",
    basePrice: 185, marketCap: 1.92e12, revenue2021: 469.8e9,
    revenueGrowth: 0.12, grossMargin: 0.47, operatingMargin: 0.06,
    netMargin: 0.05, totalAssets: 420e9, totalLiabilities: 282e9,
    cash: 54e9, longTermDebt: 67e9, sharesOut: 10.3e9,
    dividendYield: 0, beta: 1.14,
  },
  GOOGL: {
    name: "Alphabet Inc", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content & Information",
    website: "https://abc.xyz", description: "Alphabet Inc. offers various products and platforms worldwide. It operates through Google Services, Google Cloud, and Other Bets segments, providing search, advertising, cloud computing, and hardware products.",
    basePrice: 175, marketCap: 2.16e12, revenue2021: 257.6e9,
    revenueGrowth: 0.13, grossMargin: 0.57, operatingMargin: 0.27,
    netMargin: 0.22, totalAssets: 359e9, totalLiabilities: 107e9,
    cash: 21e9, longTermDebt: 14e9, sharesOut: 12.3e9,
    dividendYield: 0, beta: 1.06,
  },
  META: {
    name: "Meta Platforms Inc", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content & Information",
    website: "https://about.meta.com", description: "Meta Platforms Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, PCs, virtual reality headsets, wearables, and in-home devices.",
    basePrice: 510, marketCap: 1.3e12, revenue2021: 117.9e9,
    revenueGrowth: 0.18, grossMargin: 0.80, operatingMargin: 0.35,
    netMargin: 0.29, totalAssets: 165e9, totalLiabilities: 54e9,
    cash: 14e9, longTermDebt: 18e9, sharesOut: 2.55e9,
    dividendYield: 0.003, beta: 1.22,
  },
  TSLA: {
    name: "Tesla Inc", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Auto Manufacturers",
    website: "https://www.tesla.com", description: "Tesla Inc. designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems. The company operates through Automotive and Energy Generation and Storage segments.",
    basePrice: 245, marketCap: 780e9, revenue2021: 53.8e9,
    revenueGrowth: 0.25, grossMargin: 0.26, operatingMargin: 0.12,
    netMargin: 0.10, totalAssets: 82e9, totalLiabilities: 36e9,
    cash: 16e9, longTermDebt: 2e9, sharesOut: 3.18e9,
    dividendYield: 0, beta: 2.05,
  },
  NVDA: {
    name: "NVIDIA Corp", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    website: "https://www.nvidia.com", description: "NVIDIA Corporation provides graphics and compute and networking solutions worldwide. Its products are used in gaming, professional visualization, data center, and automotive markets.",
    basePrice: 880, marketCap: 2.16e12, revenue2021: 26.9e9,
    revenueGrowth: 0.45, grossMargin: 0.73, operatingMargin: 0.54,
    netMargin: 0.49, totalAssets: 65e9, totalLiabilities: 22e9,
    cash: 5e9, longTermDebt: 8.5e9, sharesOut: 2.46e9,
    dividendYield: 0.0003, beta: 1.68,
  },
  AMD: {
    name: "Advanced Micro Devices Inc", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    website: "https://www.amd.com", description: "Advanced Micro Devices Inc. operates as a semiconductor company worldwide. It provides x86 microprocessors, GPUs, APUs, and adaptive SoC products for data centers, client, gaming, and embedded segments.",
    basePrice: 165, marketCap: 267e9, revenue2021: 16.4e9,
    revenueGrowth: 0.20, grossMargin: 0.51, operatingMargin: 0.22,
    netMargin: 0.17, totalAssets: 67e9, totalLiabilities: 12e9,
    cash: 3.8e9, longTermDebt: 1.7e9, sharesOut: 1.62e9,
    dividendYield: 0, beta: 1.55,
  },
  PLTR: {
    name: "Palantir Technologies Inc", exchange: "NYSE", sector: "Technology", industry: "Software — Infrastructure",
    website: "https://www.palantir.com", description: "Palantir Technologies Inc. builds and deploys software platforms for the intelligence community, defense, and commercial sectors. It operates Gotham, Foundry, and Apollo platforms.",
    basePrice: 25, marketCap: 55e9, revenue2021: 1.54e9,
    revenueGrowth: 0.24, grossMargin: 0.78, operatingMargin: 0.05,
    netMargin: 0.02, totalAssets: 3.5e9, totalLiabilities: 0.9e9,
    cash: 2.5e9, longTermDebt: 0.2e9, sharesOut: 2.19e9,
    dividendYield: 0, beta: 1.62,
  },
  COIN: {
    name: "Coinbase Global Inc", exchange: "NASDAQ", sector: "Financial Services", industry: "Financial Data & Stock Exchanges",
    website: "https://www.coinbase.com", description: "Coinbase Global Inc. provides financial infrastructure and technology for the crypto economy. It offers a platform for buying, selling, and storing cryptocurrencies for retail and institutional customers.",
    basePrice: 220, marketCap: 54e9, revenue2021: 7.84e9,
    revenueGrowth: 0.08, grossMargin: 0.85, operatingMargin: 0.30,
    netMargin: 0.25, totalAssets: 12e9, totalLiabilities: 5.5e9,
    cash: 5e9, longTermDebt: 3.4e9, sharesOut: 0.245e9,
    dividendYield: 0, beta: 2.85,
  },
  AVGO: {
    name: "Broadcom Inc", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    website: "https://www.broadcom.com", description: "Broadcom Inc. designs, develops, and supplies semiconductor and infrastructure software solutions. It offers semiconductor devices focusing on complex digital and mixed signal complementary metal oxide semiconductor devices.",
    basePrice: 1350, marketCap: 626e9, revenue2021: 27.5e9,
    revenueGrowth: 0.18, grossMargin: 0.74, operatingMargin: 0.45,
    netMargin: 0.35, totalAssets: 73e9, totalLiabilities: 41e9,
    cash: 12e9, longTermDebt: 39e9, sharesOut: 0.464e9,
    dividendYield: 0.012, beta: 1.15,
  },
  ARM: {
    name: "Arm Holdings PLC", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    website: "https://www.arm.com", description: "Arm Holdings PLC designs and licenses central processing unit products and related technology. Its architecture is used in smartphones, tablets, embedded devices, servers, and networking equipment.",
    basePrice: 140, marketCap: 145e9, revenue2021: 2.7e9,
    revenueGrowth: 0.22, grossMargin: 0.95, operatingMargin: 0.25,
    netMargin: 0.20, totalAssets: 12e9, totalLiabilities: 3e9,
    cash: 2e9, longTermDebt: 0.5e9, sharesOut: 1.03e9,
    dividendYield: 0, beta: 1.45,
  },
  SMCI: {
    name: "Super Micro Computer Inc", exchange: "NASDAQ", sector: "Technology", industry: "Computer Hardware",
    website: "https://www.supermicro.com", description: "Super Micro Computer Inc. develops and manufactures high performance server and storage solutions based on modular and open architecture. Its solutions are used for cloud computing, data center, and AI/ML workloads.",
    basePrice: 750, marketCap: 44e9, revenue2021: 5.2e9,
    revenueGrowth: 0.40, grossMargin: 0.17, operatingMargin: 0.10,
    netMargin: 0.08, totalAssets: 8e9, totalLiabilities: 4.5e9,
    cash: 0.5e9, longTermDebt: 0.3e9, sharesOut: 0.058e9,
    dividendYield: 0, beta: 1.95,
  },
  MU: {
    name: "Micron Technology Inc", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    website: "https://www.micron.com", description: "Micron Technology Inc. designs, develops, manufactures, and sells memory and storage products worldwide. It operates through four segments: Compute and Networking, Mobile, Embedded, and Storage.",
    basePrice: 95, marketCap: 105e9, revenue2021: 27.7e9,
    revenueGrowth: 0.10, grossMargin: 0.38, operatingMargin: 0.22,
    netMargin: 0.18, totalAssets: 65e9, totalLiabilities: 17e9,
    cash: 8e9, longTermDebt: 7e9, sharesOut: 1.1e9,
    dividendYield: 0.005, beta: 1.35,
  },
  INTC: {
    name: "Intel Corp", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    website: "https://www.intel.com", description: "Intel Corporation designs, develops, sells, and services computing and related products and technologies worldwide. Its products include CPUs, chipsets, FPGAs, and memory and storage solutions.",
    basePrice: 28, marketCap: 120e9, revenue2021: 79e9,
    revenueGrowth: -0.05, grossMargin: 0.43, operatingMargin: 0.05,
    netMargin: 0.02, totalAssets: 191e9, totalLiabilities: 87e9,
    cash: 22e9, longTermDebt: 37e9, sharesOut: 4.27e9,
    dividendYield: 0.015, beta: 0.95,
  },
  JPM: {
    name: "JPMorgan Chase & Co", exchange: "NYSE", sector: "Financial Services", industry: "Banks — Diversified",
    website: "https://www.jpmorganchase.com", description: "JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management segments.",
    basePrice: 200, marketCap: 575e9, revenue2021: 121.6e9,
    revenueGrowth: 0.06, grossMargin: 0.60, operatingMargin: 0.38,
    netMargin: 0.33, totalAssets: 3743e9, totalLiabilities: 3403e9,
    cash: 740e9, longTermDebt: 295e9, sharesOut: 2.87e9,
    dividendYield: 0.023, beta: 1.08,
  },
  GS: {
    name: "Goldman Sachs Group Inc", exchange: "NYSE", sector: "Financial Services", industry: "Capital Markets",
    website: "https://www.goldmansachs.com", description: "The Goldman Sachs Group Inc. is a global financial institution that delivers a range of financial services across investment banking, securities, investment management, and consumer banking.",
    basePrice: 460, marketCap: 153e9, revenue2021: 59.3e9,
    revenueGrowth: 0.04, grossMargin: 0.55, operatingMargin: 0.35,
    netMargin: 0.28, totalAssets: 1464e9, totalLiabilities: 1350e9,
    cash: 261e9, longTermDebt: 254e9, sharesOut: 0.333e9,
    dividendYield: 0.022, beta: 1.32,
  },
  V: {
    name: "Visa Inc", exchange: "NYSE", sector: "Financial Services", industry: "Credit Services",
    website: "https://www.visa.com", description: "Visa Inc. operates as a payments technology company worldwide. It facilitates digital payments among consumers, merchants, financial institutions, and government entities through VisaNet transaction processing network.",
    basePrice: 280, marketCap: 565e9, revenue2021: 24.1e9,
    revenueGrowth: 0.12, grossMargin: 0.80, operatingMargin: 0.67,
    netMargin: 0.52, totalAssets: 90e9, totalLiabilities: 49e9,
    cash: 16e9, longTermDebt: 20e9, sharesOut: 2.01e9,
    dividendYield: 0.008, beta: 0.96,
  },
  MA: {
    name: "Mastercard Inc", exchange: "NYSE", sector: "Financial Services", industry: "Credit Services",
    website: "https://www.mastercard.com", description: "Mastercard Incorporated is a technology company that connects consumers, financial institutions, merchants, governments, and businesses worldwide through electronic payments processing and related services.",
    basePrice: 470, marketCap: 435e9, revenue2021: 18.9e9,
    revenueGrowth: 0.13, grossMargin: 0.78, operatingMargin: 0.58,
    netMargin: 0.46, totalAssets: 42e9, totalLiabilities: 30e9,
    cash: 7e9, longTermDebt: 14e9, sharesOut: 0.926e9,
    dividendYield: 0.006, beta: 1.08,
  },
  BAC: {
    name: "Bank of America Corp", exchange: "NYSE", sector: "Financial Services", industry: "Banks — Diversified",
    website: "https://www.bankofamerica.com", description: "Bank of America Corporation provides banking and financial products and services for individual consumers, small and middle-market businesses, institutional investors, and large corporations worldwide.",
    basePrice: 37, marketCap: 295e9, revenue2021: 89.1e9,
    revenueGrowth: 0.05, grossMargin: 0.55, operatingMargin: 0.34,
    netMargin: 0.30, totalAssets: 3169e9, totalLiabilities: 2870e9,
    cash: 350e9, longTermDebt: 165e9, sharesOut: 7.97e9,
    dividendYield: 0.026, beta: 1.35,
  },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) % 2147483647;
  }
  return h || 1;
}

function generateFundamentals(symbol: string) {
  const profile = COMPANY_PROFILES[symbol];
  const rand = seededRandom(hashSymbol(symbol));

  // Use profile data or generate generic values for unknown symbols
  const p = profile ?? {
    name: `${symbol} Corp`, exchange: "NYSE", sector: "Technology", industry: "Software",
    website: `https://www.${symbol.toLowerCase()}.com`,
    description: `${symbol} is a publicly traded company.`,
    basePrice: 50 + rand() * 200, marketCap: 10e9 + rand() * 500e9,
    revenue2021: 1e9 + rand() * 50e9, revenueGrowth: 0.05 + rand() * 0.2,
    grossMargin: 0.3 + rand() * 0.4, operatingMargin: 0.05 + rand() * 0.3,
    netMargin: 0.03 + rand() * 0.2, totalAssets: 5e9 + rand() * 100e9,
    totalLiabilities: 2e9 + rand() * 50e9, cash: 0.5e9 + rand() * 20e9,
    longTermDebt: 0.5e9 + rand() * 20e9, sharesOut: 0.1e9 + rand() * 5e9,
    dividendYield: rand() * 0.03, beta: 0.5 + rand() * 2,
  };

  const jitter = (base: number, pct: number) => base * (1 + (rand() - 0.5) * pct);

  // Overview
  const overview = {
    symbol,
    name: p.name,
    description: p.description,
    exchange: p.exchange,
    sector: p.sector,
    industry: p.industry,
    website: p.website,
  };

  // General metrics
  const latestRevenue = p.revenue2021 * Math.pow(1 + p.revenueGrowth, 4);
  const ebitda = latestRevenue * (p.operatingMargin + 0.05);
  const eps = (latestRevenue * p.netMargin) / p.sharesOut;
  const general = {
    marketCap: jitter(p.marketCap, 0.05),
    ebitda: jitter(ebitda, 0.08),
    peRatio: jitter(p.basePrice / Math.max(eps, 0.01), 0.05),
    pegRatio: jitter(p.basePrice / Math.max(eps, 0.01) / Math.max(p.revenueGrowth * 100, 1), 0.1),
    epsEstimateCurrentYear: jitter(eps, 0.1),
    epsEstimateNextYear: jitter(eps * (1 + p.revenueGrowth), 0.1),
    analystTargetPrice: jitter(p.basePrice * 1.12, 0.1),
    bookValue: jitter((p.totalAssets - p.totalLiabilities) / p.sharesOut, 0.05),
    dividendShare: jitter(p.basePrice * p.dividendYield, 0.05),
    dividendYield: jitter(p.dividendYield, 0.05),
    profitMargin: jitter(p.netMargin, 0.05),
  };

  // Valuation & TTM
  const valuation = {
    trailingPE: jitter(general.peRatio, 0.03),
    forwardPE: jitter(general.peRatio * 0.88, 0.05),
    priceToBookMRQ: jitter(p.basePrice / Math.max(general.bookValue, 0.01), 0.05),
    evToRevenue: jitter((p.marketCap + p.longTermDebt - p.cash) / latestRevenue, 0.05),
    evToEBITDA: jitter((p.marketCap + p.longTermDebt - p.cash) / ebitda, 0.05),
    operatingMarginTTM: jitter(p.operatingMargin, 0.05),
    returnOnAssetsTTM: jitter(p.netMargin * latestRevenue / p.totalAssets, 0.08),
    returnOnEquityTTM: jitter(p.netMargin * latestRevenue / (p.totalAssets - p.totalLiabilities), 0.08),
    revenueTTM: jitter(latestRevenue, 0.03),
    revenuePerShareTTM: jitter(latestRevenue / p.sharesOut, 0.03),
    grossProfitTTM: jitter(latestRevenue * p.grossMargin, 0.03),
    dilutedEpsTTM: jitter(eps, 0.05),
  };

  // Shares
  const shares = {
    sharesOutstanding: p.sharesOut,
    sharesFloat: jitter(p.sharesOut * 0.93, 0.02),
    insiderPercent: jitter(0.008, 0.4),
    institutionPercent: jitter(0.72, 0.1),
    shortInterest: jitter(p.sharesOut * 0.015, 0.3),
    shortRatio: jitter(1.8, 0.4),
    beta: p.beta,
    fiftyTwoWeekHigh: jitter(p.basePrice * 1.15, 0.05),
    fiftyTwoWeekLow: jitter(p.basePrice * 0.72, 0.05),
  };

  // Splits & Dividends
  const splitsDividends = {
    forwardDividendRate: jitter(p.basePrice * p.dividendYield, 0.05),
    forwardDividendYield: jitter(p.dividendYield, 0.05),
    payoutRatio: p.dividendYield > 0 ? jitter(0.22, 0.3) : 0,
    dividendDate: p.dividendYield > 0 ? "2026-02-15" : "N/A",
    exDividendDate: p.dividendYield > 0 ? "2026-02-10" : "N/A",
    lastSplitFactor: p.dividendYield > 0 || rand() > 0.5 ? "4:1" : "N/A",
    lastSplitDate: rand() > 0.5 ? "2020-08-31" : "N/A",
  };

  // Generate 5 years of financial statements (2021-2025)
  const years = [2021, 2022, 2023, 2024, 2025];

  const balanceSheetAnnual = years.map((year, i) => {
    const growthFactor = Math.pow(1 + p.revenueGrowth * 0.5, i);
    const assetGrowth = Math.pow(1 + p.revenueGrowth * 0.3, i);
    return {
      year,
      cash: jitter(p.cash * assetGrowth, 0.15),
      netReceivables: jitter(p.revenue2021 * 0.12 * growthFactor, 0.1),
      inventory: jitter(p.revenue2021 * 0.04 * growthFactor, 0.15),
      totalCurrentAssets: jitter(p.cash * assetGrowth + p.revenue2021 * 0.18 * growthFactor, 0.1),
      totalAssets: jitter(p.totalAssets * assetGrowth, 0.08),
      totalCurrentLiabilities: jitter(p.totalLiabilities * 0.35 * assetGrowth, 0.1),
      totalLiabilities: jitter(p.totalLiabilities * assetGrowth * 0.98, 0.08),
      shareholderEquity: jitter((p.totalAssets - p.totalLiabilities) * assetGrowth * 1.05, 0.08),
      longTermDebt: jitter(p.longTermDebt * (1 - 0.02 * i), 0.1),
      retainedEarnings: jitter((p.totalAssets - p.totalLiabilities) * 0.6 * assetGrowth, 0.1),
    };
  });

  const incomeStatementAnnual = years.map((year, i) => {
    const rev = p.revenue2021 * Math.pow(1 + p.revenueGrowth, i);
    return {
      year,
      totalRevenue: jitter(rev, 0.03),
      costOfRevenue: jitter(rev * (1 - p.grossMargin), 0.04),
      grossProfit: jitter(rev * p.grossMargin, 0.04),
      operatingExpense: jitter(rev * (p.grossMargin - p.operatingMargin), 0.05),
      operatingIncome: jitter(rev * p.operatingMargin, 0.05),
      netIncome: jitter(rev * p.netMargin, 0.06),
      ebit: jitter(rev * (p.operatingMargin + 0.02), 0.05),
    };
  });

  const cashFlowAnnual = years.map((year, i) => {
    const rev = p.revenue2021 * Math.pow(1 + p.revenueGrowth, i);
    const ni = rev * p.netMargin;
    return {
      year,
      netIncome: jitter(ni, 0.06),
      depreciation: jitter(p.totalAssets * 0.03, 0.1),
      capitalExpenditures: jitter(-rev * 0.05, 0.15),
      operatingCashFlow: jitter(ni * 1.3, 0.08),
      investingCashFlow: jitter(-rev * 0.08, 0.15),
      financingCashFlow: jitter(-ni * 0.4, 0.2),
    };
  });

  return {
    overview,
    general,
    valuation,
    shares,
    splitsDividends,
    balanceSheet: { annual: balanceSheetAnnual },
    cashFlow: { annual: cashFlowAnnual },
    incomeStatement: { annual: incomeStatementAnnual },
    institutional: generateInstitutionalData(symbol, p),
  };
}

const INSTITUTION_NAMES = [
  "Vanguard Group Inc", "BlackRock Inc", "State Street Corp",
  "Fidelity Management & Research", "Berkshire Hathaway Inc", "Morgan Stanley",
  "JPMorgan Chase & Co", "Goldman Sachs Group Inc", "Bank of America Corp",
  "Geode Capital Management", "Charles Schwab Investment Mgmt", "Northern Trust Corp",
  "T. Rowe Price Associates", "Invesco Ltd", "Wellington Management Group",
  "Capital Research Global Investors", "Citadel Advisors LLC", "Renaissance Technologies LLC",
  "Two Sigma Investments LP", "Bridgewater Associates LP", "DE Shaw & Co LP",
  "ARK Investment Management LLC", "Parametric Portfolio Associates", "AQR Capital Management",
  "Point72 Asset Management", "Millennium Management LLC", "Tiger Global Management",
  "Coatue Management LLC", "Dragoneer Investment Group", "Baillie Gifford & Co",
  "Capital Group Companies", "Norges Bank Investment Mgmt", "GIC Private Ltd",
  "Canada Pension Plan Inv Board", "Dimensional Fund Advisors", "Legal & General Group PLC",
  "UBS Group AG", "BNP Paribas Asset Mgmt", "Allianz Global Investors", "PIMCO LLC",
];

function generateInstitutionalData(
  symbol: string,
  profile: { sharesOut: number; marketCap: number },
) {
  const rand = seededRandom(hashSymbol(symbol + "inst"));
  const priceEstimate = profile.marketCap / profile.sharesOut;

  const numHolders = 30 + Math.floor(rand() * 11);
  const shuffled = [...INSTITUTION_NAMES].sort(() => rand() - 0.5).slice(0, numHolders);

  const quarters: {
    year: number; quarter: number;
    holders: { name: string; shares: number; value: number; pctOfPortfolio: number; prevShares: number }[];
    totalShares: number; totalValue: number; totalHolders: number;
  }[] = [];
  const prevMap = new Map<string, number>();

  for (let q = 0; q < 8; q++) {
    const year = 2024 + Math.floor(q / 4);
    const quarter = (q % 4) + 1;

    const holders = shuffled.map((name, i) => {
      let baseSharePct: number;
      if (i < 3) baseSharePct = 0.05 + rand() * 0.04;
      else if (i < 10) baseSharePct = 0.005 + rand() * 0.025;
      else baseSharePct = 0.0001 + rand() * 0.005;

      const baseShares = Math.round(profile.sharesOut * baseSharePct);
      const drift = q > 0 ? 1 + (rand() - 0.5) * 0.15 : 1;
      const shares = Math.round(baseShares * drift);
      const prevShares = prevMap.get(name) ?? Math.round(shares * (0.85 + rand() * 0.3));
      const value = shares * priceEstimate;
      const pctOfPortfolio = 0.1 + rand() * 8;

      return { name, shares, value, pctOfPortfolio, prevShares };
    });

    holders.sort((a, b) => b.shares - a.shares);

    for (const h of holders) {
      prevMap.set(h.name, h.shares);
    }

    quarters.push({
      year,
      quarter,
      holders,
      totalShares: holders.reduce((s, h) => s + h.shares, 0),
      totalValue: holders.reduce((s, h) => s + h.value, 0),
      totalHolders: holders.length,
    });
  }

  return { quarters };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`market:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "Symbol parameter required" }, { status: 400 });
  }

  try {
    const data = generateFundamentals(symbol);
    const response = NextResponse.json({
      ...data,
      isMockData: true,
      timestamp: Date.now(),
    });
    response.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    return response;
  } catch (err) {
    console.error("[market/fundamentals]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to generate fundamentals data" }, { status: 500 });
  }
}
