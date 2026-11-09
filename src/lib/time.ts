const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isWithinLastWeek(date: Date): boolean {
  return Date.now() - date.getTime() < WEEK_MS;
}
