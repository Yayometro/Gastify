// The movements list is loaded in two parts: the recent months first (enough for
// the dashboard: this month, last month, 12-month streaks), then the rest of the
// history in the background. Both the server (get-transactions) and the client
// split them with the same rule, so the parts never overlap or leave gaps.

export const RECENT_MONTHS = 12;

// First instant of the month RECENT_MONTHS months ago, local time.
export function getRecentCutoff(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() - RECENT_MONTHS, 1);
}

// A movement's instant: `date`, or `createdAt` when it has no date.
export function movementTime(movement: { date?: unknown; createdAt?: unknown } | null | undefined): number | null {
  const raw = movement?.date ?? movement?.createdAt;
  if (raw === null || raw === undefined || raw === "") return null;
  const time = new Date(raw as string | number | Date).getTime();
  return Number.isNaN(time) ? null : time;
}

// True when the movement belongs to the "rest of the history" part (before the
// cutoff, or with no usable date at all).
export function isBeforeCutoff(movement: { date?: unknown; createdAt?: unknown } | null | undefined, cutoff: Date | string): boolean {
  const time = movementTime(movement);
  if (time === null) return true;
  return time < new Date(cutoff).getTime();
}

// Concatenates two lists, keeping the first occurrence of each `_id`.
export function mergeById<T extends { _id?: unknown }>(first: T[], second: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...first, ...second]) {
    const key = item?._id === undefined || item?._id === null ? null : String(item._id);
    if (key !== null) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(item);
  }
  return out;
}
