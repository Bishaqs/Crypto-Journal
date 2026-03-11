/**
 * AI provider implementations for Anthropic, OpenAI, and Google.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { AIProvider, MessageOptions, ProviderId } from "./types";
import { PROVIDER_CONFIGS, DEFAULT_PROVIDER } from "./config";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Parse a base64 data URI into its mime type and raw data. Returns null for HTTP URLs. */
function parseDataUri(url: string): { mimeType: string; data: string } | null {
  const match = url.match(/^data:(image\/[^;]+);base64,(.+)$/);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

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

  private buildContent(opts: MessageOptions): string | Anthropic.MessageCreateParams["messages"][0]["content"] {
    if (!opts.images?.length) return opts.userMessage;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = [{ type: "text", text: opts.userMessage }];
    for (const url of opts.images) {
      const dataUri = parseDataUri(url);
      if (dataUri) {
        blocks.push({
          type: "image",
          source: { type: "base64", media_type: dataUri.mimeType, data: dataUri.data },
        });
      } else {
        blocks.push({
          type: "image",
          source: { type: "url", url },
        });
      }
    }
    return blocks;
  }

  async chat(opts: MessageOptions): Promise<string> {
    const client = this.getClient(opts.apiKey);
    const response = await client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: this.buildContent(opts) }],
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
      messages: [{ role: "user", content: this.buildContent(opts) }],
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

  private buildContent(opts: MessageOptions): string | OpenAI.ChatCompletionContentPart[] {
    if (!opts.images?.length) return opts.userMessage;

    const parts: OpenAI.ChatCompletionContentPart[] = [
      { type: "text", text: opts.userMessage },
    ];
    for (const url of opts.images) {
      parts.push({ type: "image_url", image_url: { url } });
    }
    return parts;
  }

  async chat(opts: MessageOptions): Promise<string> {
    const client = this.getClient(opts.apiKey);
    const response = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: this.buildContent(opts) },
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
        { role: "user", content: this.buildContent(opts) },
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

  /** Build Gemini Part[] with text + images. HTTP URLs are fetched and converted to base64. */
  private async buildParts(opts: MessageOptions): Promise<string | Part[]> {
    if (!opts.images?.length) return opts.userMessage;

    const parts: Part[] = [{ text: opts.userMessage }];
    for (const url of opts.images) {
      const dataUri = parseDataUri(url);
      if (dataUri) {
        parts.push({ inlineData: { mimeType: dataUri.mimeType, data: dataUri.data } });
      } else {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = res.headers.get("content-type") || "image/png";
            parts.push({ inlineData: { mimeType, data: base64 } });
          }
        } catch {
          // Skip images that fail to fetch
        }
      }
    }
    return parts;
  }

  async chat(opts: MessageOptions): Promise<string> {
    const genAI = this.getClient(opts.apiKey);
    const model = genAI.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });
    const content = await this.buildParts(opts);
    const result = await model.generateContent(content);
    return result.response.text();
  }

  async *stream(opts: MessageOptions): AsyncIterable<string> {
    const genAI = this.getClient(opts.apiKey);
    const model = genAI.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });
    const content = await this.buildParts(opts);
    const result = await model.generateContentStream(content);
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
