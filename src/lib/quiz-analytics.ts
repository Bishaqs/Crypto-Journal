// ─── Client-side funnel event tracking (fire-and-forget) ────────────────────

export type FunnelEventType =
  | "mini_quiz_start"
  | "mini_quiz_complete"
  | "archetype_reveal_view"
  | "archetype_share"
  | "waitlist_signup_from_quiz"
  | "deep_quiz_start"
  | "deep_quiz_complete";

export function trackFunnelEvent(
  sessionId: string,
  eventType: FunnelEventType,
  archetype?: string,
  metadata?: Record<string, unknown>,
) {
  fetch("/api/quiz/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, eventType, archetype, metadata }),
  }).catch(() => {});
}

let _sessionId: string | null = null;

export function getQuizSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("quiz_session_id");
    if (stored) {
      _sessionId = stored;
      return stored;
    }
    const id = crypto.randomUUID();
    sessionStorage.setItem("quiz_session_id", id);
    _sessionId = id;
    return id;
  }
  return crypto.randomUUID();
}
