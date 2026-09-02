"use client";
import React from "react";
import { Modal } from "antd";
import dayjs from "dayjs";
import { formatMoneyMajor } from "@/lib/money/currencies";

function MonthRow({ label, right, met }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-t border-slate-100 first:border-t-0 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-slate-800">{right}</span>
        {met !== undefined && <span className={met ? "text-green-600" : "text-red-500"}>{met ? "✓" : "✗"}</span>}
      </span>
    </div>
  );
}

// One shared "why" modal for every insight type, plus synthetic
// insight-shaped objects built at click time from a budget row or the
// spending-pace card - same body renderers, different `data`.
function InsightDetailModal({ insight, onClose, walletPrimaryCurrency }) {
  if (!insight) return null;
  const { type, data, title, icon } = insight;

  let explanation = null;
  let rows = [];

  if (type === "budget") {
    explanation = (
      <p className="text-xs text-slate-500 mb-3">
        Presupuesto mensual de {formatMoneyMajor(data.limit, walletPrimaryCurrency)} para <b>{data.category}</b>.
        {" "}Racha actual: <b>{data.streakMonths}</b> mes{data.streakMonths === 1 ? "" : "es"} bajo presupuesto.
      </p>
    );
    rows = (data.monthlySeries || []).map((m) => (
      <MonthRow
        key={m.label}
        label={m.label}
        right={`${formatMoneyMajor(m.actual, walletPrimaryCurrency)} / ${formatMoneyMajor(m.goal, walletPrimaryCurrency)}`}
        met={m.met}
      />
    ));
  } else if (type === "category_anomaly") {
    explanation = (
      <p className="text-xs text-slate-500 mb-3">
        Promedio de los últimos {data.monthlyTotals?.length || 6} meses (sin contar este mes):{" "}
        <b>{formatMoneyMajor(data.average, walletPrimaryCurrency)}</b>. Se necesitan al menos 3 meses de historial para
        calcularlo.
      </p>
    );
    rows = [
      ...(data.monthlyTotals || []).map((m) => (
        <MonthRow key={m.label} label={m.label} right={formatMoneyMajor(m.amount, walletPrimaryCurrency)} />
      )),
      <MonthRow key="current" label="Este mes" right={formatMoneyMajor(data.current, walletPrimaryCurrency)} />,
    ];
  } else if (type === "subscription") {
    explanation = (
      <p className="text-xs text-slate-500 mb-3">
        Detectada porque el mismo nombre se repite en al menos 2 de los últimos 3 meses con un monto que varía menos
        de 15% — categoría <b>{data.categoryName}</b>.
      </p>
    );
    rows = (data.occurrences || []).map((o, i) => (
      <MonthRow key={i} label={dayjs(o.date).format("DD MMM YYYY")} right={formatMoneyMajor(o.amount, walletPrimaryCurrency)} />
    ));
  } else if (type === "monthly_average") {
    explanation = (
      <p className="text-xs text-slate-500 mb-3">
        Promedio de los últimos {data.trend?.length || 6} meses: <b>{formatMoneyMajor(data.avgIncome, walletPrimaryCurrency)}</b> de
        ingresos, <b>{formatMoneyMajor(data.avgExpense, walletPrimaryCurrency)}</b> de gastos, y{" "}
        <b>{Math.round(data.avgTransactionCount || 0)}</b> transacciones por mes.
      </p>
    );
    rows = (data.trend || []).map((m) => (
      <MonthRow
        key={m.label}
        label={m.label}
        right={`${formatMoneyMajor(m.income, walletPrimaryCurrency)} / ${formatMoneyMajor(m.expense, walletPrimaryCurrency)} / ${m.transactionCount} txn`}
      />
    ));
  } else if (type === "trend_month") {
    explanation = <p className="text-xs text-slate-500 mb-3">Detalle de {data.label} — útil en pantallas donde no hay hover, como celular.</p>;
    rows = [
      <MonthRow key="income" label="Ingresos" right={formatMoneyMajor(data.income, walletPrimaryCurrency)} />,
      <MonthRow key="expense" label="Gastos" right={formatMoneyMajor(data.expense, walletPrimaryCurrency)} />,
      <MonthRow key="balance" label="Balance" right={formatMoneyMajor(data.income - data.expense, walletPrimaryCurrency)} />,
      <MonthRow key="count" label="Transacciones" right={String(data.transactionCount)} />,
    ];
  } else if (type === "savings_rate") {
    explanation = <p className="text-xs text-slate-500 mb-3">Tasa de ahorro = balance del mes ÷ ingresos del mes.</p>;
    rows = (data.savingsHistoryLabeled || []).map((m) => (
      <MonthRow key={m.label} label={m.label} right={`${Math.round(m.rate * 100)}%`} />
    ));
  } else if (type === "spending_pace") {
    explanation = (
      <p className="text-xs text-slate-500 mb-3">
        Compara cuánto llevas gastado este mes (al día {data.dayOfMonth}) contra cuánto habías gastado, para ese mismo
        día del mes, en cada uno de los últimos {data.monthlyDetail?.length || 6} meses.
      </p>
    );
    rows = [
      ...(data.monthlyDetail || []).map((m) => (
        <MonthRow key={m.label} label={`${m.label} (día ${m.throughDay})`} right={formatMoneyMajor(m.amount, walletPrimaryCurrency)} />
      )),
      <MonthRow key="current" label={`Este mes (día ${data.dayOfMonth})`} right={formatMoneyMajor(data.spentSoFar, walletPrimaryCurrency)} />,
    ];
  }

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-base">
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
