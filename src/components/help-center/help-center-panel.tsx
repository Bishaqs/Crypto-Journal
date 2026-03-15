"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { useHelpCenter } from "@/lib/help-center-context";
import { HelpCenterHome } from "./help-center-home";
import { HelpCenterArticle } from "./help-center-article";
import { HelpCenterCategory } from "./help-center-category";

const HALF_WIDTH = 420;

export function HelpCenterPanel() {
  const { state, closeHelpCenter, toggleMode, goBack } = useHelpCenter();
  const panelRef = useRef<HTMLDivElement>(null);

  const { isOpen, mode, view } = state;
  const isFull = mode === "full";
  const canGoBack = view.type !== "home";

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeHelpCenter();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeHelpCenter]);

  // Click outside closes (half mode only)
  useEffect(() => {
    if (!isOpen || isFull) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeHelpCenter();
      }
    }
    // Use timeout to avoid closing on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, isFull, closeHelpCenter]);

  const panelWidth = isFull ? "100vw" : `${HALF_WIDTH}px`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (half mode only) */}
          {!isFull && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/30"
              aria-hidden="true"
            />
          )}

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            initial={{ x: isFull ? "100vw" : HALF_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: isFull ? "100vw" : HALF_WIDTH }}
            transition={
              // Enter: spring, Exit: tween (mirrors sidebar-drawer)
              { type: "spring", damping: 35, stiffness: 400 }
            }
            className="fixed top-0 right-0 bottom-0 z-[60] flex flex-col border-l border-border/50 max-sm:!w-full"
            style={{
              width: panelWidth,
              background: "var(--background)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                {canGoBack && (
                  <button
                    onClick={goBack}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                    title="Back"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h1 className="text-sm font-bold text-foreground">Help Center</h1>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMode}
                  className="hidden md:flex p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                  title={isFull ? "Collapse" : "Expand"}
                >
                  {isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={closeHelpCenter}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {view.type === "home" && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <HelpCenterHome />
                  </motion.div>
                )}
                {view.type === "article" && (
                  <motion.div
                    key={`article-${view.articleId}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <HelpCenterArticle articleId={view.articleId} />
                  </motion.div>
                )}
                {view.type === "category" && (
                  <motion.div
                    key={`category-${view.categoryKey}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <HelpCenterCategory categoryKey={view.categoryKey} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
