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
        title="Log Phantom Trade"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white shadow-lg hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all"
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
