"use client";

import { useState } from "react";
import { Ghost } from "lucide-react";
import { PhantomTradeForm } from "./phantom-trade-form";
import { useRouter } from "next/navigation";

export function PhantomQuickAdd() {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        title="Log What-If Setup"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-surface/80 backdrop-blur border border-border text-muted-foreground shadow-lg hover:text-foreground hover:border-accent/50 hover:scale-105 active:scale-95 transition-all"
      >
        <Ghost size={20} />
      </button>

      {showForm && (
        <PhantomTradeForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
