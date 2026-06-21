"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  onTagAdded?: (tag: string) => void;
  /** Show an explicit "+" button that commits the current input as a tag. */
  showAddButton?: boolean;
  /** Show the existing-tags dropdown on focus, even before typing. */
  showSuggestionsOnFocus?: boolean;
};

export function TagInput({ value, onChange, suggestions = [], placeholder = "Type and press Enter...", onTagAdded, showAddButton = false, showSuggestionsOnFocus = false }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(tag: string) {
    // Split on commas so several tags can be added from one entry
    // (e.g. "germany win, win" → two tags). Each part may be multi-word.
    const parts = tag
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length > 0) {
      const next = [...value];
      for (const t of parts) {
        if (!next.includes(t)) {
          next.push(t);
          onTagAdded?.(t);
        }
      }
      onChange(next);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg bg-background border border-border focus-within:border-accent/50 transition-all min-h-[38px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-medium border border-accent/20"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-accent/60 hover:text-accent transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-foreground placeholder:text-muted/40 focus:outline-none"
        />
        {showAddButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (input.trim()) addTag(input);
            }}
            disabled={!input.trim()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-semibold border border-accent/20 hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {/* Suggestions dropdown — on typing, or on focus when enabled */}
      {showSuggestions &&
        (input || showSuggestionsOnFocus) &&
        filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg overflow-hidden max-h-44 overflow-y-auto">
          {!input && showSuggestionsOnFocus && (
            <p className="px-3 pt-1.5 pb-1 text-[10px] text-muted/50 uppercase tracking-wider">
              Vorhandene Tags
            </p>
          )}
          {filtered.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent/10 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
