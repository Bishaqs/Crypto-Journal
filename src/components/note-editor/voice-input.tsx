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

type MicPermission = "unknown" | "granted" | "prompt" | "denied";

export function VoiceInput({ onResult, onRawTranscript }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => getSpeechRecognition() !== null);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const reviewTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [consented, setConsented] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("stargate-voice-consent");
    if (stored === "true") return true;
    if (stored === "false") return false;
    return null;
  });

  // Check microphone permission on mount
  useEffect(() => {
    let onChange: (() => void) | null = null;
    let permStatus: PermissionStatus | null = null;

    async function checkPermission() {
      try {
        permStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setMicPermission(permStatus.state as MicPermission);
        onChange = () => setMicPermission(permStatus!.state as MicPermission);
        permStatus.addEventListener("change", onChange);
      } catch {
        // Safari / unsupported — getUserMedia handles the prompt at record time
        setMicPermission("unknown");
      }
    }

    checkPermission();
    return () => {
      if (permStatus && onChange) permStatus.removeEventListener("change", onChange);
    };
  }, []);

  // Auto-focus transcript textarea when entering review state
  useEffect(() => {
    if (state === "review" && reviewTextareaRef.current) {
      reviewTextareaRef.current.focus();
      const len = reviewTextareaRef.current.value.length;
      reviewTextareaRef.current.setSelectionRange(len, len);
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    // Request microphone permission explicitly via getUserMedia
    // This reliably triggers the browser's permission dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop immediately — SpeechRecognition manages its own audio stream
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
    } catch (err) {
      setMicPermission("denied");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Microphone access was denied. Click the lock/info icon in your browser\u2019s address bar, find \u201CMicrophone\u201D, set it to \u201CAllow\u201D, then reload the page."
        );
      } else {
        setError("Could not access microphone. Please check your device settings.");
      }
      return;
    }

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
        setMicPermission("denied");
        setError(
          "Microphone access was denied. Click the lock/info icon in your browser\u2019s address bar, find \u201CMicrophone\u201D, set it to \u201CAllow\u201D, then reload the page."
        );
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

  // Consent prompt — shown once, remembered in localStorage
  if (consented === null) {
    return (
      <div className="border border-border/50 rounded-xl overflow-hidden px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-accent shrink-0" />
          <p className="text-sm text-foreground/80">
            Would you like to enable <span className="font-medium text-foreground">Voice &amp; AI journaling</span>?
          </p>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Speak your journal entries and let AI structure them for you.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("stargate-voice-consent", "true");
              setConsented(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-all"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("stargate-voice-consent", "false");
              setConsented(false);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-muted text-sm hover:text-foreground hover:bg-surface-hover transition-all"
          >
            No thanks
          </button>
        </div>
      </div>
    );
  }

  // Declined — show small hint to re-enable
  if (consented === false) {
    return (
      <button
        type="button"
        onClick={() => {
          localStorage.setItem("stargate-voice-consent", "true");
          setConsented(true);
        }}
        className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
      >
        <Mic size={14} />
        <span>Enable Voice Input</span>
      </button>
    );
  }

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
            micPermission === "denied" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <MicOff size={16} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Microphone access is blocked. Click the lock icon in your address bar, find
                    &quot;Microphone&quot;, and set it to &quot;Allow&quot;. Then reload this page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border/30 text-muted text-xs hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  Try again
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent/20 bg-accent/5 text-accent text-sm font-medium hover:bg-accent/10 transition-all"
              >
                <Mic size={18} />
                Speak your journal entry
              </button>
            )
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
          <textarea
            ref={reviewTextareaRef}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="No speech detected. Try again or type here..."
            className="w-full text-sm text-foreground/80 bg-background/50 rounded-lg px-3 py-2 leading-relaxed max-h-[120px] min-h-[60px] resize-y overflow-y-auto border border-border/30 focus:outline-none focus:border-accent/50 transition-colors"
          />
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
