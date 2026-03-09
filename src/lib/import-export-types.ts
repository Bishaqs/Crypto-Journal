/* ================================================================
   Import/Export Hub — Shared Types
   ================================================================ */

export type BrokerType = "crypto_exchange" | "stock_broker" | "dex" | "forex_broker";
export type TargetTable = "trades" | "stock_trades" | "commodity_trades" | "forex_trades";
export type SyncFrequency = "manual" | "hourly" | "daily" | "weekly";
export type ConnectionStatus = "pending" | "active" | "error" | "paused" | "disconnected";

export type BrokerConnection = {
  id: string;
  user_id: string;
  broker_name: string;
  broker_type: BrokerType;
  account_label: string | null;
  target_table: TargetTable;
  sync_frequency: SyncFrequency;
  timezone: string;
  currency: string;
  auto_sync_enabled: boolean;
  status: ConnectionStatus;
  last_sync_at: string | null;
  total_trades_synced: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  // Note: encrypted fields are never returned to the client
  api_key_last4?: string;
};

export type SyncLog = {
  id: string;
  connection_id: string;
  user_id: string;
  sync_type: "manual" | "scheduled" | "initial";
  status: "started" | "success" | "partial" | "failed";
  trades_fetched: number;
  trades_imported: number;
  trades_skipped: number;
  trades_failed: number;
  error_message: string | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
};

export type BrokerInstruction = {
  brokerId: string;
  brokerName: string;
  group: "cex" | "stocks" | "dex" | "forex";
  targetTable: TargetTable;
  steps: string[];
  fileFormat: string;
  expectedColumns: string[];
  notes: string[];
  exportUrl?: string;
};

export type ExportFormat = "csv" | "json";

export type ExportOptions = {
  tables: TargetTable[];
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  timezone: "utc" | "local";
  currency: "base" | "native";
};

export type ImportExportTab = "upload" | "manual" | "add-sync" | "connections" | "export";
