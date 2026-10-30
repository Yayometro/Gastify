"use client";
import React from "react";
import type { WalletAnalyzerWeeklySpending } from "@gastify/core/transformers/walletAnalyzer";
import type { SpendingDay } from "@gastify/core/transformers/spendingWeeksCalendar";
import WalletAnalyzerWeekdayChart, { type WalletAnalyzerWeekdayDay } from "./WalletAnalyzerWeekdayChart";

export interface WeekdayPatternCardBodyProps {
  weekly?: WalletAnalyzerWeeklySpending;
  days: WalletAnalyzerWeekdayDay[];
  daily?: SpendingDay[];
  walletPrimaryCurrency?: string;
}

// The body of the weekday-pattern card: only the Monday-Sunday bars. The weekly bars, the spend calendar and the
// day-by-day detail live in the detail window that opens from the card.
export default function WeekdayPatternCardBody({ days, walletPrimaryCurrency }: WeekdayPatternCardBodyProps): React.JSX.Element {
  return (
    <div data-tour="ana-weekday-chart">
      <WalletAnalyzerWeekdayChart days={days} walletPrimaryCurrency={walletPrimaryCurrency} />
    </div>
  );
}
