// Server side of historyWindow.ts: the Mongo filter for one part of the movements.

// A movement's date is `date`, or `createdAt` when it has none (the same rule the
// client uses everywhere). `since` keeps movements on/after that instant;
// `before` keeps exactly the rest, so the two windows never overlap or leave gaps.
export function recentClause(since: Date) {
  return {
    $or: [
      { date: { $gte: since } },
      { date: { $in: [null] }, createdAt: { $gte: since } },
    ],
  };
}

function parseInstant(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildDateWindowFilter(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const { since, before } = body as { since?: unknown; before?: unknown };
  const sinceDate = parseInstant(since);
  if (sinceDate) return recentClause(sinceDate);
  const beforeDate = parseInstant(before);
  if (beforeDate) return { $nor: [recentClause(beforeDate)] };
  return {};
}
