"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { useEducation } from "@/lib/education/context";
import { COURSE_MAP } from "@/lib/education";
import { COURSE_CATEGORY_META } from "@/lib/education/categories";
import { redirect } from "next/navigation";

export default function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = use(params);
  const { getCourseProgress, isLessonComplete, loading } = useEducation();

  const course = COURSE_MAP[courseSlug];
  if (!course) redirect("/dashboard/learn");

  const progress = getCourseProgress(courseSlug);
  const categoryMeta = COURSE_CATEGORY_META[course.category];
  const totalTime = course.lessons.reduce((sum, l) => sum + l.readingTime, 0);

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
        href="/dashboard/learn"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to courses
      </Link>

      {/* Course header */}
      <div className="glass rounded-2xl p-6 border border-border/50 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl">{course.emoji}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground mb-1">
              {course.title}
            </h1>
            <p className="text-sm text-muted">{course.description}</p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-[10px] font-semibold ${categoryMeta.color}`}>
            {categoryMeta.label}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              course.difficulty === "beginner"
                ? "bg-profit/10 text-profit"
                : course.difficulty === "intermediate"
                ? "bg-accent/10 text-accent"
                : "bg-purple-500/10 text-purple-400"
            }`}
          >
            {course.difficulty.charAt(0).toUpperCase() +
              course.difficulty.slice(1)}
          </span>
          <span className="text-[11px] text-muted flex items-center gap-1">
            <BookOpen size={11} />
            {course.lessons.length} lessons
          </span>
          <span className="text-[11px] text-muted flex items-center gap-1">
            <Clock size={11} />
            {totalTime} min
          </span>
          <span className="text-[11px] text-muted flex items-center gap-1">
            <Sparkles size={11} />
            {course.totalXP} XP
          </span>
        </div>

        {/* Overall progress */}
        <div>
          <div className="flex justify-between text-[11px] text-muted mb-1.5">
            <span>
              {progress.completedLessons.size}/{course.lessons.length} lessons
              completed
            </span>
            <span>{progress.progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course completion banner */}
      {progress.isComplete && (
        <div className="glass rounded-xl p-4 border border-profit/20 bg-profit/5 mb-6 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-profit shrink-0" />
          <div>
            <p className="text-sm font-semibold text-profit">
              Course Complete!
            </p>
            <p className="text-xs text-muted">
              You earned {course.totalXP} XP from this course.
            </p>
          </div>
        </div>
      )}

      {/* Lesson list */}
      <div className="space-y-2">
        {course.lessons.map((lesson, i) => {
          const done = isLessonComplete(courseSlug, lesson.slug);
          return (
            <Link
              key={lesson.slug}
              href={`/dashboard/learn/${courseSlug}/${lesson.slug}`}
            >
              <div
                className={`group glass rounded-xl p-4 border transition-all duration-200 flex items-center gap-4 ${
                  done
                    ? "border-profit/20 bg-profit/5"
                    : "border-border/50 hover:border-accent/30"
                }`}
              >
                {/* Number / Check */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    done
                      ? "bg-profit/15 text-profit"
                      : "bg-surface text-muted"
                  }`}
                >
                  {done ? <CheckCircle2 size={16} /> : i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold mb-0.5 ${
                      done
                        ? "text-profit/80"
                        : "text-foreground group-hover:text-accent"
                    } transition-colors`}
                  >
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-muted truncate">
                    {lesson.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted">
                    {lesson.readingTime}m
                  </span>
                  <span className="text-[10px] text-accent font-semibold">
                    +{lesson.xpReward} XP
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-muted/40 group-hover:text-accent transition-colors"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
