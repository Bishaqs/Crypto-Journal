"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div
        className="glass rounded-2xl border border-border/50 p-8 max-w-md text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-loss/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-loss" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted mb-1">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted/50 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <p className="text-xs text-muted/50 mb-6">
          Try refreshing or navigating home.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-muted font-semibold text-sm hover:text-foreground hover:border-accent/30 transition-all"
          >
            <Home size={14} />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
