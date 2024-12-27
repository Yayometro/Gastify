import { getYearMonthDateRange, normalizeDateToUTC } from "../timeFunctions/timeFunctions";

export function filterBillsOrIncomes(trans) {
    const incomes = trans.filter((tra) => tra.isIncome);
    const bills = trans.filter((tra) => tra.isBill);
    return { incomes, bills };
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
    const transactionsTransformed =
      transformTransactionsToMonthsChartObject(allTrans);
    const reducerTransform = reduceTransactionsToMonthSpentObjects(
      transactionsTransformed
    );
    // remove the entry with the name and left only the values
    const final = Object.values(reducerTransform).sort((a,b) => a.index - b.index)
    const totalValue = final.reduce((acc, item) => acc + item.value, 0);
    return {array: final, totalValue}
  }

  export function getTransactionsFromTimeRange(trans, start, end) {
    if (!(start instanceof Date) || !(end instanceof Date)) {
      throw new Error("Start and end parameters must be valid Date objects.");
    }
    return trans.filter((transaction) => {
      const transactionDate = new Date(
        transaction.date || transaction.createdAt
      );
      return transactionDate >= start && transactionDate <= end;
    });
  }

  export function transformTransactionsToMonthsChartObject(trans) {
    const monthRanges = getYearMonthDateRange(new Date());

    const transactionsChanged = trans.map((tra) => {
      const transactionDate = normalizeDateToUTC(new Date(tra.date));
      if (
        transactionDate >=
          normalizeDateToUTC(monthRanges.get("january").start) &&
        transactionDate <= normalizeDateToUTC(monthRanges.get("january").end)
      ) {
        return {
          ["january"]: tra.amount,
          type: "january",
          color: "#FF5733",
          value: tra.amount,
          icon: "md/MdOutlineFilter1",
          index: 1
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
          index: 2
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
          index: 3
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
          index: 4
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
          index: 5
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
          index: 6
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
          index: 7
        };
      } else if (
        transactionDate >=
          normalizeDateToUTC(monthRanges.get("august").start) &&
        transactionDate <= normalizeDateToUTC(monthRanges.get("august").end)
      ) {
        return {
          ["august"]: tra.amount,
          type: "august",
          color: "#FF8D33",
          value: tra.amount,
          icon: "md/MdOutlineFilter8",
          index: 8
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
          index: 9
        };
      } else if (
        transactionDate >=
          normalizeDateToUTC(monthRanges.get("october").start) &&
        transactionDate <= normalizeDateToUTC(monthRanges.get("october").end)
      ) {
        return {
          ["october"]: tra.amount,
          type: "october",
          color: "#5733FF",
          value: tra.amount,
          icon: "md/Md10Mp",
          index: 10
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
          index: 11
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
          index: 12
        };
      } else {
        return null;
      }
    });
    return transactionsChanged;
  }
  