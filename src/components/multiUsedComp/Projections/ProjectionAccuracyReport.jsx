"use client";

import React, { useState } from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import ProjectionAccuracyInfoModal from "./ProjectionAccuracyInfoModal";
import ProjectionVarianceCell from "./ProjectionVarianceCell";

// Precisión de proyecciones: proyectado (lo que se esperaba, fijado a como
// estaba el buffer al cierre de ese mes) vs. real, solo para meses cerrados
// que tienen al menos un registro de proyección. A diferencia de
// ProjectionsView (la tabla principal de 12 meses), esta es su propia
// sección porque solo aplica a un subconjunto de meses y necesita dos
// dimensiones numéricas por mes (proyectado y real) que no caben como una
// sola columna más en la tabla existente.
function ProjectionAccuracyReport({ rows, onRowClick }) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  if (!rows || rows.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <h2 className="text-purple-800 text-lg mb-2 flex items-center">
        Precisión de tus proyecciones
        <div
          className="inline-block ml-1 align-middle cursor-pointer text-purple-500"
          onClick={() => setShowInfoModal(true)}
        >
          <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={14} />
        </div>
      </h2>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] text-center bg-white rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="py-2 px-3">Mes</th>
              <th className="py-2 px-3">Ingreso proyectado</th>
              <th className="py-2 px-3">Ingreso real</th>
              <th className="py-2 px-3">Gasto proyectado</th>
              <th className="py-2 px-3">Gasto real</th>
              <th className="py-2 px-3">Desajuste</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.monthName}
                className="capitalize cursor-pointer hover:bg-purple-50 border-b border-purple-100"
                onClick={() => onRowClick(row.monthName)}
              >
                <td className="py-2 px-3">{row.monthName}</td>
                <td className="py-2 px-3 text-gray-500">{usdFormatChanger(row.projectedIncome)}</td>
                <td className="py-2 px-3 text-green-700">{usdFormatChanger(row.actualIncome)}</td>
                <td className="py-2 px-3 text-gray-500">{usdFormatChanger(row.projectedExpense)}</td>
                <td className="py-2 px-3 text-red-700">{usdFormatChanger(row.actualExpense)}</td>
                <td className="py-2 px-3">
                  <div className="flex flex-col leading-tight text-xs items-start mx-auto w-fit">
                    <ProjectionVarianceCell
                      label="Ingreso"
                      actual={row.actualIncome}
                      projected={row.projectedIncome}
                      value={row.varianceIncome}
                      betterWhenPositive
                    />
                    <ProjectionVarianceCell
                      label="Gasto"
                      actual={row.actualExpense}
                      projected={row.projectedExpense}
                      value={row.varianceExpense}
                      betterWhenPositive={false}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2 px-1">
        Solo se muestran meses cerrados con un historial de proyección registrado.
      </p>
      {showInfoModal && <ProjectionAccuracyInfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}

export default ProjectionAccuracyReport;
