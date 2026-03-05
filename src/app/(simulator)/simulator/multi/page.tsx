"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import SimulatorPanel from "@/components/simulator/simulator-panel";
import PlaybackControls from "@/components/simulator/playback-controls";
import MultiSessionSummary from "@/components/simulator/multi-session-summary";
import { fetchKlines, getDayRange } from "@/lib/simulator/binance-klines";
import {
  multiSimReducer,
  createInitialMultiSimState,
} from "@/lib/simulator/multi-sim-reducer";
import type { SimSide } from "@/lib/simulator/types";

export default function MultiChartPage() {
  const [state, dispatch] = useReducer(
    multiSimReducer,
    undefined,
    createInitialMultiSimState
  );
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load candles for all panels ───────────────────

  const loadAllPanels = useCallback(async () => {
    const { startTime, endTime } = getDayRange(state.date);

    // Mark all as loading
    for (let i = 0; i < 4; i++) {
      dispatch({ type: "SET_PANEL_LOADING", panelId: i });
    }

    const results = await Promise.allSettled(
      state.panels.map((panel) =>
        fetchKlines(panel.symbol, state.interval, startTime, endTime)
      )
    );

    results.forEach((result, panelId) => {
      if (result.status === "fulfilled") {
        if (result.value.length === 0) {
          dispatch({
            type: "SET_PANEL_ERROR",
            panelId,
            error: "No data for this date",
          });
        } else {
          dispatch({
            type: "SET_PANEL_CANDLES",
            panelId,
            candles: result.value,
          });
        }
      } else {
        dispatch({
          type: "SET_PANEL_ERROR",
          panelId,
          error: result.reason?.message ?? "Failed to load",
        });
      }
    });
  }, [state.date, state.interval, state.panels[0].symbol, state.panels[1].symbol, state.panels[2].symbol, state.panels[3].symbol]);

  // Auto-load on settings change
  useEffect(() => {
    loadAllPanels();
  }, [loadAllPanels]);

  // ── Playback timer ────────────────────────────────

  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (state.isPlaying) {
      const ms = Math.max(50, 1000 / state.speed);
      intervalIdRef.current = setInterval(() => {
        dispatch({ type: "STEP_FORWARD" });
      }, ms);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [state.isPlaying, state.speed]);

  // Stop when all panels reach end
  useEffect(() => {
    const maxCandles = Math.max(
      ...state.panels.map((p) => p.allCandles.length)
    );
    if (state.currentIndex >= maxCandles - 1 && state.isPlaying) {
      dispatch({ type: "SET_PLAYING", isPlaying: false });
    }
  }, [state.currentIndex, state.panels, state.isPlaying]);

  // ── Keyboard shortcuts ────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      // Panel switching: 1-4
      if (["1", "2", "3", "4"].includes(e.key)) {
        dispatch({
          type: "SET_ACTIVE_PANEL",
          panelId: parseInt(e.key) - 1,
        });
        return;
      }

      // Shared playback
      switch (e.key) {
        case " ":
          e.preventDefault();
          dispatch({ type: "SET_PLAYING", isPlaying: !state.isPlaying });
          return;
        case "ArrowRight":
          if (!state.isPlaying) dispatch({ type: "STEP_FORWARD" });
          return;
        case "ArrowLeft":
          if (!state.isPlaying) dispatch({ type: "STEP_BACK" });
          return;
      }

      // Panel-scoped (requires active panel)
      if (state.activePanelId === null) return;
      const pid = state.activePanelId;
      const panel = state.panels[pid];
      const clampedIdx = Math.min(
        state.currentIndex,
        panel.allCandles.length - 1
      );
      const currentPrice = panel.allCandles[clampedIdx]?.close ?? 0;
      const qty = parseFloat(panel.orderQuantity);

      switch (e.key) {
        case "b":
        case "B":
          if (qty > 0 && currentPrice > 0) {
            dispatch({
              type: "PLACE_ORDER",
              panelId: pid,
              side: "buy" as SimSide,
              orderType: "market",
              quantity: qty,
              price: currentPrice,
            });
          }
          break;
        case "s":
        case "S":
          if (qty > 0 && currentPrice > 0) {
            dispatch({
              type: "PLACE_ORDER",
              panelId: pid,
              side: "sell" as SimSide,
              orderType: "market",
              quantity: qty,
              price: currentPrice,
            });
          }
          break;
        case "f":
        case "F":
          dispatch({ type: "FLATTEN", panelId: pid });
          break;
        case "r":
        case "R":
          dispatch({ type: "REVERSE", panelId: pid });
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPlaying, state.activePanelId, state.panels, state.currentIndex]);

  // ── Computed values ───────────────────────────────

  const maxCandles = Math.max(
    ...state.panels.map((p) => p.allCandles.length),
    1
  );

  const currentCandle =
    state.panels[0]?.allCandles[
      Math.min(state.currentIndex, state.panels[0].allCandles.length - 1)
    ];
  const currentTime = currentCandle
    ? new Date(currentCandle.time * 1000).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--";

  // ── Render ────────────────────────────────────────

  return (
    <>
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#111118] border-b border-white/5 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>

        <h1 className="text-sm font-semibold text-white flex items-center gap-1.5">
          Multi-Chart Trading
          <InfoTooltip text="Trade up to 4 crypto pairs simultaneously on synced historical charts. Press 1-4 to switch active panel, B/S for quick buy/sell." size={14} position="below" />
        </h1>

        {/* Date picker */}
        <input
          type="date"
          value={state.date}
          max={new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
          onChange={(e) =>
            dispatch({ type: "SET_DATE", date: e.target.value })
          }
          className="ml-4 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white outline-none"
        />

        {/* Interval toggle */}
        <div className="flex items-center gap-1">
          {(["1m", "5m"] as const).map((iv) => (
            <button
              key={iv}
              onClick={() => dispatch({ type: "SET_INTERVAL", interval: iv })}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                state.interval === iv
                  ? "bg-white/15 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {iv}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-gray-600">
            Active: {state.activePanelId !== null ? state.activePanelId + 1 : "—"}
            <span className="ml-2 text-gray-700">(1-4 to switch)</span>
          </span>
          <button
            onClick={() => dispatch({ type: "RESET_ALL" })}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            title="Reset all panels"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* 2x2 Chart Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0 gap-px bg-white/5">
        {state.panels.map((panel, i) => (
          <SimulatorPanel
            key={i}
            panelId={i}
            panel={panel}
            isActive={state.activePanelId === i}
            currentIndex={state.currentIndex}
            dispatch={dispatch}
          />
        ))}
      </div>

      {/* Shared Playback Controls */}
      <PlaybackControls
        isPlaying={state.isPlaying}
        speed={state.speed}
        currentIndex={state.currentIndex}
        totalCandles={maxCandles}
        currentTime={currentTime}
        onPlay={() => dispatch({ type: "SET_PLAYING", isPlaying: true })}
        onPause={() => dispatch({ type: "SET_PLAYING", isPlaying: false })}
        onStepForward={() => dispatch({ type: "STEP_FORWARD" })}
        onStepBack={() => dispatch({ type: "STEP_BACK" })}
        onJumpStart={() => dispatch({ type: "JUMP_START" })}
        onJumpEnd={() => dispatch({ type: "JUMP_END" })}
        onSpeedChange={(s) => dispatch({ type: "SET_SPEED", speed: s })}
        onSeek={(index) => dispatch({ type: "SEEK", index })}
      />

      {/* Multi-session summary */}
      <MultiSessionSummary panels={state.panels} />
    </>
  );
}
