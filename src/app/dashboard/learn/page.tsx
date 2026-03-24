"use client";

import { useState, useMemo } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { useEducation } from "@/lib/education/context";
import { ALL_COURSES, type CourseCategory } from "@/lib/education";
import { COURSE_CATEGORY_META } from "@/lib/education/categories";
import { CourseCard } from "@/components/education/course-card";
import type { TradingArchetype } from "@/lib/psychology-scoring";

const CATEGORIES: (CourseCategory | "all")[] = [
  "all",
  "psychology",
  "risk-management",
  "journaling",
  "strategy",
  "mindset",
];

export default function LearnPage() {
  const { getCourseProgress, loading } = useEducation();
  const [selectedCategory, setSelectedCategory] = useState<
    CourseCategory | "all"
  >("all");

  // TODO: Load from user_preferences.trading_archetype when available
  const userArchetype: TradingArchetype | null = null;

  const publishedCourses = ALL_COURSES.filter((c) => c.published);

  const filteredCourses = useMemo(() => {
    let courses =
      selectedCategory === "all"
        ? publishedCourses
        : publishedCourses.filter((c) => c.category === selectedCategory);

    // Sort: recommended first, then by difficulty
    if (userArchetype) {
      courses = [...courses].sort((a, b) => {
        const aMatch = a.recommendedFor.includes(userArchetype) ? 1 : 0;
        const bMatch = b.recommendedFor.includes(userArchetype) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return courses;
  }, [publishedCourses, selectedCategory, userArchetype]);

  const completedCount = publishedCourses.filter(
    (c) => getCourseProgress(c.slug).isComplete
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <GraduationCap size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Learn</h1>
            <p className="text-xs text-muted">
              {completedCount}/{publishedCourses.length} courses completed
            </p>
          </div>
        </div>
        <p className="text-sm text-muted mt-2 max-w-2xl">
          Build the mental edge that separates consistently profitable traders
          from the rest. Each course is designed to strengthen a specific aspect
          of your trading.
        </p>
      </div>

      {/* Archetype recommendation banner */}
      {userArchetype && (
        <div className="glass rounded-xl p-4 border border-accent/20 bg-accent/5 mb-6 flex items-center gap-3">
          <Sparkles size={18} className="text-accent shrink-0" />
          <p className="text-sm text-muted">
            Based on your psychology profile, courses marked{" "}
            <span className="text-accent font-semibold">Recommended</span> are
            tailored to your trading style.
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const label =
            cat === "all" ? "All Courses" : COURSE_CATEGORY_META[cat].label;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted border border-border/50 hover:border-accent/20 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Course grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted">
            No courses in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.slug}
              course={course}
              progress={getCourseProgress(course.slug)}
              recommended={
                !!userArchetype &&
                course.recommendedFor.includes(userArchetype)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
