/**
 * Shared types for multi-provider AI abstraction.
 */

export type ProviderId = "anthropic" | "openai" | "google";

export type MessageOptions = {
  system: string;
  userMessage: string;
  maxTokens: number;
  model: string;
};

export interface AIProvider {
  id: ProviderId;
  name: string;
  /** Check if the provider's API key is configured */
  isConfigured(): boolean;
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
