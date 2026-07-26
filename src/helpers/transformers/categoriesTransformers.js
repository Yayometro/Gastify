import { sortItemsByName } from "../orderFunctions/orderFunctions";

export function organizedCategoriesAndSubCategories(arr) {
  if (!(arr instanceof Array))
    throw new Error("the element shoudl be a instance of Array");

  const categoryMap = {};

  // First pass: register all root categories
  arr.forEach((item) => {
    if (!item) return;
    if (!item.fatherCategory) {
      const key = item._id || item.name;
      if (!categoryMap[key]) {
        categoryMap[key] = { ...item, children: [] };
      }
    }
  });

  // Second pass: attach subcategories to their father category
  arr.forEach((item) => {
    if (!item) return;
    if (item.fatherCategory) {
      const fatherId = typeof item.fatherCategory === "object" ? item.fatherCategory._id : item.fatherCategory;
      const fatherName = typeof item.fatherCategory === "object" ? item.fatherCategory.name : null;

      let fatherKey = Object.keys(categoryMap).find((k) => {
        const c = categoryMap[k];
        return (fatherId && String(c._id) === String(fatherId)) || (fatherName && c.name === fatherName);
      });

      if (fatherKey && categoryMap[fatherKey]) {
        if (!categoryMap[fatherKey].children) categoryMap[fatherKey].children = [];
        if (!categoryMap[fatherKey].children.some((sub) => String(sub._id) === String(item._id))) {
          categoryMap[fatherKey].children.push(item);
        }
      } else {
        const newKey = fatherId || fatherName || (item._id + "_father");
        if (typeof item.fatherCategory === "object" && item.fatherCategory.name) {
          categoryMap[newKey] = {
            ...item.fatherCategory,
            children: [item],
          };
        }
      }
    }
  });

  return sortItemsByName(Object.values(categoryMap));
}
