"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  ArrowLeft,
  X,
  Mail,
  Clock,
  MessageCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useGuide } from "./guide-context";

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  display_name: string;
  created_at: string;
};

type SupportMessage = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  display_name: string;
  is_owner_reply: boolean;
  created_at: string;
};

function isSupportOnline(): boolean {
  const cetHour = parseInt(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Berlin",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  return cetHour >= 14 && cetHour < 20;
}

function getNextOnlineTime(): string {
  const now = new Date();
  const cetFormatter = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Berlin",
    hour: "numeric",
    hour12: false,
  });
  const cetHour = parseInt(cetFormatter.format(now));

  if (cetHour < 14) {
    return "2:00 PM CET today";
  }
  return "2:00 PM CET tomorrow";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function GuideSupport() {
  const { state, closeMenu, setMenuPanel } = useGuide();
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"list" | "chat">("list");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketJustCreated, setTicketJustCreated] = useState(false);

  const open = state.menuOpen && state.menuPanel === "support";
  const online = isSupportOnline();
  const supabase = createClient();

  // Fetch tickets on open
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? []);
        // If there's an open ticket, auto-open it
        const openTicket = (data.tickets ?? []).find(
          (t: SupportTicket) => t.status === "open",
        );
        if (openTicket) {
          setActiveTicketId(openTicket.id);
          setView("chat");
        }
      }
    } catch {
      // Silently fail — tickets list just stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchTickets();
  }, [open, fetchTickets]);

  // Fetch messages when viewing a ticket
  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(
        `/api/support/messages?ticketId=${ticketId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (activeTicketId && view === "chat") {
      fetchMessages(activeTicketId);
    }
  }, [activeTicketId, view, fetchMessages]);

  // Supabase Realtime subscription for live messages
  useEffect(() => {
    if (!activeTicketId || view !== "chat") return;

    const channel = supabase
      .channel(`support-${activeTicketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${activeTicketId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as SupportMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTicketId, view, supabase]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (open && view === "chat") {
      inputRef.current?.focus();
    }
  }, [open, view]);

  // Escape closes
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
        const guideEl = (window as unknown as Record<string, unknown>)
          .__traverseGuideEl as HTMLElement | undefined;
        if (guideEl?.contains(e.target as Node)) return;
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, closeMenu]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setError(null);
    try {
      if (!activeTicketId) {
        // First message — create ticket (subject auto-generated from message)
        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to create ticket");
          return;
        }
        setActiveTicketId(data.ticketId);
        setTicketJustCreated(true);
        setMessage("");
        fetchMessages(data.ticketId);
      } else {
        // Subsequent messages — add to existing ticket
        const res = await fetch("/api/support/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: activeTicketId,
            message: message.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to send message");
          return;
        }
        setMessage("");
        fetchMessages(activeTicketId);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function openTicket(ticket: SupportTicket) {
    setActiveTicketId(ticket.id);
    setView("chat");
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
              onClick={() => {
                if (view === "chat") {
                  setView("list");
                  setActiveTicketId(null);
                  setMessages([]);
                  setError(null);
                  setTicketJustCreated(false);
                } else {
                  setMenuPanel("main");
                }
              }}
              className="p-1 rounded-lg text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
              />
              <p className="text-sm font-bold text-foreground">
                {view === "chat" ? "Support Chat" : "Live Support"}
              </p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-1 rounded-lg text-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
            <p className="text-[11px] text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── List view ── */}
          {view === "list" && (
            <div className="p-4 space-y-3">
              {/* Status banner */}
              <div
                className={`rounded-xl p-3 border ${
                  online
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-surface border-border/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                  />
                  <p className="text-xs font-semibold text-foreground">
                    {online ? "Support is online" : "Support is offline"}
                  </p>
                </div>
                <p className="text-[10px] text-muted">
                  {online
                    ? "Available now — start a conversation and get a personal reply."
                    : `Back ${getNextOnlineTime()}. Leave a message and we'll reply when we're back.`}
                </p>
                <p className="text-[10px] text-muted/60 mt-1">
                  This is ticket-based support. Replies may take up to a few hours.
                </p>
              </div>

              {/* New conversation button */}
              <button
                onClick={() => {
                  setActiveTicketId(null);
                  setMessages([]);
                  setTicketJustCreated(false);
                  setView("chat");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Plus size={16} className="text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Start a Conversation
                  </p>
                  <p className="text-[10px] text-muted">
                    {online ? "Get help now" : "Leave a message"}
                  </p>
                </div>
              </button>

              {/* Previous tickets */}
              {loading ? (
                <p className="text-[11px] text-muted text-center py-4">
                  Loading...
                </p>
              ) : tickets.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted uppercase tracking-wider font-semibold px-1">
                    Previous conversations
                  </p>
                  {tickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openTicket(t)}
                      className="w-full text-left px-3 py-2.5 rounded-xl border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
                          {t.subject}
                        </p>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                            t.status === "open"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : t.status === "resolved"
                                ? "bg-accent/10 text-accent"
                                : "bg-surface text-muted"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted mt-0.5">
                        {timeAgo(t.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Email fallback */}
              <div className="pt-2 border-t border-border/20">
                <a
                  href="mailto:support@traversejournal.com"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  <Mail size={14} />
                  <span>support@traversejournal.com</span>
                </a>
                <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-muted/60">
                  <Clock size={10} />
                  <span>Support hours: 14:00 – 20:00 CET (Mon–Sun)</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Chat view ── */}
          {view === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[290px] max-sm:max-h-[calc(85vh-180px)]">
                {messages.length === 0 && !ticketJustCreated ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageCircle
                      size={24}
                      className="text-accent mb-2"
                    />
                    <p className="text-xs text-foreground font-medium mb-1">
                      Start a conversation
                    </p>
                    <p className="text-[10px] text-muted">
                      Type your message below and hit send.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.is_owner_reply ? (
                          <div className="flex justify-start">
                            <div className="bg-accent/5 border border-accent/20 rounded-2xl rounded-tl-md px-3 py-2 max-w-[85%] text-xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-bold text-accent">
                                  Traverse Support
                                </span>
                                <span className="text-[9px] text-muted">
                                  {timeAgo(msg.created_at)}
                                </span>
                              </div>
                              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <div className="bg-surface border border-border/50 text-foreground rounded-2xl rounded-tr-md px-3 py-2 max-w-[80%] text-xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-medium text-muted">
                                  You
                                </span>
                                <span className="text-[9px] text-muted/60">
                                  {timeAgo(msg.created_at)}
                                </span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {ticketJustCreated && (
                      <div className="flex justify-start">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl rounded-tl-md px-3 py-2 max-w-[85%] text-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 size={10} className="text-emerald-400" />
                            <span className="text-[9px] font-bold text-emerald-400">
                              Message received
                            </span>
                          </div>
                          <p className="text-muted leading-relaxed">
                            We typically reply within a few hours during support hours (14:00–20:00 CET).
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat input */}
              <div className="border-t border-border/30 p-3">
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
                    maxLength={2000}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="px-3 py-2.5 rounded-xl bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
