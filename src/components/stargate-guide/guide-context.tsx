"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";

export type GuideMode = "idle" | "onboarding" | "tour" | "help";

export type MenuPanel = "main" | "feeling" | "chat";

export type SpeechContent = {
  title?: string;
  body: string;
  actions?: ReactNode;
};

export type GuidePosition = { x: number; y: number } | "home";

type GuideState = {
  mode: GuideMode;
  isVisible: boolean;
  isSpeaking: boolean;
  speechContent: SpeechContent | null;
  position: GuidePosition;
  menuOpen: boolean;
  menuPanel: MenuPanel;
};

type GuideAction =
  | { type: "SET_MODE"; mode: GuideMode }
  | { type: "SPEAK"; content: SpeechContent }
  | { type: "DISMISS" }
  | { type: "MOVE_TO"; x: number; y: number }
  | { type: "GO_HOME" }
  | { type: "TOGGLE_MENU" }
  | { type: "CLOSE_MENU" }
  | { type: "SET_MENU_PANEL"; panel: MenuPanel }
  | { type: "SET_VISIBLE"; visible: boolean };

const initialState: GuideState = {
  mode: "idle",
  isVisible: true,
  isSpeaking: false,
  speechContent: null,
  position: "home",
  menuOpen: false,
  menuPanel: "main",
};

function guideReducer(state: GuideState, action: GuideAction): GuideState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SPEAK":
      return { ...state, isSpeaking: true, speechContent: action.content };
    case "DISMISS":
      return { ...state, isSpeaking: false, speechContent: null };
    case "MOVE_TO":
      return { ...state, position: { x: action.x, y: action.y } };
    case "GO_HOME":
      return { ...state, position: "home" };
    case "TOGGLE_MENU":
      return {
        ...state,
        menuOpen: !state.menuOpen,
        menuPanel: state.menuOpen ? "main" : state.menuPanel,
        mode: state.menuOpen ? "idle" : "help",
      };
    case "CLOSE_MENU":
      return { ...state, menuOpen: false, menuPanel: "main", mode: "idle" };
    case "SET_MENU_PANEL":
      return { ...state, menuPanel: action.panel };
    case "SET_VISIBLE":
      return { ...state, isVisible: action.visible };
    default:
      return state;
  }
}

type GuideContextValue = {
  state: GuideState;
  speak: (content: SpeechContent) => void;
  dismiss: () => void;
  moveTo: (x: number, y: number) => void;
  goHome: () => void;
  setMode: (mode: GuideMode) => void;
  toggleMenu: () => void;
  closeMenu: () => void;
  setMenuPanel: (panel: MenuPanel) => void;
  setVisible: (visible: boolean) => void;
};

const GuideContext = createContext<GuideContextValue | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(guideReducer, initialState);

  const speak = useCallback(
    (content: SpeechContent) => dispatch({ type: "SPEAK", content }),
    [],
  );
  const dismiss = useCallback(() => dispatch({ type: "DISMISS" }), []);
  const moveTo = useCallback(
    (x: number, y: number) => dispatch({ type: "MOVE_TO", x, y }),
    [],
  );
  const goHome = useCallback(() => dispatch({ type: "GO_HOME" }), []);
  const setMode = useCallback(
    (mode: GuideMode) => dispatch({ type: "SET_MODE", mode }),
    [],
  );
  const toggleMenu = useCallback(
    () => dispatch({ type: "TOGGLE_MENU" }),
    [],
  );
  const closeMenu = useCallback(
    () => dispatch({ type: "CLOSE_MENU" }),
    [],
  );
  const setMenuPanel = useCallback(
    (panel: MenuPanel) => dispatch({ type: "SET_MENU_PANEL", panel }),
    [],
  );
  const setVisible = useCallback(
    (visible: boolean) => dispatch({ type: "SET_VISIBLE", visible }),
    [],
  );

  return (
    <GuideContext.Provider
      value={{
        state, speak, dismiss, moveTo, goHome, setMode,
        toggleMenu, closeMenu, setMenuPanel, setVisible,
      }}
    >
      {children}
    </GuideContext.Provider>
  );
}

export function useGuide() {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used within GuideProvider");
  return ctx;
}
