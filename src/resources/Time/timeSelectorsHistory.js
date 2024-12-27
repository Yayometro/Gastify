const { default: getLastDayOfQuarter } = require("@/lib/timeFunctions/getLastDayOfQuarter");
const { getDateInYearMonthDay } = require("@/helpers/timeFunctions/timeFunctions");

const today = new Date();
export const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const periodsForSelecter = [
  {
    value: `${today.getFullYear()}-01-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(today.getFullYear(), 1)
      ), "periodsForSelecter Q1"}`,
    name: "Fist quarter (Q1)",
  },
  {
    value: `${today.getFullYear()}-04-01*${getDateInYearMonthDay(
      getLastDayOfQuarter(today.getFullYear(), 2)
    )}`,
    name: "Second quarter (Q2)",
  },
  {
    value: `${today.getFullYear()}-07-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(today.getFullYear(), 3)
      )}`,
    name: "Third quarter (Q3)",
  },
  {
    value: `${today.getFullYear()}-10-01*${getDateInYearMonthDay(
        getLastDayOfQuarter(today.getFullYear(), 4)
      )}`,
    name: "Fourth quarter (Q4)",
  },
  {
    value: `${today.getFullYear()}-01-01*${getDateInYearMonthDay(new Date(today.getFullYear(), 5+1, 0))}`,
    name: "First half of year",
  },
  {
    value: `${today.getFullYear()}-07-01*${getDateInYearMonthDay(new Date(today.getFullYear(), 11+1, 0))}`,
    name: "Second half of year",
  },
  {
    value: `${today.getFullYear()}-01-01*${getDateInYearMonthDay(new Date(today.getFullYear(), 11+1, 0))}`,
    name: `All ${today.getFullYear()}`,
  },
];