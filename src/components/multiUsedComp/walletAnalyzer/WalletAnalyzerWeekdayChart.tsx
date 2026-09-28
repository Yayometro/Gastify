import React, { useState } from "react";
import { formatMoneyMajor } from "@/lib/money/currencies";

export interface WalletAnalyzerWeekdayDay {
  dayName: string;
  avgPerOccurrence: number;
  total: number;
  count: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayChartProps {
  days: WalletAnalyzerWeekdayDay[];
  walletPrimaryCurrency?: string;
}

const SHORT_LABELS: Record<string, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miércoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
  Sábado: "Sáb",
  Domingo: "Dom",
};

// Same hand-rolled div-bar + hover-tooltip technique as
// WalletAnalyzerTrendChart.jsx, single series instead of paired.
function WalletAnalyzerWeekdayChart({ days, walletPrimaryCurrency }: WalletAnalyzerWeekdayChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
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
            <div className="absolute bottom-full mb-2 z-10 w-max max-w-[200px] bg-gf-surface-2 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg pointer-events-none">
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
          <span className={`text-[11px] font-semibold ${hovered === i ? "text-gf-text-muted" : "text-gf-text-muted"}`}>{SHORT_LABELS[day.dayName]}</span>
        </div>
      ))}
    </div>
  );
}

export default WalletAnalyzerWeekdayChart;
