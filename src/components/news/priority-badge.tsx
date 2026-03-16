"use client";

import type { NewsPriority } from "@/lib/news/types";

interface PriorityBadgeProps {
  priority: NewsPriority;
  compact?: boolean;
}

export function PriorityBadge({ priority, compact }: PriorityBadgeProps) {
  if (priority === "normal") return null;

  if (priority === "breaking") {
    return (
      <span className={`inline-flex items-center gap-1 rounded font-black tracking-wider uppercase ${
        compact ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]"
      } bg-red-500/20 text-red-400 border border-red-500/30`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        </span>
        Breaking
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded font-bold tracking-wider uppercase ${
      compact ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]"
    } bg-amber-500/15 text-amber-400 border border-amber-500/25`}>
      Urgent
    </span>
  );
}
