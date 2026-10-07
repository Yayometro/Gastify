import {
  getMonthOfTransaction,
  mapedMonths,
  monthObjects,
  months,
} from "../timeFunctions/timeFunctions";
import type { PrimaryAmountItem } from "../timeFunctions/timeFunctions";
import { formatInPrimaryCurrency } from "@/lib/money/displayCurrency";
import { minorToMajor } from "@/lib/money/currencies";

type DateLike = Date | string | number;

export interface CategoryLike {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
}

export interface TransactionLike extends PrimaryAmountItem {
  date?: DateLike | null;
  createdAt?: DateLike | null;
  isBill?: boolean;
  isIncome?: boolean;
  kind?: string;
  category?: CategoryLike | null;
  subCategory?: CategoryLike | null;
}

export interface CategoryFather<T> {
  name: string;
  type: string;
  icon: string;
  color: string;
  value: number;
  isBill?: boolean;
  children: T[];
}

export interface CategoryHierarchyChild<T> {
  childId: string;
  name: string;
  loc: number;
  color: string;
  icon: string;
  transactions?: T[];
}

interface CategoryHierarchyInput<T> {
  fatherId: string;
  name: string;
  loc?: number;
  color: string;
  icon: string;
  children: CategoryHierarchyChild<T>[];
}

export interface CategoryHierarchyCategory<T> {
  fatherId: string;
  name: string;
  loc: number;
  color: string;
  icon: string;
  children: CategoryHierarchyChild<T>[];
  transactions?: T[];
}

export interface CategoryHierarchyRoot<T> {
  name: string;
  color: string;
  icon: string;
  children: CategoryHierarchyCategory<T>[];
}

export type MonthValueBucket = {
  type: string;
  value: number;
  color?: string;
  icon?: string;
  index?: number;
  isBill?: boolean | null;
  isIncome?: boolean | null;
};

export type RelativeMonthBucket = {
  type: string;
  index: number;
  monthLabel: string;
  value: number;
  isBill: boolean | null;
  isIncome: boolean | null;
};

export interface RelativeMonthGroup<T> {
  index: number;
  monthLabel: string;
  value: number;
  childrens: T[];
}

export type CategoryValueEntry = {
  _id: string;
  type: string;
  value: number;
  icon: string;
  color: string;
  date: DateLike | null | undefined;
  isBill: boolean | undefined;
};

export type CategoryValueSliced<T> = CategoryValueEntry & {
  children: T[];
};

export type MonthsChartObject = {
  type: string;
  color: string;
  value: number;
  icon: string;
  index: number;
  isBill: boolean | null;
  isIncome: boolean | null;
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
};

// Formats an amount in the Wallet's primary currency. The name is historical: it
// used to be a fixed en-US/USD format (bugs 51, 59, 101).
export function usdFormatChanger(currency: number | string): string {
  return formatInPrimaryCurrency(currency);
}

// The Wallet-primary-currency equivalent of a transaction's money, in major
// units - safe to sum directly across transactions/Accounts of different
// native currencies, unlike the legacy `transaction.amount` (which is only
// ever meaningful within a single currency, and every reducer below used to
// add it up blindly regardless of currency). Also accepts an
// already-aggregated synthetic item (one produced by an earlier pass through
// one of these same reducers - has `.value`/`.amount` but no `.displayMoney`
// of its own) and passes its value through unchanged, since that value was
// already currency-normalized the first time around.
export function getPrimaryAmount(item?: PrimaryAmountItem | object | null): number {
  const typedItem = item as PrimaryAmountItem | null | undefined;
  const primary = typedItem?.displayMoney?.primary;
  if (primary) return minorToMajor(primary.amountMinor, primary.currency);
  return Number(typedItem?.value ?? typedItem?.amount) || 0;
}

export function orderByHighestValue<T extends { value?: number; amount?: number }>(arr: T[]): T[] {
  if (!(arr instanceof Array))
    throw new Error("arr should be an instance of Array");
  // Sorts a COPY (the input may be a frozen Redux array, bug 92) and reads
  // `value` OR `amount` per element with ?? so a value of exactly 0 is not mistaken
  // for a missing one (bug 93).
  const keyOf = (item: { value?: number; amount?: number }): number => Number(item.value ?? item.amount) || 0;
  return [...arr].sort((a, b) => keyOf(b) - keyOf(a));
}

export function get_total_value_of_all_transactions(arr: PrimaryAmountItem[]): number {
  if (!(arr instanceof Array))
    throw new Error("arr should be an instance of Array");
  return arr.reduce((prev, current) => {
    return prev + getPrimaryAmount(current)
  }, 0)
}

export function mapToAddTypeTransactionAndColor<T extends { isBill?: boolean }>(
  arr: T[]
): (T & { color: string; transactionType: "bill" | "income" })[] {
  if (!(arr instanceof Array))
    throw new Error("arr should be an instance of Array");
  return arr.map((monthTrans) => {
    if (monthTrans.isBill) {
      return { ...monthTrans, color: "#ff8c8c", transactionType: "bill" };
    } else {
      return {
        ...monthTrans,
        color: "#88FFE3",
        transactionType: "income",
      };
    }
  });
}

export function filterBillsOrIncomes<T extends { kind?: string; isBill?: boolean }>(
  trans: T[]
): { incomes: T[]; bills: T[] } {
  // A transfer/exchange leg has isBill=false AND isIncome=false by design
  // (plan section 13) - without this exclusion, `!tra.isBill` alone
  // silently counted every transfer leg as income everywhere this function
  // is used (Dashboard, Top3, History, Projections).
  const nonTransfers = trans.filter((tra) => tra.kind !== "transfer" && tra.kind !== "exchange");
  const incomes = nonTransfers.filter((tra) => !tra.isBill);
  const bills = nonTransfers.filter((tra) => tra.isBill);
  return { incomes, bills };
}

export function reduceAndTransforToCategories<T extends TransactionLike>(
  array: T[]
): { array: CategoryFather<T>[]; totalAmount: number } {
  if (!(array instanceof Array))
    throw new Error("array should be an Array instance");
  const categoriesFathers = array.reduce((acc: Record<string, CategoryFather<T>>, trans) => {
    const category = trans.category;
    const amount = getPrimaryAmount(trans);
    // Grouped by category id (two different categories with the same name are
    // two rows, bug 94); a movement with no category goes to one "No category" row.
    const groupKey = category?._id ? `id:${String(category._id)}` : `name:${category?.name ?? "No category"}`;
    if (acc[groupKey]) {
      acc[groupKey].value += amount;
      acc[groupKey].children = [...acc[groupKey].children, trans];
    } else {
      acc[groupKey] = {
        name: category?.name || "No category",
        type: category?.name || "No category",
        icon: category?.icon || "md/MdFilterNone",
        color: category?.color || "#ABABAB",
        value: amount,
        isBill: trans.isBill,
        children: [trans],
      };
    }
    return acc;
  }, {});
  const arrayFinal = Object.values(categoriesFathers).sort(
    (a, b) => b.value - a.value
  );
  const totalAmount = arrayFinal.reduce((acc, item) => (acc += item.value), 0);
  return {
    array: arrayFinal,
    totalAmount,
  };
}

// Builds the two-level category -> subcategory hierarchy (with amounts
// summed at every level) shared by the Wallet page's category-detail charts
// - originally inlined once inside CategoryCirclePacking's bubble chart,
// extracted here so the new Treemap view can build the identical tree
// instead of re-deriving its own version of this reduce/merge logic.
// A transaction with a subCategory contributes to BOTH its subcategory leaf
// and its parent category's total; a transaction with only a category (no
// subCategory) contributes directly to that category with no children; a
// transaction with neither is grouped under a single synthetic
// "No category" bucket.
export function buildCategoryHierarchy<T extends TransactionLike>(
  transactions: T[] | null | undefined,
  isBill?: boolean
): CategoryHierarchyRoot<T> {
  const rootName = isBill ? "Total expenses" : "Total incomes";
  const rootColor = isBill ? "#FF9797" : "#A7E295";
  if (!transactions || transactions.length === 0) {
    return { name: rootName, color: rootColor, icon: "md/MdMonetizationOn", children: [] };
  }

  const transNoCategory = transactions.filter((t) => !t.category);
  const transWithCategory = transactions.filter((t) => t?.category && !t?.subCategory);
  const transWithSubCat = transactions.filter((t) => t?.subCategory);

  const cateFaseOne: CategoryHierarchyInput<T>[] = transNoCategory.map((t) => ({
    fatherId: "Generic-1",
    name: "No category",
    loc: getPrimaryAmount(t),
    color: "#ABABAB",
    icon: "MdFilterNone",
    children: [],
  }));

  let cateFaseDos: CategoryHierarchyInput<T>[] = transWithCategory.map((t) => ({
    fatherId: t.category._id,
    name: t?.category.name,
    loc: getPrimaryAmount(t),
    color: t?.category?.color || "#ABABAB",
    icon: t?.category?.icon || "MdFilterNone",
    children: [],
  }));

  transWithSubCat.forEach((t) => {
    cateFaseDos.push({
      fatherId: t.category?._id,
      name: t.category?.name,
      color: t.category?.color || "#ABABAB",
      icon: t?.category?.icon || "MdFilterNone",
      children: [
        {
          childId: t.subCategory._id,
          name: t.subCategory?.name,
          loc: getPrimaryAmount(t),
          color: t.subCategory?.color || "#ABABAB",
          icon: t?.subCategory?.icon || "MdFilterNone",
        },
      ],
    });
  });

  cateFaseDos = cateFaseDos.concat(cateFaseOne);

  const result = cateFaseDos.reduce((acc: Record<string, CategoryHierarchyCategory<T>>, item) => {
    if (!acc[item.fatherId]) {
      acc[item.fatherId] = { ...item, loc: 0, children: [] };
    }
    if (!item.children.length) {
      acc[item.fatherId].loc += item.loc;
    }
    item.children.forEach((child) => {
      const existingChild = acc[item.fatherId].children.find((c) => c.childId === child.childId);
      if (existingChild) {
        existingChild.loc += child.loc;
      } else {
        acc[item.fatherId].children.push({ ...child });
      }
    });
    return acc;
  }, {});

  // Attach each node's own raw transactions (not just the summed `loc`) so
  // consumers that need to drill all the way down to individual
  // transactions - e.g. the Wallet treemap, once a category/subcategory has
  // few enough branches that showing them one aggregate tile each would
  // waste the space - can do so without re-deriving this grouping.
  const directTxByCategoryId = new Map<string, T[]>();
  transWithCategory.forEach((t) => {
    const key = t.category._id;
    if (!directTxByCategoryId.has(key)) directTxByCategoryId.set(key, []);
    directTxByCategoryId.get(key).push(t);
  });
  const txBySubCategoryId = new Map<string, T[]>();
  transWithSubCat.forEach((t) => {
    const key = t.subCategory._id;
    if (!txBySubCategoryId.has(key)) txBySubCategoryId.set(key, []);
    txBySubCategoryId.get(key).push(t);
  });

  const children = Object.values(result).map((cat) => ({
    ...cat,
    transactions: cat.fatherId === "Generic-1" ? transNoCategory : (directTxByCategoryId.get(cat.fatherId) || []),
    children: cat.children.map((sub) => ({
      ...sub,
      transactions: txBySubCategoryId.get(sub.childId) || [],
    })),
  }));

  return {
    name: rootName,
    color: rootColor,
    icon: "md/MdMonetizationOn",
    children,
  };
}

export function getTotalValue(arr: PrimaryAmountItem[]): number {
  if (!(arr instanceof Array))
    throw new Error("arr should be an Array instance");
  return arr.reduce((acc, item) => (acc += getPrimaryAmount(item)), 0);
}

export function reduceTransToTransMonths(arr: TransactionLike[]): Record<string, MonthValueBucket> {
  if (!(arr instanceof Array))
    throw new Error("arr should be an Array instance");
  return arr.reduce((acc: Record<string, MonthValueBucket>, transaction) => {
    const monthName = getMonthOfTransaction(new Date(transaction.date || transaction.createdAt).getMonth());
    const transactionOfMonth = monthName ? mapedMonths.get(monthName.toLowerCase()) : undefined;
    // An invalid date has no month: skip that movement instead of throwing.
    if (!transactionOfMonth) return acc;
    const month = transactionOfMonth.name;
    const amount = getPrimaryAmount(transaction);
    if (acc[month]) {
      acc[month].value += amount;
    } else {
      acc[month] = {
        [month]: month,
        type: month,
        color: transactionOfMonth.color,
        value: amount,
        icon: transactionOfMonth.icon || "md/MdOutlineFilter1",
        index: transactionOfMonth.index,
        isBill: transaction.isBill || null,
        isIncome: transaction.isIncome || null,
      };
    }
    return acc;
  }, {});
}

export function reduceTransactionsToMonthSpentObjects<T extends { type: string; value: number }>(
  monTransactions: T[]
): Record<string, T> {
  const newOrder = monTransactions.reduce((acc: Record<string, T>, transaction) => {
    if (!transaction) return acc;
    if (acc[transaction.type]) {
      acc[transaction.type].value += transaction.value;
    } else {
      acc[transaction.type] = { ...transaction };
      return acc;
    }
    return acc;
  }, {});
  return newOrder;
}
export function transactionsToMonths(allTrans: TransactionLike[]): { array: MonthValueBucket[]; totalValue: number } {
  const transformed = reduceTransToTransMonths(allTrans);
  // remove the entry with the name and left only the values
  const final = Object.values(transformed).sort((a, b) => a.index - b.index);
  const totalValue = final.reduce((acc, item) => acc + item.value, 0);
  return { array: final, totalValue };
}

// Like transactionsToMonths, but buckets by position within the range
// (0 = the range's first calendar month, 1 = the second, ...) instead of by
// calendar month name. transactionsToMonths' "january"/"february"/... keys
// only work for a range confined to a single year - comparing two ranges
// that span different years (or aren't the same calendar months at all,
// e.g. "last 3 months" vs "the 3 months before that") needs bars to align
// by relative position, not by which real month they happened to fall in.
// `rangeStart` should be the same Date passed to getTransactionsFromTimeRange
// for this same array, so bucket 0 always means "this range's first month."
export function transactionsToRelativeMonths(
  trans: TransactionLike[],
  rangeStart: DateLike
): { array: RelativeMonthBucket[]; totalValue: number } {
  const start = new Date(rangeStart);
  const buckets = trans.reduce((acc: Record<number, RelativeMonthBucket>, transaction) => {
    const txDate = new Date(transaction.date || transaction.createdAt);
    const monthsSinceStart =
      (txDate.getFullYear() - start.getFullYear()) * 12 +
      (txDate.getMonth() - start.getMonth());
    const amount = getPrimaryAmount(transaction);
    const monthLabel = `${months[txDate.getMonth()]} ${txDate.getFullYear()}`;
    if (acc[monthsSinceStart]) {
      acc[monthsSinceStart].value += amount;
    } else {
      acc[monthsSinceStart] = {
        type: `Month ${monthsSinceStart + 1}`,
        index: monthsSinceStart,
        monthLabel,
        value: amount,
        isBill: transaction.isBill || null,
        isIncome: transaction.isIncome || null,
      };
    }
    return acc;
  }, {});
  const final = Object.values(buckets).sort((a, b) => a.index - b.index);
  const totalValue = final.reduce((acc, item) => acc + item.value, 0);
  return { array: final, totalValue };
}

// Same relative-position bucketing as transactionsToRelativeMonths, but
// keeps every underlying transaction per bucket (as `childrens`) instead of
// collapsing to a single total - the Top-elements compare table needs the
// actual items to list per month, not just a sum.
export function orderItemsInRelativeMonth<T extends TransactionLike>(
  arr: T[],
  rangeStart: DateLike
): RelativeMonthGroup<T>[] {
  if (!(arr instanceof Array))
    throw new Error("arr param should be an Array instance");
  const start = new Date(rangeStart);
  const buckets = arr.reduce((acc: Record<number, RelativeMonthGroup<T>>, item) => {
    const txDate = new Date(item.date || item.createdAt);
    const index =
      (txDate.getFullYear() - start.getFullYear()) * 12 +
      (txDate.getMonth() - start.getMonth());
    const monthLabel = `${months[txDate.getMonth()]} ${txDate.getFullYear()}`;
    if (acc[index]) {
      acc[index].value += getPrimaryAmount(item);
      acc[index].childrens.push(item);
    } else {
      acc[index] = { index, monthLabel, value: getPrimaryAmount(item), childrens: [item] };
    }
    return acc;
  }, {});
  return Object.values(buckets).sort((a, b) => a.index - b.index);
}

// Aligns two periods' orderItemsInRelativeMonth() outputs into table rows by
// relative index (month 0 of A next to month 0 of B, etc.), the same
// left/older-vs-right/newer alignment the mirrored compare charts use -
// months missing from one side (a shorter period, or simply no data that
// month) come through as a null column rather than being dropped, so the
// row grid stays intact.
export function mergeTopElementsForCompareTable<A extends { index: number }, B extends { index: number }>(
  monthsA: A[],
  monthsB: B[]
): { index: number; colA: A | null; colB: B | null }[] {
  const mapA = new Map(monthsA.map((m) => [m.index, m]));
  const mapB = new Map(monthsB.map((m) => [m.index, m]));
  const maxIndex = Math.max(
    monthsA.length ? Math.max(...monthsA.map((m) => m.index)) : -1,
    monthsB.length ? Math.max(...monthsB.map((m) => m.index)) : -1
  );
  const rows: { index: number; colA: A | null; colB: B | null }[] = [];
  for (let i = 0; i <= maxIndex; i++) {
    const colA = mapA.get(i) || null;
    const colB = mapB.get(i) || null;
    if (!colA && !colB) continue;
    rows.push({ index: i, colA, colB });
  }
  return rows;
}

export function getTransactionsFromTimeRange<T extends { date?: DateLike | null; createdAt?: DateLike | null }>(
  trans: T[],
  start: Date,
  end: Date
): T[] {
  if (!(start instanceof Date) || !(end instanceof Date)) {
    throw new Error("Start and end parameters must be valid Date objects.");
  }
  return trans.filter((transaction) => {
    const transactionDate = new Date(transaction.date || transaction.createdAt);
    return transactionDate >= start && transactionDate <= end;
  });
}

export function sortBasedOnValueProperty<T extends { value: number }>(numberElemenets: number, array: T[]): T[] {
  if (!(array instanceof Array))
    throw new Error("the element should be an instance of Array");
  return [...array].sort((a, b) => a.value - b.value).slice(0, numberElemenets);
}
export function sortByIndex<T extends { index: number }>(arr: T[]): T[] {
  if (!(arr instanceof Array))
    throw new Error("the element should be an instance of Array");
  return [...arr].sort((a, b) => a.index - b.index);
}

export function reduceTransCategoriesSliced<T extends TransactionLike>(arr: T[]): CategoryValueSliced<T>[] {
  if (!(arr instanceof Array))
    throw new Error("the element should be an instance of Array");
  const reduceObj = arr.reduce((acc: Record<string, CategoryValueSliced<T>>, transaction) => {
    const categoryName = transaction?.category?.name || "No category";
    const value = getPrimaryAmount(transaction);
    const icon = transaction.category?.icon || "MdFilterNone";
    if (acc[categoryName]) {
      acc[categoryName].value += value;
      acc[categoryName].children = [
        ...acc[categoryName].children,
        transaction,
      ];
    } else {
      acc[categoryName] = {
        _id: transaction.category?._id || "No category",
        type: categoryName,
        value: value,
        icon: icon,
        color: transaction?.category?.color || "#ABABAB",
        date: transaction.date || transaction.createdAt,
        isBill: transaction.isBill,
        children: new Array(transaction),
      };
    }
    return acc;
  }, {});
  return Object.values(reduceObj);
}

export function reduceTransCategories<T extends { type: string; value: number }>(
  array: T[]
): { array: T[]; totalValue: number } {
  if (!(array instanceof Array))
    throw new Error("the element should be an instance of Array");
  const reducedObject = array.reduce((acc: Record<string, T>, item) => {
    if (acc[item.type]) {
      acc[item.type].value += item.value;
    } else {
      acc[item.type] = { ...item };
    }
    return acc;
  }, {});
  const objectsToArray = Object.values(reducedObject);
  const totalValue = objectsToArray.reduce((acc, item) => acc + item.value, 0);
  return {
    array: objectsToArray,
    totalValue,
  };
}

export function transactionsToCategories(arr: TransactionLike[]): CategoryValueEntry[] {
  if (!(arr instanceof Array))
    throw new Error(
      "The paramenter is not an instance of Array and it should be, it's typeof is: " +
        typeof arr
    );
  return arr.map((transaction) => {
    return {
      _id: transaction.category?._id || "No category",
      type: transaction?.category?.name || "No category",
      value: getPrimaryAmount(transaction),
      icon: transaction.category?.icon || "MdFilterNone",
      color: transaction.category?.color || "#ABABAB",
      date: transaction.date || transaction.createdAt,
      isBill: transaction.isBill,
    };
  });
}

// One chart object per movement, tagged with its calendar month (month of the
// year, any year; it used to compare against the CURRENT year's ranges only and
// returned null for every other year, and ignored the createdAt fallback the
// rest of this file uses, bug 96). Null only when the movement has no usable date.
export function transformTransactionsToMonthsChartObject(
  trans: TransactionLike[]
): (MonthsChartObject | null)[] {
  return trans.map((tra) => {
    const transactionDate = new Date((tra.date || tra.createdAt) as string | number | Date);
    if (Number.isNaN(transactionDate.getTime())) return null;
    const month = monthObjects[transactionDate.getMonth()];
    const amount = getPrimaryAmount(tra);
    return {
      [month.name]: amount,
      type: month.name,
      color: month.color,
      value: amount,
      icon: month.icon,
      index: month.index,
      isBill: tra.isBill || null,
      isIncome: tra.isIncome || null,
    };
  });
}
