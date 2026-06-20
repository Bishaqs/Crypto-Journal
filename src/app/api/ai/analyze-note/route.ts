import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyzeNoteSchema } from "@/lib/schemas/ai";
import { rateLimit } from "@/lib/rate-limit";
import { checkAiDailyLimit } from "@/lib/ai-rate-limit";
import { getProvider, resolveModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Nova — a trading psychology and decision coach analyzing ONE of the trader's journal notes against their wider note history.

Produce ONE markdown report with exactly these three sections and headings:

## Scenario Probability
Identify the key scenario, thesis, or prediction expressed in the FOCUS NOTE. Estimate the probability (as a single %) that it plays out, grounded ONLY in evidence from this trader's own notes below — their past hit/miss patterns, recurring setups, follow-through, and biases. State the % clearly, then 2–4 sentences of reasoning that cite specific past notes (by date or title). If there isn't enough history, say so and give a wide range instead of a false-precise number.

## Patterns & Contradictions
Surface recurring patterns, emotional tells, and any contradictions between the focus note and what the trader has written before (e.g. they commit to one thing here but repeatedly did the opposite). 2–5 concise bullet points, each referencing concrete notes.

## One Action
A single, specific thing to do next.

Rules: Only use the notes provided — never invent notes, trades, prices, or numbers. This is process/psychology coaching, not financial advice. Be direct and concise (under ~300 words total).`;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_OTHER_NOTES = 40;
const OTHER_NOTE_CHARS = 220;
const FOCUS_NOTE_CHARS = 4000;

type NoteRow = {
  id: string;
  title: string | null;
  tags: string[] | null;
  note_date: string | null;
  created_at: string | null;
  content: string | null;
};

function noteDateLabel(n: NoteRow): string {
  const raw = n.note_date ?? n.created_at ?? "";
  return raw ? raw.slice(0, 10) : "undated";
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tight rate limit — each call ships a slice of the note history
  const rl = await rateLimit(`ai-analyze:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before analyzing another note." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  const daily = await checkAiDailyLimit(user.id);
  if (!daily.allowed) return daily.response;

  const body = await req.json();
  const parsed = AnalyzeNoteSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { noteId, provider: providerId, model: modelId, apiKey } = parsed.data;

  const provider = getProvider(providerId, apiKey);
  if (!provider.isConfigured(apiKey)) {
    return NextResponse.json(
      { error: "AI service not configured. Add your own API key in Settings → AI Coach." },
      { status: 500 }
    );
  }
  const model = resolveModel(provider.id, modelId);

  // Focus note (ownership-scoped)
  const { data: focus, error: focusError } = await supabase
    .from("journal_notes")
    .select("id, title, tags, note_date, created_at, content")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .single();

  if (focusError || !focus) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }
  const focusNote = focus as NoteRow;

  // Other notes — most recent first, capped
  const { data: others } = await supabase
    .from("journal_notes")
    .select("id, title, tags, note_date, created_at, content")
    .eq("user_id", user.id)
    .neq("id", noteId)
    .order("note_date", { ascending: false, nullsFirst: false })
    .limit(MAX_OTHER_NOTES);

  const otherNotes = (others ?? []) as NoteRow[];

  const focusBlock = `# FOCUS NOTE
Date: ${noteDateLabel(focusNote)}
Title: ${focusNote.title || "(untitled)"}
Tags: ${focusNote.tags?.length ? focusNote.tags.join(", ") : "none"}
Content:
${stripHtml(focusNote.content || "").slice(0, FOCUS_NOTE_CHARS) || "(empty)"}`;

  const historyBlock = otherNotes.length
    ? otherNotes
        .map((n, i) => {
          const text = stripHtml(n.content || "").slice(0, OTHER_NOTE_CHARS);
          const tags = n.tags?.length ? ` [${n.tags.join(", ")}]` : "";
          return `[${i + 1}] ${noteDateLabel(n)} — "${n.title || "(untitled)"}"${tags}: ${text}`;
        })
        .join("\n")
    : "(no other notes yet)";

  const userMessage = `${focusBlock}

# TRADER'S OTHER NOTES (most recent first, truncated)
${historyBlock}`;

  try {
    const text = await provider.chat({
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1000,
      model,
      apiKey,
    });
    return NextResponse.json({ report: text });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
