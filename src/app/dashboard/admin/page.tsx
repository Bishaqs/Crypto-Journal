import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Users, CreditCard, Ticket, TrendingUp, AlertTriangle } from "lucide-react";

type UserSub = {
  user_id: string;
  tier: string;
  is_owner: boolean;
  is_trial: boolean;
  created_at: string;
  updated_at: string | null;
};

type InviteCode = {
  id: string;
  code: string;
  grants_tier: string;
  current_uses: number;
  max_uses: number | null;
  is_active: boolean;
};

export default async function AdminPage() {
  const admin = createAdminClient();
  const errors: string[] = [];

  // Fetch all subscriptions
  const { data: subs, error: subsErr } = await admin
    .from("user_subscriptions")
    .select("user_id, tier, is_owner, is_trial, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (subsErr) {
    console.error("[admin] subscriptions query failed:", subsErr.message);
    errors.push("Failed to load subscriptions");
  }

  // Fetch invite codes
  const { data: codes, error: codesErr } = await admin
    .from("invite_codes")
    .select("id, code, grants_tier, current_uses, max_uses, is_active")
    .order("created_at", { ascending: false });
  if (codesErr) {
    console.error("[admin] invite codes query failed:", codesErr.message);
    errors.push("Failed to load invite codes");
  }

  // Fetch auth users (for email mapping)
  let authUsers: { id: string; email?: string }[] = [];
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 500 });
    authUsers = authData?.users ?? [];
  } catch (err) {
    console.error("[admin] auth users query failed:", err);
    errors.push("Failed to load auth users");
  }

  const userMap = new Map(authUsers.map((u) => [u.id, u]));
  const subscriptions: UserSub[] = subs ?? [];
  const inviteCodes: InviteCode[] = codes ?? [];

  // Stats
  const totalUsers = subscriptions.length;
  const tierCounts = { free: 0, pro: 0, max: 0 };
  for (const s of subscriptions) {
    const t = s.tier as keyof typeof tierCounts;
    if (t in tierCounts) tierCounts[t]++;
  }
  const trialCount = subscriptions.filter((s) => s.is_trial).length;
  const activeInvites = inviteCodes.filter((c) => c.is_active).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Shield size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted">Owner-only system overview</p>
        </div>
      </div>

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-loss shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-loss">Some data failed to load</p>
            {errors.map((e) => (
              <p key={e} className="text-xs text-loss/70 mt-0.5">{e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} />
        <StatCard icon={CreditCard} label="Free / Pro / Max" value={`${tierCounts.free} / ${tierCounts.pro} / ${tierCounts.max}`} />
        <StatCard icon={TrendingUp} label="Active Trials" value={trialCount} />
        <StatCard icon={Ticket} label="Active Invite Codes" value={activeInvites} />
      </div>

      {/* User list */}
      <section className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users size={18} className="text-accent" />
            All Users ({totalUsers})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Signed Up</th>
                <th className="px-5 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const authUser = userMap.get(sub.user_id);
                const email = authUser?.email ?? sub.user_id.slice(0, 8) + "...";
                return (
                  <tr key={sub.user_id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3 text-foreground font-medium">
                      {email}
                      {sub.is_owner && (
                        <span className="ml-2 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                          OWNER
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <TierBadge tier={sub.tier} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {sub.is_trial ? "Trial" : "Active"}
                    </td>
                    <td className="px-5 py-3 text-muted tabular-nums">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-muted tabular-nums">
                      {sub.updated_at ? new Date(sub.updated_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite codes */}
      <section className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Ticket size={18} className="text-accent" />
            Invite Codes ({inviteCodes.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Grants</th>
                <th className="px-5 py-3 font-medium">Uses</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {inviteCodes.map((code) => (
                <tr key={code.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 font-mono text-foreground text-xs">{code.code}</td>
                  <td className="px-5 py-3"><TierBadge tier={code.grants_tier} /></td>
                  <td className="px-5 py-3 text-muted tabular-nums">
                    {code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : " / ∞"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      code.is_active
                        ? "text-win bg-win/10"
                        : "text-muted bg-surface-hover"
                    }`}>
                      {code.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
              {inviteCodes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted">
                    No invite codes created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string | number }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-accent" />
        <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
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
