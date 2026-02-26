import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "h2", "h3",
  "ul", "ol", "li", "a", "img", "span", "div", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td", "code",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "class", "target", "rel",
  "width", "height", "style",
];

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

function parseMarkdownTable(block: string): string {
  const rows = block.trim().split("\n");
  if (rows.length < 2) return block;

  const parseRow = (row: string) =>
    row.split("|").slice(1, -1).map((c) => c.trim());

  const headers = parseRow(rows[0]);
  // Skip row[1] — the separator (|---|---|)
  const bodyRows = rows.slice(2);

  let html = "<table><thead><tr>";
  for (const h of headers) html += `<th>${h}</th>`;
  html += "</tr></thead><tbody>";
  for (const row of bodyRows) {
    const cells = parseRow(row);
    html += "<tr>";
    for (const c of cells) html += `<td>${c}</td>`;
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

export function formatAndSanitizeMarkdown(text: string): string {
  // Extract and convert markdown tables before other processing
  const tableRegex = /(?:^|\n)(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g;
  const processed = text.replace(tableRegex, (match) => "\n" + parseMarkdownTable(match) + "\n");

  const html = processed
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(^(?:\d+\.\s+.+\n?)+)/gm, (block) =>
      "<ol>" + block.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>") + "</ol>"
    )
    .replace(/(^(?:- .+\n?)+)/gm, (block) =>
      "<ul>" + block.replace(/^- (.+)$/gm, "<li>$1</li>") + "</ul>"
    )
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
  return sanitizeHtml(html);
}