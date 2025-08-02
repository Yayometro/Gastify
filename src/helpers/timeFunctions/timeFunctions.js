export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const monthObjects = [
  { color: "#fbcfc6", name: "january", icon: "md/MdOutlineFilter1", index: 1 },
  { color: "#99ffb3", name: "february", icon: "md/MdOutlineFilter2", index: 2 },
  { color: "#99a6ff", name: "march", icon: "md/MdOutlineFilter3", index: 3 },
  { color: "#ff99c9", name: "april", icon: "md/MdOutlineFilter4", index: 4 },
  { color: "#ffe699", name: "may", icon: "md/MdOutlineFilter5", index: 5 },
  { color: "#99fffb", name: "june", icon: "md/MdOutlineFilter6", index: 6 },
  { color: "#c299ff", name: "july", icon: "md/MdOutlineFilter7", index: 7 },
  { color: "#ffc299", name: "august", icon: "md/MdOutlineFilter8", index: 8 },
  {
    color: "#99ffc2",
    name: "september",
    icon: "md/MdOutlineFilter9",
    index: 9,
  },
  { color: "#b399ff", name: "october", icon: "md/Md10Mp", index: 10 },
  { color: "#ff9999", name: "november", icon: "md/Md11Mp", index: 11 },
  { color: "#99eaff", name: "december", icon: "md/Md12Mp", index: 12 },
];

export const mapedMonths = new Map(monthObjects.map((m) => [m.name, m]));
export function getDateInYearMonthDay(date, where) {
  const validDate =
    date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date);

  if (!isNaN(validDate.getTime())) {
    return validDate.toISOString().split("T")[0];
  } else {
    return "Date invalid to parse";
  }
  // throw new Error("Invalid date parameter passed to getDateInYearMonthDay");
}

export function orderItemsInTheirMonth(arr) {
  if (!(arr instanceof Array))
    throw new Error("arr param should be an Array instance");
  const mapedMonths = new Map(monthObjects.map((m) => [m.name, m]));
  const reducedItemsPerMonth = arr.reduce((acc, item) => {
    const monthNumber = new Date(item.date).getMonth();
    const month = getMonthOfTransaction(monthNumber).toLowerCase();
    if (acc[month]) {
      (acc[month].value += item.value || item.amount),
        (acc[month].childrens = [...acc[month].childrens, item]);
    } else {
      acc[month] = {
        month: month,
        value: item.value || item.amount,
        childrens: [item],
        icon: mapedMonths.get(month).icon,
        color: mapedMonths.get(month).color,
        index: mapedMonths.get(month).index,
      };
    }
    return acc;
  }, {});
  return Object.values(reducedItemsPerMonth);
}
export function slicedAndReduceNewValuesForMonths(arr, slice) {
  if (!(arr instanceof Array))
    throw new Error("arr param should be an Array instance");
  return arr.map((monthTrans) => {
    const monthsSliced = monthTrans.childrens.slice(0, slice);
    const newValue = monthsSliced.reduce(
      (acc, item) => (acc += item.value || item.amount),
      0
    );
    return {
      ...monthTrans,
      childrens: monthsSliced,
      value: newValue,
    };
  });
}
export function getMonthOfTransaction(month) {
  if (typeof month !== "number")
    throw new Error(
      `Month should be a number, but it's typeof is ${typeof month} and the element is -> ${month}`
    );
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const newMonthNamesMap = new Map(
    months.map((month, index) => [index, month])
  );
  return newMonthNamesMap.get(month);
}

export function getLastDayOfQuarter(year, quarter) {
  const quarterEndMonths = {
    1: 2,
    2: 5,
    3: 8,
    4: 11,
  };

  const month = quarterEndMonths[quarter];
  if (month === undefined) {
    throw new Error("El trimestre debe ser un valor entre 1 y 4");
  }

  return new Date(year, month + 1, 0);
}
export function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}

export function getYearMonthDateRange(today) {
  const year = today.getFullYear();

  const monthNames = [
    { color: "#FF5733", name: "january" },
    { color: "#33FF57", name: "february" },
    { color: "#3357FF", name: "march" },
    { color: "#FF33A8", name: "april" },
    { color: "#FFD633", name: "may" },
    { color: "#33FFF6", name: "june" },
    { color: "#8D33FF", name: "july" },
    { color: "#FF8D33", name: "august" },
    { color: "#33FF8D", name: "september" },
    { color: "#5733FF", name: "october" },
    { color: "#FF3333", name: "november" },
    { color: "#33D4FF", name: "december" },
  ];

  const dateRangeMap = new Map();

  monthNames.forEach((month, index) => {
    const start = new Date(year, index, 1);
    const end = getLastDayOfMonth(year, index);
    const color = month.color;
    dateRangeMap.set(month.name, { start, end, color });
  });

  return dateRangeMap;
}

export function generatePeriodsForSelector(year) {
  return [
    {
      value: `${new Date(year, 0, 1)}*${getLastDayOfQuarter(year, 1)}`,
      name: "First quarter (Q1)",
    },
    {
      value: `${new Date(year, 3, 1)}*${getLastDayOfQuarter(year, 2)}`,
      name: "Second quarter (Q2)",
    },
    {
      value: `${new Date(year, 6, 1)}*${getLastDayOfQuarter(year, 3)}`,
      name: "Third quarter (Q3)",
    },
    {
      value: `${new Date(year, 9, 1)}*${getLastDayOfQuarter(year, 4)}`,
      name: "Fourth quarter (Q4)",
    },
    {
      value: `${new Date(year, 0, 1)}*${new Date(year, 5 + 1, 0)}`,
      name: "First half of year",
    },
    {
      value: `${new Date(year, 6, 1)}*${new Date(year, 11 + 1, 0)}`,
      name: "Second half of year",
    },
    {
      value: `${new Date(year, 0, 1)}*${new Date(year, 11 + 1, 0)}`,
      name: `All ${year}`,
    },
  ];
}
const year = new Date().getFullYear();
export const timeperiodRangesArray = [
  {
    value: `${new Date(year, 0, 1)}*${getLastDayOfQuarter(year, 1)}`,
    name: "First quarter (Q1)",
  },
  {
    value: `${new Date(year, 3, 1)}*${getLastDayOfQuarter(year, 2)}`,
    name: "Second quarter (Q2)",
  },
  {
    value: `${new Date(year, 6, 1)}*${getLastDayOfQuarter(year, 3)}`,
    name: "Third quarter (Q3)",
  },
  {
    value: `${new Date(year, 9, 1)}*${getLastDayOfQuarter(year, 4)}`,
    name: "Fourth quarter (Q4)",
  },
  {
    value: `${new Date(year, 0, 1)}*${new Date(year, 5 + 1, 0)}`,
    name: "First half of year",
  },
  {
    value: `${new Date(year, 6, 1)}*${new Date(year, 11 + 1, 0)}`,
    name: "Second half of year",
  },
  {
    value: `${new Date(year, 0, 1)}*${new Date(year, 11 + 1, 0)}`,
    name: `All ${year}`,
  },
  {
    value: `${new Date(year - 1, 0, 1)}*${new Date(year - 1, 11 + 1, 0)}`,
    name: `All ${year - 1}`,
  },
];
export const generate_timeperiod_ranges_array_for_dashboard = (year) => {
  const today = new Date();
  return [
    {
      value: `${new Date(year, today.getMonth(), 1)}*${getLastDayOfMonth(
        year,
        today.getMonth()
      )}`, // calcular aqui el mes iniciando por el dia del mes en el que se est'a al dia de hoy
      name: "This Month",
    },
    {
      value: `${new Date(year, today.getMonth() - 1, 1)}*${getLastDayOfMonth(
        year,
        today.getMonth() - 1
      )}`, // calcular aqui el mes iniciando por el dia del mes en el que se est'a al dia de hoy
      name: "Last Month",
    },
    {
      value: `${new Date(year, today.getMonth(), 1)}*${new Date(
        year,
        today.getMonth(),
        15
      )}`, // calcular aqui el mes iniciando por el dia del mes al 15
      name: "First half of month",
    },
    {
      value: `${new Date(year, today.getMonth(), 15)}*${getLastDayOfMonth(
        year,
        today.getMonth()
      )}`, // calcular aqui el mes actual por el dia del 15 del mes en al fin del mes
      name: "Second half of month",
    },
    {
      value: `${new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1
      )}*${today}`,
      name: "Last 3 months",
    },
    ...timeperiodRangesArray,
  ];
};

export function normalizeDateToUTC(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}
