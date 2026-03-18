"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ExternalLink, BookOpen, ArrowLeft, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FAQ_ENTRIES,
  FAQ_MAP,
  scoreFaq,
} from "@/lib/help-content";
import { useGuide } from "./guide-context";
import { useHelpCenter } from "@/lib/help-center-context";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  relatedIds?: string[];
  matchId?: string;
  noMatch?: boolean;
  originalQuestion?: string;
};

const SUGGESTED = [
  "How do I log a trade?",
  "What is the process score?",
  "How does the AI Coach work?",
  "Can I import from my exchange?",
];

const HTML_CLASSES =
  "[&_strong]:text-foreground [&_strong]:font-semibold [&_code]:bg-surface-hover [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-[11px] [&_a]:text-accent [&_a]:underline";

export function GuideHelp() {
  const { state, closeMenu, setMenuPanel } = useGuide();
  const helpCenter = useHelpCenter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const open = state.menuOpen && state.menuPanel === "chat";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape key closes
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) closeMenu();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, closeMenu]);

  // Click outside closes
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        const guideEl = (window as unknown as Record<string, unknown>).__traverseGuideEl as HTMLElement | undefined;
        if (guideEl?.contains(e.target as Node)) return;
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, closeMenu]);

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
        noMatch: true,
        originalQuestion: q,
      };
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    submitQuestion(input);
    setInput("");
  }

  async function handleSubmitQuestion(question: string) {
    if (submittedQuestions.has(question)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submitted-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (res.ok) {
        setSubmittedQuestions((prev) => new Set(prev).add(question));
      }
    } catch {
      // Silently fail — not critical
    } finally {
      setSubmitting(false);
    }
  }

  function goToHelpCenter(articleId?: string) {
    closeMenu();
    if (articleId) {
      helpCenter.openArticle(articleId);
    } else {
      helpCenter.openHelpCenter();
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
        className="fixed bottom-[88px] right-6 max-sm:right-4 max-sm:left-4 max-sm:bottom-[80px] z-50 w-[360px] max-h-[480px] rounded-2xl border border-border/50 overflow-hidden flex flex-col max-sm:w-auto"
        style={{
          background: "var(--background)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuPanel("main")}
              className="p-1 rounded-lg text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <p className="text-sm font-bold text-foreground">
              Quick Chat
            </p>
          </div>
          <button
            onClick={() => goToHelpCenter()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted hover:text-foreground hover:bg-surface-hover transition-all"
            title="Help Center"
          >
            <BookOpen size={12} />
            All
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px] max-sm:max-h-[calc(85vh-130px)]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <p className="text-xs text-muted mb-3">
                Ask anything about Traverse
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
                            onClick={() => goToHelpCenter(msg.matchId!)}
                            className="mt-2 text-[10px] text-accent/60 hover:text-accent transition-colors flex items-center gap-1"
                          >
                            <ExternalLink size={10} />
                            View in Help Center
                          </button>
                        )}
                        {msg.noMatch && msg.originalQuestion && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            {submittedQuestions.has(msg.originalQuestion) ? (
                              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <HelpCircle size={10} />
                                Question submitted! We&apos;ll add it to our FAQ.
                              </p>
                            ) : (
                              <button
                                onClick={() =>
                                  handleSubmitQuestion(msg.originalQuestion!)
                                }
                                disabled={submitting}
                                className="text-[10px] text-accent/70 hover:text-accent transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <HelpCircle size={10} />
                                {submitting
                                  ? "Submitting..."
                                  : "Submit this question to our team"}
                              </button>
                            )}
                          </div>
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
      </motion.div>
    </AnimatePresence>
  );
}
