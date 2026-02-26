"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        background: "#080c14",
        color: "#e0eaf4",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          textAlign: "center",
          padding: "2rem",
          border: "1px solid #1a1535",
          borderRadius: "1rem",
          background: "rgba(12, 18, 30, 0.85)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6a6a9a", marginBottom: "1.5rem" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: "0.75rem",
            background: "#8B5CF6",
            color: "#080c14",
            fontWeight: 600,
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
