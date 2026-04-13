#!/usr/bin/env node
/**
 * Scans client-side source files for external URLs (fetch, WebSocket)
 * and checks them against the CSP connect-src in next.config.ts.
 *
 * Run: node scripts/check-csp.mjs
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const SRC = join(import.meta.dirname, "..", "src");
const CONFIG = join(import.meta.dirname, "..", "next.config.ts");

// ── 1. Parse connect-src from next.config.ts ──────────────────────
const configText = readFileSync(CONFIG, "utf-8");
const connectSrcMatch = configText.match(/cspConnectSrc\s*=\s*\[([\s\S]*?)\]/);
if (!connectSrcMatch) {
  console.error("Could not find cspConnectSrc array in next.config.ts");
  process.exit(1);
}
const allowedOrigins = [...connectSrcMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);

// ── 2. Walk src/ for "use client" files ───────────────────────────
function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

const clientFiles = walk(SRC).filter(f => {
  const text = readFileSync(f, "utf-8");
  return text.startsWith('"use client"') || text.startsWith("'use client'");
});

// ── 3. Extract external URLs from client files ────────────────────
// Only match URLs that are actually used for network requests:
//   - fetch("https://...") or fetch(`https://...`)
//   - new WebSocket("wss://...")
//   - URLs assigned to constants/arrays (likely passed to fetch later)
const fetchPattern = /fetch\(\s*[`"']((https?|wss?):\/\/[^"'`\s$]+)/g;
const wsPattern = /new\s+WebSocket\(\s*[`"']((wss?):\/\/[^"'`\s$]+)/g;
const constUrlPattern = /(?:const|let|var)\s+\w+\s*=\s*[`"']((https?|wss?):\/\/[^"'`\s]+)["`']/g;
const arrayUrlPattern = /^\s*["'`]((https?|wss?):\/\/[^"'`\s]+)["'`]\s*,?\s*$/gm;

const urlPatterns = [fetchPattern, wsPattern, constUrlPattern, arrayUrlPattern];

// Own domain is covered by 'self'
const SELF_HOSTS = ["traversejournal.com", "www.traversejournal.com", "localhost"];

function extractOrigin(url) {
  try {
    const u = new URL(url.replace(/\$\{[^}]*\}/g, "x")); // handle template literals
    return `${u.protocol}//${u.hostname}`;
  } catch { return null; }
}

function isSelfOrigin(origin) {
  try {
    const u = new URL(origin);
    return SELF_HOSTS.includes(u.hostname);
  } catch { return false; }
}

function originMatchesAllowed(origin) {
  if (isSelfOrigin(origin)) return true;
  return allowedOrigins.some(allowed => {
    if (allowed === "'self'") return false;
    try {
      const aUrl = new URL(allowed.replace("*.", "wildcard-placeholder."));
      const oUrl = new URL(origin);
      if (aUrl.protocol !== oUrl.protocol) return false;
      if (allowed.includes("*.")) {
        const baseDomain = aUrl.hostname.replace("wildcard-placeholder.", "");
        return oUrl.hostname === baseDomain.replace(/^\./, "") ||
               oUrl.hostname.endsWith("." + baseDomain.replace(/^\./, ""));
      }
      return aUrl.hostname === oUrl.hostname;
    } catch { return false; }
  });
}

// ── 4. Check each client-side URL ─────────────────────────────────
const issues = [];
for (const file of clientFiles) {
  const text = readFileSync(file, "utf-8");
  const seen = new Set();
  for (const pattern of urlPatterns) {
    for (const match of text.matchAll(pattern)) {
      const origin = extractOrigin(match[1]);
      if (!origin || seen.has(origin)) continue;
      seen.add(origin);
      if (!originMatchesAllowed(origin)) {
        issues.push({ file: relative(join(SRC, ".."), file), origin });
      }
    }
  }
}

// ── 5. Report ─────────────────────────────────────────────────────
if (issues.length === 0) {
  console.log("CSP check passed: all client-side external origins are in connect-src.");
} else {
  console.error("CSP connect-src gaps found:\n");
  for (const { file, origin } of issues) {
    console.error(`  ${origin}  <--  ${file}`);
  }
  console.error("\nAdd missing origins to cspConnectSrc in next.config.ts");
  process.exit(1);
}
