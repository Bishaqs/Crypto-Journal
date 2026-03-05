"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/lib/types";
import { TradeForm } from "@/components/trade-form";
import { CSVImportModal } from "@/components/csv-import-modal";
import {
  Plus, Upload, Download, BookOpen, RefreshCw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ACTIONS = [
  { key: "trade", tKey: "quickAction.logTrade", icon: Plus },
  { key: "import", tKey: "quickAction.importCsv", icon: Upload },
  { key: "note", tKey: "quickAction.addNote", icon: BookOpen },
  { key: "export", tKey: "quickAction.exportCsv", icon: Download },
  { key: "resync", tKey: "quickAction.resync", icon: RefreshCw },
] as const;

type ActionKey = (typeof ACTIONS)[number]["key"];

/**
 * Quick action menu that can be embedded in any container.
 * Renders a trigger button + popup grid + modals.
 * The trigger button and popup are positioned relative to the parent container.
 */
export function QuickActionMenu({ collapsed }: { collapsed?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Close popup on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleExport() {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false });
    const trades = (data as Trade[]) ?? [];
    if (trades.length === 0) return;

    const headers = [
      "symbol", "position", "entry_price", "exit_price", "quantity", "fees",
      "open_timestamp", "close_timestamp", "pnl", "tags", "notes",
      "emotion", "confidence", "setup_type", "process_score",
      "trade_source", "chain", "dex_protocol", "tx_hash", "wallet_address",
      "gas_fee", "gas_fee_native",
    ];
    const rows = trades.map((t) =>
      headers.map((h) => {
        const val = t[h as keyof Trade];
        if (Array.isArray(val)) return `"${val.join(";")}"`;
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") ? `"${str}"` : str;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stargate-trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAction(key: ActionKey) {
    setOpen(false);
    switch (key) {
      case "trade":
        setShowTradeForm(true);
        break;
      case "import":
        setShowImport(true);
        break;
      case "note":
        router.push("/dashboard/journal?new=true");
        break;
      case "export":
        handleExport();
        break;
      case "resync":
        setSyncing(true);
        router.refresh();
        setTimeout(() => setSyncing(false), 1200);
        break;
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        title="Quick Actions"
        className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
          collapsed
            ? "w-8 h-8 bg-accent/10 text-accent hover:bg-accent/20"
            : "w-7 h-7 bg-accent/10 text-accent hover:bg-accent/20"
        }`}
      >
        <Plus
          size={collapsed ? 16 : 14}
          className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>

      {/* Action grid popup — fixed position so it escapes sidebar overflow */}
      {open && (
        <div
          ref={popupRef}
          className="fixed left-16 top-4 z-[80] w-56 glass rounded-2xl border border-border/50 p-3.5 shadow-2xl animate-in slide-in-from-left-2 duration-200"
          style={{ boxShadow: "var(--shadow-cosmic)" }}
        >
          <p className="text-[10px] text-muted/60 uppercase tracking-widest font-semibold mb-2.5">
            {t("quickAction.title")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {ACTIONS.map(({ key, tKey, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleAction(key)}
                disabled={key === "resync" && syncing}
                className="flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl border border-border/50 bg-background hover:border-accent/30 hover:bg-accent/5 transition-all text-center disabled:opacity-50"
              >
                <Icon
                  size={16}
                  className={`text-accent ${key === "resync" && syncing ? "animate-spin" : ""}`}
                />
                <span className="text-[10px] font-medium text-foreground leading-tight">
                  {t(tKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTradeForm && (
        <TradeForm
          onClose={() => setShowTradeForm(false)}
          onSaved={() => {
            setShowTradeForm(false);
            router.refresh();
          }}
        />
      )}

      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
