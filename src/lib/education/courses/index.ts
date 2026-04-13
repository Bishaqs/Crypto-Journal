import type { CourseDefinition } from "../types";
import { TRADING_PSYCHOLOGY_101 } from "./trading-psychology-101";
import { RISK_MANAGEMENT_FUNDAMENTALS } from "./risk-management-fundamentals";
import { JOURNAL_MASTERY } from "./journal-mastery";
import { EMOTIONAL_REGULATION } from "./emotional-regulation";
import { POSITION_SIZING_MASTERY } from "./position-sizing-mastery";
import { COGNITIVE_BIAS_DEEP_DIVE } from "./cognitive-bias-deep-dive";
import { BUILDING_YOUR_TRADING_SYSTEM } from "./building-your-trading-system";
import { MARKET_PSYCHOLOGY } from "./market-psychology";
import { REVENGE_TRADING_RECOVERY } from "./revenge-trading-recovery";
import { ADVANCED_RISK_PORTFOLIO } from "./advanced-risk-portfolio";
import { GETTING_STARTED } from "./getting-started";
import { UNDERSTANDING_MARKETS } from "./understanding-markets";
import { READING_CHARTS } from "./reading-charts";
import { ORDER_TYPES_EXECUTION } from "./order-types-execution";
import { FUNDAMENTAL_ANALYSIS } from "./fundamental-analysis";

export {
  TRADING_PSYCHOLOGY_101,
  RISK_MANAGEMENT_FUNDAMENTALS,
  JOURNAL_MASTERY,
  EMOTIONAL_REGULATION,
  POSITION_SIZING_MASTERY,
  COGNITIVE_BIAS_DEEP_DIVE,
  BUILDING_YOUR_TRADING_SYSTEM,
  MARKET_PSYCHOLOGY,
  REVENGE_TRADING_RECOVERY,
  ADVANCED_RISK_PORTFOLIO,
  GETTING_STARTED,
  UNDERSTANDING_MARKETS,
  READING_CHARTS,
  ORDER_TYPES_EXECUTION,
  FUNDAMENTAL_ANALYSIS,
};

export const ALL_COURSES: CourseDefinition[] = [
  GETTING_STARTED,
  TRADING_PSYCHOLOGY_101,
  RISK_MANAGEMENT_FUNDAMENTALS,
  JOURNAL_MASTERY,
  EMOTIONAL_REGULATION,
  POSITION_SIZING_MASTERY,
  COGNITIVE_BIAS_DEEP_DIVE,
  BUILDING_YOUR_TRADING_SYSTEM,
  MARKET_PSYCHOLOGY,
  REVENGE_TRADING_RECOVERY,
  ADVANCED_RISK_PORTFOLIO,
  UNDERSTANDING_MARKETS,
  READING_CHARTS,
  ORDER_TYPES_EXECUTION,
  FUNDAMENTAL_ANALYSIS,
];

export const COURSE_MAP: Record<string, CourseDefinition> = Object.fromEntries(
  ALL_COURSES.map((c) => [c.slug, c])
);
