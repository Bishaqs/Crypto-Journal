"use client";

import { useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function EarlyAccessPage() {
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
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0a1a" }}>
      <div
        className="w-full max-w-md text-center space-y-6 p-8 rounded-2xl border"
        style={{
          background: "rgba(15, 23, 42, 0.8)",
          borderColor: "rgba(129, 140, 248, 0.2)",
          boxShadow: "0 0 60px rgba(129, 140, 248, 0.05)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "rgba(129, 140, 248, 0.1)",
            border: "1px solid rgba(129, 140, 248, 0.2)",
          }}
        >
          <Clock size={32} style={{ color: "#818cf8" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Early Access Required
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            Traverse Journal is currently in early access. You&apos;ve signed in
            successfully, but your account hasn&apos;t been granted access yet.
          </p>
        </div>

        <div
          className="rounded-xl p-4 text-left space-y-3"
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
            How to get access:
          </p>
          <ul className="text-sm space-y-2" style={{ color: "#94a3b8" }}>
            <li className="flex items-start gap-2">
              <span style={{ color: "#818cf8" }}>1.</span>
              Join the waitlist on our homepage to get early access + a 50% founding member discount
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "#818cf8" }}>2.</span>
              Already on the waitlist? Sign in with the same email you used to sign up
            </li>
          </ul>
        </div>

        <a
          href="/#waitlist"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(129, 140, 248, 0.15)",
            color: "#818cf8",
            border: "1px solid rgba(129, 140, 248, 0.25)",
          }}
        >
          Join the Waitlist
          <ArrowRight size={16} />
        </a>

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
