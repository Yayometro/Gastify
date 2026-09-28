"use client";
import React from "react";
import { Modal } from "antd";
import dayjs from "dayjs";
import { formatMoneyMajor } from "@/lib/money/currencies";

interface MonthRowProps {
  label: React.ReactNode;
  right: React.ReactNode;
  met?: boolean;
}

function MonthRow({ label, right, met }: MonthRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-t border-gf-border first:border-t-0 text-[13px]">
      <span className="text-gf-text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-gf-text">{right}</span>
        {met !== undefined && <span className={met ? "text-green-400" : "text-red-500"}>{met ? "✓" : "✗"}</span>}
      </span>
    </div>
  );
}

export interface BudgetInsightDetailData {
  limit: number;
  category?: string;
  streakMonths?: number;
  monthlySeries?: {
    label: string;
    actual: number;
    goal: number;
    met?: boolean;
  }[];
  [key: string]: unknown;
}

export interface CategoryAnomalyInsightDetailData {
  monthlyTotals?: {
    label: string;
    amount: number;
  }[];
  average: number;
  current: number;
  [key: string]: unknown;
}

export interface SubscriptionInsightDetailData {
  categoryName?: string;
  occurrences?: {
    date: string | Date;
    amount: number;
  }[];
  [key: string]: unknown;
}

export interface MonthlyAverageInsightDetailData {
  trend?: {
    label: string;
    income: number;
    expense: number;
    transactionCount: number;
  }[];
  avgIncome: number;
  avgExpense: number;
  avgTransactionCount?: number;
  [key: string]: unknown;
}

export interface TrendMonthInsightDetailData {
  label: string;
  income: number;
  expense: number;
  transactionCount: number;
  [key: string]: unknown;
}

export interface SavingsRateInsightDetailData {
  savingsHistoryLabeled?: {
    label: string;
    rate: number;
  }[];
  [key: string]: unknown;
}

export interface PeakMonthInsightDetailData {
  peakMonth: {
    label: string;
    total: number;
    biggestCategory?: {
      name: string;
      total: number;
    };
    biggestTransaction?: {
      name: string;
      amount: number;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PeakMonthVsPreviousInsightDetailData {
  current: {
    label: string;
    total: number;
    [key: string]: unknown;
  };
  previous: {
    label: string;
    total: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PeakQuarterInsightDetailData {
  peakQuarter: {
    label: string;
    months: {
      label: string;
      total: number;
      [key: string]: unknown;
    }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SpendingPaceInsightDetailData {
  dayOfMonth: number;
  monthlyDetail?: {
    label: string;
    throughDay: number;
    amount: number;
  }[];
  spentSoFar: number;
  [key: string]: unknown;
}

export interface InsightDetailItem {
  type?: string;
  data?: unknown;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "warning" | "positive" | "info" | string;
  [key: string]: unknown;
}

export interface InsightDetailModalProps {
  insight: InsightDetailItem | null | undefined;
  onClose: () => void;
  walletPrimaryCurrency?: string;
}

// One shared "why" modal for every insight type, plus synthetic
// insight-shaped objects built at click time from a budget row or the
// spending-pace card - same body renderers, different `data`.
function InsightDetailModal({ insight, onClose, walletPrimaryCurrency }: InsightDetailModalProps) {
  if (!insight) return null;
  const { type, data, title, icon } = insight;

  let explanation: React.ReactNode = null;
  let rows: React.ReactNode[] = [];

  if (type === "budget") {
    const d = data as BudgetInsightDetailData;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        Presupuesto mensual de {formatMoneyMajor(d.limit, walletPrimaryCurrency)} para <b>{d.category}</b>.
        {" "}Racha actual: <b>{d.streakMonths}</b> mes{d.streakMonths === 1 ? "" : "es"} bajo presupuesto.
      </p>
    );
    rows = (d.monthlySeries || []).map((m) => (
      <MonthRow
        key={m.label}
        label={m.label}
        right={`${formatMoneyMajor(m.actual, walletPrimaryCurrency)} / ${formatMoneyMajor(m.goal, walletPrimaryCurrency)}`}
        met={m.met}
      />
    ));
  } else if (type === "category_anomaly") {
    const d = data as CategoryAnomalyInsightDetailData;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        Promedio de los últimos {d.monthlyTotals?.length || 6} meses (sin contar este mes):{" "}
        <b>{formatMoneyMajor(d.average, walletPrimaryCurrency)}</b>. Se necesitan al menos 3 meses de historial para
        calcularlo.
      </p>
    );
    rows = [
      ...(d.monthlyTotals || []).map((m) => (
        <MonthRow key={m.label} label={m.label} right={formatMoneyMajor(m.amount, walletPrimaryCurrency)} />
      )),
      <MonthRow key="current" label="Este mes" right={formatMoneyMajor(d.current, walletPrimaryCurrency)} />,
    ];
  } else if (type === "subscription") {
    const d = data as SubscriptionInsightDetailData;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        Detectada porque el mismo nombre se repite en al menos 2 de los últimos 3 meses con un monto que varía menos
        de 15% — categoría <b>{d.categoryName}</b>.
      </p>
    );
    rows = (d.occurrences || []).map((o, i) => (
      <MonthRow key={i} label={dayjs(o.date).format("DD MMM YYYY")} right={formatMoneyMajor(o.amount, walletPrimaryCurrency)} />
    ));
  } else if (type === "monthly_average") {
    const d = data as MonthlyAverageInsightDetailData;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        Promedio de los últimos {d.trend?.length || 6} meses: <b>{formatMoneyMajor(d.avgIncome, walletPrimaryCurrency)}</b> de
        ingresos, <b>{formatMoneyMajor(d.avgExpense, walletPrimaryCurrency)}</b> de gastos, y{" "}
        <b>{Math.round(d.avgTransactionCount || 0)}</b> transacciones por mes.
      </p>
    );
    rows = (d.trend || []).map((m) => (
      <MonthRow
        key={m.label}
        label={m.label}
        right={`${formatMoneyMajor(m.income, walletPrimaryCurrency)} / ${formatMoneyMajor(m.expense, walletPrimaryCurrency)} / ${m.transactionCount} txn`}
      />
    ));
  } else if (type === "trend_month") {
    const d = data as TrendMonthInsightDetailData;
    explanation = <p className="text-xs text-gf-text-muted mb-3">Detalle de {d.label} — útil en pantallas donde no hay hover, como celular.</p>;
    rows = [
      <MonthRow key="income" label="Ingresos" right={formatMoneyMajor(d.income, walletPrimaryCurrency)} />,
      <MonthRow key="expense" label="Gastos" right={formatMoneyMajor(d.expense, walletPrimaryCurrency)} />,
      <MonthRow key="balance" label="Balance" right={formatMoneyMajor(d.income - d.expense, walletPrimaryCurrency)} />,
      <MonthRow key="count" label="Transacciones" right={String(d.transactionCount)} />,
    ];
  } else if (type === "savings_rate") {
    const d = data as SavingsRateInsightDetailData;
    explanation = <p className="text-xs text-gf-text-muted mb-3">Tasa de ahorro = balance del mes ÷ ingresos del mes.</p>;
    rows = (d.savingsHistoryLabeled || []).map((m) => (
      <MonthRow key={m.label} label={m.label} right={`${Math.round(m.rate * 100)}%`} />
    ));
  } else if (type === "peak_month") {
    const d = data as PeakMonthInsightDetailData;
    const m = d.peakMonth;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        De todos los meses dentro de este periodo, <b>{m.label}</b> fue el que más gasto acumuló.
      </p>
    );
    rows = [
      <MonthRow key="total" label={m.label} right={formatMoneyMajor(m.total, walletPrimaryCurrency)} />,
      ...(m.biggestCategory ? [<MonthRow key="cat" label="Categoría con más gasto" right={`${m.biggestCategory.name} — ${formatMoneyMajor(m.biggestCategory.total, walletPrimaryCurrency)}`} />] : []),
      ...(m.biggestTransaction ? [<MonthRow key="txn" label="Transacción más grande" right={`${m.biggestTransaction.name} — ${formatMoneyMajor(m.biggestTransaction.amount, walletPrimaryCurrency)}`} />] : []),
    ];
  } else if (type === "peak_month_vs_previous") {
    const d = data as PeakMonthVsPreviousInsightDetailData;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        Comparación entre el mes de mayor gasto de este periodo y el del periodo anterior equivalente.
      </p>
    );
    rows = [
      <MonthRow key="current" label={`Este periodo — ${d.current.label}`} right={formatMoneyMajor(d.current.total, walletPrimaryCurrency)} />,
      <MonthRow key="previous" label={`Periodo anterior — ${d.previous.label}`} right={formatMoneyMajor(d.previous.total, walletPrimaryCurrency)} />,
    ];
  } else if (type === "peak_quarter") {
    const d = data as PeakQuarterInsightDetailData;
    const q = d.peakQuarter;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        De todos los trimestres dentro de este periodo, <b>{q.label}</b> fue el que más gasto acumuló.
      </p>
    );
    rows = q.months.map((m) => <MonthRow key={m.label} label={m.label} right={formatMoneyMajor(m.total, walletPrimaryCurrency)} />);
  } else if (type === "spending_pace") {
    const d = data as SpendingPaceInsightDetailData;
    explanation = (
      <p className="text-xs text-gf-text-muted mb-3">
        Compara cuánto llevas gastado este mes (al día {d.dayOfMonth}) contra cuánto habías gastado, para ese mismo
        día del mes, en cada uno de los últimos {d.monthlyDetail?.length || 6} meses.
      </p>
    );
    rows = [
      ...(d.monthlyDetail || []).map((m) => (
        <MonthRow key={m.label} label={`${m.label} (día ${m.throughDay})`} right={formatMoneyMajor(m.amount, walletPrimaryCurrency)} />
      )),
      <MonthRow key="current" label={`Este mes (día ${d.dayOfMonth})`} right={formatMoneyMajor(d.spentSoFar, walletPrimaryCurrency)} />,
    ];
  }

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      className="gf-antd-modal-glass"
      zIndex={20000}
      title={
        <div className="flex items-center gap-2 text-purple-300 font-semibold text-base">
          <span>{icon}</span>
          {title}
        </div>
      }
    >
      {explanation}
      <div className="flex flex-col max-h-[360px] overflow-y-auto pr-1">{rows}</div>
    </Modal>
  );
}

export default InsightDetailModal;
