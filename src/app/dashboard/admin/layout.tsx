import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  let isOwner = !!(user && ownerEmail && user.email?.toLowerCase() === ownerEmail.toLowerCase());

  // Fallback: check DB is_owner flag (set by auth callback)
  if (!isOwner && user) {
    try {
      const admin = createAdminClient();
      const { data: sub } = await admin
        .from("user_subscriptions")
        .select("is_owner")
        .eq("user_id", user.id)
        .single();
      if (sub?.is_owner) isOwner = true;
    } catch {}
  }

  if (!isOwner) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
