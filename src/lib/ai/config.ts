/**
 * Provider configuration — model lists and defaults.
 */
import type { ProviderId, ProviderConfig } from "./types";

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    id: "anthropic",
    name: "Claude (Anthropic)",
    models: [
      { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
    defaultModel: "claude-opus-4-20250514",
  },
  openai: {
    id: "openai",
    name: "ChatGPT (OpenAI)",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "o3-mini", label: "o3-mini" },
    ],
    defaultModel: "gpt-4o",
  },
  google: {
    id: "google",
    name: "Gemini (Google)",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
    defaultModel: "gemini-2.5-flash",
  },
};

export const DEFAULT_PROVIDER: ProviderId = "google";

/** Returns an array of providers that have API keys configured */
export function getAvailableProviders(): ProviderConfig[] {
  const available: ProviderConfig[] = [];
  if (process.env.ANTHROPIC_API_KEY) available.push(PROVIDER_CONFIGS.anthropic);
  if (process.env.OPENAI_API_KEY) available.push(PROVIDER_CONFIGS.openai);
  if (process.env.GOOGLE_AI_API_KEY) available.push(PROVIDER_CONFIGS.google);
  return available;
}
