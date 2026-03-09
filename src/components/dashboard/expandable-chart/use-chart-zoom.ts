"use client";

import { useState, useCallback, useMemo } from "react";

export function useChartZoom<T extends { date: string }>(
  data: T[],
  enabled: boolean
) {
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomLeft, setZoomLeft] = useState<string | null>(null);
  const [zoomRight, setZoomRight] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback(
    (e: { activeLabel?: string | number }) => {
      if (!enabled || e.activeLabel == null) return;
      setRefAreaLeft(String(e.activeLabel));
      setRefAreaRight(null);
      setIsDragging(true);
    },
    [enabled]
  );

  const onMouseMove = useCallback(
    (e: { activeLabel?: string | number }) => {
      if (!enabled || !isDragging || e.activeLabel == null) return;
      setRefAreaRight(String(e.activeLabel));
    },
    [enabled, isDragging]
  );

  const onMouseUp = useCallback(() => {
    if (!enabled || !isDragging) return;
    setIsDragging(false);

    if (!refAreaLeft || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    // Ensure left < right
    const left = refAreaLeft < refAreaRight ? refAreaLeft : refAreaRight;
    const right = refAreaLeft < refAreaRight ? refAreaRight : refAreaLeft;

    if (left === right) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    setZoomLeft(left);
    setZoomRight(right);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, [enabled, isDragging, refAreaLeft, refAreaRight]);

  const resetZoom = useCallback(() => {
    setZoomLeft(null);
    setZoomRight(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setIsDragging(false);
  }, []);

  const zoomedData = useMemo(() => {
    if (!zoomLeft || !zoomRight) return data;
    return data.filter((d) => d.date >= zoomLeft && d.date <= zoomRight);
  }, [data, zoomLeft, zoomRight]);

  const isZoomed = zoomLeft !== null && zoomRight !== null;

  return {
    zoomedData,
    refAreaLeft: isDragging ? refAreaLeft : null,
    refAreaRight: isDragging ? refAreaRight : null,
    isZoomed,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    resetZoom,
  };
}
