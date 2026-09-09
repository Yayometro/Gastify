"use client";

import { useMemo, useState } from "react";
import { getPeriodLabel, timeperiodRangesArray } from "@/helpers/timeFunctions/timeFunctions";

const today = new Date();

// Shared "period A vs period B" state for every /dashboard/history section.
// Before this, TabsTogglerMontlyController, HistoricalComparativeCategories,
// and HistoricalMovementsController each independently reimplemented this
// exact same timePeriod/comparePeriod/compareEnabled state - meaning the
// same page could silently show three different "current" periods at once
// if a user changed one section's dropdown without touching the others.
// HistoryClient owns a single instance and passes it to every section
// (including HistoricalWalletAnalyzer) so they always agree.
export default function usePeriodComparison() {
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  const [compareEnabled, setCompareEnabled] = useState(false);
  // Default: the same span the user is already looking at, shifted back
  // exactly one year - the most common comparison ("this vs. last year").
  const [comparePeriod, setComparePeriod] = useState(() => [
    new Date(timePeriod[0].getFullYear() - 1, timePeriod[0].getMonth(), timePeriod[0].getDate()),
    new Date(timePeriod[1].getFullYear() - 1, timePeriod[1].getMonth(), timePeriod[1].getDate()),
  ]);

  // Stable across the hook's lifetime (only depends on the module-level
  // `today`) - memoized so consumers can safely put it in an effect's
  // dependency array without a new array reference re-triggering it on
  // every render.
  const timePeriodsForSelecter = useMemo(
    () => [
      {
        value: `${new Date(today.getFullYear(), today.getMonth() - 2, 1)}*${today}`,
        name: "Last 3 months",
      },
      ...timeperiodRangesArray,
    ],
    []
  );

  function getValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setTimePeriod([dateStart, dateEnd]);
    }
  }

  function getCompareValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setComparePeriod([new Date(start), new Date(end)]);
  }

  function handleCompareRangeDate(dateStart, dateEnd) {
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
