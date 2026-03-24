import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUnreleasedAccess } from "@/lib/api-unreleased-guard";
import { COURSE_MAP } from "@/lib/education/courses";
import { awardXP } from "@/lib/xp/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await checkUnreleasedAccess("education-platform");
  if (!gate.allowed) return gate.response!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseSlug, lessonSlug } = body;

  if (!courseSlug || !lessonSlug) {
    return NextResponse.json(
      { error: "courseSlug and lessonSlug are required" },
      { status: 400 }
    );
  }

  // Validate course and lesson exist
  const course = COURSE_MAP[courseSlug];
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const lesson = course.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Insert progress (UNIQUE constraint prevents double-completion)
  const { error: insertError } = await supabase
    .from("education_progress")
    .insert({
      user_id: user.id,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      xp_awarded: lesson.xpReward,
    });

  if (insertError) {
    // Unique constraint violation = already completed
    if (insertError.code === "23505") {
      return NextResponse.json({
        alreadyCompleted: true,
        xpAwarded: 0,
        courseComplete: false,
      });
    }
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // Award lesson XP
  const xpResult = await awardXP(
    supabase,
    user.id,
    "lesson_completed",
    `${courseSlug}/${lessonSlug}`,
    lesson.xpReward
  );

  // Check if all lessons in the course are now complete
  const { data: completedLessons } = await supabase
    .from("education_progress")
    .select("lesson_slug")
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug);

  const courseComplete =
    (completedLessons?.length ?? 0) >= course.lessons.length;

  // Award course completion bonus
  let courseXP = 0;
  if (courseComplete) {
    const bonus = Math.round(course.totalXP * 0.2); // 20% bonus for course completion
    const courseResult = await awardXP(
      supabase,
      user.id,
      "course_completed",
      courseSlug,
      bonus
    );
    courseXP = courseResult.xpAwarded;
  }

  return NextResponse.json({
    alreadyCompleted: false,
    xpAwarded: xpResult.xpAwarded + courseXP,
    courseComplete,
    newLevel: xpResult.newLevel,
    leveledUp: xpResult.leveledUp,
  });
}
