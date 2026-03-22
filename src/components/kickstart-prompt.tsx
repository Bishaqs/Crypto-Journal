"use client";

import { motion } from "framer-motion";
import { Brain, ArrowRight, X } from "lucide-react";

type Props = {
  onStart: () => void;
  onSkip: () => void;
};

export function KickstartPrompt({ onStart, onSkip }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass border border-accent/20 rounded-2xl w-full max-w-md p-8 text-center space-y-6"
        style={{ boxShadow: "0 0 80px rgba(0,180,216,0.12)" }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center"
        >
          <Brain className="w-8 h-8 text-accent" />
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Supercharge Your AI Coach
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Nova, your AI trading coach, adapts to your psychology. A 5-minute
            assessment helps her coach you like a human mentor — understanding
            your risk patterns, emotional triggers, and decision-making style.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-2 text-left">
          {[
            "Personalized coaching based on your trading psychology",
            "Identify emotional patterns before they cost you money",
            "Get insights tailored to your specific blind spots",
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-start gap-2 text-xs text-muted"
            >
              <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
              {benefit}
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-accent text-background hover:bg-accent-hover transition-all"
          >
            Start Assessment <ArrowRight size={16} />
          </button>
          <button
            onClick={onSkip}
            className="w-full flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-xs text-muted hover:text-foreground transition-all"
          >
            <X size={12} /> Skip for now
          </button>
        </div>

        <p className="text-[10px] text-muted/50">
          You can always complete this later from Settings
        </p>
      </motion.div>
    </div>
  );
}
