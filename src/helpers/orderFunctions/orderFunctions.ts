export interface NamedOrTypedItem {
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export function sortItemsByName<T extends NamedOrTypedItem>(arr: T[]): T[] {
    if (!(arr instanceof Array))
    throw new Error("the arr should be an instance of Array");
  return arr.sort((a, b) => {
    
    return (a.name || a.type).localeCompare(b.name || b.type)
  });
}
