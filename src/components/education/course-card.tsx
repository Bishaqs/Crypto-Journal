"use client";

import Link from "next/link";
import { BookOpen, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import type { CourseDefinition, CourseProgress } from "@/lib/education";
import { COURSE_CATEGORY_META } from "@/lib/education/categories";

interface CourseCardProps {
  course: CourseDefinition;
  progress: CourseProgress;
  recommended?: boolean;
}

export function CourseCard({ course, progress, recommended }: CourseCardProps) {
  const categoryMeta = COURSE_CATEGORY_META[course.category];
  const totalTime = course.lessons.reduce((sum, l) => sum + l.readingTime, 0);

  return (
    <Link href={`/dashboard/learn/${course.slug}`}>
      <div className="group relative glass rounded-2xl p-5 border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,180,216,0.08)] cursor-pointer h-full flex flex-col">
        {recommended && (
          <div className="absolute -top-2.5 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-semibold">
            <Sparkles size={10} />
            Recommended for you
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{course.emoji}</span>
          {progress.isComplete && (
            <div className="flex items-center gap-1 text-profit text-xs font-semibold">
              <CheckCircle2 size={14} />
              Complete
            </div>
          )}
        </div>

        {/* Title & description */}
        <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-accent transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-muted line-clamp-2 mb-3 flex-1">
          {course.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-muted mb-3">
          <span className={`${categoryMeta.color} font-semibold`}>
            {categoryMeta.label}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            {course.lessons.length} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {totalTime}m
          </span>
        </div>

        {/* Difficulty badge */}
        <div className="flex items-center gap-2 mb-3">
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
          <span className="text-[10px] text-muted">
            {course.totalXP} XP
          </span>
        </div>

        {/* Progress bar */}
        {progress.progressPercent > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted mb-1">
              <span>
                {progress.completedLessons.size}/{course.lessons.length} lessons
              </span>
              <span>{progress.progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
