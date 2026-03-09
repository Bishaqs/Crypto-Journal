"use client";

import { useState } from "react";
import { ShieldX } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function BannedPage() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out errors
    }
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0a1a" }}>
      <div
        className="w-full max-w-md text-center space-y-6 p-8 rounded-2xl border"
        style={{
          background: "rgba(15, 23, 42, 0.8)",
          borderColor: "rgba(239, 68, 68, 0.2)",
          boxShadow: "0 0 60px rgba(239, 68, 68, 0.05)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <ShieldX size={32} style={{ color: "#ef4444" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Account Closed
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            Your Stargate Journal account has been closed by an administrator.
            You no longer have access to the platform.
          </p>
        </div>

        <div
          className="rounded-xl p-4 text-left"
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            If you believe this was a mistake, please contact us at{" "}
            <a
              href="mailto:support@stargate.trade"
              className="underline underline-offset-2"
              style={{ color: "#818cf8" }}
            >
              support@stargate.trade
            </a>
          </p>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: "rgba(148, 163, 184, 0.1)",
            color: "#94a3b8",
            border: "1px solid rgba(148, 163, 184, 0.15)",
          }}
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
