import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID." },
        { status: 400 },
      );
    }

    // Auto-confirm email — just flips the flag, no trigger involvement
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Belt-and-suspenders: ensure subscription row exists
    // (trigger should create it, but if it fails, we catch it here)
    const { error: subError } = await admin
      .from("user_subscriptions")
      .upsert(
        { user_id: userId, tier: "free" },
        { onConflict: "user_id", ignoreDuplicates: true },
      );

    if (subError) {
      console.error("[signup] subscription upsert failed:", subError.message);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
