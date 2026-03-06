"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "stargate-ai-enhanced-insights";

export function useAiEnhancedInsights() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const enabled = localStorage.getItem(STORAGE_KEY) === "true";
    const key = localStorage.getItem("stargate-ai-api-key");
    const prov = localStorage.getItem("stargate-ai-provider");

    setIsEnabled(enabled && !!key);
    setApiKey(key);
    setProvider(prov);
  }, []);

  return { isEnabled, apiKey, provider };
}

/**
 * Fetch an AI-enhanced insight for a dashboard widget.
 * Returns null if the request fails or AI is not configured.
 */
export async function fetchAiInsight(
  trades: { symbol: string; position: string; pnl: number | null; emotion: string | null }[],
  context: string,
  apiKey: string,
  provider: string | null,
): Promise<string | null> {
  try {
    const response = await fetch("/api/ai/trade-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "dashboard-insight",
        context,
        trades: trades.slice(0, 20),
        apiKey,
        provider: provider ?? undefined,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.summary ?? null;
  } catch {
    return null;
  }
}
