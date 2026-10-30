"use client";
import React from "react";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import ProjectionVarianceCell from "../Projections/ProjectionVarianceCell";
import type { ProjectionComparisonData } from "./WalletAnalyzerView";

import TutorialTip from "@/components/tour/TutorialTip";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { monthAccuracy } from "@gastify/core/transformers/projectionAccuracy";
import { ProjectionPrecisionChip, rangeFormulaTooltip, singleValueFormulaTooltip } from "../Projections/ProjectionPrecisionChip";
import { useInfo, useT } from "@/i18n/client";

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
  // Accuracy only for a closed month: the month in progress has not finished yet.
  const accuracy = isInProgress
    ? null
    : monthAccuracy({
        projectedIncome: comparison.projectedIncome,
        actualIncome: comparison.actualIncome,
        projectedExpense: comparison.projectedExpense,
        actualExpense: comparison.actualExpense,
      });
  const actualColumnLabel = isInProgress ? t("web.actual.to.date") : t("analyzer.table.actual");

  return (
    <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5" data-tour="ana-projection">
      <div className="mb-0.5 flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{t("analyzer.projectedVsActual")}</p><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="anaProjection" label={t("tour.anaProjection.name")} /></div>
      <p className="text-xs text-gf-text-muted mb-4">
        {isInProgress
          ? t("web.this.month.is.still.in.progress.compared.against.what.wa")
          : t("web.what.you.projected.for.this.month.against.what.actually")}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4" data-tour="ana-projection-cards">
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

      <div className="flex flex-col gap-1 text-xs" data-tour="ana-projection-gap">
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

      <div className="mt-4 border-t border-gf-border pt-3" data-tour="ana-projection-accuracy">
        <div className="mb-2 flex items-center gap-1.5">
          <p className="text-[13px] font-bold text-gf-text">{t("projections.precision.title")}</p>
          <span aria-hidden="true" className="mx-2 inline-block h-4 w-px shrink-0 align-middle bg-purple-300/40" />
          <InfoTip info={APP_INFO.precision_de_proyecciones} />
          <TutorialTip tour="anaProjection" label={t("tour.anaProjection.name")} />
        </div>
        {accuracy ? (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <ProjectionPrecisionChip
                value={accuracy.income}
                label={t("analyzer.income")}
                tooltip={singleValueFormulaTooltip(t, t("analyzer.income"), comparison.projectedIncome, comparison.actualIncome)}
              />
              <ProjectionPrecisionChip
                value={accuracy.expense}
                label={t("analyzer.bill")}
                tooltip={singleValueFormulaTooltip(t, t("analyzer.bill"), comparison.projectedExpense, comparison.actualExpense)}
              />
              <ProjectionPrecisionChip
                value={accuracy.global}
                label={t("projections.precision.global")}
                tooltip={rangeFormulaTooltip(t, t("projections.precision.global"), accuracy.global)}
              />
            </div>
            <p className="mt-2 text-xs text-gf-text-muted">{t("projections.precision.monthSentence")}</p>
          </>
        ) : (
          <p className="text-xs text-gf-text-muted">{t("projections.precision.inProgress")}</p>
        )}
      </div>
    </div>
  );
}

export default WalletAnalyzerProjectionCard;
