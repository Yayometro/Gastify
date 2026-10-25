"use client";
import React from "react";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import ProjectionVarianceCell from "../Projections/ProjectionVarianceCell";
import type { ProjectionComparisonData } from "./WalletAnalyzerView";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { useT, useInfo } from "@/i18n/client";

// Typed bridge for unmigrated ProjectionVarianceCell
interface ProjectionVarianceCellProps {
  label: string;
  actual: number;
  projected: number;
  value: number;
  betterWhenPositive?: boolean;
}
const TypedProjectionVarianceCell = ProjectionVarianceCell as React.ComponentType<ProjectionVarianceCellProps>;

export interface WalletAnalyzerProjectionCardProps {
  comparison?: ProjectionComparisonData | null;
  walletPrimaryCurrency?: string;
}

// Proyectado vs. Real for whichever month Wallet Analyzer's stepper is
// currently showing - the same comparison Projections' "Precisión de tus
// proyecciones" already computes (buildProjectionComparisonForMonth reuses
// buildYearProjectionTable entirely, no new math), just surfaced here since
// this is where the user actually spends time looking at one month closely.
// Renders nothing when `comparison` is null: either a future month (hasn't
// happened yet) or a closed month with no buffer/baseline data recorded.
function WalletAnalyzerProjectionCard({ comparison, walletPrimaryCurrency }: WalletAnalyzerProjectionCardProps) {
  const { APP_INFO } = useInfo();
  const t = useT();
  if (!comparison) return null;

  const varianceIncome = comparison.actualIncome - comparison.projectedIncome;
  const varianceExpense = comparison.actualExpense - comparison.projectedExpense;
  const isInProgress = comparison.type === "in-progress";
  const actualColumnLabel = isInProgress ? t("web.actual.to.date") : t("analyzer.table.actual");

  return (
    <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
      <div className="mb-0.5 flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{t("analyzer.projectedVsActual")}</p><InfoTip info={APP_INFO.proyecci_n_del_mes} /></div>
      <p className="text-xs text-gf-text-muted mb-4">
        {isInProgress
          ? t("web.this.month.is.still.in.progress.compared.against.what.wa")
          : t("web.what.you.projected.for.this.month.against.what.actually")}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gf-accent-soft-bg rounded-xl p-3">
          <p className="text-xs text-gf-text-muted mb-1">{t("analyzer.income")}</p>
          <p className="text-xs text-gf-text-muted">{t("analyzer.projected", { p1: formatMoneyMajor(comparison.projectedIncome, walletPrimaryCurrency) })}</p>
          <p className="text-sm font-semibold text-green-400">{actualColumnLabel}: {formatMoneyMajor(comparison.actualIncome, walletPrimaryCurrency)}</p>
        </div>
        <div className="bg-gf-accent-soft-bg rounded-xl p-3">
          <p className="text-xs text-gf-text-muted mb-1">{t("analyzer.bill")}</p>
          <p className="text-xs text-gf-text-muted">{t("analyzer.projected", { p1: formatMoneyMajor(comparison.projectedExpense, walletPrimaryCurrency) })}</p>
          <p className="text-sm font-semibold text-red-400">{actualColumnLabel}: {formatMoneyMajor(comparison.actualExpense, walletPrimaryCurrency)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <TypedProjectionVarianceCell
          label={t("analyzer.income")}
          actual={comparison.actualIncome}
          projected={comparison.projectedIncome}
          value={varianceIncome}
          betterWhenPositive
        />
        <TypedProjectionVarianceCell
          label={t("analyzer.bill")}
          actual={comparison.actualExpense}
          projected={comparison.projectedExpense}
          value={varianceExpense}
          betterWhenPositive={false}
        />
      </div>
    </div>
  );
}

export default WalletAnalyzerProjectionCard;
