export interface NamedOrTypedItem {
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export function sortItemsByName<T extends NamedOrTypedItem>(arr: T[]): T[] {
    if (!(arr instanceof Array))
    throw new Error("the arr should be an instance of Array");
  // Sorts a copy, not the caller's array (bug 119).
  return [...arr].sort((a, b) => {
    
    // An item with neither name nor type sorts as empty text instead of throwing.
    return String(a.name || a.type || "").localeCompare(String(b.name || b.type || ""))
  });
}
