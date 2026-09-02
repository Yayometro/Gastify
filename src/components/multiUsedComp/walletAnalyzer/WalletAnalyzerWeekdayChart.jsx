import React, { useState } from "react";
import { formatMoneyMajor } from "@/lib/money/currencies";

const SHORT_LABELS = { Lunes: "Lun", Martes: "Mar", Miércoles: "Mié", Jueves: "Jue", Viernes: "Vie", Sábado: "Sáb", Domingo: "Dom" };

// Same hand-rolled div-bar + hover-tooltip technique as
// WalletAnalyzerTrendChart.jsx, single series instead of paired.
function WalletAnalyzerWeekdayChart({ days, walletPrimaryCurrency }) {
  const [hovered, setHovered] = useState(null);
  const maxValue = Math.max(1, ...days.map((d) => d.avgPerOccurrence));

  return (
    <div className="flex items-end gap-3" style={{ height: 140 }}>
      {days.map((day, i) => (
        <div
          key={day.dayName}
          className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
        >
          {hovered === i && (
            <div className="absolute bottom-full mb-2 z-10 w-max max-w-[200px] bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg pointer-events-none">
              <p className="font-bold mb-1">{day.dayName}</p>
              <p>Promedio: {formatMoneyMajor(day.avgPerOccurrence, walletPrimaryCurrency)}</p>
              <p className="text-slate-300">
                Total: {formatMoneyMajor(day.total, walletPrimaryCurrency)} · {day.count} transacci{day.count === 1 ? "ón" : "ones"}
              </p>
            </div>
          )}
          <div className="w-full flex items-end justify-center" style={{ height: 108 }}>
            <div
              className={`w-full max-w-[36px] rounded-t-sm transition-colors ${hovered === i ? "bg-purple-600" : "bg-purple-500/70"}`}
              style={{ height: `${Math.max(2, (day.avgPerOccurrence / maxValue) * 108)}px` }}
            />
          </div>
          <span className={`text-[11px] font-semibold ${hovered === i ? "text-slate-700" : "text-slate-400"}`}>{SHORT_LABELS[day.dayName]}</span>
        </div>
      ))}
    </div>
  );
}

export default WalletAnalyzerWeekdayChart;
