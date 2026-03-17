"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade, JournalNote } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { fetchAllTrades } from "@/lib/supabase/fetch-all-trades";
import { formatAndSanitizeMarkdown } from "@/lib/sanitize";
import {
  Brain,
  Send,
  Sparkles,
  AlertCircle,
  Loader2,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ChatBubble, type Message } from "@/components/ai/chat-bubble";
import { ConversationList, type Conversation } from "@/components/ai/conversation-list";
import { MemoryPanel, type CoachMemory } from "@/components/ai/memory-panel";

const SUGGESTED_QUESTIONS = [
  "What patterns do you see in my losing trades?",
  "When am I most profitable and why?",
  "What's my biggest behavioral weakness?",
  "How do my emotions affect my trading results?",
  "Which setup types work best for me?",
  "Summarize my recent journal notes and key themes.",
  "Compare my discipline across asset classes.",
  "What would you prioritize improving this week?",
];

// Demo responses shown when AI service is not configured
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

*Nova is currently in demo mode. Contact your administrator to enable live analysis.*`;

type PlaybookEntry = {
  id: string;
  name: string;
  description: string;
  entry_rules: string[];
  exit_rules: string[];
  stop_loss_strategy: string | null;
  risk_per_trade: string | null;
  timeframes: string[];
  tags: string[];
  asset_class: string;
  is_active: boolean;
};

export default function AIPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [aiProvider, setAiProvider] = useState<string | undefined>();
  const [aiModel, setAiModel] = useState<string | undefined>();
  const [aiApiKey, setAiApiKey] = useState<string | undefined>();
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [aiConsent, setAiConsent] = useState<boolean | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Memory state
  const [memories, setMemories] = useState<CoachMemory[]>([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // ─── Consent ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetch("/api/consent");
        if (res.ok) {
          const { consents } = await res.json();
          const aiConsent = consents.find(
            (c: { consent_type: string; granted: boolean }) =>
              c.consent_type === "ai_data_processing"
          );
          setAiConsent(aiConsent?.granted ?? null);
        }
      } catch {
        const stored = localStorage.getItem("stargate-privacy-ai-consent");
        if (stored === "true") setAiConsent(true);
      } finally {
        setConsentLoading(false);
      }
    }
    checkConsent();
  }, []);

  async function grantAiConsent() {
    setAiConsent(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_type: "ai_data_processing", granted: true }),
      });
    } catch {
      localStorage.setItem("stargate-privacy-ai-consent", "true");
    }
  }

  // ─── Load AI settings from localStorage ───────────────────────────────────
  useEffect(() => {
    const savedProvider = localStorage.getItem("stargate-ai-provider");
    const savedModel = localStorage.getItem("stargate-ai-model");
    const savedApiKey = localStorage.getItem("stargate-ai-api-key");
    const savedInstructions = localStorage.getItem("stargate-ai-custom-instructions");
    if (savedProvider) setAiProvider(savedProvider);
    if (savedModel) setAiModel(savedModel);
    if (savedApiKey) setAiApiKey(savedApiKey);
    if (savedInstructions) setCustomInstructions(savedInstructions);

    // Restore sidebar preference
    const sidebarPref = localStorage.getItem("stargate-ai-sidebar");
    if (sidebarPref === "closed") setSidebarOpen(false);
  }, []);

  // ─── Load trade data ──────────────────────────────────────────────────────
  const TRADE_TABLE_MAP: Record<string, string> = {
    crypto: "trades",
    stocks: "stock_trades",
    commodities: "commodity_trades",
    forex: "forex_trades",
  };

  const fetchTrades = useCallback(async () => {
    const assetTypes = ["crypto", "stocks", "commodities", "forex"] as const;
    const results = await Promise.all(
      assetTypes.map(async (at) => {
        const table = TRADE_TABLE_MAP[at];
        const { data } = await fetchAllTrades(supabase, "*", table);
        return (data ?? []).map((t: Record<string, unknown>) => ({
          ...t,
          symbol: (t.symbol as string) ?? (t.pair as string) ?? "Unknown",
          _assetType: at,
        }));
      })
    );
    const allTrades = results.flat() as unknown as Trade[];
    setTrades(allTrades.length === 0 ? DEMO_TRADES : allTrades);
  }, [supabase]);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("journal_notes")
      .select("*")
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return;
    setNotes((data as JournalNote[]) ?? []);
  }, [supabase]);

  const fetchPlaybooks = useCallback(async () => {
    try {
      const res = await fetch("/api/playbook");
      if (res.ok) {
        const data = await res.json();
        setPlaybooks(data.playbooks ?? []);
      }
    } catch {
      // Playbooks table may not exist yet
    }
  }, []);

  // ─── Load conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations?limit=30");
      if (res.ok) {
        const { conversations: convs } = await res.json();
        setConversations(convs ?? []);
      }
    } catch {
      // Table may not exist yet — silently continue
    }
  }, []);

  // ─── Load memories ────────────────────────────────────────────────────────
  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/memories");
      if (res.ok) {
        const { memories: mems } = await res.json();
        setMemories(mems ?? []);
      }
    } catch {
      // Table may not exist yet
    }
  }, []);

  // ─── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetchTrades(),
      fetchNotes(),
      fetchPlaybooks(),
      fetchConversations(),
      fetchMemories(),
    ]).then(() => setLoading(false));
  }, [fetchTrades, fetchNotes, fetchPlaybooks, fetchConversations, fetchMemories]);

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Load conversation messages when active conversation changes ──────────
  useEffect(() => {
    if (!activeConversationId || sending) return;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/ai/conversations/${activeConversationId}`);
        if (res.ok) {
          const { messages: msgs } = await res.json();
          if (msgs && msgs.length > 0) {
            setMessages(
              msgs.map((m: { role: string; content: string }) => ({
                role: m.role as Message["role"],
                content: m.content,
              }))
            );
          } else {
            setMessages([]);
          }
        }
      } catch {
        // If it fails, start with empty messages
        setMessages([]);
      }
    }

    loadMessages();
  }, [activeConversationId]);

  // ─── Conversation management ──────────────────────────────────────────────
  async function createNewConversation(): Promise<string | null> {
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const { conversation } = await res.json();
        setConversations((prev) => [conversation, ...prev]);
        return conversation.id;
      }
    } catch {
      // Fall through
    }
    return null;
  }

  async function handleNewChat() {
    // Trigger memory extraction for the previous conversation if it had enough messages
    if (activeConversationId && messages.length >= 6) {
      extractMemories(activeConversationId, messages);
    }

    const newId = await createNewConversation();
    if (newId) {
      setActiveConversationId(newId);
      setMessages([]);
      setDemoMode(false);
    } else {
      // Fallback: just clear local state
      setActiveConversationId(null);
      setMessages([]);
      setDemoMode(false);
    }
  }

  async function handleSelectConversation(id: string) {
    // Trigger memory extraction for the previous conversation if it had enough messages
    if (activeConversationId && activeConversationId !== id && messages.length >= 6) {
      extractMemories(activeConversationId, messages);
    }
    setActiveConversationId(id);
    setDemoMode(false);
  }

  async function handleDeleteConversation(id: string) {
    try {
      await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch {
      // Silently fail
    }
  }

  async function handleRenameConversation(id: string, title: string) {
    try {
      await fetch(`/api/ai/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch {
      // Silently fail
    }
  }

  // ─── Memory management ────────────────────────────────────────────────────
  async function handleDeleteMemory(id: string) {
    try {
      await fetch(`/api/ai/memories/${id}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // Silently fail
    }
  }

  function extractMemories(conversationId: string, msgs: Message[]) {
    const chatMsgs = msgs
      .filter((m) => m.role !== "error")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    if (chatMsgs.length < 4) return;

    // Fire and forget
    fetch("/api/ai/extract-memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        messages: chatMsgs.slice(-30),
        provider: aiProvider,
        model: aiModel,
        ...(aiApiKey ? { apiKey: aiApiKey } : {}),
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const { memories: newMems } = await res.json();
          if (newMems && newMems.length > 0) {
            setMemories((prev) => [...newMems, ...prev]);
          }
        }
      })
      .catch(() => { /* fire and forget */ });
  }

  // ─── Save messages after streaming ────────────────────────────────────────
  async function saveMessages(conversationId: string, userMsg: string, assistantMsg: string) {
    try {
      const res = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMsg,
          assistantMessage: assistantMsg,
        }),
      });
      // Update conversation in the list using server-returned metadata
      if (res.ok) {
        const { conversation: serverConv } = await res.json();
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, ...(serverConv || {}), message_count: serverConv?.message_count ?? c.message_count + 2 }
              : c
          ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      }
    } catch {
      // Non-critical — messages are already displayed
    }
  }

  // ─── Send message ─────────────────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    // Ensure we have a conversation
    let convId = activeConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (convId) {
        setActiveConversationId(convId);
      }
    }

    // Build conversation history (excluding the message we just added)
    const history = messages
      .filter((m) => m.role !== "error")
      .slice(-24)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Skip sending heavy trade/note/playbook data for follow-up messages —
    // the AI already has context from the first message in this conversation.
    const isFollowUp = history.length > 0;

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          trades: isFollowUp ? [] : trades,
          notes: isFollowUp ? [] : notes,
          playbooks: isFollowUp ? [] : playbooks,
          history,
          customInstructions: customInstructions || undefined,
          provider: aiProvider,
          model: aiModel,
          ...(aiApiKey ? { apiKey: aiApiKey } : {}),
          ...(convId ? { conversationId: convId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        if (data.error?.includes("not configured")) {
          setDemoMode(true);
          const demoReply = DEMO_RESPONSES[msg] ?? DEMO_FALLBACK;
          await new Promise((r) => setTimeout(r, 800));
          setMessages((prev) => [...prev, { role: "assistant", content: demoReply }]);
        } else {
          setMessages((prev) => [...prev, { role: "error", content: data.error || "Something went wrong." }]);
        }
        return;
      }

      // Stream response
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6);
              if (payload === "[DONE]") break;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.text) {
                  accumulated += parsed.text;
                  const current = accumulated;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: current };
                    return updated;
                  });
                }
                if (parsed.error) {
                  setMessages((prev) => [
                    ...prev.slice(0, -1),
                    { role: "error", content: parsed.error },
                  ]);
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }
      }

      // Save messages to database after streaming completes
      if (convId && accumulated) {
        saveMessages(convId, msg, accumulated);
      }
    } catch {
      const demoReply = DEMO_RESPONSES[msg] ?? DEMO_FALLBACK;
      setDemoMode(true);
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => [...prev, { role: "assistant", content: demoReply }]);
    } finally {
      setSending(false);
    }
  }

  // ─── Toggle sidebar ───────────────────────────────────────────────────────
  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("stargate-ai-sidebar", next ? "open" : "closed");
      return next;
    });
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  // ─── Consent gate (GDPR Art. 6(1)(a)) ────────────────────────────────────
  if (!consentLoading && aiConsent !== true) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-6">
        <Brain size={48} className="text-accent mb-6" />
        <h2 className="text-xl font-bold text-foreground mb-3">Nova Data Processing Consent</h2>
        <div className="text-sm text-muted leading-relaxed space-y-3 mb-8">
          <p>
            Nova analyzes your trade data to provide personalized behavioral coaching.
            To do this, your trade history, journal entries, and playbook rules are sent to
            a third-party AI provider (Anthropic, OpenAI, or Google) for processing.
          </p>
          <p>
            These providers <strong className="text-foreground">do not retain your data</strong> beyond
            the individual request. No data is used to train their models.
          </p>
          <p className="text-[11px] text-muted/60">
            Legal basis: GDPR Art. 6(1)(a) — explicit consent. You can withdraw consent
            anytime in Settings &gt; Legal &amp; Privacy.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-accent/30 transition-all"
          >
            No thanks
          </Link>
          <button
            onClick={grantAiConsent}
            className="px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
          >
            I consent — Start Nova
          </button>
        </div>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
            title={sidebarOpen ? "Hide conversations" : "Show conversations"}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <div>
            <h1 id="tour-ai-header" className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Brain size={24} className="text-accent" />
              Nova
              <InfoTooltip text="Your personal trading coach — powered by deep psychology and your actual performance data" articleId="an-insights" />
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Ask about your patterns, psychology, and performance
            </p>
            {demoMode && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                <Sparkles size={10} />
                Demo Mode — sample responses
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemoryPanel(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
            title="Nova's memories"
          >
            <Brain size={14} />
            Memories
            {memories.length > 0 && (
              <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{memories.length}</span>
            )}
          </button>
          <Link
            href="/dashboard/settings?tab=ai"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
            title="Nova settings"
          >
            <Settings size={14} />
            Settings
          </Link>
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-accent hover:bg-accent/10 transition-all"
            >
              <MessageSquare size={14} />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Main content: sidebar + chat */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Conversation sidebar */}
        {sidebarOpen && (
          <div className="w-[260px] shrink-0 rounded-2xl border border-border bg-surface p-3 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              onNewChat={handleNewChat}
              onDelete={handleDeleteConversation}
              onRename={handleRenameConversation}
            />
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-4 space-y-4 mb-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-accent" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">
                  Nova — Your Trading Coach
                </h2>
                <p className="text-sm text-muted max-w-md mb-8">
                  Ask about your patterns, psychology, risk management,
                  or anything about your trading data. The AI has access to your full trade history
                  across all asset classes, journal notes, emotions, process scores, and more.
                </p>

                {/* Suggested questions */}
                <div id="tour-ai-suggestions" className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={sending}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 text-muted hover:text-foreground transition-all"
                    >
                      <MessageSquare size={12} className="inline mr-2 text-accent/60" />
                      {q}
                    </button>
                  ))}
                </div>
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
                {demoMode && !sending && messages.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Demo mode — these are sample responses to preview the feature.
                      Contact the administrator to enable live AI analysis.
                    </p>
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
              AI analyzes your full trade history and journal notes across all asset classes. Responses are not financial advice.
            </p>
          </div>
        </div>
      </div>

      {/* Memory panel modal */}
      {showMemoryPanel && (
        <MemoryPanel
          memories={memories}
          onDelete={handleDeleteMemory}
          onClose={() => setShowMemoryPanel(false)}
        />
      )}
    </div>
  );
}
