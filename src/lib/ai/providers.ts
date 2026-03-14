/**
 * AI provider implementations for Anthropic, OpenAI, and Google.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { AIProvider, ChatMessage, MessageOptions, ProviderId } from "./types";
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

  private buildContent(text: string, images?: string[]): string | Anthropic.MessageCreateParams["messages"][0]["content"] {
    if (!images?.length) return text;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = [{ type: "text", text }];
    for (const url of images) {
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

  private buildMessages(opts: MessageOptions): Anthropic.MessageCreateParams["messages"] {
    if (opts.messages?.length) {
      return opts.messages.map((m, i) => ({
        role: m.role,
        // Attach images to the first user message only (contains trade context)
        content: m.role === "user" && i === 0 ? this.buildContent(m.content, opts.images) : m.content,
      }));
    }
    return [{ role: "user" as const, content: this.buildContent(opts.userMessage, opts.images) }];
  }

  async chat(opts: MessageOptions): Promise<string> {
    const client = this.getClient(opts.apiKey);
    const response = await client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: this.buildMessages(opts),
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
      messages: this.buildMessages(opts),
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

  private buildContent(text: string, images?: string[]): string | OpenAI.ChatCompletionContentPart[] {
    if (!images?.length) return text;

    const parts: OpenAI.ChatCompletionContentPart[] = [
      { type: "text", text },
    ];
    for (const url of images) {
      parts.push({ type: "image_url", image_url: { url } });
    }
    return parts;
  }

  private buildMessages(opts: MessageOptions): OpenAI.ChatCompletionMessageParam[] {
    const msgs: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: opts.system },
    ];
    if (opts.messages?.length) {
      for (let i = 0; i < opts.messages.length; i++) {
        const m = opts.messages[i];
        if (m.role === "user") {
          // Attach images to first user message only
          msgs.push({ role: "user", content: i === 0 ? this.buildContent(m.content, opts.images) : m.content });
        } else {
          msgs.push({ role: "assistant", content: m.content });
        }
      }
    } else {
      msgs.push({ role: "user", content: this.buildContent(opts.userMessage, opts.images) });
    }
    return msgs;
  }

  async chat(opts: MessageOptions): Promise<string> {
    const client = this.getClient(opts.apiKey);
    const response = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      messages: this.buildMessages(opts),
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async *stream(opts: MessageOptions): AsyncIterable<string> {
    const client = this.getClient(opts.apiKey);
    const stream = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      stream: true,
      messages: this.buildMessages(opts),
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
  private async buildParts(text: string, images?: string[]): Promise<string | Part[]> {
    if (!images?.length) return text;

    const parts: Part[] = [{ text }];
    for (const url of images) {
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

    if (opts.messages?.length) {
      const history = opts.messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }],
      }));
      const lastMsg = opts.messages[opts.messages.length - 1];
      const chat = model.startChat({ history });
      const lastContent = lastMsg.role === "user" && opts.messages.indexOf(lastMsg) === 0
        ? await this.buildParts(lastMsg.content, opts.images)
        : lastMsg.content;
      const result = await chat.sendMessage(lastContent);
      return result.response.text();
    }

    const content = await this.buildParts(opts.userMessage, opts.images);
    const result = await model.generateContent(content);
    return result.response.text();
  }

  async *stream(opts: MessageOptions): AsyncIterable<string> {
    const genAI = this.getClient(opts.apiKey);
    const model = genAI.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });

    if (opts.messages?.length) {
      // For multi-turn: use startChat with history, stream the last message
      const allButLast = opts.messages.slice(0, -1);
      const lastMsg = opts.messages[opts.messages.length - 1];

      // Build history — attach images to first user message
      const history: { role: "user" | "model"; parts: Part[] }[] = [];
      for (let i = 0; i < allButLast.length; i++) {
        const m = allButLast[i];
        const role = m.role === "assistant" ? "model" as const : "user" as const;
        if (m.role === "user" && i === 0 && opts.images?.length) {
          const parts = await this.buildParts(m.content, opts.images);
          history.push({ role, parts: Array.isArray(parts) ? parts : [{ text: parts }] });
        } else {
          history.push({ role, parts: [{ text: m.content }] });
        }
      }

      const chat = model.startChat({ history });
      // If the first message IS the last message (single-turn with messages array), attach images
      const lastContent = opts.messages.length === 1 && opts.images?.length
        ? await this.buildParts(lastMsg.content, opts.images)
        : lastMsg.content;
      const result = await chat.sendMessageStream(lastContent);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return;
    }

    const content = await this.buildParts(opts.userMessage, opts.images);
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
