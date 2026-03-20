import type { NewsArticle, AssetCategory } from "./types";
import { scoreArticle } from "./scoring";

const WHALE_ALERT_URL = "https://api.whale-alert.io/v1/transactions";
const MIN_USD_VALUE = 1_000_000; // $1M minimum

interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  transaction_type: string;
  hash: string;
  from: { address: string; owner: string; owner_type: string };
  to: { address: string; owner: string; owner_type: string };
  timestamp: number;
  amount: number;
  amount_usd: number;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function formatAmount(amount: number, symbol: string): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ${symbol}`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ${symbol}`;
  return `${amount.toFixed(2)} ${symbol}`;
}

function describeEntity(entity: { owner: string; owner_type: string }): string {
  if (entity.owner && entity.owner !== "unknown") return entity.owner;
  if (entity.owner_type === "exchange") return "exchange";
  return "unknown wallet";
}

function buildTitle(tx: WhaleTransaction): string {
  const from = describeEntity(tx.from);
  const to = describeEntity(tx.to);
  const amount = formatAmount(tx.amount, tx.symbol.toUpperCase());
  const usd = formatUsd(tx.amount_usd);

  if (tx.from.owner_type === "exchange" && tx.to.owner_type !== "exchange") {
    return `${amount} (${usd}) withdrawn from ${from}`;
  }
  if (tx.to.owner_type === "exchange" && tx.from.owner_type !== "exchange") {
    return `${amount} (${usd}) deposited to ${to}`;
  }
  return `${amount} (${usd}) moved from ${from} to ${to}`;
}

export async function fetchWhaleAlerts(): Promise<NewsArticle[]> {
  const apiKey = process.env.WHALE_ALERT_API_KEY;
  if (!apiKey) return [];

  try {
    const since = Math.floor(Date.now() / 1000) - 3600; // last hour
    const res = await fetch(
      `${WHALE_ALERT_URL}?api_key=${apiKey}&min_value=${MIN_USD_VALUE}&start=${since}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) return [];
    const data = await res.json();

    if (!data.transactions || !Array.isArray(data.transactions)) return [];

    return data.transactions
      .filter((tx: WhaleTransaction) => tx.amount_usd >= MIN_USD_VALUE)
      .map((tx: WhaleTransaction): NewsArticle => {
        const publishedAt = new Date(tx.timestamp * 1000).toISOString();
        const title = buildTitle(tx);

        // Score based on USD value
        let extraScore = 0;
        if (tx.amount_usd >= 500_000_000) extraScore = 80; // $500M+ = breaking
        else if (tx.amount_usd >= 100_000_000) extraScore = 50; // $100M+ = important
        else if (tx.amount_usd >= 10_000_000) extraScore = 20; // $10M+

        const { urgencyScore, priority } = scoreArticle(
          { title, publishedAt, sentiment: null },
          { importantVotes: extraScore > 40 ? 10 : 0 },
        );

        return {
          id: `wa-${tx.id}`,
          title,
          url: `https://whale-alert.io/transaction/${tx.blockchain}/${tx.hash}`,
          source: "Whale Alert",
          imageUrl: null,
          publishedAt,
          sentiment: null,
          assetCategory: "crypto" as AssetCategory,
          urgencyScore: Math.min(urgencyScore + extraScore, 100),
          priority: tx.amount_usd >= 500_000_000 ? "breaking" : tx.amount_usd >= 100_000_000 ? "important" : priority,
        };
      });
  } catch (err) {
    console.error("[whale-alert]", err instanceof Error ? err.message : err);
    return [];
  }
}
