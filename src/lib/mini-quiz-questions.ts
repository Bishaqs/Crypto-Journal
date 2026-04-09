// ─── Mini Quiz: 9 Weighted Questions + 3 Interstitials ─────────────────────
// 3 questions x 3 dimensions = 9 total
// Weighted scoring (1-2 per option) replaces binary tallying
// Varied UI: icon grids, scenario cards, multi-select for engagement
// Interstitials add breathing room + credibility between question groups

import type { Dimension } from "./mini-quiz-archetypes";

// ─── Types ──────────────────────────────────────────────────────────────────

export type QuestionVariant = "icon-grid" | "scenario-cards";

export type QuizOption = {
  id: string;
  label: string;
  icon?: string; // Lucide icon name
  pole: string;
  weight: number; // 1 = leaning, 2 = strong signal
};

export type QuizQuestion = {
  type: "question";
  variant: QuestionVariant;
  id: string;
  icon: string; // Lucide icon name
  question: string;
  subtitle?: string;
  dimension: Dimension;
  options: QuizOption[];
  multiSelect?: boolean;
};

export type InterstitialStep = {
  type: "interstitial";
  id: string;
  icon: string; // Lucide icon name
  stat: string;
  statLabel: string;
  description: string;
};

export type QuizStep = QuizQuestion | InterstitialStep;

// ─── Quiz Flow ──────────────────────────────────────────────────────────────

export const QUIZ_STEPS: QuizStep[] = [
  // ─── Decision Engine (Analytical <-> Intuitive) ────────────────────────

  {
    type: "question",
    variant: "icon-grid",
    id: "de_1",
    icon: "BarChart3",
    question: "What best describes your trading approach?",
    subtitle: "Select the one that fits best",
    dimension: "decision_engine",
    options: [
      { id: "de_1_a", label: "Systematic", icon: "Settings", pole: "analytical", weight: 2 },
      { id: "de_1_b", label: "Data-informed", icon: "TrendingUp", pole: "analytical", weight: 1 },
      { id: "de_1_c", label: "Narrative-driven", icon: "Newspaper", pole: "intuitive", weight: 1 },
      { id: "de_1_d", label: "Instinct-first", icon: "Brain", pole: "intuitive", weight: 2 },
    ],
  },
  {
    type: "question",
    variant: "scenario-cards",
    id: "de_2",
    icon: "Search",
    question: "You spot a potential setup. What's your first move?",
    dimension: "decision_engine",
    options: [
      { id: "de_2_a", label: "Check 2-3 indicators and calculate risk/reward", pole: "analytical", weight: 2 },
      { id: "de_2_b", label: "Quick chart check, take it if the setup is clean", pole: "analytical", weight: 1 },
      { id: "de_2_c", label: "See if the chart 'looks right' to my eye", pole: "intuitive", weight: 1 },
      { id: "de_2_d", label: "Already in. I felt this move building", pole: "intuitive", weight: 2 },
    ],
  },
  {
    type: "question",
    variant: "scenario-cards",
    id: "de_3",
    icon: "Zap",
    question: "Your indicators say buy, but something feels off. You...",
    dimension: "decision_engine",
    options: [
      { id: "de_3_a", label: "Trust the data. Feelings aren't a strategy", pole: "analytical", weight: 2 },
      { id: "de_3_b", label: "Take a smaller position as a compromise", pole: "analytical", weight: 1 },
      { id: "de_3_c", label: "Wait. If it feels wrong, something IS wrong", pole: "intuitive", weight: 1 },
      { id: "de_3_d", label: "Skip entirely. My gut has saved me before", pole: "intuitive", weight: 2 },
    ],
  },

  // ─── Interstitial 1 ──────────────────────────────────────────────────

  {
    type: "interstitial",
    id: "interstitial_1",
    icon: "Brain",
    stat: "73%",
    statLabel: "OF TRADERS LOSE MONEY",
    description: "Not because of bad strategy. Because of unmanaged psychology. Your decision patterns are the edge most traders never optimize.",
  },

  // ─── Risk Appetite (Aggressive <-> Conservative) ───────────────────────

  {
    type: "question",
    variant: "icon-grid",
    id: "ra_1",
    icon: "Scale",
    question: "How do you size your trades?",
    subtitle: "Select the one closest to your style",
    dimension: "risk_appetite",
    options: [
      { id: "ra_1_a", label: "All in on conviction", icon: "Flame", pole: "aggressive", weight: 2 },
      { id: "ra_1_b", label: "Meaningful 5-10%", icon: "Rocket", pole: "aggressive", weight: 1 },
      { id: "ra_1_c", label: "Moderate 2-5%", icon: "Scale", pole: "conservative", weight: 1 },
      { id: "ra_1_d", label: "Under 2% always", icon: "Shield", pole: "conservative", weight: 2 },
    ],
  },
  {
    type: "question",
    variant: "scenario-cards",
    id: "ra_2",
    icon: "TrendingDown",
    question: "A trade drops 15% against you. What do you do?",
    dimension: "risk_appetite",
    options: [
      { id: "ra_2_a", label: "Add more. It's at a better price now", pole: "aggressive", weight: 2 },
      { id: "ra_2_b", label: "Hold. My thesis hasn't changed", pole: "aggressive", weight: 1 },
      { id: "ra_2_c", label: "Reduce position to manage risk", pole: "conservative", weight: 1 },
      { id: "ra_2_d", label: "Cut immediately. Protect capital", pole: "conservative", weight: 2 },
    ],
  },
  {
    type: "question",
    variant: "scenario-cards",
    id: "ra_3",
    icon: "Target",
    question: "You just hit 3 winners in a row. Next trade you...",
    dimension: "risk_appetite",
    options: [
      { id: "ra_3_a", label: "Double the size. I'm in the zone", pole: "aggressive", weight: 2 },
      { id: "ra_3_b", label: "Size up slightly, ride the momentum", pole: "aggressive", weight: 1 },
      { id: "ra_3_c", label: "Same size. Streaks don't change the math", pole: "conservative", weight: 1 },
      { id: "ra_3_d", label: "Actually reduce. I might be due for a loss", pole: "conservative", weight: 2 },
    ],
  },

  // ─── Interstitial 2 ──────────────────────────────────────────────────

  {
    type: "interstitial",
    id: "interstitial_2",
    icon: "BarChart3",
    stat: "34x",
    statLabel: "PORTFOLIO CHECKS PER DAY",
    description: "The average trader checks their portfolio 34 times daily. Your relationship with risk shapes every single check.",
  },

  // ─── Emotional Pattern (Controlled <-> Reactive) ───────────────────────

  {
    type: "question",
    variant: "scenario-cards",
    id: "ep_1",
    icon: "Flame",
    question: "You just took a significant loss. What happens next?",
    dimension: "emotional_pattern",
    options: [
      { id: "ep_1_a", label: "Close charts, journal it, come back tomorrow", pole: "controlled", weight: 2 },
      { id: "ep_1_b", label: "Review what went wrong, then continue carefully", pole: "controlled", weight: 1 },
      { id: "ep_1_c", label: "Look for the next setup to make it back", pole: "reactive", weight: 1 },
      { id: "ep_1_d", label: "Immediately go bigger. I need to recover NOW", pole: "reactive", weight: 2 },
    ],
  },
  {
    type: "question",
    variant: "icon-grid",
    id: "ep_2",
    icon: "Smartphone",
    question: "What triggers your worst trades?",
    subtitle: "Select all that apply",
    dimension: "emotional_pattern",
    multiSelect: true,
    options: [
      { id: "ep_2_a", label: "FOMO", icon: "Clock", pole: "reactive", weight: 1 },
      { id: "ep_2_b", label: "Revenge trading", icon: "Flame", pole: "reactive", weight: 2 },
      { id: "ep_2_c", label: "Boredom", icon: "Moon", pole: "reactive", weight: 1 },
      { id: "ep_2_d", label: "Social media hype", icon: "Megaphone", pole: "reactive", weight: 1 },
      { id: "ep_2_e", label: "Overconfidence", icon: "TrendingUp", pole: "reactive", weight: 1 },
      { id: "ep_2_f", label: "None of these", icon: "Shield", pole: "controlled", weight: 2 },
    ],
  },
  {
    type: "question",
    variant: "scenario-cards",
    id: "ep_3",
    icon: "Moon",
    question: "Market's been dead quiet for 2 weeks. Nothing moving. You...",
    dimension: "emotional_pattern",
    options: [
      { id: "ep_3_a", label: "Perfect. No setups means no trades", pole: "controlled", weight: 2 },
      { id: "ep_3_b", label: "Use the downtime to research and prepare", pole: "controlled", weight: 1 },
      { id: "ep_3_c", label: "Look at smaller timeframes for opportunities", pole: "reactive", weight: 1 },
      { id: "ep_3_d", label: "Switch markets. I need some action", pole: "reactive", weight: 2 },
    ],
  },

  // ─── Interstitial 3 ──────────────────────────────────────────────────

  {
    type: "interstitial",
    id: "interstitial_3",
    icon: "TrendingUp",
    stat: "30%",
    statLabel: "WIN RATE IMPROVEMENT",
    description: "Traders who consistently journal and track their psychology improve their win rate by 30% within 90 days.",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export const QUIZ_QUESTIONS = QUIZ_STEPS.filter(
  (s): s is QuizQuestion => s.type === "question",
);

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length;
export const TOTAL_STEPS = QUIZ_STEPS.length;

// Backward-compatible export for any code referencing the old format
export type MiniQuizQuestion = QuizQuestion;
export const MINI_QUIZ_QUESTIONS = QUIZ_QUESTIONS;
