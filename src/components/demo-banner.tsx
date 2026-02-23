"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function DemoBanner({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
      <Sparkles size={16} className="text-accent shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">You&apos;re viewing sample data</p>
        <p className="text-xs text-muted">
          <Link href="/dashboard" className="text-accent hover:underline">Log your first trade</Link> to see your real {feature}.
        </p>
      </div>
    </div>
  );
}
