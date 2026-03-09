/**
 * Server-side profanity filter for feedback and comments.
 * Blocks slurs and directed insults with leet-speak evasion detection.
 * This file should NEVER be imported in client-side code.
 */

const SLURS: string[] = [
  // Racial slurs
  "nigger",
  "nigga",
  "kike",
  "spic",
  "chink",
  "wetback",
  "beaner",
  "gook",
  "raghead",
  "towelhead",
  "coon",
  "darkie",
  "redskin",
  // Homophobic slurs
  "faggot",
  "fag",
  "dyke",
  "tranny",
  // Ableist slurs
  "retard",
];

// Common leet-speak substitutions
const CHAR_SUBS: Record<string, string> = {
  a: "[a@4àáâãä]",
  e: "[e3èéêë]",
  i: "[i1!ìíîï]",
  o: "[o0òóôõö]",
  s: "[s$5]",
  t: "[t7]",
  g: "[g9]",
  l: "[l1|]",
};

function buildPattern(word: string): RegExp {
  const pattern = word
    .split("")
    .map((ch) => {
      const sub = CHAR_SUBS[ch];
      return sub ? `${sub}+` : `${ch}+`;
    })
    .join("[\\s._-]*"); // Allow separators between chars (n.i.g.g.e.r, n_i_g)
  return new RegExp(`\\b${pattern}\\b`, "gi");
}

const PATTERNS: RegExp[] = SLURS.map(buildPattern);

export type ProfanityResult = {
  isClean: boolean;
  reason?: string;
};

export function checkProfanity(text: string): ProfanityResult {
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0; // Reset stateful regex
    if (pattern.test(text)) {
      return {
        isClean: false,
        reason:
          "Your message contains language that violates our community guidelines. Please revise and resubmit.",
      };
    }
  }
  return { isClean: true };
}
