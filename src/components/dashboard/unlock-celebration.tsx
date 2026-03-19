"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Unlock } from "lucide-react";
import { useLevel } from "@/lib/xp/context";

const CATEGORY_LABELS: Record<string, string> = {
  analytics: "Analytics",
  intelligence: "Intelligence",
  compete: "Compete",
  market: "Market & Tools",
};

export function UnlockCelebration() {
  const { recentUnlocks, dismissUnlocks } = useLevel();
  const [visible, setVisible] = useState(false);
  const [currentUnlock, setCurrentUnlock] = useState<string | null>(null);

  useEffect(() => {
    if (recentUnlocks.length > 0) {
      setCurrentUnlock(recentUnlocks[0]);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissUnlocks, 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [recentUnlocks, dismissUnlocks]);

  const label = currentUnlock ? CATEGORY_LABELS[currentUnlock] ?? currentUnlock : "";

  return (
    <AnimatePresence>
      {visible && currentUnlock && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface border border-accent/30 shadow-[0_0_30px_rgba(0,180,216,0.2)]">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Unlock size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-accent font-bold uppercase tracking-wider">Unlocked</p>
              <p className="text-sm font-semibold text-foreground">{label}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
