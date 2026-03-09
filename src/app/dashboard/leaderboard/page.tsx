"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trophy,
  Crown,
  Medal,
  Users,
  Star,
  Flame,
} from "lucide-react";
import { useLevel } from "@/lib/xp";
import { useCosmetics, renderCosmeticIcon } from "@/lib/cosmetics";
import type { LeaderboardEntry, CosmeticRarity } from "@/lib/cosmetics/types";

type SortKey = "xp" | "streak" | "achievements";

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Trophy }[] = [
  { key: "xp", label: "Level / XP", icon: Star },
  { key: "streak", label: "Streak", icon: Flame },
  { key: "achievements", label: "Achievements", icon: Trophy },
];

const RARITY_COLORS: Record<CosmeticRarity, string> = {
  common: "text-gray-400",
  uncommon: "text-emerald-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
  mythic: "text-red-400",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <Crown size={18} className="text-amber-400" />;
  if (rank === 2)
    return <Medal size={18} className="text-gray-300" />;
  if (rank === 3)
    return <Medal size={18} className="text-orange-400" />;
  return (
    <span className="text-xs font-bold text-muted w-5 text-center">
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const { level } = useLevel();
  const { definitions } = useCosmetics();
  const [entries, setEntries] = useState<
    (LeaderboardEntry & { rank?: number })[]
  >([]);
  const [myPosition, setMyPosition] = useState<
    (LeaderboardEntry & { rank: number }) | null
  >(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("xp");

  // Opt-in form state
  const [showOptIn, setShowOptIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  // Build cosmetic ID -> css_class lookup map
  const cssClassMap = useMemo(() => {
    const map = new Map<string, string>();
    definitions.forEach((d) => {
      if (d.css_class) map.set(d.id, d.css_class);
    });
    return map;
  }, [definitions]);

  // Build title badge CSS class -> definition map for display name lookup
  const titleMap = useMemo(() => {
    const map = new Map<string, { name: string; rarity: CosmeticRarity }>();
    definitions
      .filter((d) => d.type === "title_badge")
      .forEach((d) => {
        // Map both by ID and by css_class for flexible lookup
        map.set(d.id, { name: d.name, rarity: d.rarity });
        if (d.css_class) map.set(d.css_class, { name: d.name, rarity: d.rarity });
      });
    return map;
  }, [definitions]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard?sort=${sort}&limit=50`);
      const data = await res.json();
      setEntries(
        (data.entries ?? []).map(
          (e: LeaderboardEntry, i: number) => ({
            ...e,
            rank: i + 1,
          }),
        ),
      );
      setMyPosition(data.myPosition);
      setHasProfile(data.hasProfile ?? false);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [sort]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  async function handleOptIn() {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          is_public: true,
        }),
      });
      setShowOptIn(false);
      fetchLeaderboard();
    } catch {
      // silently fail
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users size={24} className="text-accent" />
            Leaderboard
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Ranked by journaling dedication — never by P&L
          </p>
        </div>

        {!hasProfile && (
          <button
            onClick={() => setShowOptIn(true)}
            className="px-4 py-2 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all"
          >
            Join Leaderboard
          </button>
        )}
      </div>

      {/* Opt-in modal */}
      {showOptIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="glass border border-border/50 rounded-2xl w-full max-w-md p-6"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <h2 className="text-lg font-bold text-foreground mb-2">
              Join the Leaderboard
            </h2>
            <p className="text-xs text-muted mb-4">
              Choose a display name. Your P&L is never shown — only
              journaling discipline metrics.
            </p>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (2-30 characters)"
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowOptIn(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted text-sm font-semibold hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleOptIn}
                disabled={
                  !displayName.trim() ||
                  displayName.trim().length < 2 ||
                  saving
                }
                className="flex-1 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all disabled:opacity-40"
              >
                {saving ? "Saving..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              sort === opt.key
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-background border-border text-muted hover:text-foreground"
            }`}
          >
            <opt.icon size={14} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      {entries.length === 0 ? (
        <div
          className="glass rounded-2xl border border-border/50 p-12 text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Users size={40} className="text-muted/30 mx-auto mb-4" />
          <p className="text-sm text-muted">
            No public profiles yet. Be the first to join!
          </p>
        </div>
      ) : (
        <div
          className="glass rounded-2xl border border-border/50 overflow-hidden"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Table header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border text-[10px] text-muted uppercase tracking-wider font-semibold">
            <div className="w-8 text-center">#</div>
            <div className="flex-1">Trader</div>
            <div className="w-16 text-center">Level</div>
            <div className="w-20 text-right">
              {sort === "streak"
                ? "Streak"
                : sort === "achievements"
                  ? "Achiev."
                  : "XP"}
            </div>
          </div>

          {/* Entries */}
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const titleInfo = entry.title_badge ? titleMap.get(entry.title_badge) : null;

            return (
              <div
                key={entry.user_id}
                className={`relative overflow-hidden border-b border-border/30 transition-colors hover:bg-surface-hover ${
                  isTop3 ? "bg-accent/3" : ""
                }`}
              >
                {/* Banner gradient overlay */}
                {entry.banner && (
                  <div
                    className={`absolute inset-0 ${cssClassMap.get(entry.banner) ?? entry.banner} opacity-30 pointer-events-none`}
                  />
                )}

                {/* Row content */}
                <div className="relative z-10 flex items-center gap-3 px-5 py-3">
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    <RankBadge rank={rank} />
                  </div>

                  {/* Name + cosmetics */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    {/* Avatar frame + icon preview */}
                    <div
                      className={`w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0 ${entry.avatar_frame ? (cssClassMap.get(entry.avatar_frame) ?? entry.avatar_frame) : ""}`}
                    >
                      {entry.avatar_icon ? (
                        <span className="text-accent">{renderCosmeticIcon(cssClassMap.get(entry.avatar_icon) ?? entry.avatar_icon, 16)}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted">
                          {entry.current_level}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold text-foreground truncate ${entry.name_style ? (cssClassMap.get(entry.name_style) ?? "") : ""}`}>
                        {entry.display_name}
                      </p>
                      {titleInfo ? (
                        <span className={`text-[10px] font-semibold ${RARITY_COLORS[titleInfo.rarity]}`}>
                          {titleInfo.name}
                        </span>
                      ) : entry.title_badge ? (
                        <span className="text-[10px] text-accent">
                          {entry.title_badge}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Level */}
                  <div className="w-16 text-center">
                    <span className="text-xs font-bold text-foreground">
                      {entry.current_level}
                    </span>
                  </div>

                  {/* Metric */}
                  <div className="w-20 text-right">
                    <span className="text-xs font-semibold text-accent">
                      {sort === "streak"
                        ? `${entry.current_streak}d`
                        : sort === "achievements"
                          ? entry.achievement_count
                          : entry.total_xp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My position (fixed bottom) */}
      {myPosition && (
        <div
          className="mt-4 glass rounded-2xl border border-accent/30 p-4 flex items-center gap-3"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <div className="w-8 flex justify-center">
            <span className="text-xs font-bold text-accent">
              #{myPosition.rank}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {myPosition.display_name}{" "}
              <span className="text-xs text-muted">(You)</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-accent">
              Lv. {myPosition.current_level}
            </span>
            <span className="text-xs text-muted ml-2">
              {myPosition.total_xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
