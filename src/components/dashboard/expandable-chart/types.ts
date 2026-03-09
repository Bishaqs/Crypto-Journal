import type { ReactNode } from "react";

export type ChartVariant = "area" | "line" | "bar";

export type ChartCapabilities = {
  zoom: boolean;
  chartSwitch: boolean;
  dataView: boolean;
  saveImage: boolean;
  defaultVariant: ChartVariant;
};

export type DataColumn = {
  key: string;
  label: string;
  format?: (value: unknown) => string;
};

export type ChartRenderProps = {
  height: number;
  variant: ChartVariant;
  zoomedData?: Record<string, unknown>[];
  isExpanded: boolean;
  zoomHandlers?: {
    onMouseDown: (e: { activeLabel?: string | number }) => void;
    onMouseMove: (e: { activeLabel?: string | number }) => void;
    onMouseUp: () => void;
    refAreaLeft: string | null;
    refAreaRight: string | null;
  };
};

export type ExpandableChartProps = {
  title: string;
  titleExtra?: ReactNode;
  capabilities: ChartCapabilities;
  data: Record<string, unknown>[];
  columns: DataColumn[];
  children: (props: ChartRenderProps) => ReactNode;
  id?: string;
  className?: string;
};
