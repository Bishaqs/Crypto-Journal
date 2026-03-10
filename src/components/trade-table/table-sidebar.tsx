"use client";

import { Columns3, SlidersHorizontal, Settings2 } from "lucide-react";
import type { SidebarTab, TradeTableColumn, FilterDef } from "./types";
import { ColumnPanel } from "./column-panel";
import { FilterPanel } from "./filter-panel";
import { ActionsPanel } from "./actions-panel";

type Props<T> = {
  activeTab: SidebarTab;
  onToggleTab: (tab: SidebarTab) => void;
  // Column panel
  columns: TradeTableColumn<T>[];
  visibleColumnIds: Set<string>;
  onToggleColumn: (id: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  // Filter panel
  filters: FilterDef<T>[];
  filterValues: Record<string, unknown>;
  onSetFilter: (id: string, value: unknown) => void;
  onClearFilters: () => void;
  // Actions panel
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResetTable: () => void;
  onDeleteSelected?: () => void;
  allData: Record<string, unknown>[];
  exportFileName?: string;
};

const TABS: { id: SidebarTab; icon: typeof Columns3; label: string }[] = [
  { id: "columns", icon: Columns3, label: "Columns" },
  { id: "filters", icon: SlidersHorizontal, label: "Filters" },
  { id: "actions", icon: Settings2, label: "Table Actions" },
];

export function TableSidebar<T>(props: Props<T>) {
  const { activeTab, onToggleTab } = props;
  const isOpen = activeTab !== null;

  // Count active filters for badge
  const activeFilterCount = Object.values(props.filterValues).filter(
    (v) => v !== undefined && v !== null && v !== "" && v !== "All"
  ).length;

  return (
    <div className="flex h-full">
      {/* Panel content */}
      {isOpen && (
        <div className="w-[260px] border-l border-border bg-surface overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "columns" && (
              <ColumnPanel
                columns={props.columns}
                visibleColumnIds={props.visibleColumnIds}
                onToggleColumn={props.onToggleColumn}
                onShowAll={props.onShowAll}
                onHideAll={props.onHideAll}
              />
            )}
            {activeTab === "filters" && (
              <FilterPanel
                filters={props.filters}
                values={props.filterValues}
                onSetFilter={props.onSetFilter}
                onClearAll={props.onClearFilters}
              />
            )}
            {activeTab === "actions" && (
              <ActionsPanel
                selectedCount={props.selectedCount}
                totalCount={props.totalCount}
                onSelectAll={props.onSelectAll}
                onDeselectAll={props.onDeselectAll}
                onClearFilters={props.onClearFilters}
                onResetTable={props.onResetTable}
                onDeleteSelected={props.onDeleteSelected}
                allData={props.allData}
                exportFileName={props.exportFileName}
              />
            )}
          </div>
        </div>
      )}

      {/* Tab rail */}
      <div className="flex flex-col items-center gap-1 py-2 px-1 border-l border-border bg-surface/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onToggleTab(tab.id)}
              className={`relative p-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-foreground hover:bg-border/30"
              }`}
              title={tab.label}
            >
              <Icon size={16} />
              {tab.id === "filters" && activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent text-white text-[8px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
