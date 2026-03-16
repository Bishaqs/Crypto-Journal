"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { NewsArticle, FlashNewsResponse } from "./types";

interface FlashNewsContextType {
  breakingArticles: NewsArticle[];
  importantArticles: NewsArticle[];
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const FlashNewsContext = createContext<FlashNewsContextType>({
  breakingArticles: [],
  importantArticles: [],
  dismiss: () => {},
  dismissAll: () => {},
});

export function useFlashNews() {
  return useContext(FlashNewsContext);
}

const DISMISSED_KEY = "stargate-flash-dismissed";
const DISMISSED_DATE_KEY = "stargate-flash-dismissed-date";
const POLL_INTERVAL = 90_000;

export function FlashNewsProvider({ children }: { children: React.ReactNode }) {
  const [breaking, setBreaking] = useState<NewsArticle[]>([]);
  const [important, setImportant] = useState<NewsArticle[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  // Load dismissed IDs from localStorage, clear daily
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const today = new Date().toISOString().split("T")[0];
    const savedDate = localStorage.getItem(DISMISSED_DATE_KEY);

    if (savedDate !== today) {
      localStorage.removeItem(DISMISSED_KEY);
      localStorage.setItem(DISMISSED_DATE_KEY, today);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
        setDismissed(new Set(saved));
      } catch {
        /* ignore corrupt data */
      }
    }
  }, []);

  const fetchFlashNews = useCallback(async () => {
    try {
      const res = await fetch("/api/market/flash-news");
      if (!res.ok) return;
      const data: FlashNewsResponse = await res.json();
      setBreaking(data.breaking.slice(0, 3));
      setImportant(data.important.slice(0, 10));
    } catch {
      // Silent fail for background polling
    }
  }, []);

  useEffect(() => {
    fetchFlashNews();
    const interval = setInterval(fetchFlashNews, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFlashNews]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const allIds = [...breaking, ...important].map((a) => a.id);
    setDismissed((prev) => {
      const next = new Set([...prev, ...allIds]);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [breaking, important]);

  const filteredBreaking = breaking.filter((a) => !dismissed.has(a.id));
  const filteredImportant = important.filter((a) => !dismissed.has(a.id));

  return (
    <FlashNewsContext.Provider
      value={{
        breakingArticles: filteredBreaking,
        importantArticles: filteredImportant,
        dismiss,
        dismissAll,
      }}
    >
      {children}
    </FlashNewsContext.Provider>
  );
}
