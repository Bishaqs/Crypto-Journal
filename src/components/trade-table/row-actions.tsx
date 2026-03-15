"use client";

import { Eye, Pencil, ChevronDown } from "lucide-react";

type TradeRowActionsProps = {
  onView: () => void;
  onEdit?: () => void;
  onExpand: () => void;
  isExpanded: boolean;
};

export function TradeRowActions({ onView, onEdit, onExpand, isExpanded }: TradeRowActionsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onView(); }}
        title="Explore trade"
        className="p-1.5 rounded-md text-muted/50 hover:text-accent hover:bg-accent/10 transition-colors"
      >
        <Eye size={14} />
      </button>
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit trade"
          className="p-1.5 rounded-md text-muted/50 hover:text-accent hover:bg-accent/10 transition-colors"
        >
          <Pencil size={14} />
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        title={isExpanded ? "Collapse" : "Expand"}
        className="p-1.5 rounded-md text-muted/50 hover:text-accent hover:bg-accent/10 transition-colors"
      >
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
