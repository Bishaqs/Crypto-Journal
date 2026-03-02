"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SimulatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[simulator] error:", error);
  }, [error]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-white mb-2">
          Simulator Error
        </h2>
        <p className="text-red-400 text-sm mb-4">{error.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
