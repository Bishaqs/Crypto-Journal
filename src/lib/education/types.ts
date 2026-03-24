import type { TradingArchetype } from "@/lib/psychology-scoring";

export type CourseCategory =
  | "psychology"
  | "risk-management"
  | "journaling"
  | "strategy"
  | "mindset";

export type CourseDifficulty = "beginner" | "intermediate" | "advanced";

export type LessonContentBlock =
  | { type: "text"; content: string }
  | { type: "callout"; variant: "tip" | "warning" | "insight"; content: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "video"; placeholder: true; heygen_id?: string }
  | { type: "quiz"; questions: LessonQuizQuestion[] };

export type LessonQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LessonDefinition = {
  slug: string;
  title: string;
  description: string;
  readingTime: number;
  xpReward: number;
  content: LessonContentBlock[];
};

export type CourseDefinition = {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  recommendedFor: TradingArchetype[];
  totalXP: number;
  lessons: LessonDefinition[];
  published: boolean;
  freeTier?: boolean;
};

export type LessonProgress = {
  course_slug: string;
  lesson_slug: string;
  completed_at: string;
  xp_awarded: number;
};

export type CourseProgress = {
  courseSlug: string;
  completedLessons: Set<string>;
  progressPercent: number;
  isComplete: boolean;
};
