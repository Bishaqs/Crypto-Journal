"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { LessonProgress, CourseProgress } from "./types";
import { COURSE_MAP } from "./courses";

type EducationContextType = {
  progress: LessonProgress[];
  completedCourses: string[];
  isLessonComplete: (courseSlug: string, lessonSlug: string) => boolean;
  getCourseProgress: (courseSlug: string) => CourseProgress;
  refresh: () => void;
  loading: boolean;
};

const EducationContext = createContext<EducationContextType>({
  progress: [],
  completedCourses: [],
  isLessonComplete: () => false,
  getCourseProgress: (courseSlug: string) => ({
    courseSlug,
    completedLessons: new Set(),
    progressPercent: 0,
    isComplete: false,
  }),
  refresh: () => {},
  loading: true,
});

export function EducationProvider({
  children,
  userId: initialUserId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);

  const supabase = createClient();

  useEffect(() => {
    if (initialUserId) return;
    supabase.auth
      .getUser()
      .then(
        ({
          data: { user },
        }: {
          data: { user: { id: string } | null };
        }) => {
          if (user) setUserId(user.id);
          else setLoading(false);
        }
      );
  }, [supabase, initialUserId]);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("education_progress")
        .select("course_slug, lesson_slug, completed_at, xp_awarded")
        .eq("user_id", userId);
      if (data) setProgress(data);
    } catch {
      // Table may not exist yet
    }
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) fetchProgress();
  }, [userId, fetchProgress]);

  const isLessonComplete = useCallback(
    (courseSlug: string, lessonSlug: string) =>
      progress.some(
        (p) => p.course_slug === courseSlug && p.lesson_slug === lessonSlug
      ),
    [progress]
  );

  const getCourseProgress = useCallback(
    (courseSlug: string): CourseProgress => {
      const course = COURSE_MAP[courseSlug];
      if (!course)
        return {
          courseSlug,
          completedLessons: new Set(),
          progressPercent: 0,
          isComplete: false,
        };

      const completed = new Set(
        progress
          .filter((p) => p.course_slug === courseSlug)
          .map((p) => p.lesson_slug)
      );

      const total = course.lessons.length;
      return {
        courseSlug,
        completedLessons: completed,
        progressPercent: total > 0 ? Math.round((completed.size / total) * 100) : 0,
        isComplete: completed.size >= total,
      };
    },
    [progress]
  );

  const completedCourses = Object.keys(COURSE_MAP).filter(
    (slug) => getCourseProgress(slug).isComplete
  );

  return (
    <EducationContext.Provider
      value={{
        progress,
        completedCourses,
        isLessonComplete,
        getCourseProgress,
        refresh: fetchProgress,
        loading,
      }}
    >
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  return useContext(EducationContext);
}
