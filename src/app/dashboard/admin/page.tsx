import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Users, CreditCard, Ticket, TrendingUp, AlertTriangle } from "lucide-react";
import { AdminInviteManager } from "@/components/admin/invite-codes-manager";
import { AdminUsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

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
  description: string | null;
  current_uses: number;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
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
    .select("id, code, grants_tier, description, current_uses, max_uses, is_active, created_at")
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

  // Build subscription lookup by user_id
  const subMap = new Map((subs ?? []).map((s) => [s.user_id, s as UserSub]));
  const inviteCodes: InviteCode[] = codes ?? [];

  // Merge: auth users are the primary source, left-join with subscriptions
  const allUsers = authUsers
    .map((u) => ({
      id: u.id,
      email: u.email ?? u.id.slice(0, 8) + "...",
      sub: subMap.get(u.id) ?? null,
      created_at: (u as { created_at?: string }).created_at ?? "",
    }))
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

  // Stats
  const totalUsers = allUsers.length;
  const tierCounts = { free: 0, pro: 0, max: 0 };
  for (const u of allUsers) {
    const t = (u.sub?.tier ?? "free") as keyof typeof tierCounts;
    if (t in tierCounts) tierCounts[t]++;
  }
  const trialCount = allUsers.filter((u) => u.sub?.is_trial).length;
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
        <AdminUsersManager
          initialUsers={allUsers.map((u) => ({
            id: u.id,
            email: u.email,
            tier: u.sub?.tier ?? null,
            isOwner: u.sub?.is_owner ?? false,
            isTrial: u.sub?.is_trial ?? false,
            createdAt: u.created_at,
            updatedAt: u.sub?.updated_at ?? null,
          }))}
        />
      </section>

      {/* Invite codes — interactive management */}
      <section className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Ticket size={18} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Invite Codes</h2>
        </div>
        <AdminInviteManager initialCodes={inviteCodes} />
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

