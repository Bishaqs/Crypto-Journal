/**
 * Unified crypto coin registry — single source of truth for all app pages.
 * Add new coins here and they'll appear across seasonality, backtester,
 * simulator, heatmaps, and API routes automatically.
 */

// ── Ticker → CoinGecko ID mapping ──────────────────────────────────
export const COIN_TO_COINGECKO_ID: Record<string, string> = {
  // Major
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  // DeFi
  UNI: "uniswap",
  AAVE: "aave",
  LINK: "chainlink",
  MKR: "maker",
  SNX: "synthetix-network-token",
  CRV: "curve-dao-token",
  COMP: "compound-governance-token",
  SUSHI: "sushi",
  PENDLE: "pendle",
  // Meme
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  PEPE: "pepe",
  BONK: "bonk",
  FLOKI: "floki",
  WIF: "dogwifcoin",
  // Layer 2
  ARB: "arbitrum",
  OP: "optimism",
  MATIC: "matic-network",
  IMX: "immutable-x",
  STRK: "starknet",
  // Alt L1
  ADA: "cardano",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  APT: "aptos",
  SUI: "sui",
  NEAR: "near",
  ATOM: "cosmos",
  FTM: "fantom",
  SEI: "sei-network",
  INJ: "injective-protocol",
  TIA: "celestia",
  TON: "the-open-network",
  // Infrastructure
  FIL: "filecoin",
  RENDER: "render-token",
  GRT: "the-graph",
  AR: "arweave",
  THETA: "theta-token",
  // AI
  FET: "fetch-ai",
  TAO: "bittensor",
  RNDR: "render-token",
  // Gaming
  AXS: "axie-infinity",
  SAND: "the-sandbox",
  MANA: "decentraland",
  GALA: "gala",
  // Exchange
  CRO: "crypto-com-chain",
  OKB: "okb",
  // Other
  LTC: "litecoin",
  XLM: "stellar",
  ALGO: "algorand",
  VET: "vechain",
  HBAR: "hedera-hashgraph",
  XMR: "monero",
  ETC: "ethereum-classic",
  TRX: "tron",
  EGLD: "elrond-erd-2",
  ICP: "internet-computer",
  RUNE: "thorchain",
  ENS: "ethereum-name-service",
  LDO: "lido-dao",
  RPL: "rocket-pool",
  STX: "blockstack",
  KAVA: "kava",
  ROSE: "oasis-network",
  ZIL: "zilliqa",
  ONE: "harmony",
};

// ── UI symbol groups (for button grids) ────────────────────────────
export const CRYPTO_SYMBOL_GROUPS: Record<string, string[]> = {
  Major: ["BTC", "ETH", "SOL", "BNB", "XRP"],
  DeFi: ["UNI", "AAVE", "LINK", "MKR", "SNX", "CRV", "PENDLE", "LDO"],
  Meme: ["DOGE", "SHIB", "PEPE", "BONK", "FLOKI", "WIF"],
  "Layer 2": ["ARB", "OP", "MATIC", "IMX", "STRK"],
  "Alt L1": ["ADA", "DOT", "AVAX", "APT", "SUI", "NEAR", "ATOM", "TON", "SEI", "INJ", "TIA"],
  AI: ["FET", "TAO", "RENDER"],
  Infra: ["FIL", "GRT", "AR", "THETA"],
  Gaming: ["AXS", "SAND", "MANA", "GALA", "IMX"],
  Other: ["LTC", "XLM", "ALGO", "HBAR", "TRX", "ICP", "STX", "ENS", "RUNE"],
};

// ── Binance-format symbols for simulator ───────────────────────────
export const SUPPORTED_BINANCE_SYMBOLS = [
  // Major
  { value: "BTCUSDT", label: "BTC / USDT" },
  { value: "ETHUSDT", label: "ETH / USDT" },
  { value: "SOLUSDT", label: "SOL / USDT" },
  { value: "BNBUSDT", label: "BNB / USDT" },
  { value: "XRPUSDT", label: "XRP / USDT" },
  // DeFi
  { value: "LINKUSDT", label: "LINK / USDT" },
  { value: "UNIUSDT", label: "UNI / USDT" },
  { value: "AAVEUSDT", label: "AAVE / USDT" },
  { value: "MKRUSDT", label: "MKR / USDT" },
  { value: "SNXUSDT", label: "SNX / USDT" },
  { value: "CRVUSDT", label: "CRV / USDT" },
  { value: "PENDLEUSDT", label: "PENDLE / USDT" },
  { value: "LDOUSDT", label: "LDO / USDT" },
  // Meme
  { value: "DOGEUSDT", label: "DOGE / USDT" },
  { value: "SHIBUSDT", label: "SHIB / USDT" },
  { value: "PEPEUSDT", label: "PEPE / USDT" },
  { value: "BONKUSDT", label: "BONK / USDT" },
  { value: "FLOKIUSDT", label: "FLOKI / USDT" },
  { value: "WIFUSDT", label: "WIF / USDT" },
  // Layer 2
  { value: "ARBUSDT", label: "ARB / USDT" },
  { value: "OPUSDT", label: "OP / USDT" },
  { value: "MATICUSDT", label: "MATIC / USDT" },
  { value: "IMXUSDT", label: "IMX / USDT" },
  { value: "STRKUSDT", label: "STRK / USDT" },
  // Alt L1
  { value: "ADAUSDT", label: "ADA / USDT" },
  { value: "DOTUSDT", label: "DOT / USDT" },
  { value: "AVAXUSDT", label: "AVAX / USDT" },
  { value: "APTUSDT", label: "APT / USDT" },
  { value: "SUIUSDT", label: "SUI / USDT" },
  { value: "NEARUSDT", label: "NEAR / USDT" },
  { value: "ATOMUSDT", label: "ATOM / USDT" },
  { value: "TONUSDT", label: "TON / USDT" },
  { value: "SEIUSDT", label: "SEI / USDT" },
  { value: "INJUSDT", label: "INJ / USDT" },
  { value: "TIAUSDT", label: "TIA / USDT" },
  // AI
  { value: "FETUSDT", label: "FET / USDT" },
  { value: "TAOUSDT", label: "TAO / USDT" },
  { value: "RENDERUSDT", label: "RENDER / USDT" },
  // Infra
  { value: "FILUSDT", label: "FIL / USDT" },
  { value: "GRTUSDT", label: "GRT / USDT" },
  { value: "ARUSDT", label: "AR / USDT" },
  { value: "THETAUSDT", label: "THETA / USDT" },
  // Gaming
  { value: "AXSUSDT", label: "AXS / USDT" },
  { value: "SANDUSDT", label: "SAND / USDT" },
  { value: "MANAUSDT", label: "MANA / USDT" },
  { value: "GALAUSDT", label: "GALA / USDT" },
  // Other
  { value: "LTCUSDT", label: "LTC / USDT" },
  { value: "XLMUSDT", label: "XLM / USDT" },
  { value: "ALGOUSDT", label: "ALGO / USDT" },
  { value: "HBARUSDT", label: "HBAR / USDT" },
  { value: "TRXUSDT", label: "TRX / USDT" },
  { value: "ICPUSDT", label: "ICP / USDT" },
  { value: "STXUSDT", label: "STX / USDT" },
  { value: "ENSUSDT", label: "ENS / USDT" },
  { value: "RUNEUSDT", label: "RUNE / USDT" },
  { value: "FTMUSDT", label: "FTM / USDT" },
] as const;

export type SupportedSymbol = (typeof SUPPORTED_BINANCE_SYMBOLS)[number]["value"];

// Helper: resolve ticker to CoinGecko ID (falls back to lowercase)
export function resolveCoinGeckoId(ticker: string): string {
  return COIN_TO_COINGECKO_ID[ticker.toUpperCase()] ?? ticker.toLowerCase();
}
