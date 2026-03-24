"use client";

import { use } from "react";
import { useEducation } from "@/lib/education/context";
import { COURSE_MAP } from "@/lib/education";
import { LessonChat } from "@/components/education/lesson-chat";
import { redirect } from "next/navigation";

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = use(params);
  const { loading } = useEducation();

  const course = COURSE_MAP[courseSlug];
  if (!course) redirect("/dashboard/learn");

  const lessonIndex = course.lessons.findIndex((l) => l.slug === lessonSlug);
  if (lessonIndex === -1) redirect(`/dashboard/learn/${courseSlug}`);

  const lesson = course.lessons[lessonIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LessonChat
      course={course}
      lesson={lesson}
      lessonIndex={lessonIndex}
    />
  );
}
