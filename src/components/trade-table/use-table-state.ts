"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { TableConfig, TableState, ViewTab, SidebarTab, TradeTableColumn } from "./types";

function loadSet(storageKey: string, suffix: string): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${storageKey}-${suffix}`);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return null;
}

function saveSet(storageKey: string, suffix: string, set: Set<string>) {
  try {
    localStorage.setItem(`${storageKey}-${suffix}`, JSON.stringify([...set]));
  } catch {}
}

function loadNumber(storageKey: string, suffix: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${storageKey}-${suffix}`);
    if (raw) return Number(raw);
  } catch {}
  return null;
}

function saveNumber(storageKey: string, suffix: string, n: number) {
  try {
    localStorage.setItem(`${storageKey}-${suffix}`, String(n));
  } catch {}
}

export function useTableState<T>(config: TableConfig<T>, data: T[]) {
  const {
    columns,
    filters = [],
    storageKey,
    getId,
    getSymbol,
    getDate,
    isOpen,
    defaultSortKey = "date",
    defaultSortDir = "desc",
    defaultPageSize = 50,
  } = config;

  // Compute default visible columns from column defs
  const defaultVisibleIds = useMemo(
    () => new Set(columns.filter((c) => c.defaultVisible).map((c) => c.id)),
    [columns]
  );

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => loadNumber(storageKey, "ps") ?? defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<string>>(
    () => loadSet(storageKey, "cols") ?? defaultVisibleIds
  );
  const [activeTab, setActiveTab] = useState<ViewTab>("trades");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(null);
  const [search, setSearch] = useState("");

  // Persist column visibility
  useEffect(() => {
    saveSet(storageKey, "cols", visibleColumnIds);
  }, [visibleColumnIds, storageKey]);

  // Persist page size
  useEffect(() => {
    saveNumber(storageKey, "ps", pageSize);
  }, [pageSize, storageKey]);

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleColumnIds.has(c.id)),
    [columns, visibleColumnIds]
  );

  // Filter + Search + Sort
  const sortedFilteredData = useMemo(() => {
    let result = data;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const sym = getSymbol(item).toLowerCase();
        return sym.includes(q);
      });
    }

    // Filters
    for (const fDef of filters) {
      const val = filterValues[fDef.id];
      if (val !== undefined && val !== null && val !== "" && val !== "All") {
        result = result.filter((item) => fDef.filterFn(item, val));
      }
    }

    // View tab: "open" filters to open positions
    if (activeTab === "open") {
      result = result.filter(isOpen);
    }

    // Sort
    if (sortKey) {
      const col = columns.find((c) => c.sortKey === sortKey);
      if (col?.sortFn) {
        result = [...result].sort((a, b) => {
          const dir = sortDir === "asc" ? 1 : -1;
          return dir * col.sortFn!(a, b);
        });
      }
    }

    return result;
  }, [data, search, filterValues, filters, activeTab, isOpen, sortKey, sortDir, columns, getSymbol]);

  // Pagination
  const totalItems = sortedFilteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedFilteredData.slice(start, start + pageSize);
  }, [sortedFilteredData, safePage, pageSize]);

  // Reset page when filters/search/tab change
  useEffect(() => {
    setPage(1);
  }, [search, filterValues, activeTab, sortKey, sortDir]);

  // --- Actions ---

  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }, [sortKey]);

  const toggleColumn = useCallback((colId: string) => {
    setVisibleColumnIds((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }, []);

  const showAllColumns = useCallback(() => {
    setVisibleColumnIds(new Set(columns.map((c) => c.id)));
  }, [columns]);

  const hideAllColumns = useCallback(() => {
    setVisibleColumnIds(new Set());
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(paginatedData.map(getId)));
  }, [paginatedData, getId]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const setFilter = useCallback((filterId: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [filterId]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterValues({});
    setSearch("");
  }, []);

  const resetTable = useCallback(() => {
    setVisibleColumnIds(defaultVisibleIds);
    setFilterValues({});
    setSearch("");
    setSortKey(defaultSortKey);
    setSortDir(defaultSortDir);
    setPage(1);
    setSelectedIds(new Set());
    setActiveTab("trades");
    setSidebarTab(null);
  }, [defaultVisibleIds, defaultSortKey, defaultSortDir]);

  const toggleSidebarTab = useCallback((tab: SidebarTab) => {
    setSidebarTab((prev) => (prev === tab ? null : tab));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const state: TableState = {
    page: safePage,
    pageSize,
    sortKey,
    sortDir,
    visibleColumnIds,
    activeTab,
    selectedIds,
    filters: filterValues,
    sidebarTab,
    search,
  };

  return {
    state,
    visibleColumns,
    sortedFilteredData,
    paginatedData,
    totalItems,
    totalPages,
    actions: {
      setPage,
      setPageSize: handlePageSizeChange,
      toggleSort,
      toggleColumn,
      showAllColumns,
      hideAllColumns,
      toggleRow,
      selectAll,
      deselectAll,
      setFilter,
      clearFilters,
      resetTable,
      setActiveTab,
      toggleSidebarTab,
      setSearch,
    },
  };
}
