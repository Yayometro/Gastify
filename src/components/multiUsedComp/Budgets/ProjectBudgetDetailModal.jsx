"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import EditSingleTransModal from "@/components/multiUsedComp/EditSingleTransModal";
import AddTransactionComp from "@/components/multiUsedComp/AddTransactionComp";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { getExplicitBudgetId } from "@/helpers/transformers/budgetTypes";
import { updateTransaction } from "@/lib/features/transacctionsSlice";

const transactionTags = (transaction) => (transaction.tags || []).map((tag) => String(tag?._id || tag));

export default function ProjectBudgetDetailModal({ budget, transacciones = [], onClose, onEdit }) {
  const [editingMovement, setEditingMovement] = useState(null);
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const budgetCurrency = budget.currency || walletPrimaryCurrency;
  const toFetch = fetcher();
  const budgetId = String(budget._id);
  const tagIds = useMemo(
    () => (budget.linkedTags || []).map((tag) => String(tag?._id || tag)),
    [budget.linkedTags]
  );

  const linked = useMemo(() => transacciones
    .filter((transaction) => getExplicitBudgetId(transaction) === budgetId)
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)), [transacciones, budgetId]);
  const spent = linked.filter((transaction) => transaction.isBill && !transaction.isIncome)
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  const goal = Number(budget.goalAmount) || 0;
  const ratio = goal > 0 ? spent / goal : 0;

  const candidates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transacciones.filter((transaction) => {
      if (!transaction.isBill || transaction.isIncome || getExplicitBudgetId(transaction)) return false;
      if (normalized && !(transaction.name || "").toLowerCase().includes(normalized)) return false;
      return true;
    }).sort((a, b) => {
      const aSuggested = tagIds.some((id) => transactionTags(a).includes(id));
      const bSuggested = tagIds.some((id) => transactionTags(b).includes(id));
      return Number(bSuggested) - Number(aSuggested) || new Date(b.date) - new Date(a.date);
    }).slice(0, 30);
  }, [transacciones, query, tagIds]);

  const linkMovement = async (transactionId, shouldLink) => {
    try {
      const res = await toFetch.post("general-data/transactions/link-budget", {
        transactionId,
        budgetId: shouldLink ? budget._id : null,
      });
      if (!res.ok || !res.data) throw new Error(res.message || "Could not update the movement");
      dispatch(updateTransaction(res.data));
      runNotify("ok", shouldLink ? "Movement added to project" : "Movement removed from project");
    } catch (error) { runNotify("error", error?.message || String(error)); }
  };

  const range = budget.eventStartDate || budget.eventEndDate
    ? `${budget.eventStartDate ? dayjs(budget.eventStartDate).format("DD MMM YYYY") : "No start date"} → ${budget.eventEndDate ? dayjs(budget.eventEndDate).format("DD MMM YYYY") : "No end date"}`
    : "Dates not set";

  return <>
    <BasicModal close={onClose} renderContent={
      <div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-[94vw] max-w-[720px] max-h-[92vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl">
        <div className="relative px-6 pt-6 pb-5 text-white shrink-0">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 bg-white text-purple-700 rounded-full p-1.5"><CategoIcon type="MdClose" siz={18} /></button>
          <div className="flex items-center gap-3 pr-10">
            <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0"><UniversalCategoIcon type={budget.icon || "md/MdFlightTakeoff"} siz={24} /></span>
            <div><p className="text-xs text-purple-200 font-bold uppercase tracking-wide">Project budget • {budgetCurrency} based</p><h2 className="text-2xl font-bold">{budget.name}</h2></div>
          </div>
          <p className="text-xs text-purple-100 mt-1">{range} · dates are editable</p>
        </div>
        <div className="bg-slate-50 rounded-t-[38px] px-5 sm:px-7 py-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <div className="bg-white border border-purple-100 rounded-2xl p-3"><p className="text-[10px] text-gray-400 uppercase">Spent</p><p className="text-lg font-bold text-purple-800">{usdFormatChanger(spent)}</p></div>
            <div className="bg-white border border-purple-100 rounded-2xl p-3"><p className="text-[10px] text-gray-400 uppercase">Limit</p><p className="text-lg font-bold text-purple-800">{usdFormatChanger(goal)}</p></div>
            <div className={`col-span-2 sm:col-span-1 border rounded-2xl p-3 ${spent > goal ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}><p className="text-[10px] text-gray-400 uppercase">{spent > goal ? "Over" : "Available"}</p><p className="text-lg font-bold">{usdFormatChanger(Math.abs(goal - spent))}</p></div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full ${ratio > 1 ? "bg-red-500" : "bg-purple-600"}`} style={{ width: `${Math.min(Math.max(ratio * 100, 0), 100)}%` }} /></div>
          <p className="text-[11px] text-gray-500 mt-2">{Math.round(ratio * 100)}% used · counts linked expenses from any purchase date</p>

          {!!budget.linkedTags?.length && <div className="mt-4"><p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Suggestion tags</p><div className="flex flex-wrap gap-1.5">{budget.linkedTags.map((tag) => <span key={tag._id || tag} className="bg-purple-100 text-purple-700 rounded-full px-2.5 py-1 text-xs">#{tag.name || "tag"}</span>)}</div></div>}

          <div className="flex flex-wrap gap-2 mt-5">
            <button type="button" onClick={() => onEdit(budget)} className="rounded-full bg-purple-600 text-white text-xs font-bold px-4 py-2">Edit project</button>
            <button type="button" onClick={() => setShowAddExisting((value) => !value)} className="rounded-full border border-purple-300 text-purple-700 text-xs font-bold px-4 py-2">Add existing movement</button>
            <button type="button" onClick={() => setShowCreate(true)} className="rounded-full border border-purple-300 text-purple-700 text-xs font-bold px-4 py-2">Create movement</button>
          </div>

          {showAddExisting && <div className="mt-4 bg-purple-50 border border-purple-100 rounded-2xl p-3">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses…" className="w-full mb-2" />
            {!!tagIds.length && <p className="text-[10px] text-purple-700 mb-2">Movements sharing a project tag are shown first.</p>}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">{candidates.length ? candidates.map((transaction) => {
              const suggested = tagIds.some((id) => transactionTags(transaction).includes(id));
              return <button key={transaction._id} type="button" onClick={() => linkMovement(transaction._id, true)} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2 text-left"><span className="min-w-0"><span className="block text-xs font-semibold truncate">{transaction.name}</span><span className="block text-[10px] text-gray-400">{dayjs(transaction.date).format("DD MMM YYYY")}{suggested ? " · Suggested by tag" : ""}</span></span><strong className="text-xs text-red-500 shrink-0">{usdFormatChanger(transaction.amount)}</strong></button>;
            }) : <p className="text-xs text-gray-400 text-center py-3">No available expenses found.</p>}</div>
          </div>}

          <div className="mt-5"><div className="flex items-center justify-between mb-2"><h3 className="font-bold text-purple-900">Linked movements</h3><span className="text-xs text-gray-400">{linked.length}</span></div>
            <div className="flex flex-col gap-2">{linked.length ? linked.map((transaction) => <div key={transaction._id} className="flex items-center justify-between gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-2">
              <div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{transaction.name}</p><p className="text-[10px] text-gray-400">{dayjs(transaction.date).format("DD MMM YYYY")}</p></div>
              <strong className="text-xs text-red-500">{usdFormatChanger(transaction.amount)}</strong>
              <button type="button" title="Edit movement" onClick={() => setEditingMovement(transaction)} className="text-gray-400 hover:text-purple-600"><CategoIcon type="MdOutlineCreate" siz={16} /></button>
              <button type="button" title="Remove from project" onClick={() => linkMovement(transaction._id, false)} className="text-gray-400 hover:text-red-600"><UniversalCategoIcon type="md/MdLinkOff" siz={17} /></button>
            </div>) : <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl p-5"><p className="text-sm font-semibold text-gray-600">No movements linked yet</p><p className="text-xs text-gray-400 mt-1">Add an existing expense or create one for this project.</p></div>}</div>
          </div>
        </div>
      </div>
    } />
    {editingMovement && <EditSingleTransModal trans={editingMovement} onClose={() => setEditingMovement(null)} />}
    {showCreate && <BasicModal close={() => setShowCreate(false)} renderContent={<div className="content absolute bg-purple-600 border-2 border-purple-600 flex flex-col w-[94vw] max-w-[720px] h-[88vh] overflow-hidden rounded-3xl z-[1001] shadow-2xl"><div className="relative text-white px-5 py-4 font-bold">New project movement<button type="button" onClick={() => setShowCreate(false)} className="absolute right-4 bg-white text-purple-700 rounded-full p-1"><CategoIcon type="MdClose" siz={17} /></button></div><div className="bg-slate-50 rounded-t-[32px] flex-1 overflow-hidden"><SelectCategories><AddTransactionComp initialBudgetId={budget._id} onCreated={() => setShowCreate(false)} /></SelectCategories></div></div>} />}
  </>;
}
