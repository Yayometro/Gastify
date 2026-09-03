"use client";

import React from "react";
import { Tooltip } from "antd";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

// One line of a projected-vs-actual comparison: a label, the colored
// variance value, and a hover tooltip spelling out the actual subtraction
// with this row's own numbers. "Better" flips per label - more income is
// good, less expense is good - so the sign-to-color mapping is
// intentionally mirrored between an income line and an expense line (see
// ProjectionAccuracyInfoModal for the full explanation). Shared between
// ProjectionAccuracyReport (Projections page) and WalletAnalyzerProjectionCard
// (Wallet Analyzer) so the "why is one green and one red" explanation users
// are taught once doesn't need re-teaching with different wording in a
// second place.
function ProjectionVarianceCell({ label, actual, projected, value, betterWhenPositive }) {
  const isBetter = betterWhenPositive ? value >= 0 : value <= 0;
  const sign = value > 0 ? "+" : "";
  const verb = betterWhenPositive ? "ganaste" : "gastaste";
  const comparison = value >= 0 ? "más" : "menos";
  const verdict = isBetter ? "mejor de lo esperado" : "peor de lo esperado";
  const tooltip = (
    <>
      {label} real ({usdFormatChanger(actual)}) − {label.toLowerCase()} proyectado ({usdFormatChanger(projected)}) = {sign}{usdFormatChanger(value)}.
      <br />
      {verb.charAt(0).toUpperCase() + verb.slice(1)} {usdFormatChanger(Math.abs(value))} {comparison} de lo que proyectabas — {verdict}.
    </>
  );
  return (
    <Tooltip title={tooltip}>
      <span className="text-gray-500 cursor-help">
        {label}: <span className={isBetter ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{sign}{usdFormatChanger(value)}</span>
      </span>
    </Tooltip>
  );
}

export default ProjectionVarianceCell;
