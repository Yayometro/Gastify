"use client";

import React, { useState } from "react";
import { Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import CategoIcon from "../CategoIcon";

const RECURRENCE_LABELS = {
  monthly: "Monthly",
  semimonthly: "Semimonthly (fixed paydays, ~2/mo)",
  biweekly: "Biweekly (every 14 days)",
  weekly: "Weekly",
};

const emptyForm = { name: "", amount: "", recurrence: "monthly", anchorDate: "" };

function IncomeSourcesPanel({ incomeSources, userId, walletId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const toFetch = fetcher();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const startEdit = (source) => {
    setEditingId(source._id);
    setForm({
      name: source.name || "",
      amount: source.amount || "",
      recurrence: source.recurrence || "monthly",
      anchorDate: source.anchorDate
        ? new Date(source.anchorDate).toISOString().slice(0, 10)
        : "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let res;
      if (editingId) {
        res = await toFetch.post("general-data/income-sources/update", {
          id: editingId,
          name: form.name,
          amount: Number(form.amount),
          recurrence: form.recurrence,
          anchorDate: form.anchorDate || undefined,
        });
      } else {
        res = await toFetch.post("general-data/income-sources/new", {
          user: userId,
          wallet: walletId,
          name: form.name,
          amount: Number(form.amount),
          recurrence: form.recurrence,
          anchorDate: form.anchorDate || undefined,
        });
      }
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

  const handleRemove = async (id) => {
    try {
      setIsLoading(true);
      const res = await toFetch.post("general-data/income-sources/remove", { id });
      if (res.ok) {
        runNotify("ok", res.message);
        onChange();
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="income-sources-panel w-full bg-purple-100 rounded-3xl p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl text-purple-800 font-normal">
          Income sources ({(incomeSources || []).length})
        </h2>
        <CategoIcon type={isOpen ? "MdExpandLess" : "MdExpandMore"} siz={24} />
      </div>
      {isOpen && (
        <div className="mt-3">
          <ul className="flex flex-col gap-2 mb-4">
            {(incomeSources || []).map((source) => (
              <li
                key={source._id}
                className="flex justify-between items-center bg-white rounded-2xl px-4 py-2"
              >
                <div className="flex flex-col">
                  <p className="text-purple-800">{source.name}</p>
                  <p className="text-xs text-gray-500">
                    ${source.amount} · {RECURRENCE_LABELS[source.recurrence]}
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
            className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end bg-white rounded-2xl p-3"
          >
            <div className="flex flex-col flex-1">
              <label className="text-xs text-gray-500">Name</label>
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
              <label className="text-xs text-gray-500">Amount / occurrence</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Recurrence</label>
              <select name="recurrence" value={form.recurrence} onChange={handleChange}>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">First payment date</label>
              <input
                type="date"
                name="anchorDate"
                value={form.anchorDate}
                onChange={handleChange}
              />
            </div>
            <button
              type="submit"
              className="bg-purple-600 text-white rounded-full px-4 py-2 hover:bg-purple-500"
            >
              {isLoading ? <Spin /> : editingId ? "Save" : "Add"}
            </button>
            {editingId && (
              <button type="button" className="text-gray-500 underline" onClick={resetForm}>
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
