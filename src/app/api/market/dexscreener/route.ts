import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const DEX_BASE = "https://api.dexscreener.com";
const FETCH_TIMEOUT_MS = 5000;
const MAX_LOOKUP_RESULTS = 8;

// Shape of a single DexScreener pair (only the fields we read).
type DexToken = {
  address?: string;
  name?: string;
  symbol?: string;
};

type DexPair = {
  chainId?: string;
  pairAddress?: string;
  url?: string;
  baseToken?: DexToken;
  quoteToken?: DexToken;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  priceChange?: { h24?: number };
};

export type NormalizedToken = {
  tokenAddress: string;
  chain: string;
  pairAddress: string | null;
  symbol: string | null;
  name: string | null;
  priceUsd: number | null;
  marketCap: number | null;
  fdv: number | null;
  liquidityUsd: number | null;
  priceChange24h: number | null;
  url: string | null;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function liquidityOf(pair: DexPair): number {
  return toNumber(pair.liquidity?.usd) ?? 0;
}

function normalizePair(pair: DexPair): NormalizedToken {
  const marketCap = toNumber(pair.marketCap);
  const fdv = toNumber(pair.fdv);
  return {
    tokenAddress: pair.baseToken?.address ?? "",
    chain: pair.chainId ?? "",
    pairAddress: pair.pairAddress ?? null,
    symbol: pair.baseToken?.symbol ?? null,
    name: pair.baseToken?.name ?? null,
    priceUsd: toNumber(pair.priceUsd),
    // Fall back to FDV when marketCap is missing.
    marketCap: marketCap ?? fdv,
    fdv,
    liquidityUsd: toNumber(pair.liquidity?.usd),
    priceChange24h: toNumber(pair.priceChange?.h24),
    url: pair.url ?? null,
  };
}

/**
 * Fetch JSON from DexScreener with a hard timeout. Returns null on any
 * failure (timeout, non-2xx, parse error) so callers degrade gracefully.
 */
async function fetchDex(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function jsonWithCache(body: { tokens: NormalizedToken[] }, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set(
    "Cache-Control",
    "s-maxage=60, stale-while-revalidate=120"
  );
  return response;
}

// MODE A — lookup for the add-form: ?q=<address-or-symbol>
async function handleLookup(q: string) {
  const url = `${DEX_BASE}/latest/dex/search?q=${encodeURIComponent(q)}`;
  const data = await fetchDex(url);

  if (!data || typeof data !== "object") {
    return jsonWithCache({ tokens: [] }, 502);
  }

  const rawPairs = (data as { pairs?: DexPair[] | null }).pairs;
  if (!Array.isArray(rawPairs)) {
    // DexScreener may return pairs: null / empty.
    return jsonWithCache({ tokens: [] });
  }

  const tokens = rawPairs
    .filter((p) => liquidityOf(p) > 0)
    .sort((a, b) => liquidityOf(b) - liquidityOf(a))
    .slice(0, MAX_LOOKUP_RESULTS)
    .map(normalizePair)
    .filter((t) => t.tokenAddress !== "");

  return jsonWithCache({ tokens });
}

// MODE B — live refresh: ?chain=<chainId>&addresses=<comma-separated>
async function handleRefresh(chain: string, addressesParam: string) {
  const requested = addressesParam
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  if (requested.length === 0) {
    return jsonWithCache({ tokens: [] });
  }

  const url = `${DEX_BASE}/tokens/v1/${encodeURIComponent(chain)}/${requested
    .map((a) => encodeURIComponent(a))
    .join(",")}`;
  const data = await fetchDex(url);

  if (!Array.isArray(data)) {
    // Timeout / failure / unexpected shape — degrade to empty, not a throw.
    return jsonWithCache({ tokens: [] }, 502);
  }

  const pairs = data as DexPair[];

  // Group by baseToken.address, keep the top-liquidity pair per token.
  const bestByToken = new Map<string, DexPair>();
  for (const pair of pairs) {
    const addr = pair.baseToken?.address;
    if (!addr) continue;
    const key = addr.toLowerCase();
    const existing = bestByToken.get(key);
    if (!existing || liquidityOf(pair) > liquidityOf(existing)) {
      bestByToken.set(key, pair);
    }
  }

  // Return one normalized entry per requested address that we found data for.
  const tokens: NormalizedToken[] = [];
  for (const addr of requested) {
    const pair = bestByToken.get(addr.toLowerCase());
    if (pair) tokens.push(normalizePair(pair));
  }

  return jsonWithCache({ tokens });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const q = searchParams.get("q");
  const chain = searchParams.get("chain");
  const addresses = searchParams.get("addresses");

  try {
    // MODE B — live refresh takes precedence when both chain + addresses present.
    if (chain && addresses) {
      return await handleRefresh(chain, addresses);
    }
    // MODE A — lookup.
    if (q && q.trim().length > 0) {
      return await handleLookup(q.trim());
    }
    return NextResponse.json(
      { error: "Provide ?q= (lookup) or ?chain=&addresses= (refresh)." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[market/dexscreener]", err instanceof Error ? err.message : err);
    return jsonWithCache({ tokens: [] }, 502);
  }
}
