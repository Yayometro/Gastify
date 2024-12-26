export function getDateInYearMonthDay(date) {
  return date.toISOString().split("T")[0];
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

  // Crear un mapa con el rango de fechas para cada mes del año
  const monthNames = [
    {color: "#FF5733", name: "january"},
    {color: "#33FF57", name: "february"},
   {color: "#3357FF", name:  "march"},
    {color: "#FF33A8", name: "april"},
    {color: "#FFD633", name: "may"},
    {color: "#33FFF6", name: "june"},
    {color: "#8D33FF", name: "july"},
    {color: "#FF8D33", name: "august"},
    {color: "#33FF8D", name: "september"},
    {color: "#5733FF", name: "october"},
    {color: "#FF3333", name: "november"},
    {color: "#33D4FF", name: "december"},
  ];

  const dateRangeMap = new Map();

  monthNames.forEach((month, index) => {
    const start = new Date(`${year}-${index + 1}-01`);
    const end = getLastDayOfMonth(year, index);
    const color = month.color;
    dateRangeMap.set(month.name, { start, end, color});
  });

  return dateRangeMap;
}

export function generatePeriodsForSelector(year) {
  return [
    {
      value: `${year}-01-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(year, 1)
      )}`,
      name: "First quarter (Q1)",
    },
    {
      value: `${year}-04-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(year, 2)
      )}`,
      name: "Second quarter (Q2)",
    },
    {
      value: `${year}-07-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(year, 3)
      )}`,
      name: "Third quarter (Q3)",
    },
    {
      value: `${year}-10-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(year, 4)
      )}`,
      name: "Fourth quarter (Q4)",
    },
    {
      value: `${year}-01-01*${getDateInYearMonthDay(new Date(year, 5 + 1, 0))}`,
      name: "First half of year",
    },
    {
      value: `${year}-07-01*${getDateInYearMonthDay(
        new Date(year, 11 + 1, 0)
      )}`,
      name: "Second half of year",
    },
    {
      value: `${year}-01-01*${getDateInYearMonthDay(
        new Date(year, 11 + 1, 0)
      )}`,
      name: `All ${year}`,
    },
  ];
}
const year = new Date().getFullYear();
export const timeperiodRangesArray = [
  {
    value: `${year}-01-01*${getDateInYearMonthDay(
      getLastDayOfQuarter(year, 1)
    )}`,
    name: "First quarter (Q1)",
  },
  {
    value: `${year}-04-01*${getDateInYearMonthDay(
      getLastDayOfQuarter(year, 2)
    )}`,
    name: "Second quarter (Q2)",
  },
  {
    value: `${year}-07-01*${getDateInYearMonthDay(
      getLastDayOfQuarter(year, 3)
    )}`,
    name: "Third quarter (Q3)",
  },
  {
    value: `${year}-10-01*${getDateInYearMonthDay(
      getLastDayOfQuarter(year, 4)
    )}`,
    name: "Fourth quarter (Q4)",
  },
  {
    value: `${year}-01-01*${getDateInYearMonthDay(new Date(year, 5 + 1, 0))}`,
    name: "First half of year",
  },
  {
    value: `${year}-07-01*${getDateInYearMonthDay(new Date(year, 11 + 1, 0))}`,
    name: "Second half of year",
  },
  {
    value: `${year}-01-01*${getDateInYearMonthDay(new Date(year, 11 + 1, 0))}`,
    name: `All ${year}`,
  },
];

export function normalizeDateToUTC(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}
