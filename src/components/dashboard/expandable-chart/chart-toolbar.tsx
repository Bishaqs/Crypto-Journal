"use client";

import {
  Table2,
  ZoomIn,
  RotateCcw,
  TrendingUp,
  BarChart3,
  AreaChart as AreaChartIcon,
  Undo2,
  Download,
} from "lucide-react";
import type { ChartCapabilities, ChartVariant } from "./types";

type ToolbarProps = {
  capabilities: ChartCapabilities;
  variant: ChartVariant;
  showDataView: boolean;
  zoomEnabled: boolean;
  isZoomed: boolean;
  onToggleDataView: () => void;
  onToggleZoom: () => void;
  onResetZoom: () => void;
  onSetVariant: (v: ChartVariant) => void;
  onRestore: () => void;
  onSaveImage: () => void;
};

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-md transition-all ${
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:text-foreground hover:bg-surface-hover"
      }`}
    >
      <Icon size={14} />
    </button>
  );
}

export function ChartToolbar({
  capabilities,
  variant,
  showDataView,
  zoomEnabled,
  isZoomed,
  onToggleDataView,
  onToggleZoom,
  onResetZoom,
  onSetVariant,
  onRestore,
  onSaveImage,
}: ToolbarProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-background border border-border/50 p-0.5 gap-0.5">
      {capabilities.dataView && (
        <ToolbarButton
          icon={Table2}
          label="Data View"
          active={showDataView}
          onClick={onToggleDataView}
        />
      )}

      {capabilities.zoom && (
        <>
          <ToolbarButton
            icon={ZoomIn}
            label="Zoom (drag to select)"
            active={zoomEnabled}
            onClick={onToggleZoom}
          />
          {isZoomed && (
            <ToolbarButton
              icon={RotateCcw}
              label="Reset Zoom"
              onClick={onResetZoom}
            />
          )}
        </>
      )}

      {capabilities.chartSwitch && (
        <>
          <div className="w-px h-4 bg-border/50 mx-0.5" />
          <ToolbarButton
            icon={TrendingUp}
            label="Line Chart"
            active={variant === "line"}
            onClick={() => onSetVariant("line")}
          />
          <ToolbarButton
            icon={BarChart3}
            label="Bar Chart"
            active={variant === "bar"}
            onClick={() => onSetVariant("bar")}
          />
          <ToolbarButton
            icon={AreaChartIcon}
            label="Area Chart"
            active={variant === "area"}
            onClick={() => onSetVariant("area")}
          />
          {variant !== capabilities.defaultVariant && (
            <ToolbarButton
              icon={Undo2}
              label="Restore Default"
              onClick={onRestore}
            />
          )}
        </>
      )}

      {capabilities.saveImage && (
        <>
          <div className="w-px h-4 bg-border/50 mx-0.5" />
          <ToolbarButton
            icon={Download}
            label="Save as Image"
            onClick={onSaveImage}
          />
        </>
      )}
    </div>
  );
}
