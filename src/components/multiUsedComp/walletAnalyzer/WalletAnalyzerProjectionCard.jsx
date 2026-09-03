"use client";
import React from "react";
import { formatMoneyMajor } from "@/lib/money/currencies";
import ProjectionVarianceCell from "../Projections/ProjectionVarianceCell";

// Proyectado vs. Real for whichever month Wallet Analyzer's stepper is
// currently showing - the same comparison Projections' "Precisión de tus
// proyecciones" already computes (buildProjectionComparisonForMonth reuses
// buildYearProjectionTable entirely, no new math), just surfaced here since
// this is where the user actually spends time looking at one month closely.
// Renders nothing when `comparison` is null: either a future month (hasn't
// happened yet) or a closed month with no buffer/baseline data recorded.
function WalletAnalyzerProjectionCard({ comparison, walletPrimaryCurrency }) {
  if (!comparison) return null;

  const varianceIncome = comparison.actualIncome - comparison.projectedIncome;
  const varianceExpense = comparison.actualExpense - comparison.projectedExpense;
  const isInProgress = comparison.type === "in-progress";
  const actualColumnLabel = isInProgress ? "Real hasta hoy" : "Real";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
      <p className="text-[15px] font-extrabold text-slate-800 mb-0.5">Proyectado vs. Real</p>
      <p className="text-xs text-slate-400 mb-4">
        {isInProgress
          ? "Este mes sigue en curso - comparado contra lo esperado hasta ahora."
          : "Lo que proyectabas para este mes contra lo que realmente pasó."}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Ingreso</p>
          <p className="text-xs text-gray-400">Proyectado: {formatMoneyMajor(comparison.projectedIncome, walletPrimaryCurrency)}</p>
          <p className="text-sm font-semibold text-green-700">{actualColumnLabel}: {formatMoneyMajor(comparison.actualIncome, walletPrimaryCurrency)}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Gasto</p>
          <p className="text-xs text-gray-400">Proyectado: {formatMoneyMajor(comparison.projectedExpense, walletPrimaryCurrency)}</p>
          <p className="text-sm font-semibold text-red-700">{actualColumnLabel}: {formatMoneyMajor(comparison.actualExpense, walletPrimaryCurrency)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <ProjectionVarianceCell
          label="Ingreso"
          actual={comparison.actualIncome}
          projected={comparison.projectedIncome}
          value={varianceIncome}
          betterWhenPositive
        />
        <ProjectionVarianceCell
          label="Gasto"
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
