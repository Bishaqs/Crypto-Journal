"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import {
  Brain,
  Send,
  Sparkles,
  AlertCircle,
  Loader2,
  Key,
  MessageSquare,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Shield,
} from "lucide-react";

type Message = {
  role: "user" | "assistant" | "error";
  content: string;
};

const SUGGESTED_QUESTIONS = [
  "What patterns do you see in my losing trades?",
  "When am I most profitable and why?",
  "What's my biggest behavioral weakness?",
  "How do my emotions affect my trading results?",
  "Which setup types work best for me?",
  "Am I following my own rules consistently?",
  "What would you prioritize improving this week?",
  "Analyze my risk management habits.",
];

// Demo responses shown when no API key is configured
const DEMO_RESPONSES: Record<string, string> = {
  "What patterns do you see in my losing trades?": `## Losing Trade Patterns

Looking at your recent losses, I see **three clear patterns**:

**1. FOMO entries without confirmation**
Your ETHUSDT loss ($-223.20) was a textbook fakeout entry. You noted "entered too early before confirmation" — and your process score was only 3/10. You knew it wasn't clean.

**2. Trading against the macro trend**
The BTCUSDT loss ($-107.00) came from entering long against a downtrend. Your own notes say "entered against the trend." When confidence is 4/10, that's your gut telling you to sit out.

**3. Ignoring your own plan**
Your AVAXUSDT loss ($-137.10) wasn't on your watchlist — checklist shows \`on_plan: false\`. Trades taken off-plan have a **significantly worse** hit rate.

### Action Items
- **Wait for candle close** before breakout entries
- **Check BTC trend** before any alt position
- If it's not on your plan, **don't trade it**. Your on-plan win rate is ~75% vs ~30% off-plan`,

  "What's my biggest behavioral weakness?": `## Your Biggest Weakness: Impulsive Off-Plan Trades

The data is clear — your **#1 leak is taking trades that aren't on your plan**.

When you check your checklist and trade your watchlist:
- **Win rate: ~75%**
- **Avg process score: 8.5/10**
- **Avg confidence: 8.2/10**

When you go off-script:
- **Win rate: ~33%**
- **Avg process score: 3.7/10**
- **Avg confidence: 5.0/10**

The FOMO and Frustrated emotion tags almost exclusively appear on off-plan trades. You're essentially **two different traders** — a disciplined one with an edge, and an impulsive one giving it back.

### The Fix
- **Hard rule**: If \`on_plan\` is false, you don't click buy. Period.
- Your process score already tracks this — aim for 7+ every single trade
- The DOGE scalp made money but it was luck, not edge. Those trades erode discipline over time`,

  "How do my emotions affect my trading results?": `## Emotion → P&L Correlation

Here's what your data shows:

| Emotion | Trades | Avg P&L | Win Rate |
|---------|--------|---------|----------|
| **Calm** | 3 | +$128.57 | 100% |
| **Confident** | 3 | +$299.03 | 100% |
| **Excited** | 2 | +$195.55 | 100% |
| **FOMO** | 1 | -$223.20 | 0% |
| **Frustrated** | 1 | -$107.00 | 0% |
| **Anxious** | 1 | -$137.10 | 0% |

**The pattern is obvious**: Calm and Confident = profitable. FOMO, Frustrated, Anxious = losing.

### Key Insight
Your **Calm** trades are your best — not because of luck, but because calm means you followed the process. The emotion is a **symptom** of good preparation.

When you feel FOMO or frustration creeping in:
- **Stop**. Close the chart for 15 minutes
- Ask: "Am I trading my plan or reacting to price?"
- If your confidence is below 7, it's a sit-out`,
};

const DEMO_FALLBACK = `## Analysis

Based on your trading data, here are some observations:

**Process is your edge.** Your highest-scoring process trades (8-9/10) are consistently profitable. When your process score drops below 5, losses follow.

**Calm and confident states win.** Your best P&L comes when you're emotionally centered. Negative emotions (FOMO, frustration, anxiety) correlate strongly with losses.

**Your checklist works — use it.** On-plan trades with full checklist compliance have a dramatically higher win rate.

### Recommendations
- Treat your pre-trade checklist as non-negotiable
- Set a daily max loss and respect it
- Journal your emotional state honestly — the patterns will keep improving

*Connect your API key for personalized, real-time analysis of your specific trading patterns.*`;

const API_KEY_STORAGE = "stargate-ai-api-key";

export default function AIPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "testing" | "valid" | "invalid">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const dbTrades = (data as Trade[]) ?? [];
    setTrades(dbTrades.length === 0 ? DEMO_TRADES : dbTrades);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Load saved API key
  useEffect(() => {
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE);
      if (saved) {
        setApiKey(saved);
        setKeyStatus("valid");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveApiKey() {
    if (!apiKey.trim()) return;
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
    setKeyStatus("valid");
    setNoApiKey(false);
  }

  function removeApiKey() {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey("");
    setKeyStatus("idle");
  }

  async function testApiKey() {
    if (!apiKey.trim()) return;
    setKeyStatus("testing");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Say hello in one sentence.",
          trades: [],
          apiKey: apiKey.trim(),
        }),
      });
      if (res.ok) {
        setKeyStatus("valid");
        localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
        setNoApiKey(false);
      } else {
        setKeyStatus("invalid");
      }
    } catch {
      setKeyStatus("invalid");
    }
  }

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    // Get stored API key
    const storedKey = localStorage.getItem(API_KEY_STORAGE) || "";

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          trades: trades.slice(0, 50),
          apiKey: storedKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("ANTHROPIC_API_KEY") || data.error?.includes("not configured")) {
          setNoApiKey(true);
          const demoReply = DEMO_RESPONSES[msg] ?? DEMO_FALLBACK;
          await new Promise((r) => setTimeout(r, 800));
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: demoReply },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "error", content: data.error || "Something went wrong." },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      const demoReply = DEMO_RESPONSES[msg] ?? DEMO_FALLBACK;
      setNoApiKey(true);
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: demoReply },
      ]);
    } finally {
      setSending(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setNoApiKey(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Brain size={24} className="text-accent" />
            AI Trading Coach
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Ask questions about your trading patterns, psychology, and performance
          </p>
          {noApiKey && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
              <Sparkles size={10} />
              Demo Mode — sample responses
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
          >
            <Trash2 size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-4 space-y-4 mb-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {noApiKey ? (
              <ApiKeyInput
                apiKey={apiKey}
                setApiKey={setApiKey}
                showKey={showKey}
                setShowKey={setShowKey}
                keyStatus={keyStatus}
                onSave={saveApiKey}
                onTest={testApiKey}
                onRemove={removeApiKey}
              />
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-accent" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">
                  Your AI Trading Coach
                </h2>
                <p className="text-sm text-muted max-w-md mb-8">
                  Powered by Claude. Ask about your patterns, psychology, risk management,
                  or anything about your trading data. The AI has access to your trade history,
                  emotions, process scores, and more.
                </p>

                {/* Suggested questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={sending}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 text-muted hover:text-foreground transition-all"
                    >
                      <MessageSquare
                        size={12}
                        className="inline mr-2 text-accent/60"
                      />
                      {q}
                    </button>
                  ))}
                </div>

                {/* API Key section — collapsed */}
                <div className="mt-8 w-full max-w-md">
                  <ApiKeyInput
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    showKey={showKey}
                    setShowKey={setShowKey}
                    keyStatus={keyStatus}
                    onSave={saveApiKey}
                    onTest={testApiKey}
                    onRemove={removeApiKey}
                    compact
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted px-4 py-3">
                <Loader2 size={14} className="animate-spin text-accent" />
                Analyzing your trading data...
              </div>
            )}
            {noApiKey && !sending && messages.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs text-amber-500 font-medium mb-2">
                  These are sample responses to preview the feature
                </p>
                <ApiKeyInput
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  showKey={showKey}
                  setShowKey={setShowKey}
                  keyStatus={keyStatus}
                  onSave={saveApiKey}
                  onTest={testApiKey}
                  onRemove={removeApiKey}
                  compact
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 pb-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about your trading patterns, psychology, or performance..."
            disabled={sending}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            className="px-4 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-muted/40 mt-1.5 text-center">
          AI analyzes your last 50 trades. Responses are not financial advice.
        </p>
      </div>
    </div>
  );
}

function ApiKeyInput({
  apiKey,
  setApiKey,
  showKey,
  setShowKey,
  keyStatus,
  onSave,
  onTest,
  onRemove,
  compact,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  keyStatus: "idle" | "testing" | "valid" | "invalid";
  onSave: () => void;
  onTest: () => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-9 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted"
            >
              {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          {keyStatus === "valid" ? (
            <button
              onClick={onRemove}
              className="px-3 py-2 rounded-lg text-[11px] font-semibold text-loss bg-loss/10 hover:bg-loss/20 transition-all shrink-0"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={!apiKey.trim()}
              className="px-3 py-2 rounded-lg text-[11px] font-semibold text-accent bg-accent/10 hover:bg-accent/20 transition-all disabled:opacity-30 shrink-0"
            >
              Save
            </button>
          )}
        </div>
        {keyStatus === "valid" && (
          <p className="text-[10px] text-win mt-1 flex items-center gap-1">
            <CheckCircle2 size={10} /> API key saved
          </p>
        )}
        {keyStatus === "invalid" && (
          <p className="text-[10px] text-loss mt-1 flex items-center gap-1">
            <XCircle size={10} /> Invalid key — check and try again
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
        <Key size={28} className="text-accent" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        Connect Your AI Coach
      </h2>
      <p className="text-sm text-muted mb-6">
        Enter your Anthropic API key to enable real AI analysis of your trading data.
      </p>

      <div className="bg-background rounded-xl border border-border p-4 text-left space-y-3">
        <div className="relative">
          <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-mono"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!apiKey.trim()}
            className="flex-1 py-2.5 rounded-lg bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all disabled:opacity-30"
          >
            Save Key
          </button>
          <button
            onClick={onTest}
            disabled={!apiKey.trim() || keyStatus === "testing"}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted hover:text-foreground hover:border-accent/30 transition-all disabled:opacity-30"
          >
            {keyStatus === "testing" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Testing...
              </span>
            ) : (
              "Test Connection"
            )}
          </button>
        </div>

        {keyStatus === "valid" && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-win/5 border border-win/10">
            <p className="text-xs text-win font-medium flex items-center gap-1.5">
              <CheckCircle2 size={12} /> Connected — key saved
            </p>
            <button onClick={onRemove} className="text-[10px] text-loss hover:underline">
              Remove
            </button>
          </div>
        )}
        {keyStatus === "invalid" && (
          <p className="text-xs text-loss flex items-center gap-1.5 px-3 py-2 rounded-lg bg-loss/5 border border-loss/10">
            <XCircle size={12} /> Connection failed — check your key
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 text-[11px] text-muted/60 justify-center">
        <Shield size={12} />
        Stored locally in your browser only — never sent to our servers
      </div>
      <p className="text-[11px] text-muted mt-2">
        Get your key at{" "}
        <span className="text-accent">console.anthropic.com</span>
      </p>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent/10 border border-accent/20 text-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%] text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="bg-loss/10 border border-loss/20 text-loss rounded-2xl rounded-tl-md px-4 py-3 max-w-[75%] text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-background border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%] text-sm text-foreground leading-relaxed">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className="text-accent" />
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
            Stargate AI
          </span>
        </div>
        <div
          className="prose prose-sm prose-invert max-w-none [&_strong]:text-accent [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:space-y-1 [&_li]:text-muted"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
