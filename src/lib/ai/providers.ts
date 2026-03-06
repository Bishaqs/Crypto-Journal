/**
 * AI provider implementations for Anthropic, OpenAI, and Google.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, MessageOptions, ProviderId } from "./types";
import { PROVIDER_CONFIGS, DEFAULT_PROVIDER } from "./config";

// ---------------------------------------------------------------------------
// Anthropic (Claude)
// ---------------------------------------------------------------------------
class AnthropicProvider implements AIProvider {
  id: ProviderId = "anthropic";
  name = "Claude (Anthropic)";

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.ANTHROPIC_API_KEY);
  }

  private getClient(apiKey?: string): Anthropic {
    return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY! });
  }

  async chat(opts: MessageOptions): Promise<string> {
    const client = this.getClient(opts.apiKey);
    const response = await client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.userMessage }],
    });
    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  }

  async *stream(opts: MessageOptions): AsyncIterable<string> {
    const client = this.getClient(opts.apiKey);
    const stream = client.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.userMessage }],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI (ChatGPT)
// ---------------------------------------------------------------------------
class OpenAIProvider implements AIProvider {
  id: ProviderId = "openai";
  name = "ChatGPT (OpenAI)";

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.OPENAI_API_KEY);
  }

  private getClient(apiKey?: string): OpenAI {
    return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY! });
  }

  async chat(opts: MessageOptions): Promise<string> {
    const client = this.getClient(opts.apiKey);
    const response = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async *stream(opts: MessageOptions): AsyncIterable<string> {
    const client = this.getClient(opts.apiKey);
    const stream = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      stream: true,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.userMessage },
      ],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

// ---------------------------------------------------------------------------
// Google (Gemini)
// ---------------------------------------------------------------------------
class GoogleProvider implements AIProvider {
  id: ProviderId = "google";
  name = "Gemini (Google)";

  isConfigured(apiKey?: string): boolean {
    return !!(apiKey || process.env.GOOGLE_AI_API_KEY);
  }

  private getClient(apiKey?: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey || process.env.GOOGLE_AI_API_KEY!);
  }

  async chat(opts: MessageOptions): Promise<string> {
    const genAI = this.getClient(opts.apiKey);
    const model = genAI.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });
    const result = await model.generateContent(opts.userMessage);
    return result.response.text();
  }

  async *stream(opts: MessageOptions): AsyncIterable<string> {
    const genAI = this.getClient(opts.apiKey);
    const model = genAI.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });
    const result = await model.generateContentStream(opts.userMessage);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------
const providers: Record<ProviderId, AIProvider> = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  google: new GoogleProvider(),
};

/**
 * Get an AI provider by ID. Falls back to the default provider
 * if the requested one isn't configured.
 * @param apiKey Optional BYOK key — if provided, the requested provider is considered configured.
 */
export function getProvider(id?: ProviderId | string, apiKey?: string): AIProvider {
  const providerId = (id ?? DEFAULT_PROVIDER) as ProviderId;
  const provider = providers[providerId];
  if (provider?.isConfigured(apiKey)) return provider;

  // Fall back to any configured provider (server-side keys only)
  const fallback = Object.values(providers).find((p) => p.isConfigured());
  if (fallback) return fallback;

  // Return the requested provider anyway — the route will check isConfigured()
  return providers[DEFAULT_PROVIDER];
}

/**
 * Resolve a model string, falling back to provider default if invalid.
 */
export function resolveModel(providerId: ProviderId | string, model?: string): string {
  const config = PROVIDER_CONFIGS[providerId as ProviderId];
  if (!config) return PROVIDER_CONFIGS[DEFAULT_PROVIDER].defaultModel;
  if (model && config.models.some((m) => m.id === model)) return model;
  return config.defaultModel;
}
