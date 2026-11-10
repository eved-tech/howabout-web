// The pastel accents used for brand/author initial chips across the "How
// about" home page, picked deterministically per name so the same brand or
// person always gets the same colour.
const PALETTE = ["#A9CCFF", "#FFD36B", "#A8DDA2", "#D4C2F7", "#FFB8CC", "#FFC49A"];

export function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
