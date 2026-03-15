"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { FaqCategory } from "@/lib/help-content";

export type HelpCenterView =
  | { type: "home" }
  | { type: "article"; articleId: string }
  | { type: "category"; categoryKey: FaqCategory }
  | { type: "search"; query: string };

export type HelpCenterMode = "half" | "full";

type HelpCenterState = {
  isOpen: boolean;
  mode: HelpCenterMode;
  view: HelpCenterView;
  searchQuery: string;
  history: HelpCenterView[];
};

type HelpCenterAction =
  | { type: "OPEN" }
  | { type: "OPEN_ARTICLE"; articleId: string }
  | { type: "OPEN_CATEGORY"; categoryKey: FaqCategory }
  | { type: "CLOSE" }
  | { type: "TOGGLE_MODE" }
  | { type: "SET_VIEW"; view: HelpCenterView }
  | { type: "SET_SEARCH"; query: string }
  | { type: "GO_BACK" };

const initialState: HelpCenterState = {
  isOpen: false,
  mode: "half",
  view: { type: "home" },
  searchQuery: "",
  history: [],
};

function reducer(state: HelpCenterState, action: HelpCenterAction): HelpCenterState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true, view: { type: "home" }, searchQuery: "", history: [] };
    case "OPEN_ARTICLE":
      return {
        ...state,
        isOpen: true,
        history: state.isOpen ? [...state.history, state.view] : [],
        view: { type: "article", articleId: action.articleId },
        searchQuery: "",
      };
    case "OPEN_CATEGORY":
      return {
        ...state,
        isOpen: true,
        history: state.isOpen ? [...state.history, state.view] : [],
        view: { type: "category", categoryKey: action.categoryKey },
        searchQuery: "",
      };
    case "CLOSE":
      return { ...state, isOpen: false, view: { type: "home" }, searchQuery: "", history: [] };
    case "TOGGLE_MODE":
      return { ...state, mode: state.mode === "half" ? "full" : "half" };
    case "SET_VIEW":
      return {
        ...state,
        history: [...state.history, state.view],
        view: action.view,
      };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.query };
    case "GO_BACK": {
      if (state.history.length === 0) return { ...state, view: { type: "home" } };
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        view: prev,
        history: state.history.slice(0, -1),
      };
    }
    default:
      return state;
  }
}

type HelpCenterContextValue = {
  state: HelpCenterState;
  openHelpCenter: () => void;
  openArticle: (articleId: string) => void;
  openCategory: (categoryKey: FaqCategory) => void;
  closeHelpCenter: () => void;
  toggleMode: () => void;
  setView: (view: HelpCenterView) => void;
  setSearch: (query: string) => void;
  goBack: () => void;
};

const HelpCenterContext = createContext<HelpCenterContextValue | null>(null);

export function HelpCenterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const openHelpCenter = useCallback(() => dispatch({ type: "OPEN" }), []);
  const openArticle = useCallback((articleId: string) => dispatch({ type: "OPEN_ARTICLE", articleId }), []);
  const openCategory = useCallback((categoryKey: FaqCategory) => dispatch({ type: "OPEN_CATEGORY", categoryKey }), []);
  const closeHelpCenter = useCallback(() => dispatch({ type: "CLOSE" }), []);
  const toggleMode = useCallback(() => dispatch({ type: "TOGGLE_MODE" }), []);
  const setView = useCallback((view: HelpCenterView) => dispatch({ type: "SET_VIEW", view }), []);
  const setSearch = useCallback((query: string) => dispatch({ type: "SET_SEARCH", query }), []);
  const goBack = useCallback(() => dispatch({ type: "GO_BACK" }), []);

  return (
    <HelpCenterContext.Provider
      value={{
        state, openHelpCenter, openArticle, openCategory,
        closeHelpCenter, toggleMode, setView, setSearch, goBack,
      }}
    >
      {children}
    </HelpCenterContext.Provider>
  );
}

export function useHelpCenter() {
  const ctx = useContext(HelpCenterContext);
  if (!ctx) throw new Error("useHelpCenter must be used within HelpCenterProvider");
  return ctx;
}

const noop = () => {};
const noopState: HelpCenterState = initialState;
const noopCtx: HelpCenterContextValue = {
  state: noopState,
  openHelpCenter: noop,
  openArticle: noop,
  openCategory: noop,
  closeHelpCenter: noop,
  toggleMode: noop,
  setView: noop,
  setSearch: noop,
  goBack: noop,
};

/** Safe hook that returns no-ops when used outside HelpCenterProvider */
export function useHelpCenterSafe() {
  const ctx = useContext(HelpCenterContext);
  return ctx ?? noopCtx;
}
