"use client";

import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Download,
  XCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { exportToCSV, downloadFile } from "@/lib/export-trades";

type Props = {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onClearFilters: () => void;
  onResetTable: () => void;
  onDeleteSelected?: () => void;
  allData: Record<string, unknown>[];
  exportFileName?: string;
};

export function ActionsPanel({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
  onClearFilters,
  onResetTable,
  onDeleteSelected,
  allData,
  exportFileName = "trades",
}: Props) {
  const handleExportCSV = () => {
    const csv = exportToCSV(allData);
    downloadFile(`${exportFileName}.csv`, csv, "text/csv");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-1">
        {/* Selection */}
        <ActionButton icon={<CheckSquare size={14} />} label="Select All" onClick={onSelectAll} />
        <ActionButton
          icon={<Square size={14} />}
          label="Deselect All"
          onClick={onDeselectAll}
          disabled={selectedCount === 0}
        />

        <div className="border-t border-border/50 my-1" />

        {/* Expand/Collapse */}
        {onExpandAll && <ActionButton icon={<ChevronDown size={14} />} label="Expand Rows" onClick={onExpandAll} />}
        {onCollapseAll && <ActionButton icon={<ChevronUp size={14} />} label="Collapse Rows" onClick={onCollapseAll} />}

        {(onExpandAll || onCollapseAll) && <div className="border-t border-border/50 my-1" />}

        {/* Export */}
        <ActionButton icon={<Download size={14} />} label="Export to CSV" onClick={handleExportCSV} />

        <div className="border-t border-border/50 my-1" />

        {/* Reset */}
        <ActionButton icon={<XCircle size={14} />} label="Clear Filters" onClick={onClearFilters} />
        <ActionButton icon={<RotateCcw size={14} />} label="Reset Table" onClick={onResetTable} />

        {/* Delete */}
        {onDeleteSelected && (
          <>
            <div className="border-t border-border/50 my-1" />
            <ActionButton
              icon={<Trash2 size={14} />}
              label={`Delete Selected${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              variant="danger"
            />
          </>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="px-3 py-2 border-t border-border text-[10px] text-muted">
          {selectedCount} of {totalCount} selected
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors ${
        disabled
          ? "text-muted/30 cursor-not-allowed"
          : variant === "danger"
            ? "text-loss hover:bg-loss/10"
            : "text-foreground hover:bg-border/20"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
