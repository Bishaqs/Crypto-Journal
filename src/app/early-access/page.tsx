"use client";

import { useState, useEffect } from "react";
import { Clock, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type RequestStatus = "loading" | "none" | "pending" | "approved" | "denied" | "error";

export default function EarlyAccessPage() {
  const [signingOut, setSigningOut] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/request-access")
      .then((res) => res.json())
      .then((data) => setRequestStatus(data.status || "none"))
      .catch(() => setRequestStatus("error"));
  }, []);

  async function handleRequestAccess() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-access", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRequestStatus(data.status);
      } else {
        setRequestStatus("error");
      }
    } catch {
      setRequestStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

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
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background:
              requestStatus === "pending"
                ? "rgba(250, 204, 21, 0.1)"
                : requestStatus === "approved"
                  ? "rgba(34, 197, 94, 0.1)"
                  : requestStatus === "denied"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(129, 140, 248, 0.1)",
            border: `1px solid ${
              requestStatus === "pending"
                ? "rgba(250, 204, 21, 0.2)"
                : requestStatus === "approved"
                  ? "rgba(34, 197, 94, 0.2)"
                  : requestStatus === "denied"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(129, 140, 248, 0.2)"
            }`,
          }}
        >
          {requestStatus === "pending" ? (
            <Clock size={32} style={{ color: "#facc15" }} />
          ) : requestStatus === "approved" ? (
            <Check size={32} style={{ color: "#22c55e" }} />
          ) : requestStatus === "denied" ? (
            <X size={32} style={{ color: "#ef4444" }} />
          ) : (
            <Clock size={32} style={{ color: "#818cf8" }} />
          )}
        </div>

        {/* Content — varies by status */}
        <div className="space-y-2">
          {requestStatus === "loading" && (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                Checking access...
              </h1>
              <div className="flex justify-center pt-2">
                <Loader2 size={24} className="animate-spin" style={{ color: "#818cf8" }} />
              </div>
            </>
          )}

          {requestStatus === "none" && (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                Early Access Required
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Traverse Journal is currently in early access. Request access
                below and we&apos;ll email you as soon as you&apos;re approved.
              </p>
            </>
          )}

          {requestStatus === "pending" && (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                Request Submitted
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                We&apos;ve received your request. You&apos;ll get an email as
                soon as your access is approved.
              </p>
            </>
          )}

          {requestStatus === "approved" && (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                You&apos;re Approved!
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Your access has been granted. Head to the dashboard to get
                started.
              </p>
            </>
          )}

          {requestStatus === "denied" && (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                Request Not Approved
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Unfortunately your access request was not approved at this time.
              </p>
            </>
          )}

          {requestStatus === "error" && (
            <>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                Early Access Required
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Something went wrong. Please try again.
              </p>
            </>
          )}
        </div>

        {/* Action buttons */}
        {(requestStatus === "none" || requestStatus === "error") && (
          <button
            onClick={handleRequestAccess}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: "rgba(129, 140, 248, 0.15)",
              color: "#818cf8",
              border: "1px solid rgba(129, 140, 248, 0.25)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                Request Access
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}

        {requestStatus === "approved" && (
          <a
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
              border: "1px solid rgba(34, 197, 94, 0.25)",
            }}
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </a>
        )}

        {requestStatus === "pending" && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(250, 204, 21, 0.05)",
              border: "1px solid rgba(250, 204, 21, 0.15)",
              color: "#facc15",
            }}
          >
            We review requests quickly — usually within a few hours.
          </div>
        )}

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
