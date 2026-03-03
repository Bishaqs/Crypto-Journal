// === Company Overview ===
export interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  exchange: string;
  sector: string;
  industry: string;
  website: string;
}

// === General Metrics ===
export interface GeneralMetrics {
  marketCap: number;
  ebitda: number;
  peRatio: number;
  pegRatio: number;
  epsEstimateCurrentYear: number;
  epsEstimateNextYear: number;
  analystTargetPrice: number;
  bookValue: number;
  dividendShare: number;
  dividendYield: number;
  profitMargin: number;
}

// === Valuation & TTM ===
export interface ValuationTTM {
  trailingPE: number;
  forwardPE: number;
  priceToBookMRQ: number;
  evToRevenue: number;
  evToEBITDA: number;
  operatingMarginTTM: number;
  returnOnAssetsTTM: number;
  returnOnEquityTTM: number;
  revenueTTM: number;
  revenuePerShareTTM: number;
  grossProfitTTM: number;
  dilutedEpsTTM: number;
}

// === Shares Data ===
export interface SharesData {
  sharesOutstanding: number;
  sharesFloat: number;
  insiderPercent: number;
  institutionPercent: number;
  shortInterest: number;
  shortRatio: number;
  beta: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

// === Splits & Dividends ===
export interface SplitsDividends {
  forwardDividendRate: number;
  forwardDividendYield: number;
  payoutRatio: number;
  dividendDate: string;
  exDividendDate: string;
  lastSplitFactor: string;
  lastSplitDate: string;
}

// === Annual Financial Row ===
export interface AnnualFinancialRow {
  year: number;
  [key: string]: number | string;
}

// === Financial Statement Data ===
export interface BalanceSheetData {
  annual: AnnualFinancialRow[];
}

export interface CashFlowData {
  annual: AnnualFinancialRow[];
}

export interface IncomeStatementData {
  annual: AnnualFinancialRow[];
}

// === Institutional Ownership ===
export interface InstitutionalHolder {
  name: string;
  shares: number;
  value: number;
  pctOfPortfolio: number;
  prevShares: number;
}

export interface InstitutionalQuarter {
  year: number;
  quarter: number;
  holders: InstitutionalHolder[];
  totalShares: number;
  totalValue: number;
  totalHolders: number;
}

export interface InstitutionalData {
  quarters: InstitutionalQuarter[];
}

// === Full Fundamentals Response ===
export interface FundamentalsData {
  overview: CompanyOverview;
  general: GeneralMetrics;
  valuation: ValuationTTM;
  shares: SharesData;
  splitsDividends: SplitsDividends;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
  incomeStatement: IncomeStatementData;
  institutional: InstitutionalData;
}

// === Tab System ===
export type FundamentalsTab = "overview" | "balance-sheet" | "cash-flow" | "income-statement" | "institutional";

export const TAB_OPTIONS: { value: FundamentalsTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "balance-sheet", label: "Balance Sheet" },
  { value: "cash-flow", label: "Cash Flow" },
  { value: "income-statement", label: "Income Statement" },
  { value: "institutional", label: "Institutional" },
];

// === Symbol Groups ===
export const SYMBOL_GROUPS: Record<string, string[]> = {
  "Mega Cap": ["AAPL", "MSFT", "AMZN", "GOOGL", "META"],
  Momentum: ["TSLA", "NVDA", "AMD", "PLTR", "COIN"],
  Semis: ["AVGO", "ARM", "SMCI", "MU", "INTC"],
  Finance: ["JPM", "GS", "V", "MA", "BAC"],
};

// === Metric Definitions for Grid Display ===
export interface MetricDef {
  key: string;
  label: string;
  format: "currency" | "currencyLarge" | "percent" | "number" | "ratio" | "date" | "text";
}

export const GENERAL_METRICS: MetricDef[] = [
  { key: "marketCap", label: "Market Cap", format: "currencyLarge" },
  { key: "ebitda", label: "EBITDA", format: "currencyLarge" },
  { key: "peRatio", label: "P/E Ratio", format: "ratio" },
  { key: "pegRatio", label: "PEG Ratio", format: "ratio" },
  { key: "epsEstimateCurrentYear", label: "EPS Est. (CY)", format: "currency" },
  { key: "epsEstimateNextYear", label: "EPS Est. (NY)", format: "currency" },
  { key: "analystTargetPrice", label: "Target Price", format: "currency" },
  { key: "bookValue", label: "Book Value", format: "currency" },
  { key: "dividendShare", label: "Dividend/Share", format: "currency" },
  { key: "dividendYield", label: "Dividend Yield", format: "percent" },
  { key: "profitMargin", label: "Profit Margin", format: "percent" },
];

export const VALUATION_METRICS: MetricDef[] = [
  { key: "trailingPE", label: "Trailing PE", format: "ratio" },
  { key: "forwardPE", label: "Forward PE", format: "ratio" },
  { key: "priceToBookMRQ", label: "Price/Book MRQ", format: "ratio" },
  { key: "evToRevenue", label: "EV/Revenue", format: "ratio" },
  { key: "evToEBITDA", label: "EV/EBITDA", format: "ratio" },
  { key: "operatingMarginTTM", label: "Operating Margin TTM", format: "percent" },
  { key: "returnOnAssetsTTM", label: "ROA TTM", format: "percent" },
  { key: "returnOnEquityTTM", label: "ROE TTM", format: "percent" },
  { key: "revenueTTM", label: "Revenue TTM", format: "currencyLarge" },
  { key: "revenuePerShareTTM", label: "Revenue/Share TTM", format: "currency" },
  { key: "grossProfitTTM", label: "Gross Profit TTM", format: "currencyLarge" },
  { key: "dilutedEpsTTM", label: "Diluted EPS TTM", format: "currency" },
];

export const SHARES_METRICS: MetricDef[] = [
  { key: "sharesOutstanding", label: "Shares Outstanding", format: "currencyLarge" },
  { key: "sharesFloat", label: "Float", format: "currencyLarge" },
  { key: "insiderPercent", label: "Insiders %", format: "percent" },
  { key: "institutionPercent", label: "Institutions %", format: "percent" },
  { key: "shortInterest", label: "Short Interest", format: "currencyLarge" },
  { key: "shortRatio", label: "Short Ratio", format: "ratio" },
  { key: "beta", label: "Beta", format: "ratio" },
  { key: "fiftyTwoWeekHigh", label: "52-Week High", format: "currency" },
  { key: "fiftyTwoWeekLow", label: "52-Week Low", format: "currency" },
];

export const SPLITS_METRICS: MetricDef[] = [
  { key: "forwardDividendRate", label: "Forward Dividend Rate", format: "currency" },
  { key: "forwardDividendYield", label: "Forward Dividend Yield", format: "percent" },
  { key: "payoutRatio", label: "Payout Ratio", format: "percent" },
  { key: "dividendDate", label: "Dividend Date", format: "date" },
  { key: "exDividendDate", label: "Ex-Dividend Date", format: "date" },
  { key: "lastSplitFactor", label: "Last Split Factor", format: "text" },
  { key: "lastSplitDate", label: "Last Split Date", format: "date" },
];

// === Balance Sheet Row Definitions ===
export const BALANCE_SHEET_ROWS = [
  { key: "cash", label: "Cash & Equivalents" },
  { key: "netReceivables", label: "Net Receivables" },
  { key: "inventory", label: "Inventory" },
  { key: "totalCurrentAssets", label: "Total Current Assets" },
  { key: "totalAssets", label: "Total Assets" },
  { key: "totalCurrentLiabilities", label: "Total Current Liabilities" },
  { key: "totalLiabilities", label: "Total Liabilities" },
  { key: "shareholderEquity", label: "Shareholder Equity" },
  { key: "longTermDebt", label: "Long-Term Debt" },
  { key: "retainedEarnings", label: "Retained Earnings" },
];

// === Cash Flow Row Definitions ===
export const CASH_FLOW_ROWS = [
  { key: "netIncome", label: "Net Income" },
  { key: "depreciation", label: "Depreciation" },
  { key: "capitalExpenditures", label: "Capital Expenditures" },
  { key: "operatingCashFlow", label: "Operating Cash Flow" },
  { key: "investingCashFlow", label: "Investing Cash Flow" },
  { key: "financingCashFlow", label: "Financing Cash Flow" },
];

// === Income Statement Row Definitions ===
export const INCOME_STATEMENT_ROWS = [
  { key: "totalRevenue", label: "Total Revenue" },
  { key: "costOfRevenue", label: "Cost of Revenue" },
  { key: "grossProfit", label: "Gross Profit" },
  { key: "operatingExpense", label: "Operating Expenses" },
  { key: "operatingIncome", label: "Operating Income" },
  { key: "netIncome", label: "Net Income" },
  { key: "ebit", label: "EBIT" },
];
