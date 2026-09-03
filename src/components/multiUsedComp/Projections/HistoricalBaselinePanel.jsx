"use client";

import React, { useState } from "react";
import { ConfigProvider, DatePicker, Spin } from "antd";
import esES from "antd/locale/es_ES";
import dayjs from "dayjs";
import "dayjs/locale/es";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import { formatMoneyMajor, minorToMajor, SUPPORTED_CURRENCIES, CURRENCY_META } from "@/lib/money/currencies";

function formatMonthYear(date) {
  return new Date(date).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

const pickerTheme = { token: { colorPrimary: "#9333ea", borderRadius: 999 } };

// One independent income OR expense timeline - income and expense are never
// forced to change together (a raise doesn't imply rent changed that same
// month), so each gets its own list + its own "add a period" mini-form,
// hitting the same kind-discriminated update/delete endpoints. Periods are
// additive (see ProjectionBaseline.js): two overlapping entries - e.g. two
// simultaneous jobs - both count toward that month's total, so leaving
// "Hasta" empty just means "still ongoing" rather than replacing an earlier
// entry.
function BaselineTimelineEditor({ kind, label, placeholder, entries, moneyField, walletPrimaryCurrency, mail, onChange }) {
  const defaultCurrency = walletPrimaryCurrency || "MXN";
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [effectiveFrom, setEffectiveFrom] = useState(null);
  const [effectiveTo, setEffectiveTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const toFetch = fetcher();

  const sorted = [...(entries || [])].sort((a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom));

  const resetForm = () => {
    setEditingId(null);
    setEffectiveFrom(null);
    setEffectiveTo(null);
    setAmount("");
    setCurrency(defaultCurrency);
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEffectiveFrom(dayjs(entry.effectiveFrom));
    setEffectiveTo(entry.effectiveTo ? dayjs(entry.effectiveTo) : null);
    setAmount(minorToMajor(entry[moneyField]?.amountMinor || 0, entry[moneyField]?.currency || defaultCurrency));
    setCurrency(entry[moneyField]?.currency || defaultCurrency);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveFrom) return;
    try {
      setIsLoading(true);
      // Built from the picker's own local year/month (not a bare
      // "YYYY-MM-01" ISO string, which parses as UTC midnight and shifts a
      // whole month backward in any timezone behind UTC) - matches the
      // local-time Date construction convention the rest of Projections
      // already uses.
      const res = await toFetch.post("general-data/projection-baseline/update", {
        mail,
        kind,
        entryId: editingId || undefined,
        effectiveFrom: new Date(effectiveFrom.year(), effectiveFrom.month(), 1),
        effectiveTo: effectiveTo ? new Date(effectiveTo.year(), effectiveTo.month(), 1) : null,
        amount: Number(amount || 0),
        currency,
      });
      if (res.ok) {
        runNotify("ok", res.message);
        resetForm();
        onChange();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (entryId) => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/projection-baseline/delete", { mail, kind, entryId });
      if (res.ok) {
        runNotify("ok", res.message);
        if (editingId === entryId) resetForm();
        onChange();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 last:mb-0">
      <p className="text-purple-800 font-medium mb-2">{label}</p>
      {sorted.length > 0 && (
        <ul className="flex flex-col gap-2 mb-3">
          {sorted.map((entry) => (
            <li
              key={entry._id}
              className="flex justify-between items-center bg-white rounded-2xl px-4 py-2"
            >
              <p className="text-purple-800 capitalize">
                Desde {formatMonthYear(entry.effectiveFrom)}
                {entry.effectiveTo ? ` hasta ${formatMonthYear(entry.effectiveTo)}` : " (en curso)"}
                <span className="text-xs text-gray-500 normal-case ml-2">
                  ~{formatMoneyMajor(
                    minorToMajor(entry[moneyField]?.amountMinor || 0, entry[moneyField]?.currency || defaultCurrency),
                    entry[moneyField]?.currency || defaultCurrency,
                    { showCode: true }
                  )}
                </span>
              </p>
              <div className="flex gap-2 shrink-0">
                <div className="cursor-pointer" onClick={() => startEdit(entry)}>
                  <CategoIcon type="MdModeEdit" siz={18} />
                </div>
                <div
                  className="cursor-pointer text-red-500"
                  onClick={() => handleRemove(entry._id)}
                >
                  <CategoIcon type="MdClose" siz={18} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={handleSubmit}
        className="form-trans-edit flex flex-col sm:flex-row gap-2 items-stretch sm:items-end bg-white rounded-2xl p-3"
      >
        <div className="flex flex-col">
          <p className="label-tfp mb-1">Desde</p>
          <ConfigProvider locale={esES} theme={pickerTheme}>
            <DatePicker
              picker="month"
              value={effectiveFrom ? effectiveFrom.locale("es") : null}
              onChange={(d) => setEffectiveFrom(d)}
              format="MMMM YYYY"
              placeholder="Elige un mes"
              allowClear={false}
              style={{ height: 40 }}
            />
          </ConfigProvider>
        </div>
        <div className="flex flex-col">
          <p className="label-tfp mb-1">Hasta (opcional)</p>
          <ConfigProvider locale={esES} theme={pickerTheme}>
            <DatePicker
              picker="month"
              value={effectiveTo ? effectiveTo.locale("es") : null}
              onChange={(d) => setEffectiveTo(d)}
              disabledDate={(d) => effectiveFrom && d.isBefore(effectiveFrom, "month")}
              format="MMMM YYYY"
              placeholder="En curso"
              allowClear
              style={{ height: 40 }}
            />
          </ConfigProvider>
        </div>
        <div className="flex flex-col flex-1">
          <p className="label-tfp mb-1">Monto mensual aproximado</p>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={placeholder}
            required
          />
        </div>
        <div className="flex flex-col">
          <p className="label-tfp mb-1">Moneda</p>
          <select
            className="etm-selector"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} ({CURRENCY_META[code].symbol})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-purple-600 text-white rounded-full px-4 py-2 hover:bg-purple-500 shrink-0"
        >
          {isLoading ? <Spin /> : editingId ? "Guardar" : "Agregar"}
        </button>
        {editingId && (
          <button type="button" className="text-gray-500 underline shrink-0" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
}

// Lets the user capture a rough, wallet-wide list of concurrent income
// periods and, independently, expense periods - used only to fill in
// Projections for months/years with no real Budgets, Income Sources, or
// transactions logged at all (real data always wins). Income and expense
// are tracked separately since they don't necessarily change together.
// Periods are additive (see ProjectionBaseline.js / BaselineTimelineEditor
// above) so two simultaneous jobs both count, and each can carry its own
// currency (e.g. a USD paycheck) - converted to the Wallet's primary
// currency at read time by ProjectionsClient, same as Income Sources.
function HistoricalBaselinePanel({ baseline, walletPrimaryCurrency, mail, onChange, defaultOpen }) {
  const [isOpen, setIsOpen] = useState(!!defaultOpen);
  const totalEntries = (baseline?.incomeHistory?.length || 0) + (baseline?.expenseHistory?.length || 0);

  return (
    <div className="historical-baseline-panel w-full bg-purple-100 rounded-3xl p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl text-purple-800 font-normal">
          Referencia histórica ({totalEntries})
        </h2>
        <CategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-3">
            Solo se usa para rellenar meses sin transacciones, Presupuestos o Fuentes de ingreso
            reales — donde sí haya datos reales, esos siempre ganan. Ingreso y gasto se manejan por
            separado, ya que no necesariamente cambian al mismo tiempo. Si dos periodos se cruzan
            (ej. dos trabajos a la vez), se suman. Deja &ldquo;Hasta&rdquo; en blanco si sigue vigente. Aplica a
            cualquier año que veas, no solo a uno.
          </p>
          <BaselineTimelineEditor
            kind="income"
            label="Ingreso aproximado"
            placeholder="e.g. 150000"
            entries={baseline?.incomeHistory}
            moneyField="incomeMoney"
            walletPrimaryCurrency={walletPrimaryCurrency}
            mail={mail}
            onChange={onChange}
          />
          <BaselineTimelineEditor
            kind="expense"
            label="Gasto aproximado"
            placeholder="e.g. 100000"
            entries={baseline?.expenseHistory}
            moneyField="expenseMoney"
            walletPrimaryCurrency={walletPrimaryCurrency}
            mail={mail}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

export default HistoricalBaselinePanel;
