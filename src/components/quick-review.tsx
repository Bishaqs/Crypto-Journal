"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type SessionReview = {
  timestamp: string;
  mood: string;
  note: string;
};

const MOODS = [
  { label: "Great", emoji: "🟢", value: "great" },
  { label: "Good", emoji: "🔵", value: "good" },
  { label: "Neutral", emoji: "⚪", value: "neutral" },
  { label: "Bad", emoji: "🟠", value: "bad" },
  { label: "Tilted", emoji: "🔴", value: "tilted" },
];

const STORAGE_KEY = "stargate-session-reviews";

function getReviews(): SessionReview[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveReview(review: SessionReview) {
  const existing = getReviews();
  existing.unshift(review);
  // Keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
}

export function QuickReview() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  function handleSave() {
    if (!mood) return;
    saveReview({
      timestamp: new Date().toISOString(),
      mood,
      note: note.trim(),
    });
    setMood("");
    setNote("");
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      setOpen(false);
    }, 1200);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-all duration-300"
        style={{ boxShadow: "var(--shadow-cosmic)" }}
        title="Quick Review"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 glass border border-border/50 rounded-2xl p-4 space-y-3"
          style={{ boxShadow: "var(--shadow-card)", backdropFilter: "blur(16px)" }}
        >
          {justSaved ? (
            <div className="text-center py-4">
              <p className="text-sm font-semibold text-win">Logged!</p>
              <p className="text-[11px] text-muted mt-1">Review saved to session history</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">How are you feeling?</p>

              {/* Mood selector */}
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex-1 py-2 rounded-xl text-center transition-all ${
                      mood === m.value
                        ? "bg-accent/15 border border-accent/40 scale-105"
                        : "bg-background border border-border hover:border-accent/20"
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <p className="text-[9px] text-muted mt-0.5">{m.label}</p>
                  </button>
                ))}
              </div>

              {/* Note input */}
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="Quick note (optional)..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-all"
              />

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!mood}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mood
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-border text-muted cursor-not-allowed"
                }`}
              >
                <Send size={14} />
                Log Review
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
