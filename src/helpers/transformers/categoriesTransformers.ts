import { sortItemsByName } from "../orderFunctions/orderFunctions";

export interface RawCategoryItem {
  _id?: string | unknown;
  name?: string | null;
  fatherCategory?: { _id?: string | unknown; name?: string | null; [key: string]: unknown } | string | null | unknown;
  children?: RawCategoryItem[];
  [key: string]: unknown;
}

export interface OrganizedCategoryItem<T = RawCategoryItem> {
  _id?: string | unknown;
  name?: string | null;
  children: T[];
  [key: string]: unknown;
}

export function organizedCategoriesAndSubCategories<T extends RawCategoryItem = RawCategoryItem>(
  arr: T[]
): (OrganizedCategoryItem<T> | (T & { children: T[] }))[] {
  if (!(arr instanceof Array))
    throw new Error("the element should be an instance of Array");

  const categoryMap: Record<string, OrganizedCategoryItem<T> | (T & { children: T[] })> = {};

  // First pass: register all root categories
  arr.forEach((item, index) => {
    if (!item) return;
    if (!item.fatherCategory) {
      // A root with neither id nor name used to share the key "undefined" and
      // overwrite the others (bug 117).
      const key = String(item._id || item.name || `__root_${index}`);
      if (!categoryMap[key]) {
        categoryMap[key] = { ...item, children: [] };
      }
    }
  });

  // Second pass: attach subcategories to their father category
  arr.forEach((item) => {
    if (!item) return;
    if (item.fatherCategory) {
      const fatherId = typeof item.fatherCategory === "object" ? (item.fatherCategory as { _id?: unknown })._id : item.fatherCategory;
      const fatherName = typeof item.fatherCategory === "object" ? (item.fatherCategory as { name?: string }).name : null;

      const fatherKey = Object.keys(categoryMap).find((k) => {
        const c = categoryMap[k];
        return (fatherId && String(c._id) === String(fatherId)) || (fatherName && c.name === fatherName);
      });

      if (fatherKey && categoryMap[fatherKey]) {
        if (!categoryMap[fatherKey].children) categoryMap[fatherKey].children = [];
        if (!categoryMap[fatherKey].children.some((sub) => String(sub._id) === String(item._id))) {
          categoryMap[fatherKey].children.push(item);
        }
      } else {
        const newKey = (fatherId || fatherName || (item._id + "_father")) as string;
        if (typeof item.fatherCategory === "object" && (item.fatherCategory as { name?: string }).name) {
          categoryMap[newKey] = {
            ...(item.fatherCategory as object),
            children: [item],
          } as OrganizedCategoryItem<T>;
        } else if (typeof item.fatherCategory === "string" && fatherId) {
          // The father is only an id that is not in the list: it used to be
          // dropped silently (bug 118). It is kept under a placeholder father so
          // the sub-category stays visible.
          categoryMap[newKey] = { _id: fatherId, name: "Unknown category", children: [item] } as OrganizedCategoryItem<T>;
        }
      }
    }
  });

  return sortItemsByName(Object.values(categoryMap));
}
