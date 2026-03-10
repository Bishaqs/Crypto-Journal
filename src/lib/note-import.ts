import { parseCSV } from "./csv-parser";
import type { ImportRow, ImportResult } from "./csv-import";

// Maps common CSV headers to our field names
const NOTE_HEADER_ALIASES: Record<string, string> = {
  // title
  name: "title",
  heading: "title",
  subject: "title",

  // content
  text: "content",
  body: "content",
  description: "content",
  note: "content",
  notes: "content",
  memo: "content",
  entry: "content",

  // tags
  tag: "tags",
  category: "tags",
  categories: "tags",
  labels: "tags",
  label: "tags",

  // note_date
  date: "note_date",
  created: "note_date",
  created_at: "note_date",
  timestamp: "note_date",
  datetime: "note_date",
  time: "note_date",
  written: "note_date",

  // note_type
  type: "note_type",
  kind: "note_type",
  category_type: "note_type",
};

function resolveHeader(raw: string): string {
  const normalized = raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return NOTE_HEADER_ALIASES[normalized] ?? normalized;
}

function parseTags(val: string): string[] {
  if (!val) return [];
  // Support both comma and semicolon separators
  return val
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseNoteType(val: string): string {
  const lower = val.toLowerCase().trim();
  if (["trade", "trade review", "trade-review"].includes(lower)) return "trade";
  if (["daily", "morning", "morning plan", "morning-plan", "day"].includes(lower)) return "daily";
  return "other";
}

function tryParseDate(val: string): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function validateNoteImportData(csvText: string): ImportResult {
  const { headers, rows } = parseCSV(csvText);
  const mappedHeaders: Record<string, string> = {};
  headers.forEach((h) => {
    mappedHeaders[h] = resolveHeader(h);
  });

  const validRows: ImportRow[] = [];
  const invalidRows: ImportRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const errors: string[] = [];

    // Map raw headers to normalized field names
    const mapped: Record<string, string> = {};
    for (const [key, val] of Object.entries(raw)) {
      mapped[resolveHeader(key)] = val;
    }

    // Validate required: content must exist
    if (!mapped.content || !mapped.content.trim()) {
      errors.push("Missing content");
    }

    // Validate date if provided
    if (mapped.note_date && !tryParseDate(mapped.note_date)) {
      errors.push(`Invalid date: "${mapped.note_date}"`);
    }

    const parsed = errors.length === 0 ? buildNotePayload(mapped) : null;
    const row: ImportRow = { rowNumber: i + 1, data: mapped, parsed, errors };

    if (errors.length === 0) {
      validRows.push(row);
    } else {
      invalidRows.push(row);
    }
  }

  return { totalRows: rows.length, validRows, invalidRows, headers, mappedHeaders };
}

function buildNotePayload(mapped: Record<string, string>): Record<string, unknown> {
  return {
    title: mapped.title || null,
    content: mapped.content,
    tags: parseTags(mapped.tags ?? ""),
    note_date: tryParseDate(mapped.note_date ?? "") ?? new Date().toISOString(),
    note_type: mapped.note_type ? parseNoteType(mapped.note_type) : "other",
    trade_id: null,
    auto_link_on_import: false,
  };
}
