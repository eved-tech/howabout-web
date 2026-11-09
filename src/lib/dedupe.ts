const STOPWORDS = new Set([
  "a", "an", "the", "to", "and", "or", "of", "in", "on", "for", "should",
  "they", "them", "it", "is", "are", "be", "so", "that", "this", "i",
]);

function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/**
 * Jaccard similarity over significant words. A stand-in for the real
 * pgvector + embeddings dedupe pipeline until that's wired up — good
 * enough to catch near-identical phrasing of the same idea.
 */
export function similarity(a: string, b: string): number {
  const wa = wordsOf(a);
  const wb = wordsOf(b);
  if (wa.size === 0 || wb.size === 0) return 0;

  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;

  const union = wa.size + wb.size - shared;
  return union === 0 ? 0 : shared / union;
}

export const DUPLICATE_THRESHOLD = 0.4;
