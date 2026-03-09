import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Users, CreditCard, Ticket, TrendingUp, AlertTriangle, MessageSquareText, ShieldBan, Tag, Headphones, HelpCircle } from "lucide-react";
import { AdminInviteManager } from "@/components/admin/invite-codes-manager";
import { AdminUsersManager } from "@/components/admin/users-manager";
import { AdminFeedbackManager, type FeedbackItem } from "@/components/admin/feedback-manager";
import { AdminBannedAccountsManager } from "@/components/admin/banned-accounts-manager";
import { AdminDiscountManager } from "@/components/admin/discount-codes-manager";
import { AdminSupportTicketsManager, type SupportTicketAdmin } from "@/components/admin/support-tickets-manager";
import { AdminSubmittedQuestionsManager, type SubmittedQuestion } from "@/components/admin/submitted-questions-manager";

export const dynamic = "force-dynamic";

type UserSub = {
  user_id: string;
  tier: string;
  is_owner: boolean;
  is_trial: boolean;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
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

type DiscountCode = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  applicable_tiers: string[];
  applicable_billing: string[];
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
};

export default async function AdminPage() {
  const admin = createAdminClient();
  const errors: string[] = [];

  // Fetch all subscriptions (including ban fields)
  const { data: subs, error: subsErr } = await admin
    .from("user_subscriptions")
    .select("user_id, tier, is_owner, is_trial, is_banned, banned_at, banned_reason, created_at, updated_at")
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

  // Fetch discount codes
  const { data: discountCodesRaw, error: discountErr } = await admin
    .from("discount_codes")
    .select("id, code, discount_type, discount_value, applicable_tiers, applicable_billing, description, current_uses, max_uses, is_active, created_at")
    .order("created_at", { ascending: false });
  if (discountErr) {
    console.error("[admin] discount codes query failed:", discountErr.message);
    errors.push("Failed to load discount codes");
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

  // Fetch feedback
  const { data: feedbackRaw, error: feedbackErr } = await admin
    .from("feedback")
    .select("id, user_id, category, message, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (feedbackErr) {
    console.error("[admin] feedback query failed:", feedbackErr.message);
    errors.push("Failed to load feedback");
  }

  // Fetch support tickets
  const { data: supportTicketsRaw, error: supportErr } = await admin
    .from("support_tickets")
    .select("id, user_id, subject, status, display_name, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (supportErr) {
    console.error("[admin] support tickets query failed:", supportErr.message);
    errors.push("Failed to load support tickets");
  }

  // Fetch submitted questions
  const { data: submittedQuestionsRaw, error: questionsErr } = await admin
    .from("submitted_questions")
    .select("id, user_id, question, status, display_name, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (questionsErr) {
    console.error("[admin] submitted questions query failed:", questionsErr.message);
    errors.push("Failed to load submitted questions");
  }

  // Build subscription lookup by user_id
  const subMap = new Map((subs ?? []).map((s) => [s.user_id, s as UserSub]));
  const inviteCodes: InviteCode[] = codes ?? [];
  const discountCodes: DiscountCode[] = discountCodesRaw ?? [];

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
  const bannedCount = allUsers.filter((u) => u.sub?.is_banned).length;
  const activeDiscounts = discountCodes.filter((c) => c.is_active).length;

  // Map feedback user_id to email
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? u.id.slice(0, 8) + "..."]));
  const feedbackItems: FeedbackItem[] = (feedbackRaw ?? []).map((f) => ({
    id: f.id,
    user_email: emailMap.get(f.user_id) ?? f.user_id.slice(0, 8) + "...",
    category: f.category as FeedbackItem["category"],
    message: f.message,
    is_read: f.is_read,
    created_at: f.created_at,
  }));
  const unreadFeedback = feedbackItems.filter((f) => !f.is_read).length;

  const supportTickets: SupportTicketAdmin[] = (supportTicketsRaw ?? []).map((t) => ({
    id: t.id,
    user_id: t.user_id,
    subject: t.subject,
    status: t.status,
    display_name: t.display_name,
    created_at: t.created_at,
    resolved_at: t.resolved_at,
  }));
  const openTickets = supportTickets.filter((t) => t.status === "open").length;

  const submittedQuestions: SubmittedQuestion[] = (submittedQuestionsRaw ?? []).map((q) => ({
    id: q.id,
    user_id: q.user_id,
    question: q.question,
    status: q.status,
    display_name: q.display_name,
    created_at: q.created_at,
    reviewed_at: q.reviewed_at,
  }));
  const pendingQuestions = submittedQuestions.filter((q) => q.status === "pending").length;

  // Build banned users list for the widget
  const bannedUsers = allUsers
    .filter((u) => u.sub?.is_banned)
    .map((u) => ({
      id: u.id,
      email: u.email,
      bannedAt: u.sub?.banned_at ?? null,
      reason: u.sub?.banned_reason ?? null,
    }));

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} />
        <StatCard icon={CreditCard} label="Free / Pro / Max" value={`${tierCounts.free} / ${tierCounts.pro} / ${tierCounts.max}`} />
        <StatCard icon={TrendingUp} label="Active Trials" value={trialCount} />
        <StatCard icon={Ticket} label="Invite Codes" value={activeInvites} />
        <StatCard icon={Tag} label="Discount Codes" value={activeDiscounts} />
        <StatCard icon={ShieldBan} label="Banned" value={bannedCount} />
        <StatCard icon={MessageSquareText} label="Unread Feedback" value={unreadFeedback} />
        <StatCard icon={Headphones} label="Open Tickets" value={openTickets} />
        <StatCard icon={HelpCircle} label="Pending Questions" value={pendingQuestions} />
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
            isBanned: u.sub?.is_banned ?? false,
            bannedReason: u.sub?.banned_reason ?? null,
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

      {/* Discount codes */}
      <section className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Tag size={18} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Discount Codes</h2>
        </div>
        <AdminDiscountManager initialCodes={discountCodes} />
      </section>

      {/* User feedback */}
      <section className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquareText size={18} className="text-accent" />
            User Feedback ({feedbackItems.length})
          </h2>
        </div>
        <AdminFeedbackManager initialFeedback={feedbackItems} />
      </section>

      {/* Support tickets */}
      <section className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Headphones size={18} className="text-accent" />
            Support Tickets ({supportTickets.length})
            {openTickets > 0 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                {openTickets} open
              </span>
            )}
          </h2>
        </div>
        <AdminSupportTicketsManager initialTickets={supportTickets} />
      </section>

      {/* Submitted questions */}
      <section className="bg-surface rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <HelpCircle size={18} className="text-accent" />
            Submitted Questions ({submittedQuestions.length})
            {pendingQuestions > 0 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {pendingQuestions} pending
              </span>
            )}
          </h2>
        </div>
        <AdminSubmittedQuestionsManager initialQuestions={submittedQuestions} />
      </section>

      {/* Banned accounts */}
      <section className="bg-surface rounded-2xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldBan size={18} className="text-loss" />
          <h2 className="text-lg font-semibold text-foreground">Banned Accounts ({bannedCount})</h2>
        </div>
        <AdminBannedAccountsManager initialBannedUsers={bannedUsers} />
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
