"use client";

import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";

const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function OnlineUsersCard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    function fetchCount() {
      fetch("/api/admin/online")
        .then((r) => r.json())
        .then((d) => setCount(d.count ?? 0))
        .catch(() => {});
    }

    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="p-2 rounded-xl bg-accent/10">
        <Wifi size={18} className="text-accent" />
      </div>
      <div>
        <p className="text-xs text-muted">Online Now</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-foreground">
            {count === null ? "..." : count}
          </p>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        </div>
      </div>
    </div>
  );
}
