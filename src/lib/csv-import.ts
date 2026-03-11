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
  detectedFormat?: string;
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
  futures: "symbol",
  trade_price: "entry_price",
  filled_qty: "quantity",
  trade_fee: "fees",
  executed: "quantity",
  order_amount: "quantity",
  netprofits: "pnl",
  realized_p_l: "pnl",

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
  const normalized = raw.toLowerCase().trim().replace(/[\s\-\/]+/g, "_");
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
  // Exact matches
  if (["long", "buy", "b", "bought", "bot"].includes(lower)) return "long";
  if (["short", "sell", "s", "sold", "sld"].includes(lower)) return "short";
  // Compound values (e.g., Bitget "Buy/Long", "Sell/Short")
  if (lower.includes("long") || lower.includes("buy")) return "long";
  if (lower.includes("short") || lower.includes("sell")) return "short";
  return null;
}

const DEX_INDICATOR_FIELDS = ["tx_hash", "gas_fee", "chain", "dex_protocol", "wallet_address"];

// ── BitGet Futures Pre-Processing ──────────────────────────────────────────

function detectBitgetFutures(headers: string[], rows: Record<string, string>[]): boolean {
  // BitGet futures CSVs have "direction" + "futures" columns
  const hasDirection = headers.includes("direction");
  const hasFutures = headers.includes("futures");
  if (!hasDirection || !hasFutures) return false;

  // Verify Direction values contain BitGet-specific "Open/Close long/short" patterns
  const sample = rows.slice(0, 30).map((r) => (r["direction"] || "").toLowerCase());
  return sample.some(
    (d) => d.includes("open long") || d.includes("close long") || d.includes("open short") || d.includes("close short"),
  );
}

type BitgetOrder = {
  direction: string;
  symbol: string;
  avgPrice: number;
  quantity: number;
  realizedPnl: number;
  netProfits: number;
  date: string;
  status: string;
};

function preprocessBitgetFutures(rows: Record<string, string>[]): Record<string, string>[] {
  const QTY_EPSILON = 1e-10;

  // Parse all rows into structured orders
  const orders: BitgetOrder[] = rows.map((row) => ({
    direction: (row["direction"] || "").toLowerCase().trim(),
    symbol: (row["futures"] || "").toUpperCase().trim(),
    avgPrice: parseFloat((row["average price"] || "0").replace(/[$,\s]/g, "")) || 0,
    quantity: parseFloat((row["executed"] || "0").replace(/[$,\s]/g, "")) || 0,
    realizedPnl: parseFloat((row["realized p/l"] || "0").replace(/[$,\s]/g, "")) || 0,
    netProfits: parseFloat((row["netprofits"] || "0").replace(/[$,\s]/g, "")) || 0,
    date: row["date"] || "",
    status: (row["status"] || "").toLowerCase().trim(),
  }));

  // Filter: remove cancelled orders and orders with 0 executed quantity
  const active = orders.filter((o) => !o.status.includes("cancel") && o.quantity > QTY_EPSILON);

  // Sort chronologically (BitGet exports newest-first)
  active.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Separate opens and closes
  const opens = active.filter((o) => o.direction.startsWith("open"));
  const closes = active.filter((o) => o.direction.startsWith("close"));

  // Build open order pool: key = "BTCUSDT|long"
  type OpenTracker = { order: BitgetOrder; remainingQty: number };
  const openPool = new Map<string, OpenTracker[]>();

  for (const open of opens) {
    const polarity = open.direction.includes("long") ? "long" : "short";
    const key = `${open.symbol}|${polarity}`;
    if (!openPool.has(key)) openPool.set(key, []);
    openPool.get(key)!.push({ order: open, remainingQty: open.quantity });
  }

  // Match each close to opens (FIFO) and build trade rows
  const tradeRows: Record<string, string>[] = [];

  for (const close of closes) {
    const polarity = close.direction.includes("long") ? "long" : "short";
    const key = `${close.symbol}|${polarity}`;
    const pool = openPool.get(key) || [];

    // Find matching opens — a single close may consume from multiple opens
    let remainingCloseQty = close.quantity;
    const matchedOpens: { price: number; qty: number; date: string }[] = [];

    for (const tracker of pool) {
      if (remainingCloseQty <= QTY_EPSILON) break;
      if (tracker.remainingQty <= QTY_EPSILON) continue;

      const matched = Math.min(tracker.remainingQty, remainingCloseQty);
      matchedOpens.push({ price: tracker.order.avgPrice, qty: matched, date: tracker.order.date });
      tracker.remainingQty -= matched;
      if (Math.abs(tracker.remainingQty) < QTY_EPSILON) tracker.remainingQty = 0;
      remainingCloseQty -= matched;
      if (Math.abs(remainingCloseQty) < QTY_EPSILON) remainingCloseQty = 0;
    }

    // Calculate entry price (weighted average if matched across multiple opens)
    let entryPrice = "0";
    let openDate = close.date;
    const tags = ["bitget-futures"];

    if (matchedOpens.length > 0) {
      const totalQty = matchedOpens.reduce((s, m) => s + m.qty, 0);
      const weighted = matchedOpens.reduce((s, m) => s + m.price * m.qty, 0) / totalQty;
      entryPrice = String(weighted);
      openDate = matchedOpens[0].date;
    } else {
      tags.push("bitget-unmatched-close");
    }

    // Fee = gross P&L - net P&L
    const fees = Math.abs(close.realizedPnl - close.netProfits);

    tradeRows.push({
      symbol: close.symbol,
      position: polarity,
      entry_price: entryPrice,
      exit_price: String(close.avgPrice),
      quantity: String(close.quantity),
      pnl: String(close.netProfits),
      fees: String(fees),
      open_timestamp: openDate,
      close_timestamp: close.date,
      tags: tags.join(";"),
    });
  }

  return tradeRows;
}

// ── End BitGet Futures Pre-Processing ──────────────────────────────────────

export function validateImportData(csvText: string): ImportResult {
  const { headers, rows } = parseCSV(csvText);

  // Exchange-specific pre-processing: detect BitGet futures and transform orders → trades
  const isBitget = detectBitgetFutures(headers, rows);
  const processedRows = isBitget ? preprocessBitgetFutures(rows) : rows;
  const effectiveHeaders = isBitget && processedRows.length > 0 ? Object.keys(processedRows[0]) : headers;

  const mappedHeaders: Record<string, string> = {};
  effectiveHeaders.forEach((h) => {
    mappedHeaders[h] = resolveHeader(h);
  });

  const validRows: ImportRow[] = [];
  const invalidRows: ImportRow[] = [];

  for (let i = 0; i < processedRows.length; i++) {
    const raw = processedRows[i];
    const errors: string[] = [];

    // Re-key the data using mapped headers
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(raw)) {
      const field = resolveHeader(key);
      // Don't overwrite a non-empty value with an empty one
      if (!mapped[field] || val) {
        mapped[field] = val;
      }
    }

    // Validate required fields (entry_price/quantity default to 0 in buildPayload)
    for (const field of REQUIRED_FIELDS) {
      if (!mapped[field] && field !== "entry_price" && field !== "quantity") {
        errors.push(`Missing ${field}`);
      }
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

  return {
    totalRows: processedRows.length,
    validRows,
    invalidRows,
    headers: effectiveHeaders,
    mappedHeaders,
    detectedFormat: isBitget ? "bitget-futures" : undefined,
  };
}

function detectDexSource(mapped: Record<string, string>): boolean {
  return DEX_INDICATOR_FIELDS.some((f) => !!mapped[f]);
}

function buildPayload(mapped: Record<string, string>): Record<string, unknown> {
  const isDex = detectDexSource(mapped);
  const entryPrice = parseNumeric(mapped.entry_price) ?? 0;
  const exitPrice = parseNumeric(mapped.exit_price);
  const quantity = parseNumeric(mapped.quantity) ?? 0;
  const fees = parseNumeric(mapped.fees) ?? 0;
  const position = parsePosition(mapped.position) ?? "long";

  // Use explicit PnL from CSV, or calculate from prices if available
  let pnl = parseNumeric(mapped.pnl);
  if (pnl === null && exitPrice !== null && entryPrice > 0) {
    const direction = position === "long" ? 1 : -1;
    pnl = (exitPrice - entryPrice) * direction * quantity - fees;
  }

  const userTags = mapped.tags ? mapped.tags.split(";").map((t) => t.trim()).filter(Boolean) : [];

  return {
    symbol: mapped.symbol?.toUpperCase(),
    position,
    entry_price: entryPrice,
    exit_price: exitPrice,
    quantity,
    fees,
    open_timestamp: mapped.open_timestamp || new Date().toISOString(),
    close_timestamp: mapped.close_timestamp || ((exitPrice !== null || pnl !== null) ? (mapped.open_timestamp || new Date().toISOString()) : null),
    pnl,
    tags: [...userTags, "csv-import"],
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
