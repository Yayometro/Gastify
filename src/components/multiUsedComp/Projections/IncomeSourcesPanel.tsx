"use client";

import React, { useState } from "react";
import { Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";
import { SUPPORTED_CURRENCIES, CURRENCY_META, formatMoneyMajor } from "@/lib/money/currencies";
import type { IIncomeSource, IncomeSourceRecurrence } from "@/model/IncomeSource";
import type { IncomeSourceItem } from "@/hooks/useProjectionTable";

export type IncomeSourceLike = IIncomeSource | IncomeSourceItem;

export interface IncomeSourceFormData {
  name: string;
  amount: number | string;
  currency: string;
  recurrence: IncomeSourceRecurrence | string;
  anchorDate: Date;
}

export interface IncomeSourcesPanelProps {
  incomeSources?: IncomeSourceLike[] | null;
  userId?: string;
  walletId?: string;
  walletPrimaryCurrency?: string;
  onChange?: () => void;
}

const RECURRENCE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  semimonthly: "Semimonthly (fixed paydays, ~2/mo)",
  biweekly: "Biweekly (every 14 days)",
  weekly: "Weekly",
};

const getEmptyForm = (currency?: string): IncomeSourceFormData => ({
  name: "",
  amount: "",
  currency: currency || "MXN",
  recurrence: "monthly",
  anchorDate: new Date(),
});

function IncomeSourcesPanel({
  incomeSources,
  userId,
  walletId,
  walletPrimaryCurrency,
  onChange,
}: IncomeSourcesPanelProps): React.JSX.Element {
  const defaultCurrency = walletPrimaryCurrency || "MXN";
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IncomeSourceFormData>(() => getEmptyForm(defaultCurrency));
  const toFetch = fetcher();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDateChange = (newValue: Dayjs | null) => {
    // Clearing the field keeps the previous date (it used to crash).
    if (!newValue) return;
    setForm({ ...form, anchorDate: new Date(newValue.format()) });
  };

  const startEdit = (source: IncomeSourceLike) => {
    setEditingId(source._id ? String(source._id) : null);
    setForm({
      name: source.name || "",
      amount: source.amount ?? "",
      currency: source.currency || defaultCurrency,
      recurrence: source.recurrence || "monthly",
      anchorDate: source.anchorDate ? new Date(source.anchorDate) : new Date(),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(getEmptyForm(defaultCurrency));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let res;
      if (editingId) {
        res = await toFetch.post("general-data/income-sources/update", {
          id: editingId,
          name: form.name,
          amount: Number(form.amount),
          currency: form.currency,
          recurrence: form.recurrence,
          anchorDate: form.anchorDate || undefined,
        });
      } else {
        res = await toFetch.post("general-data/income-sources/new", {
          user: userId,
          wallet: walletId,
          name: form.name,
          amount: Number(form.amount),
          currency: form.currency,
          recurrence: form.recurrence,
          anchorDate: form.anchorDate || undefined,
        });
      }
      if (res.ok) {
        runNotify("ok", res.message);
        resetForm();
        onChange?.();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string | unknown) => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/income-sources/remove", { id });
      if (res.ok) {
        runNotify("ok", res.message);
        onChange?.();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="income-sources-panel w-full bg-gf-accent-soft-bg rounded-3xl p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl text-purple-300 font-normal">
          Income sources ({(incomeSources || []).length})
        </h2>
        <CategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <ul className="flex flex-col gap-2 mb-4">
            {(incomeSources || []).map((source) => (
              <li
                key={source._id ? String(source._id) : undefined}
                className="flex justify-between items-center bg-gf-surface rounded-2xl px-4 py-2"
              >
                <div className="flex flex-col">
                  <p className="text-purple-300">{source.name}</p>
                  <p className="text-xs text-gf-text-muted">
                    {formatMoneyMajor(source.amount || 0, source.currency || defaultCurrency, { showCode: true })} · {RECURRENCE_LABELS[source.recurrence as string] ?? source.recurrence ?? "Custom"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="cursor-pointer" onClick={() => startEdit(source)}>
                    <CategoIcon type="MdModeEdit" siz={20} />
                  </div>
                  <div
                    className="cursor-pointer text-red-500"
                    onClick={() => handleRemove(source._id)}
                  >
                    <CategoIcon type="MdClose" siz={20} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <form
            onSubmit={handleSubmit}
            className="form-trans-edit flex flex-col sm:flex-row gap-2 items-stretch sm:items-end bg-gf-surface rounded-2xl p-3"
          >
            <div className="flex flex-col flex-1">
              <p className="label-tfp mb-1">Name</p>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Sueldo Nomina"
                required
              />
            </div>
            <div className="flex flex-col">
              <p className="label-tfp mb-1">Amount / occurrence</p>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <p className="label-tfp mb-1">Currency</p>
              <select
                className="etm-selector"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCY_META[code].symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <p className="label-tfp mb-1">Recurrence</p>
              <select
                className="etm-selector"
                name="recurrence"
                value={form.recurrence}
                onChange={handleChange}
              >
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <p className="label-tfp mb-1">First payment date</p>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDateTimePicker
                  slotProps={{ textField: { size: "small", variant: "standard" } }}
                  onChange={handleDateChange}
                  value={dayjs(form.anchorDate)}
                  sx={{
                    width: "100%",
                    // The visible pill (border/padding/radius/height) comes
                    // entirely from the global `.form-trans-edit input` rule,
                    // which already targets this MUI input's real <input>
                    // element - same as its sibling fields. Drawing a second
                    // border here on the wrapper on top of that produced a
                    // visible double-border artifact. The wrapper itself
                    // defaults to 50px tall regardless of the inner input's
                    // own height, though, so it still needs its own explicit
                    // match to the sibling fields' 40px.
                    "& .MuiInputBase-root": {
                      width: "100%",
                      height: "40px",
                    },
                    "& .MuiInputBase-root:before, & .MuiInputBase-root:after": {
                      border: "none",
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
            <button
              type="submit"
              className="gf-glass-button text-white rounded-full px-4 py-2"
            >
              {isLoading ? <Spin /> : editingId ? "Save" : "Add"}
            </button>
            {editingId && (
              <button type="button" className="gf-glass-button-neutral text-gf-text rounded-full px-4 py-2" onClick={resetForm}>
                Cancel
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default IncomeSourcesPanel;
