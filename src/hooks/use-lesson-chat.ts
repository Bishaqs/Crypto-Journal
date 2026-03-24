"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/components/ai/chat-bubble";
import type { LessonDefinition } from "@/lib/education/types";

type LessonChatOptions = {
  courseSlug: string;
  lessonSlug: string;
  lesson: LessonDefinition;
  isAlreadyComplete: boolean;
  onComplete: (result: {
    xpAwarded: number;
    courseComplete: boolean;
    leveledUp: boolean;
  }) => void;
};

export function useLessonChat({
  courseSlug,
  lessonSlug,
  lesson,
  isAlreadyComplete,
  onComplete,
}: LessonChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [completed, setCompleted] = useState(isAlreadyComplete);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize: find or create lesson conversation
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        // Check for existing conversation
        const lookupRes = await fetch(
          `/api/ai/conversations/lesson?courseSlug=${encodeURIComponent(courseSlug)}&lessonSlug=${encodeURIComponent(lessonSlug)}`
        );
        const lookupData = await lookupRes.json();

        if (lookupData.conversation) {
          // Resume existing conversation
          setConversationId(lookupData.conversation.id);
          const loadedMessages: Message[] = (lookupData.messages || []).map(
            (m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })
          );
          setMessages(loadedMessages);
          setInitializing(false);
        } else {
          // Create new conversation and auto-start
          const createRes = await fetch("/api/ai/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Lesson: ${lesson.title}`,
              lessonCourseSlug: courseSlug,
              lessonSlug: lessonSlug,
            }),
          });
          const createData = await createRes.json();
          const convId = createData.conversation?.id;
          setConversationId(convId);
          setInitializing(false);

          // Auto-send kickoff message
          if (convId) {
            await streamMessage(
              `I'm ready to start learning: ${lesson.title}`,
              convId
            );
          }
        }
      } catch {
        setInitializing(false);
      }
    })();
  }, [courseSlug, lessonSlug, lesson.title]);

  const streamMessage = useCallback(
    async (msg: string, convId: string) => {
      setSending(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: msg },
        { role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            trades: [],
            conversationId: convId,
            lessonCourseSlug: courseSlug,
            lessonSlug: lessonSlug,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Stream failed" }));
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "error", content: errorData.error || "Something went wrong" },
          ]);
          setSending(false);
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const payload = line.slice(6);
                if (payload === "[DONE]") break;
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed.text) {
                    accumulated += parsed.text;
                    // Strip completion marker from display
                    const display = accumulated
                      .replace(/\[LESSON_COMPLETE\]/g, "")
                      .trim();
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: "assistant",
                        content: display,
                      };
                      return updated;
                    });
                  }
                  if (parsed.error) {
                    setMessages((prev) => [
                      ...prev.slice(0, -1),
                      { role: "error", content: parsed.error },
                    ]);
                  }
                } catch {
                  // Skip unparseable
                }
              }
            }
          }
        }

        // Save messages to conversation
        if (accumulated) {
          const cleanContent = accumulated
            .replace(/\[LESSON_COMPLETE\]/g, "")
            .trim();
          fetch(`/api/ai/conversations/${convId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userMessage: msg,
              assistantMessage: cleanContent,
            }),
          }).catch(() => {});
        }

        // Check for lesson completion
        if (accumulated.includes("[LESSON_COMPLETE]") && !completed && !isAlreadyComplete) {
          setCompleted(true);
          try {
            const completeRes = await fetch("/api/education/complete-lesson", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseSlug, lessonSlug }),
            });
            const completeData = await completeRes.json();
            if (!completeData.alreadyCompleted) {
              onComplete({
                xpAwarded: completeData.xpAwarded,
                courseComplete: completeData.courseComplete,
                leveledUp: completeData.leveledUp,
              });
            }
          } catch {
            // Completion failed silently — user can use manual button
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "error", content: "Connection failed. Please try again." },
        ]);
      } finally {
        setSending(false);
      }
    },
    [courseSlug, lessonSlug, completed, isAlreadyComplete, onComplete]
  );

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || sending || !conversationId) return;
    setInput("");
    await streamMessage(msg, conversationId);
  }, [input, sending, conversationId, streamMessage]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    sending,
    initializing,
    completed,
    conversationId,
  };
}
