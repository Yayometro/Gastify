import {
  getMonthOfTransaction,
  getYearMonthDateRange,
  mapedMonths,
  months,
  normalizeDateToUTC,
} from "../timeFunctions/timeFunctions";
import currencyFormatter from "currency-formatter";
import { minorToMajor } from "@/lib/money/currencies";

export function usdFormatChanger(currency) {
  return currencyFormatter.format(currency, {
    locale: "en-US",
  });
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
export function getPrimaryAmount(item) {
  const primary = item?.displayMoney?.primary;
  if (primary) return minorToMajor(primary.amountMinor, primary.currency);
  return Number(item?.value ?? item?.amount) || 0;
}

export function orderByHighestValue(arr) {
  if (!(arr instanceof Array))
    throw new Error("arr should be an instance of Array");
  return arr.sort((a, b) => (b.value || b.amount) - (a.value || a.amount));
}

export function get_total_value_of_all_transactions(arr){
  if (!(arr instanceof Array))
    throw new Error("arr should be an instance of Array");
  return arr.reduce((prev, current) => {
    return prev + getPrimaryAmount(current)
  }, 0)
}

export function mapToAddTypeTransactionAndColor(arr) {
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

export function filterBillsOrIncomes(trans) {
  // A transfer/exchange leg has isBill=false AND isIncome=false by design
  // (plan section 13) - without this exclusion, `!tra.isBill` alone
  // silently counted every transfer leg as income everywhere this function
  // is used (Dashboard, Top3, History, Projections).
  const nonTransfers = trans.filter((tra) => tra.kind !== "transfer" && tra.kind !== "exchange");
  const incomes = nonTransfers.filter((tra) => !tra.isBill);
  const bills = nonTransfers.filter((tra) => tra.isBill);
  return { incomes, bills };
}

export function reduceAndTransforToCategories(array) {
  if (!(array instanceof Array))
    throw new Error("array should be an Array instance");
  const categoriesFathers = array.reduce((acc, trans) => {
    const category = trans.category;
    const amount = getPrimaryAmount(trans);
    if (acc[category?.name]) {
      acc[category?.name].value += amount;
      acc[category?.name].children = [...acc[category?.name].children, trans];
    } else {
      acc[category?.name] = {
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
export function buildCategoryHierarchy(transactions, isBill) {
  const rootName = isBill ? "Total expenses" : "Total incomes";
  const rootColor = isBill ? "#FF9797" : "#A7E295";
  if (!transactions || transactions.length === 0) {
    return { name: rootName, color: rootColor, icon: "md/MdMonetizationOn", children: [] };
  }

  const transNoCategory = transactions.filter((t) => !t.category);
  const transWithCategory = transactions.filter((t) => t?.category && !t?.subCategory);
  const transWithSubCat = transactions.filter((t) => t?.subCategory);

  const cateFaseOne = transNoCategory.map((t) => ({
    fatherId: "Generic-1",
    name: "No category",
    loc: getPrimaryAmount(t),
    color: "#ABABAB",
    icon: "MdFilterNone",
    children: [],
  }));

  let cateFaseDos = transWithCategory.map((t) => ({
    fatherId: t.category._id,
    name: t?.category.name,
    loc: getPrimaryAmount(t),
    color: t?.category?.color || "#ABABAB",
    icon: t?.category?.icon || "MdFilterNone",
    children: [],
  }));

  transWithSubCat.forEach((t) => {
    cateFaseDos.push({
      fatherId: t.category._id,
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

  const result = cateFaseDos.reduce((acc, item) => {
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
  const directTxByCategoryId = new Map();
  transWithCategory.forEach((t) => {
    const key = t.category._id;
    if (!directTxByCategoryId.has(key)) directTxByCategoryId.set(key, []);
    directTxByCategoryId.get(key).push(t);
  });
  const txBySubCategoryId = new Map();
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

export function getTotalValue(arr) {
  if (!(arr instanceof Array))
    throw new Error("arr should be an Array instance");
  return arr.reduce((acc, item) => (acc += getPrimaryAmount(item)), 0);
}

export function reduceTransToTransMonths(arr) {
  if (!(arr instanceof Array))
    throw new Error("arr should be an Array instance");
  return arr.reduce((acc, transaction) => {
    const transactionOfMonth = mapedMonths.get(
      getMonthOfTransaction(new Date(transaction.date).getMonth()).toLowerCase()
    );
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

export function reduceTransactionsToMonthSpentObjects(monTransactions) {
  const newOrder = monTransactions.reduce((acc, transaction) => {
    if (transaction && acc[transaction?.type]) {
      acc[transaction.type].value += transaction.value;
    } else {
      acc[transaction.type] = { ...transaction };
      return acc;
    }
    return acc;
  }, {});
  return newOrder;
}
export function transactionsToMonths(allTrans) {
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
export function transactionsToRelativeMonths(trans, rangeStart) {
  const start = new Date(rangeStart);
  const buckets = trans.reduce((acc, transaction) => {
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
export function orderItemsInRelativeMonth(arr, rangeStart) {
  if (!(arr instanceof Array))
    throw new Error("arr param should be an Array instance");
  const start = new Date(rangeStart);
  const buckets = arr.reduce((acc, item) => {
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
export function mergeTopElementsForCompareTable(monthsA, monthsB) {
  const mapA = new Map(monthsA.map((m) => [m.index, m]));
  const mapB = new Map(monthsB.map((m) => [m.index, m]));
  const maxIndex = Math.max(
    monthsA.length ? Math.max(...monthsA.map((m) => m.index)) : -1,
    monthsB.length ? Math.max(...monthsB.map((m) => m.index)) : -1
  );
  const rows = [];
  for (let i = 0; i <= maxIndex; i++) {
    const colA = mapA.get(i) || null;
    const colB = mapB.get(i) || null;
    if (!colA && !colB) continue;
    rows.push({ index: i, colA, colB });
  }
  return rows;
}

export function getTransactionsFromTimeRange(trans, start, end) {
  if (!(start instanceof Date) || !(end instanceof Date)) {
    throw new Error("Start and end parameters must be valid Date objects.");
  }
  return trans.filter((transaction) => {
    const transactionDate = new Date(transaction.date || transaction.createdAt);
    return transactionDate >= start && transactionDate <= end;
  });
}

export function sortBasedOnValueProperty(numberElemenets, array) {
  if (!(array instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  return array.sort((a, b) => a.value - b.value).slice(0, numberElemenets);
}
export function sortByIndex(arr) {
  if (!(arr instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  return arr.sort((a, b) => a.index - b.index);
}

export function reduceTransCategoriesSliced(arr, slice) {
  if (!(arr instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  const reduceObj = arr.reduce((acc, transaction) => {
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

export function reduceTransCategories(array) {
  if (!(array instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  const reducedObject = array.reduce((acc, item) => {
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

export function transactionsToCategories(arr) {
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

export function transformTransactionsToMonthsChartObject(trans) {
  const monthRanges = getYearMonthDateRange(new Date());

  const transactionsChanged = trans.map((tra) => {
    const transactionDate = normalizeDateToUTC(new Date(tra.date));
    const amount = getPrimaryAmount(tra);
    if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("january").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("january").end)
    ) {
      return {
        ["january"]: amount,
        type: "january",
        color: "#FF5733",
        value: amount,
        icon: "md/MdOutlineFilter1",
        index: 1,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >=
        normalizeDateToUTC(monthRanges.get("february").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("february").end)
    ) {
      return {
        ["february"]: amount,
        type: "february",
        color: "#33FF57",
        value: amount,
        icon: "md/MdOutlineFilter2",
        index: 2,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("march").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("march").end)
    ) {
      return {
        ["march"]: amount,
        type: "march",
        color: "#3357FF",
        value: amount,
        icon: "md/MdOutlineFilter3",
        index: 3,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("april").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("april").end)
    ) {
      return {
        ["april"]: amount,
        type: "april",
        color: "#FF33A8",
        value: amount,
        icon: "md/MdOutlineFilter4",
        index: 4,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("may").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("may").end)
    ) {
      return {
        ["may"]: amount,
        type: "may",
        color: "#FFD633",
        value: amount,
        icon: "md/MdOutlineFilter5",
        index: 5,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("june").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("june").end)
    ) {
      return {
        ["june"]: amount,
        type: "june",
        color: "#33FFF6",
        value: amount,
        icon: "md/MdOutlineFilter6",
        index: 6,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("july").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("july").end)
    ) {
      return {
        ["july"]: amount,
        type: "july",
        color: "#8D33FF",
        value: amount,
        icon: "md/MdOutlineFilter7",
        index: 7,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("august").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("august").end)
    ) {
      return {
        ["august"]: amount,
        type: "august",
        color: "#FF8D33",
        value: amount,
        icon: "md/MdOutlineFilter8",
        index: 8,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >=
        normalizeDateToUTC(monthRanges.get("september").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("september").end)
    ) {
      return {
        ["september"]: amount,
        type: "september",
        color: "#33FF8D",
        value: amount,
        icon: "md/MdOutlineFilter9",
        index: 9,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("october").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("october").end)
    ) {
      return {
        ["october"]: amount,
        type: "october",
        color: "#5733FF",
        value: amount,
        icon: "md/Md10Mp",
        index: 10,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >=
        normalizeDateToUTC(monthRanges.get("november").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("november").end)
    ) {
      return {
        ["november"]: amount,
        type: "november",
        color: "#FF3333",
        value: amount,
        icon: "md/Md11Mp",
        index: 11,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else if (
      transactionDate >=
        normalizeDateToUTC(monthRanges.get("december").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("december").end)
    ) {
      return {
        ["december"]: amount,
        type: "december",
        color: "#33D4FF",
        value: amount,
        icon: "md/Md12Mp",
        index: 12,
        isBill: tra.isBill || null,
        isIncome: tra.isIncome || null,
      };
    } else {
      return null;
    }
  });
  return transactionsChanged;
}
