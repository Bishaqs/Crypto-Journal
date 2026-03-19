"use client";

import { useEffect, useState } from "react";
import { X, Zap, Flame, Trophy, BarChart3, BookOpen, CheckCircle, Coins, Brain } from "lucide-react";

type UserDetail = {
  level: number;
  totalXp: number;
  xpToday: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  achievementCount: number;
  tradeCount: number;
  noteCount: number;
  checkinCount: number;
  recentXpEvents: { source: string; xp_amount: number; created_at: string }[];
  psychologyTier: string;
  coins: { balance: number; totalEarned: number; totalSpent: number };
  displayName: string | null;
  subscription: {
    tier: string;
    isTrial: boolean;
    isBanned: boolean;
    isOwner: boolean;
    createdAt: string;
    lastSeen: string | null;
  } | null;
};

type Props = {
  userId: string;
  email: string;
  onClose: () => void;
};

const SOURCE_LABELS: Record<string, string> = {
  trade_logged: "Trade Logged",
  trade_with_notes: "Trade + Notes",
  journal_entry: "Journal Entry",
  checkin: "Check-in",
  behavioral_log: "Behavioral Log",
  trade_plan: "Trade Plan",
  weekly_review: "Weekly Review",
  streak_bonus: "Streak Bonus",
  challenge_completed: "Challenge",
  achievement_bronze: "Achievement (Bronze)",
  achievement_silver: "Achievement (Silver)",
  achievement_gold: "Achievement (Gold)",
  achievement_diamond: "Achievement (Diamond)",
  achievement_legendary: "Achievement (Legendary)",
  achievement_single: "Achievement",
};

export function UserDetailPanel({ userId, email, onClose }: Props) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/admin/analytics/user-detail?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user detail");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-surface border-l border-border overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{data?.displayName ?? email}</h2>
            {data?.displayName && <p className="text-xs text-muted truncate">{email}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-hover transition-colors shrink-0">
            <X size={18} className="text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-border/20 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-loss/20 bg-loss/5 p-4 text-sm text-loss">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Subscription Info */}
              {data.subscription && (
                <div className="flex items-center gap-2 flex-wrap">
                  <TierBadge tier={data.subscription.tier} />
                  {data.subscription.isTrial && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">TRIAL</span>
                  )}
                  {data.subscription.isOwner && (
                    <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">OWNER</span>
                  )}
                  {data.subscription.isBanned && (
                    <span className="text-[10px] font-semibold text-loss bg-loss/10 px-2 py-0.5 rounded-full">BANNED</span>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MiniStat icon={Zap} label="Level" value={data.level} />
                <MiniStat icon={Zap} label="Total XP" value={data.totalXp.toLocaleString()} />
                <MiniStat icon={Flame} label="Streak" value={`${data.currentStreak}d`} sub={`Best: ${data.longestStreak}d`} />
                <MiniStat icon={Trophy} label="Achievements" value={data.achievementCount} />
                <MiniStat icon={BarChart3} label="Trades" value={data.tradeCount} />
                <MiniStat icon={BookOpen} label="Notes" value={data.noteCount} />
                <MiniStat icon={CheckCircle} label="Check-ins" value={data.checkinCount} />
                <MiniStat icon={Coins} label="Coins" value={data.coins.balance} sub={`Earned: ${data.coins.totalEarned}`} />
                <MiniStat icon={Brain} label="Psych Tier" value={data.psychologyTier} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-hover rounded-xl p-3">
                  <span className="text-muted">Signed Up</span>
                  <p className="text-foreground font-medium mt-0.5">
                    {data.subscription?.createdAt
                      ? new Date(data.subscription.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div className="bg-surface-hover rounded-xl p-3">
                  <span className="text-muted">Last Active</span>
                  <p className="text-foreground font-medium mt-0.5">
                    {data.subscription?.lastSeen
                      ? formatRelative(data.subscription.lastSeen)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Recent XP Events */}
              <div>
                <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Recent Activity</h3>
                {data.recentXpEvents.length === 0 ? (
                  <p className="text-xs text-muted">No recent activity</p>
                ) : (
                  <div className="space-y-1">
                    {data.recentXpEvents.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          <span className="text-xs text-foreground truncate">
                            {SOURCE_LABELS[ev.source] ?? ev.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold text-accent">+{ev.xp_amount} XP</span>
                          <span className="text-[10px] text-muted tabular-nums">
                            {formatRelative(ev.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-surface-hover rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-accent" />
        <span className="text-[10px] font-medium text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground tabular-nums capitalize">{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: "text-muted bg-surface-hover",
    pro: "text-amber-400 bg-amber-400/10",
    max: "text-accent bg-accent/10",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[tier] ?? styles.free}`}>
      {tier}
    </span>
  );
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
