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
    throw new Error("the element shoudl be a instance of Array");

  const categoryMap: Record<string, OrganizedCategoryItem<T> | (T & { children: T[] })> = {};

  // First pass: register all root categories
  arr.forEach((item) => {
    if (!item) return;
    if (!item.fatherCategory) {
      const key = (item._id || item.name) as string;
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
        }
      }
    }
  });

  return sortItemsByName(Object.values(categoryMap));
}
