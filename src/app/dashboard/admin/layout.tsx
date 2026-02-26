import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(user && ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  // Fallback: check DB is_owner flag (set by auth callback)
  if (!isOwner && user) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("is_owner")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.is_owner) isOwner = true;
  }

  // Diagnostic logging — check Vercel function logs
  console.log("[admin-layout] owner-check:", {
    OWNER_EMAIL: process.env.OWNER_EMAIL ? "set" : "unset",
    NEXT_PUBLIC_OWNER_EMAIL: process.env.NEXT_PUBLIC_OWNER_EMAIL ? "set" : "unset",
    resolvedOwnerEmail: ownerEmail ?? "none",
    userEmail: user?.email ?? "no-user",
    isOwner,
  });

  if (!isOwner) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
