"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
} from "lucide-react";
import { ChatBubble } from "@/components/ai/chat-bubble";
import { useLessonChat } from "@/hooks/use-lesson-chat";
import { useEducation } from "@/lib/education/context";
import { useLevel } from "@/lib/xp";
import type { CourseDefinition, LessonDefinition } from "@/lib/education/types";

interface LessonChatProps {
  course: CourseDefinition;
  lesson: LessonDefinition;
  lessonIndex: number;
}

export function LessonChat({ course, lesson, lessonIndex }: LessonChatProps) {
  const { isLessonComplete, refresh } = useEducation();
  const { refresh: refreshLevel } = useLevel();
  const isComplete = isLessonComplete(course.slug, lesson.slug);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{
    xpAwarded: number;
    courseComplete: boolean;
    leveledUp: boolean;
  } | null>(null);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    sending,
    initializing,
    completed,
  } = useLessonChat({
    courseSlug: course.slug,
    lessonSlug: lesson.slug,
    lesson,
    isAlreadyComplete: isComplete,
    onComplete: (r) => {
      setResult(r);
      refresh();
      refreshLevel();
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input after streaming
  useEffect(() => {
    if (!sending && !initializing) {
      inputRef.current?.focus();
    }
  }, [sending, initializing]);

  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-4rem)]">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/learn/${course.slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors mb-4 shrink-0"
      >
        <ArrowLeft size={14} />
        {course.title}
      </Link>

      {/* Header */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-muted mb-1">
          <span>
            Lesson {lessonIndex + 1} of {course.lessons.length}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            ~{lesson.readingTime} min
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-accent">
            <Sparkles size={11} />
            +{lesson.xpReward} XP
          </span>
          {(isComplete || completed) && (
            <>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-profit">
                <CheckCircle2 size={11} />
                Complete
              </span>
            </>
          )}
        </div>
        <h1 className="text-lg font-bold text-foreground">{lesson.title}</h1>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {initializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Brain size={24} className="text-accent" />
              </div>
              <p className="text-sm text-muted">
                Nova is preparing your lesson...
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}

            {/* Typing indicator */}
            {sending &&
              messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start">
                  <div className="bg-background border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-accent" />
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                        Nova
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

            {/* Completion celebration */}
            {result && (
              <div className="glass rounded-xl p-5 border border-profit/20 bg-profit/5 text-center">
                <CheckCircle2
                  size={28}
                  className="text-profit mx-auto mb-2"
                />
                <h3 className="text-base font-bold text-profit mb-1">
                  {result.courseComplete
                    ? "Course Complete!"
                    : "Lesson Complete!"}
                </h3>
                <p className="text-sm text-muted">
                  +{result.xpAwarded} XP earned
                  {result.leveledUp && " — Level up!"}
                </p>
                {nextLesson && (
                  <Link
                    href={`/dashboard/learn/${course.slug}/${nextLesson.slug}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-accent hover:text-accent/80 transition-colors"
                  >
                    Next: {nextLesson.title}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}

            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      {!initializing && (
        <div className="shrink-0 pt-3 border-t border-border/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                completed || isComplete
                  ? "Continue chatting with Nova..."
                  : "Type your response..."
              }
              disabled={sending}
              className="flex-1 bg-surface border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3">
            {prevLesson ? (
              <Link
                href={`/dashboard/learn/${course.slug}/${prevLesson.slug}`}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
              >
                <ArrowLeft size={12} />
                {prevLesson.title}
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link
                href={`/dashboard/learn/${course.slug}/${nextLesson.slug}`}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
              >
                {nextLesson.title}
                <ArrowRight size={12} />
              </Link>
            ) : (
              <Link
                href="/dashboard/learn"
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                All courses
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
