const TAG_PALETTE = [
  { bg: "rgba(239, 68, 68, 0.12)", text: "#f87171", border: "rgba(239, 68, 68, 0.25)" },
  { bg: "rgba(249, 115, 22, 0.12)", text: "#fb923c", border: "rgba(249, 115, 22, 0.25)" },
  { bg: "rgba(234, 179, 8, 0.12)", text: "#facc15", border: "rgba(234, 179, 8, 0.25)" },
  { bg: "rgba(34, 197, 94, 0.12)", text: "#4ade80", border: "rgba(34, 197, 94, 0.25)" },
  { bg: "rgba(20, 184, 166, 0.12)", text: "#2dd4bf", border: "rgba(20, 184, 166, 0.25)" },
  { bg: "rgba(6, 182, 212, 0.12)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.25)" },
  { bg: "rgba(59, 130, 246, 0.12)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.25)" },
  { bg: "rgba(139, 92, 246, 0.12)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.25)" },
  { bg: "rgba(168, 85, 247, 0.12)", text: "#c084fc", border: "rgba(168, 85, 247, 0.25)" },
  { bg: "rgba(236, 72, 153, 0.12)", text: "#f472b6", border: "rgba(236, 72, 153, 0.25)" },
];

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

export function getTagColor(tag: string): { bg: string; text: string; border: string } {
  const index = hashString(tag) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
}
