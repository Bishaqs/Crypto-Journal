"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { HelpCircle, Search, ChevronDown, Send, MessageSquare } from "lucide-react";
import { Header } from "@/components/header";
import {
  FAQ_ENTRIES,
  FAQ_CATEGORIES,
  FAQ_MAP,
  scoreFaq,
  type FaqCategory,
  type FaqEntry,
} from "@/lib/help-content";

type HelpMessage = {
  role: "user" | "assistant";
  content: string;
  relatedIds?: string[];
};

const SUGGESTED_QUESTIONS = [
  "How do I log my first trade?",
  "What is the process score?",
  "How does the AI Trading Coach work?",
  "What is expectancy and why does it matter?",
  "How do I import trades from my exchange?",
  "Can I use Stargate on my phone?",
];

const HTML_CLASSES = "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_strong]:text-foreground [&_strong]:font-semibold [&_code]:bg-surface-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent [&_code]:text-xs [&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:mb-3 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mt-2 [&_ol]:mb-3 [&_ol]:space-y-1 [&_li]:text-sm";

function ChatBubble({ message, onRelatedClick }: { message: HelpMessage; onRelatedClick: (q: string) => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent/10 border border-accent/20 text-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%] text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-background border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%] text-sm text-muted leading-relaxed">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={14} className="text-accent" />
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
            Help Center
          </span>
        </div>
        <div
          className={HTML_CLASSES}
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
        {message.relatedIds && message.relatedIds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/20">
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold mb-2">
              Related Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {message.relatedIds.map((rid) => {
                const related = FAQ_MAP[rid];
                if (!related) return null;
                return (
                  <button
                    key={rid}
                    onClick={() => onRelatedClick(related.question)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/5 text-accent/80 border border-accent/10 hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all text-left"
                  >
                    {related.question}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HelpPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSubmitted = useRef(false);

  // FAQ library state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const submitQuestion = useCallback((question: string) => {
    const q = question.trim();
    if (!q) return;

    const userMsg: HelpMessage = { role: "user", content: q };

    const scored = FAQ_ENTRIES
      .map((e) => ({ entry: e, score: scoreFaq(e, q) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    let assistantMsg: HelpMessage;
    if (scored.length > 0) {
      const best = scored[0].entry;
      assistantMsg = {
        role: "assistant",
        content: best.answer,
        relatedIds: best.relatedIds,
      };
    } else {
      assistantMsg = {
        role: "assistant",
        content: "<p>I couldn't find an answer to that question. Try different keywords or browse the topics below.</p><p>You can also email <a href=\"mailto:support@stargate.trade\">support@stargate.trade</a> for help.</p>",
      };
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle ?q= URL param
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      submitQuestion(q);
    }
  }, [searchParams, submitQuestion]);

  function handleChatSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    submitQuestion(chatInput);
    setChatInput("");
  }

  // FAQ library filtering
  const filteredEntries = useMemo(() => {
    let entries = FAQ_ENTRIES;

    if (activeCategory !== "all") {
      entries = entries.filter((e) => e.category === activeCategory);
    }

    if (search.trim()) {
      const scored = entries
        .map((e) => ({ entry: e, score: scoreFaq(e, search) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score);
      return scored.map((s) => s.entry);
    }

    return entries;
  }, [search, activeCategory]);

  function handleAccordionRelatedClick(relatedId: string) {
    const entry = FAQ_MAP[relatedId];
    if (!entry) return;

    if (activeCategory !== "all" && entry.category !== activeCategory) {
      setActiveCategory("all");
    }
    setSearch("");
    setExpandedId(relatedId);

    requestAnimationFrame(() => {
      document.getElementById(`faq-${relatedId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  return (
    <div className="space-y-6 mx-auto max-w-[1600px]">
      <Header />

      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <HelpCircle size={24} className="text-accent" />
          Help Center
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Ask a question or browse topics below
        </p>
      </div>

      {/* ═══════ CHAT SECTION ═══════ */}
      <div
        className="glass rounded-2xl border border-border/50 overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Chat messages area */}
        <div className="h-[420px] md:h-[480px] overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-accent" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                Ask me anything
              </h3>
              <p className="text-sm text-muted max-w-md mb-6">
                Type a question about Stargate and I&apos;ll find the best answer for you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => submitQuestion(q)}
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
                <ChatBubble
                  key={i}
                  message={msg}
                  onRelatedClick={(q) => submitQuestion(q)}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border/30 p-4">
          <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question about Stargate..."
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-4 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* ═══════ FAQ LIBRARY ═══════ */}
      <div className="border-t border-border/30 pt-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Browse All Topics</h3>

        {/* Search */}
        <div className="relative w-full max-w-md mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter topics..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/30 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>

        {/* Category Chips */}
        <div
          className="flex gap-1 rounded-xl border border-border/50 p-1 glass overflow-x-auto mb-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeCategory === "all"
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            All
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(activeCategory === cat.key ? "all" : cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.key
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-xs text-muted mb-4">
          {filteredEntries.length} {filteredEntries.length === 1 ? "result" : "results"}
          {search && ` for "${search}"`}
        </p>

        {/* FAQ Accordion */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-2">
            {filteredEntries.map((entry) => {
              const isOpen = expandedId === entry.id;
              const categoryMeta = FAQ_CATEGORIES.find((c) => c.key === entry.category);
              return (
                <div
                  key={entry.id}
                  id={`faq-${entry.id}`}
                  className={`glass rounded-2xl border transition-all duration-300 ${
                    isOpen ? "border-accent/30" : "border-border/50 hover:border-accent/20"
                  }`}
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium uppercase tracking-wider shrink-0">
                        {categoryMeta?.label ?? entry.category}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">
                        {entry.question}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-muted shrink-0 ml-3 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 border-t border-border/30">
                      <div
                        className={`text-sm text-muted leading-relaxed mt-4 ${HTML_CLASSES}`}
                        dangerouslySetInnerHTML={{ __html: entry.answer }}
                      />

                      {entry.relatedIds.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-border/20">
                          <p className="text-[10px] uppercase tracking-wider text-muted/60 font-semibold mb-2">
                            Related Questions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {entry.relatedIds.map((rid) => {
                              const related = FAQ_MAP[rid];
                              if (!related) return null;
                              return (
                                <button
                                  key={rid}
                                  onClick={() => handleAccordionRelatedClick(rid)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/5 text-accent/80 border border-accent/10 hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all text-left"
                                >
                                  {related.question}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="glass rounded-2xl border border-border/50 p-12 flex flex-col items-center justify-center text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Search size={32} className="text-muted/30 mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No results found</h3>
            <p className="text-sm text-muted mb-4">
              Try different keywords or browse by category
            </p>
            <a
              href="mailto:support@stargate.trade"
              className="text-sm text-accent hover:text-accent-hover transition-colors font-medium"
            >
              Contact support &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted/40 pb-4">
        Can&apos;t find what you&apos;re looking for?{" "}
        <a
          href="mailto:support@stargate.trade"
          className="text-accent/60 hover:text-accent transition-colors"
        >
          Email support@stargate.trade
        </a>
      </div>
    </div>
  );
}
