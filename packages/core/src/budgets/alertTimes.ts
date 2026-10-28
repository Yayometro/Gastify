// When each budget notice first showed up on this device. The server stores nothing about the notices: they are worked out from the
// budgets on each visit, so the moment a notice is first seen is its date. A notice that was already there before this record existed
// has no date (null): the date of the update would be a lie. Pure: the app reads and writes the record (the web in localStorage, the
// phone in its secure storage).
export type AlertTimes = Record<string, string | null>;

// The same bound the app already uses for the notices it remembers.
const MAX_KEPT = 200;

// The record after seeing the notices that apply now. With no record yet (null), the notices already there get null; the ones that
// appear later get the moment they appeared. The oldest entries go first when the record is full.
export function seeNotices(times: AlertTimes | null, keys: readonly string[], nowIso: string): AlertTimes {
  const next: AlertTimes = { ...(times ?? {}) };
  for (const key of keys) {
    if (!(key in next)) next[key] = times === null ? null : nowIso;
  }
  return Object.fromEntries(Object.entries(next).slice(-MAX_KEPT));
}

// The date of a notice, or null when it is unknown (it predates the record, or there is no record).
export function alertDate(times: AlertTimes | null, key: string): string | null {
  return times?.[key] ?? null;
}
