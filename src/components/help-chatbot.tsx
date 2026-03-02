"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, X, Send, ExternalLink } from "lucide-react";
import {
  FAQ_ENTRIES,
  FAQ_MAP,
  FAQ_CATEGORIES,
  scoreFaq,
  type FaqEntry,
} from "@/lib/help-content";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  relatedIds?: string[];
  matchId?: string;
};

const SUGGESTED = [
  "How do I log a trade?",
  "What is the process score?",
  "How does the AI Coach work?",
  "Can I import from my exchange?",
];

const HTML_CLASSES =
  "[&_strong]:text-foreground [&_strong]:font-semibold [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-[11px] [&_a]:text-accent [&_a]:underline";

export function HelpChatbot() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape key closes
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Click outside closes
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const submitQuestion = useCallback((question: string) => {
    const q = question.trim();
    if (!q) return;

    const userMsg: ChatMessage = { role: "user", content: q };

    const scored = FAQ_ENTRIES.map((e) => ({ entry: e, score: scoreFaq(e, q) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    let assistantMsg: ChatMessage;
    if (scored.length > 0) {
      const best = scored[0].entry;
      assistantMsg = {
        role: "assistant",
        content: best.answer,
        relatedIds: best.relatedIds.slice(0, 3),
        matchId: best.id,
      };
    } else {
      assistantMsg = {
        role: "assistant",
        content:
          "I couldn't find a match. Try different keywords or browse the <strong>Help Center</strong> for all topics.",
      };
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    submitQuestion(input);
    setInput("");
  }

  function goToHelpCenter(query?: string) {
    setOpen(false);
    router.push(query ? `/dashboard/help?q=${encodeURIComponent(query)}` : "/dashboard/help");
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-40">
      {/* Chat Panel */}
      {open && (
        <div
          className="absolute bottom-16 right-0 w-[360px] max-h-[480px] rounded-2xl border border-border/50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200 max-sm:fixed max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:max-h-[85vh] max-sm:rounded-b-none"
          style={{
            background: "var(--background)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <HelpCircle size={14} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">
                  Help
                </p>
                <p className="text-[10px] text-muted">
                  {FAQ_ENTRIES.length} answers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToHelpCenter()}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                title="Open Help Center"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px] max-sm:max-h-[calc(85vh-130px)]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <p className="text-xs text-muted mb-4">
                  Ask anything about Stargate
                </p>
                <div className="flex flex-col gap-1.5 w-full">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => submitQuestion(q)}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border border-border/50 hover:border-accent/30 hover:bg-accent/5 text-muted hover:text-foreground transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-accent/10 border border-accent/20 text-foreground rounded-2xl rounded-tr-md px-3 py-2 max-w-[80%] text-xs">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="bg-surface border border-border/50 rounded-2xl rounded-tl-md px-3 py-2 max-w-[85%] text-xs text-muted leading-relaxed">
                          <div
                            className={HTML_CLASSES}
                            dangerouslySetInnerHTML={{ __html: msg.content }}
                          />
                          {msg.relatedIds && msg.relatedIds.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/20 flex flex-wrap gap-1">
                              {msg.relatedIds.map((rid) => {
                                const related = FAQ_MAP[rid];
                                if (!related) return null;
                                return (
                                  <button
                                    key={rid}
                                    onClick={() =>
                                      submitQuestion(related.question)
                                    }
                                    className="px-2 py-1 rounded-md text-[10px] font-medium bg-accent/5 text-accent/80 border border-accent/10 hover:bg-accent/10 transition-all text-left"
                                  >
                                    {related.question}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {msg.matchId && (
                            <button
                              onClick={() => {
                                const entry = FAQ_MAP[msg.matchId!];
                                if (entry) goToHelpCenter(entry.question);
                              }}
                              className="mt-2 text-[10px] text-accent/60 hover:text-accent transition-colors flex items-center gap-1"
                            >
                              <ExternalLink size={10} />
                              View in Help Center
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/30 p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-3 py-2.5 rounded-xl bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
          open
            ? "bg-surface border border-border/50 text-foreground rotate-0"
            : "bg-accent text-background hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] hover:scale-105"
        }`}
        aria-label={open ? "Close help" : "Open help"}
      >
        {open ? <X size={18} /> : <HelpCircle size={20} />}
      </button>
    </div>
  );
}
