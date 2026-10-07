// Shared duplicate-detection logic, previously copy-pasted independently
// in Movements.jsx and ModalContentTopMonthItem.jsx (plan section 14.4).
//
// Native duplicate key always includes currency: 100 MXN and 100 USD are
// never duplicates merely because both contain the number 100, regardless
// of which criteria checkboxes are enabled.

export interface DuplicateCriteria {
  name?: boolean;
  date?: boolean;
  amount?: boolean;
  category?: boolean;
  subcategory?: boolean;
  [key: string]: boolean | undefined;
}

export interface DuplicateTransaction {
  _id?: string | unknown;
  name?: string | null;
  date?: string | Date | null;
  createdAt?: string | Date | null;
  amount?: number | null;
  category?: { _id?: string | unknown; [key: string]: unknown } | null;
  subCategory?: { _id?: string | unknown; [key: string]: unknown } | null;
  displayMoney?: {
    native?: {
      amountMinor?: number;
      currency?: string;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface DuplicatePair<T = DuplicateTransaction> {
  original: T;
  duplicate: T;
}

function nativeAmountMinor(t: DuplicateTransaction): number {
  // A native money object WITHOUT a usable amountMinor used to return undefined (and
  // every comparison with it was false); it falls back to the legacy amount now (bug 112).
  const native = t.displayMoney?.native?.amountMinor;
  if (typeof native === "number" && Number.isFinite(native)) return native;
  return Math.round(Math.abs((t.amount as number) || 0) * 100);
}

// Local calendar day of a movement as a timestamp, or NaN when it has no valid date.
// This used to slice String(date) to 10 characters: fine for an ISO string, but a Date
// object stringifies as "Wed Oct 07 ..." and was read back as the year 2001 (bug 110).
function dayStamp(t: DuplicateTransaction): number {
  const d = new Date((t.date || t.createdAt) as string | number | Date);
  return Number.isNaN(d.getTime()) ? NaN : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function nativeCurrency(t: DuplicateTransaction): string {
  return t.displayMoney?.native?.currency || "MXN";
}

export function areDuplicates(
  a: DuplicateTransaction,
  b: DuplicateTransaction,
  criteria: DuplicateCriteria,
  dateTol?: number,
  amountTol?: number
): boolean {
  // Unconditional - currency mismatch always disqualifies, since the
  // numbers being compared are only meaningful within the same currency.
  if (nativeCurrency(a) !== nativeCurrency(b)) return false;

  if (criteria.name) {
    const na = (a.name || "").toLowerCase().trim();
    const nb = (b.name || "").toLowerCase().trim();
    if (na !== nb) return false;
  }
  if (criteria.date) {
    const da = dayStamp(a);
    const db = dayStamp(b);
    // No usable date on either side: it cannot be the same day (it used to pass).
    if (Number.isNaN(da) || Number.isNaN(db)) return false;
    const diffDays = Math.round(Math.abs(da - db) / 86400000);
    // With no tolerance given, the date must be the same day (undefined made the
    // comparison false and never disqualified anything, bug 111).
    if (diffDays > (dateTol ?? 0)) return false;
  }
  if (criteria.amount) {
    // Compare in native minor units (integer-safe) - amountTol is a
    // major-unit tolerance in that same native currency.
    const amountTolMinor = Math.round(((amountTol as number) || 0) * 100);
    const diff = Math.abs(nativeAmountMinor(a) - nativeAmountMinor(b));
    if (diff > amountTolMinor) return false;
  }
  if (criteria.category) {
    if (String(a.category?._id || "none") !== String(b.category?._id || "none")) return false;
  }
  if (criteria.subcategory) {
    if (String(a.subCategory?._id || "none") !== String(b.subCategory?._id || "none")) return false;
  }
  return true;
}

// Union-Find over transaction indices.
export function buildDupGroups<T extends DuplicateTransaction>(
  transactions: T[],
  criteria: DuplicateCriteria,
  dateTol?: number,
  amountTol?: number
): number[][] {
  const n = transactions.length;
  const parent = transactions.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (i: number, j: number): void => {
    parent[find(i)] = find(j);
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (areDuplicates(transactions[i], transactions[j], criteria, dateTol, amountTol)) {
        union(i, j);
      }
    }
  }
  const comps: Record<number, number[]> = {};
  transactions.forEach((_, i) => {
    const root = find(i);
    if (!comps[root]) comps[root] = [];
    comps[root].push(i);
  });
  return Object.values(comps).filter((g) => g.length > 1);
}

export function getDuplicates<T extends DuplicateTransaction>(
  transactions: T[],
  criteria: DuplicateCriteria,
  dateTol?: number,
  amountTol?: number
): T[] {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const dupIds = new Set<string>();
  groups.forEach((g) => g.forEach((i) => dupIds.add(String(transactions[i]._id))));
  return transactions.filter((t) => dupIds.has(String(t._id)));
}

// Every group member except the first (keep one original).
export function getDuplicatesToDelete<T extends DuplicateTransaction>(
  transactions: T[],
  criteria: DuplicateCriteria,
  dateTol?: number,
  amountTol?: number
): Array<T["_id"]> {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const toDelete: Array<T["_id"]> = [];
  groups.forEach((g) => g.slice(1).forEach((i) => toDelete.push(transactions[i]._id)));
  return toDelete;
}

// Every group member, including the first (delete all matches).
export function getAllMatchingIds<T extends DuplicateTransaction>(
  transactions: T[],
  criteria: DuplicateCriteria,
  dateTol?: number,
  amountTol?: number
): Array<T["_id"]> {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const toDelete: Array<T["_id"]> = [];
  groups.forEach((g) => g.forEach((i) => toDelete.push(transactions[i]._id)));
  return toDelete;
}

// Strict 1-to-1 { original, duplicate } pairs for side-by-side comparison.
export function getDuplicatePairs<T extends DuplicateTransaction>(
  transactions: T[],
  selectedIds: Array<string | unknown> | null | undefined,
  criteria: DuplicateCriteria,
  dateTol?: number,
  amountTol?: number
): DuplicatePair<T>[] {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const selectedSet = new Set((selectedIds || []).map(String));
  const pairs: DuplicatePair<T>[] = [];
  groups.forEach((g) => {
    if (!g || g.length === 0) return;
    const original = transactions[g[0]];
    g.slice(1).forEach((idx) => {
      const dupItem = transactions[idx];
      if (dupItem && selectedSet.has(String(dupItem._id))) {
        pairs.push({ original, duplicate: dupItem });
      }
    });
    if (original && selectedSet.has(String(original._id)) && !pairs.some((p) => String(p.duplicate._id) === String(original._id))) {
      const refItem = transactions[g[1]] || original;
      pairs.push({ original: refItem, duplicate: original });
    }
  });
  const pairedDupIds = new Set(pairs.map((p) => String(p.duplicate._id)));
  (selectedIds || []).forEach((id) => {
    if (!pairedDupIds.has(String(id))) {
      const t = transactions.find((tr) => String(tr._id) === String(id));
      if (t) pairs.push({ original: t, duplicate: t });
    }
  });
  return pairs;
}
