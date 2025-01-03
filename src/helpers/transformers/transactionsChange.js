import {
  getMonthOfTransaction,
  getYearMonthDateRange,
  mapedMonths,
  normalizeDateToUTC,
} from "../timeFunctions/timeFunctions";
import currencyFormatter from "currency-formatter";

export function usdFormatChanger(currency) {
  return currencyFormatter.format(currency, {
    locale: "en-US",
  });
}
export function orderByHighestValue(arr) {
  if (!(arr instanceof Array))
    throw new Error("arr should be an instance of Array");
  return arr.sort((a, b) => (b.value || b.amount) - (a.value || a.amount));
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
  const incomes = trans.filter((tra) => !tra.isBill);
  const bills = trans.filter((tra) => tra.isBill);
  return { incomes, bills };
}

export function reduceTransToTransMonths(arr){
  if(!(arr instanceof Array)) throw new Error("arr should be an Array instance")
    return arr.reduce((acc, transaction) => {
  const transactionOfMonth = mapedMonths.get(getMonthOfTransaction(new Date(transaction.date).getMonth()).toLowerCase())
  const month = transactionOfMonth.name
  if(acc[month]){
    acc[month].value += transaction.amount
  } else {
    acc[month] = {
      [month]: month,
      type: month,
      color: transactionOfMonth.color,
      value: transaction.amount,
      icon: transactionOfMonth.icon || "md/MdOutlineFilter1",
      index: transactionOfMonth.index,
      isBill: transaction.isBill || null,
      isIncome: transaction.isIncome || null,
    };
  }
      return acc
    }, {})
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
  const transformed = reduceTransToTransMonths(allTrans)
  // remove the entry with the name and left only the values
  const final = Object.values(transformed).sort(
    (a, b) => a.index - b.index
  );
  const totalValue = final.reduce((acc, item) => acc + item.value, 0);
  return { array: final, totalValue };
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
export function sortByIndex(arr){
  if (!(arr instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  return arr.sort((a, b) => a.index - b.index)
}

export function reduceTransCategoriesSliced(arr, slice) {
  if (!(arr instanceof Array))
    throw new Error("the element shoudl be a instance of Array");
  const reduceObj = arr.reduce((acc, transaction) => {
    const categoryName = transaction?.category?.name || "No category";
    const value = transaction.value || transaction.amount || 0;
    const icon = transaction.category?.icon || "MdFilterNone";
    if (acc[categoryName]) {
      if (acc[categoryName].length <= slice) {
        acc[categoryName].value += value;
        acc[categoryName].length += 1;
      }
    } else {
      acc[categoryName] = {
        _id: transaction.category?._id || "No category",
        type: categoryName,
        value: value,
        icon: icon,
        color: transaction?.category?.color || "#ABABAB",
        date: transaction.date || transaction.createdAt,
        isBill: transaction.isBill,
        length: 1,
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
      value: transaction.amount || 0,
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
    if (
      transactionDate >= normalizeDateToUTC(monthRanges.get("january").start) &&
      transactionDate <= normalizeDateToUTC(monthRanges.get("january").end)
    ) {
      return {
        ["january"]: tra.amount,
        type: "january",
        color: "#FF5733",
        value: tra.amount,
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
        ["february"]: tra.amount,
        type: "february",
        color: "#33FF57",
        value: tra.amount,
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
        ["march"]: tra.amount,
        type: "march",
        color: "#3357FF",
        value: tra.amount,
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
        ["april"]: tra.amount,
        type: "april",
        color: "#FF33A8",
        value: tra.amount,
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
        ["may"]: tra.amount,
        type: "may",
        color: "#FFD633",
        value: tra.amount,
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
        ["june"]: tra.amount,
        type: "june",
        color: "#33FFF6",
        value: tra.amount,
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
        ["july"]: tra.amount,
        type: "july",
        color: "#8D33FF",
        value: tra.amount,
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
        ["august"]: tra.amount,
        type: "august",
        color: "#FF8D33",
        value: tra.amount,
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
        ["september"]: tra.amount,
        type: "september",
        color: "#33FF8D",
        value: tra.amount,
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
        ["october"]: tra.amount,
        type: "october",
        color: "#5733FF",
        value: tra.amount,
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
        ["november"]: tra.amount,
        type: "november",
        color: "#FF3333",
        value: tra.amount,
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
        ["december"]: tra.amount,
        type: "december",
        color: "#33D4FF",
        value: tra.amount,
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
