"use client";

import React from "react";
import { Tooltip } from "antd";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import { accuracyTone, valueAccuracy, type AccuracyTone } from "@gastify/core/transformers/projectionAccuracy";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

// The colour is a hint only: the number is always written out, so the band
// is readable without colour (the tooltip explains the maths).
const TONE_CLASS: Record<AccuracyTone, string> = {
  good: "text-green-400 border-green-400/40 bg-green-400/10",
  warning: "text-amber-400 border-amber-400/50 bg-amber-400/10",
  poor: "text-red-400 border-red-400/50 bg-red-400/10",
};

export function formatAccuracy(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? "—" : `${Math.round(value)}%`;
}

export interface ProjectionPrecisionChipProps {
  value: number | null | undefined;
  label?: string;
  tooltip?: React.ReactNode;
}

// One accuracy value as a small chip. A null value (nothing to measure) shows a dash.
export function ProjectionPrecisionChip({ value, label, tooltip }: ProjectionPrecisionChipProps): React.JSX.Element {
  const body =
    value === null || value === undefined || !Number.isFinite(value) ? (
      <span className="text-gf-text-muted">—</span>
    ) : (
      <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-semibold whitespace-nowrap ${TONE_CLASS[accuracyTone(value)]}`}>
        {label && <span className="font-normal text-gf-text-muted">{label}</span>}
        {formatAccuracy(value)}
      </span>
    );
  if (!tooltip) return body;
  return (
    <Tooltip title={tooltip}>
      <span className="inline-flex cursor-help">{body}</span>
    </Tooltip>
  );
}

// The maths of one value written with the row's own numbers, so the percentage can be checked by hand.
export function singleValueFormulaTooltip(t: TranslateFn, label: string, projected: number, actual: number): React.ReactNode {
  const scale = Math.max(Math.abs(projected), Math.abs(actual));
  return (
    <>
      <div className="font-semibold">{label}</div>
      <div>
        {t("projections.precision.formula", {
          p1: usdFormatChanger(projected),
          p2: usdFormatChanger(actual),
          p3: usdFormatChanger(scale),
          p4: valueAccuracy(projected, actual).toFixed(1),
        })}
      </div>
    </>
  );
}

// The maths of a range or of the pooled global value, shown with its final percentage.
export function rangeFormulaTooltip(t: TranslateFn, label: string, percent: number | null): React.ReactNode {
  return (
    <>
      <div className="font-semibold">{label}</div>
      <div>{t("projections.precision.rangeFormula", { p1: percent === null ? "—" : percent.toFixed(1) })}</div>
    </>
  );
}
