"use client";

import { useState, useCallback } from "react";

const LS_KEY = "stargate-dismissed-tilt";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type DismissedMap = Record<string, string>; // signalType -> ISO timestamp

function readAndPrune(): DismissedMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed: DismissedMap = JSON.parse(raw);
    const now = Date.now();
    const pruned: DismissedMap = {};
    let changed = false;
    for (const [type, ts] of Object.entries(parsed)) {
      if (now - new Date(ts).getTime() < TTL_MS) {
        pruned[type] = ts;
      } else {
        changed = true;
      }
    }
    if (changed) localStorage.setItem(LS_KEY, JSON.stringify(pruned));
    return pruned;
  } catch {
    return {};
  }
}

export function useDismissedTilt() {
  const [map, setMap] = useState<DismissedMap>(() => readAndPrune());

  const isDismissed = useCallback(
    (signalType: string): boolean => {
      const ts = map[signalType];
      if (!ts) return false;
      return Date.now() - new Date(ts).getTime() < TTL_MS;
    },
    [map],
  );

  const dismiss = useCallback((signalType: string) => {
    setMap((prev) => {
      const next = { ...prev, [signalType]: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const dismissAll = useCallback((signalTypes: string[]) => {
    setMap((prev) => {
      const now = new Date().toISOString();
      const next = { ...prev };
      for (const type of signalTypes) {
        next[type] = now;
      }
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { isDismissed, dismiss, dismissAll };
}
