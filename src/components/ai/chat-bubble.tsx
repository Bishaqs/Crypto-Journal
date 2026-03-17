"use client";

import { Brain, AlertCircle } from "lucide-react";
import { formatAndSanitizeMarkdown } from "@/lib/sanitize";

export type Message = {
  role: "user" | "assistant" | "error";
  content: string;
};

export function ChatBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent/10 border border-accent/20 text-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%] text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="bg-loss/10 border border-loss/20 text-loss rounded-2xl rounded-tl-md px-4 py-3 max-w-[75%] text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-background border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%] text-sm text-foreground leading-relaxed">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className="text-accent" />
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
            Nova
          </span>
        </div>
        <div
          className="prose prose-sm prose-invert max-w-none [&_strong]:text-accent [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:space-y-1 [&_li]:text-muted"
          dangerouslySetInnerHTML={{ __html: formatAndSanitizeMarkdown(message.content) }}
        />
      </div>
    </div>
  );
}
