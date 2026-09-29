"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { getPeriodLabel, timeperiodRangesArray } from "@/helpers/timeFunctions/timeFunctions";

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

const today = new Date();

// Shared "period A vs period B" state for every /dashboard/history section.
// Before this, TabsTogglerMontlyController, HistoricalComparativeCategories,
// and HistoricalMovementsController each independently reimplemented this
// exact same timePeriod/comparePeriod/compareEnabled state - meaning the
// same page could silently show three different "current" periods at once
// if a user changed one section's dropdown without touching the others.
// HistoryClient owns a single instance and passes it to every section
// (including HistoricalWalletAnalyzer) so they always agree.
export default function usePeriodComparison(): PeriodComparisonState {
  const [timePeriod, setTimePeriod] = useState<[Date, Date]>([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  const [compareEnabled, setCompareEnabled] = useState<boolean>(false);
  // Default: the same span the user is already looking at, shifted back
  // exactly one year - the most common comparison ("this vs. last year").
  const [comparePeriod, setComparePeriod] = useState<[Date, Date]>(() => [
    new Date(timePeriod[0].getFullYear() - 1, timePeriod[0].getMonth(), timePeriod[0].getDate()),
    new Date(timePeriod[1].getFullYear() - 1, timePeriod[1].getMonth(), timePeriod[1].getDate()),
  ]);

  // Stable across the hook's lifetime (only depends on the module-level
  // `today`) - memoized so consumers can safely put it in an effect's
  // dependency array without a new array reference re-triggering it on
  // every render.
  const timePeriodsForSelecter: TimePeriodOption[] = useMemo(
    () => [
      {
        value: `${new Date(today.getFullYear(), today.getMonth() - 2, 1)}*${today}`,
        name: "Last 3 months",
      },
      ...timeperiodRangesArray,
    ],
    []
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
