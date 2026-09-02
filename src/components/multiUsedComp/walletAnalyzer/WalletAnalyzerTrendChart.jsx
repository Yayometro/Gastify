import React, { useRef, useState } from "react";
import { formatMoneyMajor } from "@/lib/money/currencies";

// Plain divs sized by inline style, same hand-rolled technique as
// CategoryTreemap's squarified treemap - no charting dependency needed for
// a 6-bar income-vs-expense comparison. The tooltip follows the actual
// cursor position (tracked via onMouseMove on the chart container, same
// technique as CategoryTreemap's cursor-following tooltip) instead of
// being pinned above whichever column is hovered.
function WalletAnalyzerTrendChart({ trend, walletPrimaryCurrency, onSelectMonth }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const maxValue = Math.max(1, ...trend.flatMap((m) => [m.income, m.expense]));
  // Transaction counts share the chart but not the currency scale, so
  // they get their own max to size against - a count bar sized against
  // peso amounts would be invisible next to real spend.
  const maxCount = Math.max(1, ...trend.map((m) => m.transactionCount));

  function handleMouseMove(e) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const TOOLTIP_WIDTH = 190;
  const tooltipLeft = Math.min(Math.max(cursor.x + 14, 0), (containerRef.current?.clientWidth || TOOLTIP_WIDTH) - TOOLTIP_WIDTH);

  return (
    <div ref={containerRef} className="relative" onMouseMove={handleMouseMove}>
      {hovered !== null && (
        <div
          className="absolute z-10 w-[190px] bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{ left: tooltipLeft, top: Math.max(cursor.y - 76, 0) }}
        >
          <p className="font-bold mb-1">{trend[hovered].label}</p>
          <p className="text-green-300">Ingresos: {formatMoneyMajor(trend[hovered].income, walletPrimaryCurrency)}</p>
          <p className="text-red-300">Gastos: {formatMoneyMajor(trend[hovered].expense, walletPrimaryCurrency)}</p>
          <p className="text-slate-300">
            {trend[hovered].transactionCount} transacci{trend[hovered].transactionCount === 1 ? "ón" : "ones"}
          </p>
        </div>
      )}
      <div className="flex items-end gap-3" style={{ height: 140 }}>
        {trend.map((month, i) => (
          <div
            key={month.label}
            className={`flex-1 flex flex-col items-center gap-1 h-full justify-end ${onSelectMonth ? "cursor-pointer" : ""}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            onClick={() => onSelectMonth?.(month)}
            role={onSelectMonth ? "button" : undefined}
            tabIndex={onSelectMonth ? 0 : undefined}
            onKeyDown={
              onSelectMonth
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectMonth(month);
                  }
                : undefined
            }
          >
            <div className="w-full flex items-end justify-center gap-1 cursor-default" style={{ height: 108 }}>
              <div
                className={`flex-1 max-w-[26px] rounded-t-sm transition-colors ${hovered === i ? "bg-green-500" : "bg-green-500/80"}`}
                style={{ height: `${Math.max(2, (month.income / maxValue) * 108)}px` }}
              />
              <div
                className={`flex-1 max-w-[26px] rounded-t-sm transition-colors ${hovered === i ? "bg-red-500" : "bg-red-500/80"}`}
                style={{ height: `${Math.max(2, (month.expense / maxValue) * 108)}px` }}
              />
              <div
                className={`flex-1 max-w-[26px] rounded-t-sm transition-colors ${hovered === i ? "bg-purple-500" : "bg-purple-400/70"}`}
                style={{ height: `${Math.max(2, (month.transactionCount / maxCount) * 108)}px` }}
              />
            </div>
            <span className={`text-[11px] font-semibold ${hovered === i ? "text-slate-700" : "text-slate-400"}`}>{month.shortLabel}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3.5 text-[11px] text-slate-500 mt-2.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-green-500/80" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500/80" /> Gastos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-purple-400/70" /> Transacciones
        </span>
      </div>
    </div>
  );
}

export default WalletAnalyzerTrendChart;
