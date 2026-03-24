"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useEducation } from "@/lib/education/context";
import { COURSE_MAP } from "@/lib/education";
import { LessonContent } from "@/components/education/lesson-content";
import { useLevel } from "@/lib/xp";
import { redirect } from "next/navigation";

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = use(params);
  const { isLessonComplete, refresh, loading } = useEducation();
  const { refresh: refreshLevel } = useLevel();
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<{
    xpAwarded: number;
    courseComplete: boolean;
    leveledUp: boolean;
  } | null>(null);

  const course = COURSE_MAP[courseSlug];
  if (!course) redirect("/dashboard/learn");

  const lessonIndex = course.lessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) redirect(`/dashboard/learn/${courseSlug}`);

  const lesson = course.lessons[lessonIndex];
  const isComplete = isLessonComplete(courseSlug, lessonSlug);
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch("/api/education/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, lessonSlug }),
      });
      const data = await res.json();
      if (!data.alreadyCompleted) {
        setResult({
          xpAwarded: data.xpAwarded,
          courseComplete: data.courseComplete,
          leveledUp: data.leveledUp,
        });
      }
      refresh();
      refreshLevel();
    } catch {
      // Silently fail — user can retry
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/learn/${courseSlug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        {course.title}
      </Link>

      {/* Lesson header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
          <span>
            Lesson {lessonIndex + 1} of {course.lessons.length}
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {lesson.readingTime} min read
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-accent">
            <Sparkles size={11} />
            +{lesson.xpReward} XP
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground">{lesson.title}</h1>
        <p className="text-sm text-muted mt-1">{lesson.description}</p>
      </div>

      {/* Lesson content */}
      <div className="mb-10">
        <LessonContent blocks={lesson.content} />
      </div>

      {/* Completion section */}
      <div className="border-t border-border/50 pt-6">
        {result ? (
          <div className="glass rounded-xl p-6 border border-profit/20 bg-profit/5 text-center mb-6">
            <CheckCircle2
              size={32}
              className="text-profit mx-auto mb-3"
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
          </div>
        ) : isComplete ? (
          <div className="flex items-center gap-2 text-sm text-profit mb-6">
            <CheckCircle2 size={16} />
            <span>You&apos;ve completed this lesson</span>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {completing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Completing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                Complete Lesson — +{lesson.xpReward} XP
              </span>
            )}
          </button>
        )}

        {/* Previous / Next navigation */}
        <div className="flex items-center justify-between">
          {prevLesson ? (
            <Link
              href={`/dashboard/learn/${courseSlug}/${prevLesson.slug}`}
              className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
            >
              <ArrowLeft size={14} />
              {prevLesson.title}
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link
              href={`/dashboard/learn/${courseSlug}/${nextLesson.slug}`}
              className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
            >
              {nextLesson.title}
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/dashboard/learn"
              className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Back to all courses
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
