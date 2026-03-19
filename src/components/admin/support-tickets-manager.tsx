"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type SupportTicketAdmin = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  display_name: string | null;
  created_at: string;
  resolved_at: string | null;
};

type SupportMessage = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  display_name: string | null;
  is_owner_reply: boolean;
  created_at: string;
};

const STATUS_FILTERS = ["all", "open", "resolved", "closed"] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function AdminSupportTicketsManager({
  initialTickets,
}: {
  initialTickets: SupportTicketAdmin[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  const fetchMessages = useCallback(async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/support/admin?ticketId=${ticketId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (expandedId) {
      fetchMessages(expandedId);
    } else {
      setMessages([]);
    }
  }, [expandedId, fetchMessages]);

  async function handleReply(ticketId: string) {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/support/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, message: reply.trim() }),
      });
      if (res.ok) {
        setReply("");
        fetchMessages(ticketId);
      }
    } catch {
      // Silent fail
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(
    ticketId: string,
    status: "resolved" | "closed",
  ) {
    try {
      const res = await fetch("/api/support/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status }),
      });
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status,
                  resolved_at:
                    status === "resolved" ? new Date().toISOString() : t.resolved_at,
                }
              : t,
          ),
        );
      }
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="p-5 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const count =
            f === "all"
              ? tickets.length
              : tickets.filter((t) => t.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
        {openCount > 0 && (
          <span className="ml-auto text-[10px] font-medium text-emerald-400">
            {openCount} open
          </span>
        )}
      </div>

      {/* Tickets list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">
            No tickets in this category
          </p>
        ) : (
          filtered.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border ${
                t.status === "open"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-border bg-surface"
              }`}
            >
              {/* Ticket header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === t.id ? null : t.id)
                }
                className="w-full p-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {t.subject}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {t.display_name ?? "Anonymous"} &middot;{" "}
                      {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                    {expandedId === t.id ? (
                      <ChevronUp size={14} className="text-muted" />
                    ) : (
                      <ChevronDown size={14} className="text-muted" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded view */}
              {expandedId === t.id && (
                <div className="px-3 pb-3 border-t border-border/30">
                  {/* Messages */}
                  <div className="space-y-2 py-3 max-h-[300px] overflow-y-auto">
                    {loadingMessages ? (
                      <p className="text-[11px] text-muted text-center py-4">
                        Loading messages...
                      </p>
                    ) : messages.length === 0 ? (
                      <p className="text-[11px] text-muted text-center py-4">
                        No messages yet
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-lg p-2.5 text-xs ${
                            msg.is_owner_reply
                              ? "bg-accent/5 border border-accent/20 ml-4"
                              : "bg-surface border border-border/50 mr-4"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-[9px] font-semibold ${
                                msg.is_owner_reply ? "text-accent" : "text-muted"
                              }`}
                            >
                              {msg.is_owner_reply
                                ? "You (Support)"
                                : msg.display_name ?? "User"}
                            </span>
                            <span className="text-[9px] text-muted/60">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply input — always visible so admin can reply regardless of status */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                      <input
                        type="text"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(t.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleReply(t.id)}
                        disabled={!reply.trim() || sending}
                        className="p-2 rounded-lg bg-accent text-background hover:bg-accent-hover transition-colors disabled:opacity-40"
                      >
                        <Send size={12} />
                      </button>
                    </div>

                  {/* Status actions */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                    {t.status === "open" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(t.id, "resolved")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <CheckCircle2 size={12} />
                          Resolve
                        </button>
                        <button
                          onClick={() => handleStatusChange(t.id, "closed")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-loss hover:bg-loss/10 transition-colors"
                        >
                          <XCircle size={12} />
                          Close
                        </button>
                      </>
                    )}
                    {t.status !== "open" && (
                      <p className="text-[10px] text-muted flex items-center gap-1">
                        <MessageCircle size={10} />
                        {messages.length} message{messages.length !== 1 ? "s" : ""}
                        {t.resolved_at && ` — resolved ${formatDate(t.resolved_at)}`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
