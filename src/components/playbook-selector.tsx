"use client";

import { useState, useEffect, useCallback } from "react";
import { BookMarked } from "lucide-react";
import type { Playbook } from "@/lib/schemas/playbook";

type PlaybookSelectorProps = {
  value: string | null;
  onChange: (playbookId: string | null, playbook: Playbook | null) => void;
  assetClass?: string;
};

export function PlaybookSelector({ value, onChange, assetClass }: PlaybookSelectorProps) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);

  useEffect(() => {
    fetch("/api/playbook")
      .then((res) => (res.ok ? res.json() : { playbooks: [] }))
      .then((data) => setPlaybooks(data.playbooks ?? []))
      .catch(() => {});
  }, []);

  // Filter to active playbooks matching the asset class
  const filtered = playbooks.filter(
    (pb) =>
      pb.is_active &&
      (pb.asset_class === "all" || !assetClass || pb.asset_class === assetClass)
  );

  if (filtered.length === 0) return null;

  return (
    <div>
      <label className="block text-xs text-muted mb-2 flex items-center gap-1.5">
        <BookMarked size={12} className="text-accent" />
        Playbook Setup
      </label>
      <div className="flex flex-wrap gap-2">
        {filtered.map((pb) => {
          const isSelected = value === pb.id;
          return (
            <button
              key={pb.id}
              type="button"
              onClick={() => onChange(isSelected ? null : pb.id, isSelected ? null : pb)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                isSelected
                  ? "bg-accent/10 border-accent/30 text-accent shadow-sm"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
              }`}
            >
              {pb.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Convert playbook entry_rules to checklist items format */
export function playbookToChecklistItems(playbook: Playbook | null): { key: string; label: string }[] | undefined {
  if (!playbook || !playbook.entry_rules || playbook.entry_rules.length === 0) return undefined;
  return playbook.entry_rules.map((rule, i) => ({
    key: `pb_rule_${i}`,
    label: rule,
  }));
}
