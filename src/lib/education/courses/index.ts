import type { CourseDefinition } from "../types";
import { TRADING_PSYCHOLOGY_101 } from "./trading-psychology-101";
import { RISK_MANAGEMENT_FUNDAMENTALS } from "./risk-management-fundamentals";
import { JOURNAL_MASTERY } from "./journal-mastery";
import { EMOTIONAL_REGULATION } from "./emotional-regulation";

export {
  TRADING_PSYCHOLOGY_101,
  RISK_MANAGEMENT_FUNDAMENTALS,
  JOURNAL_MASTERY,
  EMOTIONAL_REGULATION,
};

export const ALL_COURSES: CourseDefinition[] = [
  TRADING_PSYCHOLOGY_101,
  RISK_MANAGEMENT_FUNDAMENTALS,
  JOURNAL_MASTERY,
  EMOTIONAL_REGULATION,
];

export const COURSE_MAP: Record<string, CourseDefinition> = Object.fromEntries(
  ALL_COURSES.map((c) => [c.slug, c])
);
