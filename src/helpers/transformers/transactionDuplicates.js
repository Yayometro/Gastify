// Shared duplicate-detection logic, previously copy-pasted independently
// in Movements.jsx and ModalContentTopMonthItem.jsx (plan section 14.4).
//
// Native duplicate key always includes currency: 100 MXN and 100 USD are
// never duplicates merely because both contain the number 100, regardless
// of which criteria checkboxes are enabled.

function nativeAmountMinor(t) {
  if (t.displayMoney?.native) return t.displayMoney.native.amountMinor;
  return Math.round(Math.abs(t.amount || 0) * 100);
}

function nativeCurrency(t) {
  return t.displayMoney?.native?.currency || "MXN";
}

export function areDuplicates(a, b, criteria, dateTol, amountTol) {
  // Unconditional - currency mismatch always disqualifies, since the
  // numbers being compared are only meaningful within the same currency.
  if (nativeCurrency(a) !== nativeCurrency(b)) return false;

  if (criteria.name) {
    const na = (a.name || "").toLowerCase().trim();
    const nb = (b.name || "").toLowerCase().trim();
    if (na !== nb) return false;
  }
  if (criteria.date) {
    const daStr = String(a.date || a.createdAt || "").slice(0, 10);
    const dbStr = String(b.date || b.createdAt || "").slice(0, 10);
    const da = new Date(daStr).getTime();
    const db = new Date(dbStr).getTime();
    const diffDays = Math.round(Math.abs(da - db) / 86400000);
    if (diffDays > dateTol) return false;
  }
  if (criteria.amount) {
    // Compare in native minor units (integer-safe) - amountTol is a
    // major-unit tolerance in that same native currency.
    const amountTolMinor = Math.round((amountTol || 0) * 100);
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
export function buildDupGroups(transactions, criteria, dateTol, amountTol) {
  const n = transactions.length;
  const parent = transactions.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (i, j) => { parent[find(i)] = find(j); };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (areDuplicates(transactions[i], transactions[j], criteria, dateTol, amountTol)) {
        union(i, j);
      }
    }
  }
  const comps = {};
  transactions.forEach((_, i) => {
    const root = find(i);
    if (!comps[root]) comps[root] = [];
    comps[root].push(i);
  });
  return Object.values(comps).filter((g) => g.length > 1);
}

export function getDuplicates(transactions, criteria, dateTol, amountTol) {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const dupIds = new Set();
  groups.forEach((g) => g.forEach((i) => dupIds.add(String(transactions[i]._id))));
  return transactions.filter((t) => dupIds.has(String(t._id)));
}

// Every group member except the first (keep one original).
export function getDuplicatesToDelete(transactions, criteria, dateTol, amountTol) {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const toDelete = [];
  groups.forEach((g) => g.slice(1).forEach((i) => toDelete.push(transactions[i]._id)));
  return toDelete;
}

// Every group member, including the first (delete all matches).
export function getAllMatchingIds(transactions, criteria, dateTol, amountTol) {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const toDelete = [];
  groups.forEach((g) => g.forEach((i) => toDelete.push(transactions[i]._id)));
  return toDelete;
}

// Strict 1-to-1 { original, duplicate } pairs for side-by-side comparison.
export function getDuplicatePairs(transactions, selectedIds, criteria, dateTol, amountTol) {
  const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
  const selectedSet = new Set((selectedIds || []).map(String));
  const pairs = [];
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
