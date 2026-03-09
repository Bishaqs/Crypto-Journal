"use client";

import { useState, useCallback } from "react";
import { Maximize2 } from "lucide-react";
import { ChartModal } from "./chart-modal";
import { useChartZoom } from "./use-chart-zoom";
import type { ExpandableChartProps, ChartVariant } from "./types";

export function ExpandableChart({
  title,
  titleExtra,
  capabilities,
  data,
  columns,
  children,
  id,
  className,
}: ExpandableChartProps) {
  const [expanded, setExpanded] = useState(false);
  const [variant, setVariant] = useState<ChartVariant>(
    capabilities.defaultVariant
  );
  const [showDataView, setShowDataView] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);

  const typedData = data as (Record<string, unknown> & { date: string })[];
  const zoom = useChartZoom(typedData, zoomEnabled && expanded);

  const handleClose = useCallback(() => {
    setExpanded(false);
    setShowDataView(false);
    setZoomEnabled(false);
    zoom.resetZoom();
  }, [zoom]);

  const handleRestore = useCallback(() => {
    setVariant(capabilities.defaultVariant);
  }, [capabilities.defaultVariant]);

  return (
    <div id={id} className={className}>
      {/* Collapsed view */}
      <div className="relative group/expand">
        {children({
          height: 220,
          variant: capabilities.defaultVariant,
          isExpanded: false,
        })}
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-background/80 border border-border/50 text-muted hover:text-foreground hover:bg-surface-hover opacity-0 group-hover/expand:opacity-100 transition-all z-10"
          title="Expand chart"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <ChartModal
          title={title}
          titleExtra={titleExtra}
          capabilities={capabilities}
          variant={variant}
          showDataView={showDataView}
          zoomEnabled={zoomEnabled}
          isZoomed={zoom.isZoomed}
          data={data}
          columns={columns}
          onClose={handleClose}
          onToggleDataView={() => setShowDataView((v) => !v)}
          onToggleZoom={() => setZoomEnabled((v) => !v)}
          onResetZoom={zoom.resetZoom}
          onSetVariant={setVariant}
          onRestore={handleRestore}
          zoomHandlers={{
            onMouseDown: zoom.onMouseDown,
            onMouseMove: zoom.onMouseMove,
            onMouseUp: zoom.onMouseUp,
            refAreaLeft: zoom.refAreaLeft,
            refAreaRight: zoom.refAreaRight,
          }}
          zoomedData={
            zoom.isZoomed
              ? (zoom.zoomedData as Record<string, unknown>[])
              : undefined
          }
        >
          {children}
        </ChartModal>
      )}
    </div>
  );
}
