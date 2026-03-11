/**
 * Shared types for multi-provider AI abstraction.
 */

export type ProviderId = "anthropic" | "openai" | "google";

export type MessageOptions = {
  system: string;
  userMessage: string;
  maxTokens: number;
  model: string;
  /** Optional user-provided API key (BYOK) — takes precedence over server env var */
  apiKey?: string;
  /** Optional image URLs or base64 data URIs from journal notes */
  images?: string[];
};

export interface AIProvider {
  id: ProviderId;
  name: string;
  /** Check if the provider's API key is configured (server-side or BYOK) */
  isConfigured(apiKey?: string): boolean;
  /** Non-streaming: returns the full response text */
  chat(opts: MessageOptions): Promise<string>;
  /** Streaming: returns an async iterable of text chunks */
  stream(opts: MessageOptions): AsyncIterable<string>;
}

export type ProviderModel = {
  id: string;
  label: string;
};

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  models: ProviderModel[];
  defaultModel: string;
};
