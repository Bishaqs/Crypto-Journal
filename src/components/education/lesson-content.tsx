"use client";

import { useState } from "react";
import {
  Lightbulb,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
} from "lucide-react";
import type { LessonContentBlock, LessonQuizQuestion } from "@/lib/education";
import { sanitizeHtml } from "@/lib/sanitize";

export function LessonContent({ blocks }: { blocks: LessonContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <ContentBlock key={i} block={block} />
      ))}
    </div>
  );
}

function ContentBlock({ block }: { block: LessonContentBlock }) {
  switch (block.type) {
    case "text":
      return <TextBlock content={block.content} />;
    case "callout":
      return <CalloutBlock variant={block.variant} content={block.content} />;
    case "image":
      return <ImageBlock src={block.src} alt={block.alt} caption={block.caption} />;
    case "video":
      return <VideoPlaceholder />;
    case "quiz":
      return <QuizBlock questions={block.questions} />;
    default:
      return null;
  }
}

function TextBlock({ content }: { content: string }) {
  // Simple markdown-like rendering: headers, bold, italic, lists, tables
  const html = content
    .replace(/### (.+)/g, '<h3 class="text-base font-bold text-foreground mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /\| (.+?) \|/g,
      (match) => {
        const cells = match
          .split("|")
          .filter(Boolean)
          .map((c) => c.trim());
        return `<tr>${cells.map((c) => `<td class="px-3 py-1.5 border border-border/50 text-xs">${c}</td>`).join("")}</tr>`;
      }
    )
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><div class="w-4 h-4 mt-0.5 rounded border border-border/50 shrink-0"></div><span class="text-sm text-muted">$1</span></div>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-muted ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="text-sm text-muted ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-muted leading-relaxed mb-3">')
    .replace(/\n/g, "<br/>");

  return (
    <div
      className="text-sm text-muted leading-relaxed prose-sm"
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(`<p class="text-sm text-muted leading-relaxed mb-3">${html}</p>`),
      }}
    />
  );
}

function CalloutBlock({
  variant,
  content,
}: {
  variant: "tip" | "warning" | "insight";
  content: string;
}) {
  const config = {
    tip: {
      icon: Lightbulb,
      bg: "bg-accent/5",
      border: "border-accent/20",
      iconColor: "text-accent",
      label: "Tip",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-loss/5",
      border: "border-loss/20",
      iconColor: "text-loss",
      label: "Warning",
    },
    insight: {
      icon: Sparkles,
      bg: "bg-purple-500/5",
      border: "border-purple-500/20",
      iconColor: "text-purple-400",
      label: "Insight",
    },
  }[variant];

  const Icon = config.icon;

  // Render bold and italic in callout content
  const html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl p-4 flex gap-3`}
    >
      <Icon size={18} className={`${config.iconColor} shrink-0 mt-0.5`} />
      <div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${config.iconColor} block mb-1`}
        >
          {config.label}
        </span>
        <p
          className="text-sm text-muted leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </div>
    </div>
  );
}

function ImageBlock({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <figure className="rounded-xl overflow-hidden border border-border/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full" onError={() => setFailed(true)} />
      {caption && (
        <figcaption className="text-xs text-muted text-center py-2 px-4 bg-surface">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function VideoPlaceholder() {
  return (
    <div className="rounded-xl border border-border/50 bg-surface aspect-video flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
          <Play size={24} className="text-accent ml-1" />
        </div>
        <p className="text-sm text-muted">Video lesson coming soon</p>
      </div>
    </div>
  );
}

function QuizBlock({ questions }: { questions: LessonQuizQuestion[] }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
        Quick Check
      </h4>
      {questions.map((q) => (
        <QuizQuestion key={q.id} question={q} />
      ))}
    </div>
  );
}

function QuizQuestion({ question }: { question: LessonQuizQuestion }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === question.correctIndex;

  return (
    <div className="glass rounded-xl p-4 border border-border/50">
      <p className="text-sm font-semibold text-foreground mb-3">
        {question.question}
      </p>
      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;

          return (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                !answered
                  ? "border border-border/50 hover:border-accent/30 hover:bg-accent/5 text-muted"
                  : isCorrect
                  ? "border border-profit/30 bg-profit/10 text-profit"
                  : isSelected
                  ? "border border-loss/30 bg-loss/10 text-loss"
                  : "border border-border/30 text-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {answered &&
                  (isCorrect ? (
                    <CheckCircle2 size={16} className="shrink-0" />
                  ) : isSelected ? (
                    <XCircle size={16} className="shrink-0" />
                  ) : null)}
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={`mt-3 p-3 rounded-lg text-xs ${
            correct
              ? "bg-profit/5 text-profit/80"
              : "bg-loss/5 text-loss/80"
          }`}
        >
          {correct ? "Correct! " : "Not quite. "}
          {question.explanation}
        </div>
      )}
    </div>
  );
}
