import { parseCSV } from "./csv-parser";

export type ImportRow = {
  rowNumber: number;
  data: Record<string, string>;
  parsed: Record<string, unknown> | null;
  errors: string[];
};

export type ImportResult = {
  totalRows: number;
  validRows: ImportRow[];
  invalidRows: ImportRow[];
  headers: string[];
  mappedHeaders: Record<string, string>;
};

// Maps common exchange CSV headers to our field names
const HEADER_ALIASES: Record<string, string> = {
  // Generic
  ticker: "symbol",
  pair: "symbol",
  market: "symbol",
  asset: "symbol",
  coin: "symbol",
  currency: "symbol",
  side: "position",
  direction: "position",
  type: "position",
  action: "position",
  entry: "entry_price",
  buy_price: "entry_price",
  open_price: "entry_price",
  price: "entry_price",
  exit: "exit_price",
  sell_price: "exit_price",
  close_price: "exit_price",
  size: "quantity",
  amount: "quantity",
  volume: "quantity",
  qty: "quantity",
  fee: "fees",
  commission: "fees",
  trading_fee: "fees",
  date: "open_timestamp",
  time: "open_timestamp",
  open_date: "open_timestamp",
  created_at: "open_timestamp",
  close_date: "close_timestamp",
  closed_at: "close_timestamp",
  tag: "tags",
  note: "notes",
  comment: "notes",
  description: "notes",
  memo: "notes",
  profit: "pnl",
  profit_loss: "pnl",
  "p&l": "pnl",
  net_profit: "pnl",
  feeling: "emotion",
  mood: "emotion",
  setup: "setup_type",
  strategy: "setup_type",
  process: "process_score",
  source: "trade_source",
  network: "chain",
  blockchain: "chain",
  protocol: "dex_protocol",
  transaction: "tx_hash",
  tx_id: "tx_hash",
  transaction_hash: "tx_hash",
  wallet: "wallet_address",
  gas: "gas_fee",

  // Binance
  realized_profit: "pnl",
  realized_pnl: "pnl",
  order_price: "entry_price",
  executed_quant: "quantity",

  // Bybit
  closed_pnl: "pnl",
  avg_entry_price: "entry_price",
  avg_exit_price: "exit_price",
  order_qty: "quantity",
  exec_fee: "fees",

  // OKX
  avg_px: "entry_price",
  fill_px: "exit_price",
  fill_sz: "quantity",
  inst_id: "symbol",

  // Coinbase
  total: "quantity",
  subtotal: "pnl",
  price_currency: "symbol",
  quantity_unit: "symbol",

  // Kraken
  vol: "quantity",
  cost: "entry_price",
  margin: "fees",
  ordertxid: "tx_hash",

  // KuCoin
  deal_price: "entry_price",
  deal_funds: "quantity",
  deal_size: "quantity",

  // Gate.io
  filled_price: "entry_price",
  filled_amount: "quantity",
  filled_total: "pnl",

  // Bitget / MEXC / HTX
  trade_price: "entry_price",
  filled_qty: "quantity",
  trade_fee: "fees",

  // Crypto.com / Gemini
  native_amount: "quantity",
  native_currency: "symbol",
  to_currency: "symbol",

  // Stock brokers (Robinhood, Schwab, IBKR, Webull, Fidelity, E*Trade)
  instrument: "symbol",
  average_price: "entry_price",
  shares: "quantity",
  net_amount: "pnl",
  trade_date: "open_timestamp",
  settle_date: "close_timestamp",
  execution_price: "entry_price",
  quantity_filled: "quantity",
};

const REQUIRED_FIELDS = ["symbol", "position", "entry_price", "quantity"];

function resolveHeader(raw: string): string {
  const normalized = raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return HEADER_ALIASES[normalized] ?? normalized;
}

function parseNumeric(val: string): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parsePosition(val: string): string | null {
  const lower = val.toLowerCase().trim();
  if (["long", "buy", "b", "bought", "bot"].includes(lower)) return "long";
  if (["short", "sell", "s", "sold", "sld"].includes(lower)) return "short";
  return null;
}

const DEX_INDICATOR_FIELDS = ["tx_hash", "gas_fee", "chain", "dex_protocol", "wallet_address"];

export function validateImportData(csvText: string): ImportResult {
  const { headers, rows } = parseCSV(csvText);
  const mappedHeaders: Record<string, string> = {};
  headers.forEach((h) => {
    mappedHeaders[h] = resolveHeader(h);
  });

  const validRows: ImportRow[] = [];
  const invalidRows: ImportRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const errors: string[] = [];

    // Re-key the data using mapped headers
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(raw)) {
      mapped[resolveHeader(key)] = val;
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!mapped[field]) errors.push(`Missing ${field}`);
    }

    // Validate position
    if (mapped.position && !parsePosition(mapped.position)) {
      errors.push(`Invalid position: "${mapped.position}" (use long/short)`);
    }

    // Validate numerics
    if (mapped.entry_price && parseNumeric(mapped.entry_price) === null) {
      errors.push(`Invalid entry_price: "${mapped.entry_price}"`);
    }
    if (mapped.quantity && parseNumeric(mapped.quantity) === null) {
      errors.push(`Invalid quantity: "${mapped.quantity}"`);
    }

    const parsed = errors.length === 0 ? buildPayload(mapped) : null;
    const row: ImportRow = { rowNumber: i + 1, data: mapped, parsed, errors };

    if (errors.length === 0) {
      validRows.push(row);
    } else {
      invalidRows.push(row);
    }
  }

  return { totalRows: rows.length, validRows, invalidRows, headers, mappedHeaders };
}

function detectDexSource(mapped: Record<string, string>): boolean {
  return DEX_INDICATOR_FIELDS.some((f) => !!mapped[f]);
}

function buildPayload(mapped: Record<string, string>): Record<string, unknown> {
  const isDex = detectDexSource(mapped);
  return {
    symbol: mapped.symbol?.toUpperCase(),
    position: parsePosition(mapped.position) ?? "long",
    entry_price: parseNumeric(mapped.entry_price) ?? 0,
    exit_price: parseNumeric(mapped.exit_price),
    quantity: parseNumeric(mapped.quantity) ?? 0,
    fees: parseNumeric(mapped.fees) ?? 0,
    open_timestamp: mapped.open_timestamp || new Date().toISOString(),
    close_timestamp: mapped.close_timestamp || null,
    pnl: parseNumeric(mapped.pnl),
    tags: mapped.tags ? mapped.tags.split(";").map((t) => t.trim()).filter(Boolean) : [],
    notes: mapped.notes || null,
    emotion: mapped.emotion || null,
    confidence: parseNumeric(mapped.confidence),
    setup_type: mapped.setup_type || null,
    process_score: parseNumeric(mapped.process_score),
    trade_source: mapped.trade_source || (isDex ? "dex" : null),
    chain: mapped.chain || null,
    dex_protocol: mapped.dex_protocol || null,
    tx_hash: mapped.tx_hash || null,
    wallet_address: mapped.wallet_address || null,
    gas_fee: parseNumeric(mapped.gas_fee),
    gas_fee_native: parseNumeric(mapped.gas_fee_native),
  };
}
