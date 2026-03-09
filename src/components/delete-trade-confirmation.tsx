"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

type DeleteTradeConfirmationProps = {
  symbol: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function DeleteTradeConfirmation({
  symbol,
  onConfirm,
  onCancel,
}: DeleteTradeConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-border/50 rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmed ? "bg-loss/20" : "bg-loss/10"}`}>
            <AlertTriangle className={`w-5 h-5 ${confirmed ? "text-loss" : "text-loss/80"}`} />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {confirmed ? "Are you sure?" : "Delete Trade"}
          </h2>
        </div>

        <p className="text-muted text-sm mb-6">
          {confirmed
            ? "This is permanent and cannot be undone."
            : <>Delete <span className="font-semibold text-foreground">{symbol}</span> trade?</>}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setConfirmed(false);
              onCancel();
            }}
            className="flex-1 py-2.5 rounded-lg bg-surface border border-border text-muted font-medium hover:text-foreground hover:border-accent/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
              confirmed
                ? "bg-red-600 hover:bg-red-500"
                : "bg-loss/80 hover:bg-loss"
            }`}
          >
            {loading
              ? "Deleting..."
              : confirmed
                ? "Permanently Delete"
                : "Delete Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}
