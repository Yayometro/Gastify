import { sortItemsByName } from "../orderFunctions/orderFunctions";

export function organizedCategoriesAndSubCategories(arr) {
  if (!(arr instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  const organized = arr.reduce((acc, item) => {
    const father = acc[item?.fatherCategory?.name];
    if (father) {
      if (father.children) {
        father.children = [...father.children, item];
      } else {
        father.children = [item];
      }
    } else {
      if (item?.fatherCategory) {
        acc[item?.fatherCategory?.name] = {
          ...item?.fatherCategory,
          children: [item],
        };
      } else {
        acc[item.name] = { ...item };
      }
    }
    return acc;
  }, {});
  return sortItemsByName(Object.values(organized));
}
