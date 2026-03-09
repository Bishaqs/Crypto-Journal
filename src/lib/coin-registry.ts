/**
 * Unified crypto coin registry — single source of truth for all app pages.
 * Add new coins here and they'll appear across seasonality, backtester,
 * simulator, heatmaps, and API routes automatically.
 */

// ── Display name overrides for virtual/derived metrics ────────────
export const VIRTUAL_DISPLAY_NAMES: Record<string, string> = {
  __virtual__btc_dominance: "Bitcoin Dominance (Est.)",
};

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
  DYDX: "dydx-chain",
  GMX: "gmx",
  JUP: "jupiter-exchange-solana",
  RAY: "raydium",
  "1INCH": "1inch",
  BAL: "balancer",
  // Meme
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  PEPE: "pepe",
  BONK: "bonk",
  FLOKI: "floki",
  WIF: "dogwifcoin",
  BRETT: "brett",
  TURBO: "turbo",
  POPCAT: "popcat",
  MOG: "mog-coin",
  NEIRO: "neiro-ethereum",
  // Layer 2
  ARB: "arbitrum",
  OP: "optimism",
  MATIC: "matic-network",
  IMX: "immutable-x",
  STRK: "starknet",
  MANTA: "manta-network",
  ZK: "zksync",
  BLAST: "blast",
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
  KAS: "kaspa",
  MINA: "mina-protocol",
  NEO: "neo",
  EOS: "eos",
  IOTA: "iota",
  FLOW: "flow",
  CELO: "celo",
  // Infrastructure
  FIL: "filecoin",
  RENDER: "render-token",
  GRT: "the-graph",
  AR: "arweave",
  THETA: "theta-token",
  // AI
  FET: "fetch-ai",
  TAO: "bittensor",
  AGIX: "singularitynet",
  OCEAN: "ocean-protocol",
  AKT: "akash-network",
  // RWA
  ONDO: "ondo-finance",
  MNT: "mantle",
  PYTH: "pyth-network",
  // Privacy
  ZEC: "zcash",
  DASH: "dash",
  // DePIN
  HNT: "helium",
  IOTX: "iotex",
  // Gaming
  AXS: "axie-infinity",
  SAND: "the-sandbox",
  MANA: "decentraland",
  GALA: "gala",
  RONIN: "ronin",
  PIXEL: "pixels",
  MAGIC: "magic",
  PRIME: "echelon-prime",
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
  DeFi: ["UNI", "AAVE", "LINK", "MKR", "SNX", "CRV", "PENDLE", "LDO", "DYDX", "GMX", "JUP", "1INCH"],
  Meme: ["DOGE", "SHIB", "PEPE", "BONK", "FLOKI", "WIF", "BRETT", "TURBO", "POPCAT", "MOG"],
  "Layer 2": ["ARB", "OP", "MATIC", "IMX", "STRK", "MANTA", "ZK", "BLAST"],
  "Alt L1": ["ADA", "DOT", "AVAX", "APT", "SUI", "NEAR", "ATOM", "TON", "SEI", "INJ", "TIA", "KAS", "MINA", "FLOW"],
  AI: ["FET", "TAO", "RENDER", "AGIX", "OCEAN", "AKT"],
  RWA: ["ONDO", "MNT", "PYTH"],
  Infra: ["FIL", "GRT", "AR", "THETA"],
  DePIN: ["HNT", "IOTX"],
  Gaming: ["AXS", "SAND", "MANA", "GALA", "RONIN", "PIXEL", "MAGIC", "PRIME"],
  Other: ["LTC", "XLM", "ALGO", "HBAR", "TRX", "ICP", "STX", "ENS", "RUNE", "ZEC", "DASH"],
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
  { value: "DYDXUSDT", label: "DYDX / USDT" },
  { value: "GMXUSDT", label: "GMX / USDT" },
  { value: "JUPUSDT", label: "JUP / USDT" },
  { value: "1INCHUSDT", label: "1INCH / USDT" },
  { value: "BALUSDT", label: "BAL / USDT" },
  // Meme
  { value: "DOGEUSDT", label: "DOGE / USDT" },
  { value: "SHIBUSDT", label: "SHIB / USDT" },
  { value: "PEPEUSDT", label: "PEPE / USDT" },
  { value: "BONKUSDT", label: "BONK / USDT" },
  { value: "FLOKIUSDT", label: "FLOKI / USDT" },
  { value: "WIFUSDT", label: "WIF / USDT" },
  { value: "TURBOUSDT", label: "TURBO / USDT" },
  // Layer 2
  { value: "ARBUSDT", label: "ARB / USDT" },
  { value: "OPUSDT", label: "OP / USDT" },
  { value: "MATICUSDT", label: "MATIC / USDT" },
  { value: "IMXUSDT", label: "IMX / USDT" },
  { value: "STRKUSDT", label: "STRK / USDT" },
  { value: "MANTAUSDT", label: "MANTA / USDT" },
  { value: "ZKUSDT", label: "ZK / USDT" },
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
  { value: "KASUSDT", label: "KAS / USDT" },
  { value: "MINAUSDT", label: "MINA / USDT" },
  { value: "FLOWUSDT", label: "FLOW / USDT" },
  { value: "EOSUSDT", label: "EOS / USDT" },
  { value: "IOTAUSDT", label: "IOTA / USDT" },
  // AI
  { value: "FETUSDT", label: "FET / USDT" },
  { value: "TAOUSDT", label: "TAO / USDT" },
  { value: "RENDERUSDT", label: "RENDER / USDT" },
  { value: "AKTUSDT", label: "AKT / USDT" },
  // RWA
  { value: "ONDOUSDT", label: "ONDO / USDT" },
  { value: "MNTUSDT", label: "MNT / USDT" },
  { value: "PYTHUSDT", label: "PYTH / USDT" },
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
  { value: "RONINUSDT", label: "RONIN / USDT" },
  { value: "PIXELUSDT", label: "PIXEL / USDT" },
  { value: "MAGICUSDT", label: "MAGIC / USDT" },
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
  { value: "ZECUSDT", label: "ZEC / USDT" },
  { value: "DASHUSDT", label: "DASH / USDT" },
  { value: "HNTUSDT", label: "HNT / USDT" },
] as const;

export type SupportedSymbol = (typeof SUPPORTED_BINANCE_SYMBOLS)[number]["value"];

// Helper: resolve ticker to CoinGecko ID (falls back to lowercase)
export function resolveCoinGeckoId(ticker: string): string {
  return COIN_TO_COINGECKO_ID[ticker.toUpperCase()] ?? ticker.toLowerCase();
}

// Build a Set for O(1) lookup of Binance symbols
const BINANCE_SYMBOL_SET: Set<string> = new Set(SUPPORTED_BINANCE_SYMBOLS.map((s) => s.value));

// Helper: resolve ticker to Binance USDT pair, or null if not listed
export function resolveBinanceSymbol(ticker: string): string | null {
  const upper = ticker.toUpperCase();
  const candidate = `${upper}USDT`;
  return BINANCE_SYMBOL_SET.has(candidate) ? candidate : null;
}
