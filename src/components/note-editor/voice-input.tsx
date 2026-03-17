"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Sparkles, Type, Loader2, RotateCcw } from "lucide-react";

export interface VoiceResult {
  title: string;
  content: string;
  template: string;
  emotion?: string;
  tags?: string[];
  confidence?: number;
}

interface VoiceInputProps {
  onResult: (data: VoiceResult) => void;
  onRawTranscript?: (text: string) => void;
}

type RecordingState = "idle" | "recording" | "review" | "processing";

// Check browser support (must be called client-side only)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceInput({ onResult, onRawTranscript }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => getSpeechRecognition() !== null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as ArrayLike<{ 0: { transcript: string } }>)
        .map((result) => result[0].transcript)
        .join("");
      setTranscript(text);
      onRawTranscript?.(text);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow mic access in your browser settings.");
      } else if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
      setState("idle");
    };

    recognition.onend = () => {
      // Only transition to review if we were recording (not if manually stopped)
      if (recognitionRef.current === recognition) {
        setState((s) => (s === "recording" ? "review" : s));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("recording");
    setTranscript("");
  }, [onRawTranscript]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState("review");
  }, []);

  const structureWithAI = useCallback(async () => {
    if (!transcript.trim()) return;
    setState("processing");
    setError(null);

    try {
      const provider = localStorage.getItem("stargate-ai-provider") || undefined;
      const model = localStorage.getItem("stargate-ai-model") || undefined;
      const apiKey = localStorage.getItem("stargate-ai-api-key") || undefined;

      const res = await fetch("/api/ai/structure-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim(), provider, model, apiKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to structure journal entry" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: VoiceResult = await res.json();
      onResult(data);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process transcript");
      setState("review");
    }
  }, [transcript, onResult]);

  const useAsPlainText = useCallback(() => {
    if (!transcript.trim()) return;
    onResult({
      title: "",
      content: `<p>${transcript.trim().replace(/\n/g, "</p><p>")}</p>`,
      template: "free",
    });
    reset();
  }, [transcript, onResult]);

  const reset = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState("idle");
    setTranscript("");
    setError(null);
  }, []);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
      >
        <Mic size={14} />
        <span>Voice / AI journal entry</span>
      </button>
    );
  }

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      {/* Idle: show mic button or text fallback */}
      {state === "idle" && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Voice Journal</p>
            <button type="button" onClick={() => setCollapsed(true)} className="text-xs text-muted/50 hover:text-muted transition-colors">
              hide
            </button>
          </div>

          {isSupported ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent/20 bg-accent/5 text-accent text-sm font-medium hover:bg-accent/10 transition-all"
            >
              <Mic size={18} />
              Speak your journal entry
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted/60 italic">Speech recognition not supported in this browser. Type your thoughts instead:</p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Describe your trade or trading day in your own words..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm min-h-[80px] resize-y focus:outline-none focus:border-accent/50 transition-all"
              />
              {transcript.trim() && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={structureWithAI}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-all"
                  >
                    <Sparkles size={14} />
                    Structure with AI
                  </button>
                  <button
                    type="button"
                    onClick={useAsPlainText}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-muted text-sm hover:text-foreground hover:bg-surface-hover transition-all"
                  >
                    <Type size={14} />
                    Use as plain text
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recording: pulsing mic + live transcript */}
      {state === "recording" && (
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={stopRecording}
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <MicOff size={18} className="relative z-10" />
            </button>
            <div>
              <p className="text-sm font-medium text-red-400">Recording...</p>
              <p className="text-xs text-muted">Tap to stop</p>
            </div>
          </div>
          {transcript && (
            <p className="text-sm text-foreground/80 bg-background/50 rounded-lg px-3 py-2 leading-relaxed">
              {transcript}
            </p>
          )}
        </div>
      )}

      {/* Review: show transcript + action buttons */}
      {state === "review" && (
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Transcript ready</p>
            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
              <RotateCcw size={12} />
              Start over
            </button>
          </div>
          <p className="text-sm text-foreground/80 bg-background/50 rounded-lg px-3 py-2 leading-relaxed max-h-[120px] overflow-y-auto">
            {transcript || <span className="text-muted italic">No speech detected. Try again or type below.</span>}
          </p>
          {transcript.trim() && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={structureWithAI}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-all"
              >
                <Sparkles size={14} />
                Structure with AI
              </button>
              <button
                type="button"
                onClick={useAsPlainText}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border text-muted text-sm hover:text-foreground hover:bg-surface-hover transition-all"
              >
                <Type size={14} />
                Plain text
              </button>
            </div>
          )}
        </div>
      )}

      {/* Processing: loading spinner */}
      {state === "processing" && (
        <div className="px-4 py-4 flex items-center justify-center gap-3">
          <Loader2 size={18} className="animate-spin text-accent" />
          <p className="text-sm text-muted">AI is structuring your entry...</p>
        </div>
      )}

      {error && (
        <div className="px-4 pb-3">
          <p className="text-xs text-loss bg-loss/10 px-3 py-1.5 rounded-lg">{error}</p>
        </div>
      )}
    </div>
  );
}
