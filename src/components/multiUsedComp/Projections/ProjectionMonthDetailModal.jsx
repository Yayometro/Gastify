"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Spin } from "antd";
import CategoIcon from "../CategoIcon";
import runNotify from "@/helpers/gastifyNotifier";

const Column = dynamic(() => import("@ant-design/plots").then((m) => m.Column), {
  ssr: false,
});

function ProjectionMonthDetailModal({
  monthRow,
  bucketBreakdown,
  incomeOccurrences,
  unexpectedBuffer,
  onSaveBuffer,
  onClose,
}) {
  const [bufferValue, setBufferValue] = useState(unexpectedBuffer ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  if (!monthRow) return null;

  const chartData = (bucketBreakdown || []).flatMap((row) => [
    { label: row.label, type: "Budgeted", value: row.budgeted },
    { label: row.label, type: "Actual", value: row.actual },
  ]);

  const config = {
    data: chartData,
    xField: "label",
    yField: "value",
    colorField: "type",
    group: true,
    autoFit: true,
    height: 260,
  };

  const handleSaveBuffer = async () => {
    try {
      setIsSaving(true);
      await onSaveBuffer(Number(bufferValue));
      runNotify("ok", "Unexpected buffer updated");
    } catch (e) {
      runNotify("error", String(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[1000] bg-white/10 backdrop-blur-sm flex items-center justify-center">
      <div className="content bg-white border-2 border-purple-400 flex flex-col w-[95%] max-w-[650px] max-h-[85vh] overflow-y-auto relative rounded-2xl px-6 pt-8 pb-6">
        <div
          className="absolute top-3 right-3 border-2 rounded-full text-purple-700 p-1 cursor-pointer"
          onClick={onClose}
        >
          <CategoIcon type="MdClose" siz={20} />
        </div>
        <h1 className="text-2xl text-purple-800 capitalize mb-1">
          {monthRow.monthName} {monthRow.year}
        </h1>
        <p className="text-xs text-gray-500 mb-4">
          {monthRow.type === "actual" && "Closed month — showing real transactions."}
          {monthRow.type === "estimate" && "Future month — pure estimate from your Budgets and Income Sources."}
          {monthRow.type === "current" && "Current month — projected value climbs from your estimate to your real spend as it happens."}
        </p>

        {monthRow.type === "current" && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="bg-purple-50 rounded-xl p-2">
              <p className="text-gray-500">Income</p>
              <p className="text-lg text-purple-800">${monthRow.projectedIncome?.toFixed(2)}</p>
              <p className="text-xs text-gray-400">
                real so far: ${monthRow.actualIncome?.toFixed(2)} / expected: ${monthRow.shadowIncome?.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-2">
              <p className="text-gray-500">Expense</p>
              <p className="text-lg text-purple-800">${monthRow.projectedExpense?.toFixed(2)}</p>
              <p className="text-xs text-gray-400">
                real so far: ${monthRow.actualExpense?.toFixed(2)} / budgeted: ${monthRow.shadowExpense?.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {bucketBreakdown && bucketBreakdown.length > 0 && (
          <div className="w-full mb-4">
            <Column {...config} />
          </div>
        )}

        {incomeOccurrences && incomeOccurrences.length > 0 && (
          <div className="w-full mb-4">
            <h2 className="text-purple-800 mb-1">Expected income this month</h2>
            <ul className="flex flex-col gap-1">
              {incomeOccurrences.map((row, i) => (
                <li key={i} className="flex justify-between text-sm bg-purple-50 rounded-xl px-3 py-1">
                  <span>{row.name}</span>
                  <span>
                    {row.occurrences} × ${row.amount} = ${(row.occurrences * row.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="w-full flex items-end gap-2 mt-2">
          <div className="flex flex-col flex-1">
            <label className="text-xs text-gray-500">Unexpected / other buffer</label>
            <input
              type="number"
              value={bufferValue}
              onChange={(e) => setBufferValue(e.target.value)}
            />
          </div>
          <button
            className="bg-purple-600 text-white rounded-full px-4 py-2 hover:bg-purple-500"
            onClick={handleSaveBuffer}
          >
            {isSaving ? <Spin /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectionMonthDetailModal;
