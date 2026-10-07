"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  getLast3MonthsPeriod,
  getPeriodLabel,
  getTimeperiodRangesArray,
  shiftPeriodBackOneYear,
} from "@/helpers/timeFunctions/timeFunctions";

export interface TimePeriodOption {
  value: string;
  name: string;
}

export interface PeriodComparisonState {
  timePeriod: [Date, Date];
  setTimePeriod: React.Dispatch<React.SetStateAction<[Date, Date]>>;
  comparePeriod: [Date, Date];
  setComparePeriod: React.Dispatch<React.SetStateAction<[Date, Date]>>;
  compareEnabled: boolean;
  setCompareEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  timePeriodsForSelecter: TimePeriodOption[];
  timePeriodsForCompareSelecter: TimePeriodOption[];
  periodFromFather: TimePeriodOption;
  getValueFromSelecter: (v: string) => void;
  handleRangeDate: (dateStart?: Date | null, dateEnd?: Date | null) => void;
  getCompareValueFromSelecter: (v: string) => void;
  handleCompareRangeDate: (dateStart?: Date | null, dateEnd?: Date | null) => void;
  labelA: string;
  labelB: string;
}

// Shared "period A vs period B" state for every /dashboard/history section.
// Before this, TabsTogglerMontlyController, HistoricalComparativeCategories,
// and HistoricalMovementsController each independently reimplemented this
// exact same timePeriod/comparePeriod/compareEnabled state - meaning the
// same page could silently show three different "current" periods at once
// if a user changed one section's dropdown without touching the others.
// HistoryClient owns a single instance and passes it to every section
// (including HistoricalWalletAnalyzer) so they always agree.
export default function usePeriodComparison(): PeriodComparisonState {
  // "Today" is taken when the hook mounts, not when the bundle loads (a tab left
  // open across midnight used to keep the old day, bug 17). The default period
  // and the first option of the selector come from the same pair of dates so the
  // label of the default period is recognised.
  const [defaultLast3Months] = useState<[Date, Date]>(() => getLast3MonthsPeriod());
  const [timePeriod, setTimePeriod] = useState<[Date, Date]>(defaultLast3Months);
  const [compareEnabled, setCompareEnabled] = useState<boolean>(false);
  // Default: the same span the user is already looking at, shifted back
  // exactly one year - the most common comparison ("this vs. last year").
  const [comparePeriod, setComparePeriodState] = useState<[Date, Date]>(() => shiftPeriodBackOneYear(timePeriod));
  // Once the user picks the comparison period themselves it is left alone;
  // until then it follows the main period (it used to stay on the initial one
  // when the user changed the main period and then turned "Compare" on, bug 18).
  const compareAdjusted = useRef<boolean>(false);
  const setComparePeriod: React.Dispatch<React.SetStateAction<[Date, Date]>> = (value) => {
    compareAdjusted.current = true;
    setComparePeriodState(value);
  };
  const firstRun = useRef<boolean>(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!compareAdjusted.current) setComparePeriodState(shiftPeriodBackOneYear(timePeriod));
  }, [timePeriod]);

  // Stable across the hook's lifetime (it only depends on the day the hook
  // mounted) - memoized so consumers can safely put it in an effect's
  // dependency array without a new array reference re-triggering it on
  // every render.
  const timePeriodsForSelecter: TimePeriodOption[] = useMemo(
    () => [
      {
        value: `${defaultLast3Months[0]}*${defaultLast3Months[1]}`,
        name: "Last 3 months",
      },
      ...getTimeperiodRangesArray(defaultLast3Months[1].getFullYear()),
    ],
    [defaultLast3Months]
  );

  function getValueFromSelecter(v: string): void {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart?: Date | null, dateEnd?: Date | null): void {
    if (dateStart && dateEnd) {
      setTimePeriod([dateStart, dateEnd]);
    }
  }

  function getCompareValueFromSelecter(v: string): void {
    const [start, end] = v.split("*");
    setComparePeriod([new Date(start), new Date(end)]);
  }

  function handleCompareRangeDate(dateStart?: Date | null, dateEnd?: Date | null): void {
    if (dateStart && dateEnd) {
      setComparePeriod([dateStart, dateEnd]);
    }
  }

  return {
    timePeriod,
    setTimePeriod,
    comparePeriod,
    setComparePeriod,
    compareEnabled,
    setCompareEnabled,
    timePeriodsForSelecter,
    timePeriodsForCompareSelecter: timePeriodsForSelecter,
    periodFromFather: timePeriodsForSelecter[0],
    getValueFromSelecter,
    handleRangeDate,
    getCompareValueFromSelecter,
    handleCompareRangeDate,
    labelA: getPeriodLabel(timePeriodsForSelecter, timePeriod),
    labelB: getPeriodLabel(timePeriodsForSelecter, comparePeriod),
  };
}
