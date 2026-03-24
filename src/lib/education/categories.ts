import type { CourseCategory } from "./types";

export const COURSE_CATEGORY_META: Record<
  CourseCategory,
  { label: string; emoji: string; color: string; description: string }
> = {
  psychology: {
    label: "Psychology",
    emoji: "🧠",
    color: "text-purple-400",
    description: "Understand the mind behind your trades",
  },
  "risk-management": {
    label: "Risk Management",
    emoji: "🛡️",
    color: "text-blue-400",
    description: "Protect your capital, grow consistently",
  },
  journaling: {
    label: "Journaling",
    emoji: "📝",
    color: "text-orange-400",
    description: "Build the habit that unlocks your edge",
  },
  strategy: {
    label: "Strategy",
    emoji: "🎯",
    color: "text-emerald-400",
    description: "Develop systematic approaches to markets",
  },
  mindset: {
    label: "Mindset",
    emoji: "💪",
    color: "text-amber-400",
    description: "Build mental toughness and emotional control",
  },
  fundamentals: {
    label: "Fundamentals",
    emoji: "📚",
    color: "text-cyan-400",
    description: "Start here — learn the basics of markets and trading",
  },
};
