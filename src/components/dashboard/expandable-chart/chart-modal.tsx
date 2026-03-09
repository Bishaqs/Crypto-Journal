"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ChartToolbar } from "./chart-toolbar";
import { ChartDataView } from "./chart-data-view";
import type {
  ChartCapabilities,
  ChartVariant,
  DataColumn,
  ChartRenderProps,
} from "./types";

type ChartModalProps = {
  title: string;
  titleExtra?: React.ReactNode;
  capabilities: ChartCapabilities;
  variant: ChartVariant;
  showDataView: boolean;
  zoomEnabled: boolean;
  isZoomed: boolean;
  data: Record<string, unknown>[];
  columns: DataColumn[];
  onClose: () => void;
  onToggleDataView: () => void;
  onToggleZoom: () => void;
  onResetZoom: () => void;
  onSetVariant: (v: ChartVariant) => void;
  onRestore: () => void;
  children: (props: ChartRenderProps) => React.ReactNode;
  zoomHandlers?: ChartRenderProps["zoomHandlers"];
  zoomedData?: Record<string, unknown>[];
};

export function ChartModal({
  title,
  titleExtra,
  capabilities,
  variant,
  showDataView,
  zoomEnabled,
  isZoomed,
  data,
  columns,
  onClose,
  onToggleDataView,
  onToggleZoom,
  onResetZoom,
  onSetVariant,
  onRestore,
  children,
  zoomHandlers,
  zoomedData,
}: ChartModalProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSaveImage = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#0f172a",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save chart image:", err);
    }
  }, [title]);

  const modal = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass border border-border/50 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {titleExtra}
          </div>
          <div className="flex items-center gap-3">
            <ChartToolbar
              capabilities={capabilities}
              variant={variant}
              showDataView={showDataView}
              zoomEnabled={zoomEnabled}
              isZoomed={isZoomed}
              onToggleDataView={onToggleDataView}
              onToggleZoom={onToggleZoom}
              onResetZoom={onResetZoom}
              onSetVariant={onSetVariant}
              onRestore={onRestore}
              onSaveImage={handleSaveImage}
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-auto" ref={chartRef}>
          {showDataView ? (
            <ChartDataView data={data} columns={columns} />
          ) : (
            <div style={{ minHeight: 500 }}>
              {children({
                height: 500,
                variant,
                zoomedData,
                isExpanded: true,
                zoomHandlers: zoomEnabled ? zoomHandlers : undefined,
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modal, document.body);
}
