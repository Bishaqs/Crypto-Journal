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
  ticker: "symbol",
  pair: "symbol",
  side: "position",
  direction: "position",
  type: "position",
  entry: "entry_price",
  buy_price: "entry_price",
  open_price: "entry_price",
  exit: "exit_price",
  sell_price: "exit_price",
  close_price: "exit_price",
  size: "quantity",
  amount: "quantity",
  volume: "quantity",
  qty: "quantity",
  fee: "fees",
  commission: "fees",
  date: "open_timestamp",
  open_date: "open_timestamp",
  close_date: "close_timestamp",
  tag: "tags",
  note: "notes",
  comment: "notes",
  profit: "pnl",
  profit_loss: "pnl",
  "p&l": "pnl",
  realized_pnl: "pnl",
  feeling: "emotion",
  mood: "emotion",
  setup: "setup_type",
  strategy: "setup_type",
  process: "process_score",
  source: "trade_source",
  network: "chain",
  protocol: "dex_protocol",
  transaction: "tx_hash",
  wallet: "wallet_address",
  gas: "gas_fee",
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
  if (["long", "buy", "b"].includes(lower)) return "long";
  if (["short", "sell", "s"].includes(lower)) return "short";
  return null;
}

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

function buildPayload(mapped: Record<string, string>): Record<string, unknown> {
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
    trade_source: mapped.trade_source || null,
    chain: mapped.chain || null,
    dex_protocol: mapped.dex_protocol || null,
    tx_hash: mapped.tx_hash || null,
    wallet_address: mapped.wallet_address || null,
    gas_fee: parseNumeric(mapped.gas_fee),
    gas_fee_native: parseNumeric(mapped.gas_fee_native),
  };
}
