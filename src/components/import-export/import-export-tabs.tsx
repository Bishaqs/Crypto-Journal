"use client";

import type { ImportExportTab } from "@/lib/import-export-types";
import {
  Upload,
  PenLine,
  FileText,
  Link2,
  Activity,
  Package,
  Download,
} from "lucide-react";

const TABS: { id: ImportExportTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "upload", label: "Upload File", icon: Upload },
  { id: "manual", label: "Manual Entry", icon: PenLine },
  { id: "notes", label: "Import Notes", icon: FileText },
  { id: "add-sync", label: "Add Auto-sync", icon: Link2 },
  { id: "connections", label: "Connections", icon: Activity },
  { id: "manage", label: "Manage Imports", icon: Package },
  { id: "export", label: "Manage & Export", icon: Download },
];

export function ImportExportTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ImportExportTab;
  onTabChange: (tab: ImportExportTab) => void;
}) {
  return (
    <nav className="w-full md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-accent/15 text-accent border border-accent/20"
                : "text-muted hover:text-foreground hover:bg-surface-hover border border-transparent"
            }`}
          >
            <Icon size={16} className={isActive ? "text-accent" : "text-muted"} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
