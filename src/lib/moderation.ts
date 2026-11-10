// Crude, fast, pre-publish filter for the obvious stuff — not an attempt at
// real sentiment analysis. Flags go straight back to the writer (see
// FLAGGED_MESSAGE) rather than creating the idea; nothing sits in a queue
// at this stage. Subtler disguised complaints that slip past this still get
// caught later via the "report as complaint" flow and a human ruling.

const PROFANITY = ["fuck", "shit", "cunt", "bitch", "asshole", "bastard"];

const REPEATED_PUNCTUATION = /[!?]{2,}/;

function isShoutyWord(word: string) {
  const letters = word.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}

export function isFlaggable(...texts: string[]): boolean {
  const combined = texts.join(" ");

  if (PROFANITY.some((word) => new RegExp(`\\b${word}\\b`, "i").test(combined))) {
    return true;
  }

  if (REPEATED_PUNCTUATION.test(combined)) {
    return true;
  }

  const shoutyWords = combined.split(/\s+/).filter(isShoutyWord);
  if (shoutyWords.length >= 2) {
    return true;
  }

  return false;
}

export const FLAGGED_MESSAGE =
  "This reads more like a complaint than an idea. How about flipping it: what would you love them to do instead?";
