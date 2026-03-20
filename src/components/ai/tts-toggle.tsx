"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "stargate-ai-tts-enabled";

/**
 * Strip markdown formatting for clean TTS output.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "") // headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/^\s*[-*+]\s+/gm, "") // bullet points
    .replace(/^\s*\d+\.\s+/gm, "") // numbered lists
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/\|.*\|/g, "") // tables
    .replace(/---+/g, "") // horizontal rules
    .replace(/\n{3,}/g, "\n\n") // excess newlines
    .trim();
}

export function useTts() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") setEnabled(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      if (!next) {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
      }
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !supported) return;
    window.speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Google UK English Female") || v.name.includes("Samantha") || v.name.includes("Karen"),
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [enabled, supported]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { enabled, supported, speaking, toggle, speak, cancel };
}

export function TtsToggle({ enabled, supported, speaking, onToggle }: {
  enabled: boolean;
  supported: boolean;
  speaking: boolean;
  onToggle: () => void;
}) {
  if (!supported) return null;

  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg transition-all ${
        enabled
          ? speaking
            ? "text-accent bg-accent/10 animate-pulse"
            : "text-accent bg-accent/5 hover:bg-accent/10"
          : "text-muted hover:text-foreground hover:bg-surface"
      }`}
      title={enabled ? "Disable voice responses" : "Enable voice responses"}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}
