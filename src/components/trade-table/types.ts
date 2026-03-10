import { ReactNode } from "react";

// --- Column definition ---

export type TradeTableColumn<T> = {
  id: string;
  label: string;
  group?: string;
  sortKey?: string;
  sortFn?: (a: T, b: T) => number;
  defaultVisible?: boolean;
  align?: "left" | "right" | "center";
  minWidth?: string;
  renderCell: (item: T) => ReactNode;
};

// --- View tabs ---

export type ViewTab = "trades" | "symbol" | "day" | "open";

// --- Filters ---

export type FilterDef<T> = {
  id: string;
  label: string;
  type: "select" | "text" | "range" | "date-range";
  options?: { value: string; label: string }[];
  filterFn: (item: T, value: unknown) => boolean;
};

// --- Table state ---

export type SidebarTab = "columns" | "filters" | "actions" | null;

export type TableState = {
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  visibleColumnIds: Set<string>;
  activeTab: ViewTab;
  selectedIds: Set<string>;
  filters: Record<string, unknown>;
  sidebarTab: SidebarTab;
  search: string;
};

// --- Table config (passed by each page) ---

export type TableConfig<T> = {
  columns: TradeTableColumn<T>[];
  filters?: FilterDef<T>[];
  storageKey: string;
  tableName?: string; // Supabase table for bulk delete
  getId: (item: T) => string;
  getSymbol: (item: T) => string;
  getDate: (item: T) => string;
  isOpen: (item: T) => boolean;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  defaultPageSize?: number;
};

// --- Group summary ---

export type GroupSummary<T> = {
  key: string;
  label: string;
  items: T[];
  totalPnl: number;
  winCount: number;
  lossCount: number;
};
