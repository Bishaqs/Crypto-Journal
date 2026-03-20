"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

interface VoiceChatInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/**
 * Push-to-talk microphone button for Nova chat.
 * Uses browser Web Speech API to transcribe speech in real-time.
 * Auto-sends the final transcript when user stops recording.
 */
export function VoiceChatInput({ onTranscript, disabled }: VoiceChatInputProps) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    transcriptRef.current = "";
    setInterim("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      transcriptRef.current = final;
      setInterim(final + interimText);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        console.error("[VoiceChatInput] Speech error:", event.error);
      }
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
      const text = transcriptRef.current.trim();
      if (text) {
        onTranscript(text);
      }
      setInterim("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
    } catch (err) {
      console.error("[VoiceChatInput] Failed to start:", err);
    }
  }, [onTranscript]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Interim transcript preview */}
      {recording && interim && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 rounded-xl bg-surface border border-accent/20 text-sm text-muted max-h-20 overflow-y-auto">
          <span className="text-accent text-[10px] uppercase tracking-wider font-semibold block mb-0.5">Listening...</span>
          {interim}
        </div>
      )}

      {recording ? (
        <button
          type="button"
          onClick={stop}
          disabled={disabled}
          className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all animate-pulse"
          title="Stop recording and send"
        >
          <Square size={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-accent hover:border-accent/30 transition-all"
          title="Voice input — speak to Nova"
        >
          <Mic size={18} />
        </button>
      )}
    </div>
  );
}
