"use client";

import type { ViewTab } from "./types";

const TABS: { value: ViewTab; label: string }[] = [
  { value: "trades", label: "Trades" },
  { value: "symbol", label: "Symbol" },
  { value: "day", label: "Day" },
  { value: "open", label: "Open" },
];

type Props = {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  counts?: Partial<Record<ViewTab, number>>;
};

export function ViewTabs({ activeTab, onTabChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1 bg-surface/50 border border-border rounded-xl p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === tab.value
              ? "bg-accent text-background shadow-sm"
              : "text-muted hover:text-foreground hover:bg-border/30"
          }`}
        >
          {tab.label}
          {counts?.[tab.value] != null && (
            <span className={`ml-1.5 text-[10px] ${activeTab === tab.value ? "text-background/80" : "opacity-70"}`}>{counts[tab.value]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
