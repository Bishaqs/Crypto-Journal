import type { NewsArticle, NewsPriority } from "./types";

export const BREAKING_KEYWORDS = [
  // Crisis / bear signals
  "crash", "crashes", "crashed",
  "hack", "hacked", "exploit", "exploited",
  "halt", "halted", "suspended",
  "emergency",
  "sanctions", "sanctioned",
  "default", "defaults", "defaulted",
  "circuit breaker",
  "flash crash",
  "black swan",
  "bank run",
  "collapse", "collapsed",
  "rug pull", "rugged",
  "liquidation", "liquidated",
  "war", "invasion", "strike", "attack",
  "assassination",
  "shutdown",
  "delisted", "delisting",
  "insolvency", "insolvent", "bankrupt", "bankruptcy",
  "nuclear",
  "pandemic",
  "martial law",
  "coup",
  // Monetary policy
  "rate cut", "rate hike", "rate decision",
  "tariff", "tariffs",
  "quantitative easing", "quantitative tightening",
  // Institutional / whale activity
  "MicroStrategy", "Saylor",
  "BlackRock", "Fidelity", "Grayscale", "VanEck",
  "sovereign wealth", "treasury purchase",
  "major acquisition", "strategic reserve",
  "billion dollar", "billion worth",
  // ETF / regulatory
  "ETF approved", "ETF filing", "ETF launch", "ETF rejection",
  "SEC charges", "SEC sues", "SEC ruling", "SEC approval",
  "CFTC", "BaFin", "EU regulation", "MiCA",
  "crypto ban", "crypto regulation",
  // Bull signals
  "all-time high", "new ATH",
  "halving", "bitcoin halving",
  "mass adoption", "legal tender",
];

export interface ScoringMeta {
  fromImportantFilter?: boolean;
  importantVotes?: number;
  fromPriorityDomain?: boolean;
}

export function scoreArticle(
  article: Pick<NewsArticle, "title" | "publishedAt" | "sentiment">,
  meta: ScoringMeta = {},
): { urgencyScore: number; priority: NewsPriority } {
  let score = 0;

  // Source-level signals
  if (meta.importantVotes && meta.importantVotes >= 5) score += 40;
  if (meta.fromImportantFilter) score += 30;
  if (meta.fromPriorityDomain) score += 25;

  // Keyword analysis
  const titleLower = article.title.toLowerCase();
  let keywordHits = 0;
  for (const kw of BREAKING_KEYWORDS) {
    if (titleLower.includes(kw)) keywordHits++;
  }
  score += Math.min(keywordHits * 20, 40);

  // Recency bonus
  const ageMs = Date.now() - new Date(article.publishedAt).getTime();
  const ageMinutes = ageMs / 60_000;
  if (ageMinutes < 30) score += 15;
  else if (ageMinutes < 120) score += 5;

  // Sentiment strength
  if (article.sentiment === "bullish" || article.sentiment === "bearish") {
    score += 5;
  }

  const priority: NewsPriority =
    score >= 75 ? "breaking" : score >= 45 ? "important" : "normal";

  return { urgencyScore: Math.min(score, 100), priority };
}

/** Demote breaking to important if same source has another breaking within 2h */
export function applySourceCooldown(articles: NewsArticle[]): NewsArticle[] {
  const breakingSources = new Map<string, number>();

  return articles.map((a) => {
    if (a.priority !== "breaking") return a;

    const lastBreaking = breakingSources.get(a.source);
    const pubTime = new Date(a.publishedAt).getTime();

    if (lastBreaking && Math.abs(pubTime - lastBreaking) < 2 * 60 * 60 * 1000) {
      return { ...a, priority: "important" as NewsPriority };
    }

    breakingSources.set(a.source, pubTime);
    return a;
  });
}

/** Decay: breaking > 4h → important, important > 12h → normal */
export function applyTimeDecay(articles: NewsArticle[]): NewsArticle[] {
  const now = Date.now();
  return articles.map((a) => {
    const ageHours = (now - new Date(a.publishedAt).getTime()) / (60 * 60 * 1000);

    if (a.priority === "breaking" && ageHours > 4) {
      return { ...a, priority: "important" as NewsPriority };
    }
    if (a.priority === "important" && ageHours > 12) {
      return { ...a, priority: "normal" as NewsPriority };
    }
    return a;
  });
}
