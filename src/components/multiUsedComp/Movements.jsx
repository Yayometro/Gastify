import React, { useEffect, useRef, useState } from "react";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";

import { PiExcludeSquareDuotone } from "react-icons/pi";
import { HiMiniCursorArrowRipple } from "react-icons/hi2";
import currencyFormatter from "currency-formatter";
import CategoIcon from "./CategoIcon";
import UniversalCategoIcon from "./UniversalCategoIcon";
import dayjs from "dayjs";
import Tag from "./Tag";
import fetcher from "@/helpers/fetcher";
import EditSingleTransModal from "./EditSingleTransModal";
import { IoCheckmarkDoneCircleOutline, IoSearchOutline } from "react-icons/io5";
import { MdOutlineFindInPage, MdOutlineDriveFileRenameOutline, MdOutlineCalendarMonth, MdOutlineSwapVert, MdOutlineCategory, MdOutlineAccountBalance, MdOutlineSettings, MdOutlineFileDownload } from "react-icons/md";
import { PiFileCsvDuotone, PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { VscJson } from "react-icons/vsc";
import { Tooltip, Button, Modal, Skeleton } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditMultipleTransModal from "./EditMultipleTransModal";
import QuickEditModal from "./QuickEditModal";
import runNotify from "@/helpers/gastifyNotifier";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTrans,
  removeManyTransactions,
  removeOneTransacction,
} from "@/lib/features/transacctionsSlice";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
  getDateInYearMonthDay,
} from "@/helpers/timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange } from "@/helpers/transformers/transactionsChange";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";

const today = new Date();

function Movements({ timePeriodFromFather, mail }) {
  const defaultPeriod = timePeriodFromFather || [
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
  ];

  const userHasSelectedPeriod = useRef(false);
  const [allMovements, setAllMovements] = useState([]);
  const [timePeriod, setTimePeriod] = useState(defaultPeriod);
  const [trastType, setTransType] = useState("all");
  const [readable, setReadable] = useState("all");
  const [removedElement, setRemovedElement] = useState(false);
  const [editingTrans, setEditingTrans] = useState(null);
  const [editKey, setEditKey] = useState(0);
  const [editMultiModal, setEditMultiModal] = useState([]);
  const [showMultipleTransEdit, setShowMultipleTransEdit] = useState(false);
  const [selectedTrans, setSelectedTrans] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isRemoveModal, setIsRemoveModal] = useState(false);
  const [isRemoveModalMany, setIsRemoveModalMany] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [transRemovableId, setTransRemovableId] = useState("");
  const [loadingComponent, setLoadingComponent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dupFinderOpen, setDupFinderOpen] = useState(false);
  const [dupCriteria, setDupCriteria] = useState({ name: true, date: true, amount: true, category: false, subcategory: false });
  const [dupMode, setDupMode] = useState(false);
  const [dupCount, setDupCount] = useState(0);
  const [dupDateTolerance, setDupDateTolerance] = useState(0);
  const [dupAmountTolerance, setDupAmountTolerance] = useState(0);
  const [dupDeleteAll, setDupDeleteAll] = useState(false);
  const [quickEditField, setQuickEditField] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // 'excel' | 'json'
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const toFetch = fetcher();
  const reduxDispartcher = useDispatch();
  const reduxAllTrans = useSelector((state) => state.transacctionsReducer);
  const rdxTransactions = reduxAllTrans?.data;

  const timePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(today.getFullYear());

  useEffect(() => {
    if (reduxAllTrans.status == "idle") {
      reduxDispartcher(fetchTrans(mail));
    }
  }, []);

  // Solo sincroniza con el padre si el usuario NO ha seleccionado un período manualmente
  useEffect(() => {
    if (!timePeriodFromFather || userHasSelectedPeriod.current) return;
    setTimePeriod(timePeriodFromFather);
  }, [timePeriodFromFather]);

  // Single consolidated filter effect
  useEffect(() => {
    if (!rdxTransactions || rdxTransactions.length === 0) return;
    if (reduxAllTrans.status == "succeeded") setLoadingComponent(false);

    const [start, end] = timePeriod;
    let filtered = getTransactionsFromTimeRange(rdxTransactions, start, end).sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    if (trastType === "incomes") filtered = filtered.filter((t) => t.isIncome && !t.isBill);
    if (trastType === "bills") filtered = filtered.filter((t) => t.isBill && !t.isIncome);
    if (readable === "true") filtered = filtered.filter((t) => t.isReadable);
    if (readable === "false") filtered = filtered.filter((t) => !t.isReadable);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.category?.name?.toLowerCase().includes(q) ||
          t.subCategory?.name?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.name?.toLowerCase().includes(q))
      );
    }

    if (dupMode) {
      const dups = getDuplicates(filtered, dupCriteria, dupDateTolerance, dupAmountTolerance);
      setDupCount(dups.length);
      setAllMovements(dups);
    } else {
      setDupCount(0);
      setAllMovements(filtered);
    }
  }, [rdxTransactions, timePeriod, trastType, readable, searchQuery, dupMode, dupCriteria, dupDateTolerance, dupAmountTolerance]);

  function areDuplicates(a, b, criteria, dateTol, amountTol) {
    if (criteria.name) {
      const na = (a.name || "").toLowerCase().trim();
      const nb = (b.name || "").toLowerCase().trim();
      if (na !== nb) return false;
    }
    if (criteria.date) {
      const da = new Date(a.date || a.createdAt).getTime();
      const db = new Date(b.date || b.createdAt).getTime();
      const diffDays = Math.abs(da - db) / 86400000;
      if (diffDays > dateTol) return false;
    }
    if (criteria.amount) {
      const diff = Math.abs((a.amount ?? 0) - (b.amount ?? 0));
      if (diff > amountTol) return false;
    }
    if (criteria.category) {
      if (String(a.category?._id || "none") !== String(b.category?._id || "none")) return false;
    }
    if (criteria.subcategory) {
      if (String(a.subCategory?._id || "none") !== String(b.subCategory?._id || "none")) return false;
    }
    return true;
  }

  // Encuentra componentes conectados via Union-Find
  function buildDupGroups(transactions, criteria, dateTol, amountTol) {
    const n = transactions.length;
    const parent = transactions.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const union = (i, j) => { parent[find(i)] = find(j); };

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (areDuplicates(transactions[i], transactions[j], criteria, dateTol, amountTol)) {
          union(i, j);
        }
      }
    }
    // Agrupa índices por componente
    const comps = {};
    transactions.forEach((_, i) => {
      const root = find(i);
      if (!comps[root]) comps[root] = [];
      comps[root].push(i);
    });
    return Object.values(comps).filter((g) => g.length > 1);
  }

  function getDuplicates(transactions, criteria, dateTol, amountTol) {
    const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
    const dupIds = new Set();
    groups.forEach((g) => g.forEach((i) => dupIds.add(String(transactions[i]._id))));
    return transactions.filter((t) => dupIds.has(String(t._id)));
  }

  // Devuelve IDs a eliminar: todos excepto el primero de cada componente
  function getDuplicatesToDelete(transactions, criteria, dateTol, amountTol) {
    const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
    const toDelete = [];
    groups.forEach((g) => g.slice(1).forEach((i) => toDelete.push(transactions[i]._id)));
    return toDelete;
  }

  // Devuelve IDs a eliminar: TODOS los items de cada grupo (ninguno se conserva)
  function getAllMatchingIds(transactions, criteria, dateTol, amountTol) {
    const groups = buildDupGroups(transactions, criteria, dateTol, amountTol);
    const toDelete = [];
    groups.forEach((g) => g.forEach((i) => toDelete.push(transactions[i]._id)));
    return toDelete;
  }

  function getValueFromSelecter(v) {
    userHasSelectedPeriod.current = true;
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      userHasSelectedPeriod.current = true;
      setTimePeriod([dateStart, dateEnd]);
    }
  }

  const handleTransType = (event) => setTransType(event.target.value);
  const handleReadable = (event) => setReadable(event.target.value);

  const handleCleanFilter = () => {
    setReadable("all");
    setTransType("all");
    setSearchQuery("");
    setDupMode(false);
    setDupFinderOpen(false);
    setDupCriteria({ name: true, date: true, amount: true, category: false, subcategory: false });
    setDupDateTolerance(0);
    setDupAmountTolerance(0);
    setDupDeleteAll(false);
    setTimePeriod(timePeriodFromFather || defaultPeriod);
  };

  function buildFilterSummary() {
    const parts = [];
    const [start, end] = timePeriod;
    parts.push(`Period: ${getDateInYearMonthDay(start)} → ${getDateInYearMonthDay(end)}`);
    if (trastType !== "all") parts.push(`Type: ${trastType === "incomes" ? "Incomes only" : "Bills only"}`);
    if (readable !== "all") parts.push(`Readable: ${readable === "true" ? "Readable only" : "Not readable"}`);
    if (searchQuery.trim()) parts.push(`Search: "${searchQuery.trim()}"`);
    if (dupMode) parts.push(`Mode: Duplicate finder (${dupCount} found)`);
    return parts;
  }

  const handleExportConfirm = async () => {
    if (!exportFormat) return;
    setExportLoading(true);
    try {
      const ids = allMovements.map((t) => String(t._id));
      const userEmail = mail;

      if (exportFormat === "json") {
        const data = JSON.stringify(allMovements, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gastify-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        runNotify("ok", `Exported ${ids.length} transactions as JSON 📦`);
      } else {
        const response = await fetch(
          toFetch.getFullPath(`general-data/files/export/${userEmail}`),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionIds: ids }),
          }
        );
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "Export failed");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gastify-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        runNotify("ok", `Exported ${ids.length} transactions as Excel 📊`);
      }
      setExportModalOpen(false);
      setExportOpen(false);
    } catch (e) {
      runNotify("error", e?.message || "Export failed, please try again 🤕");
    } finally {
      setExportLoading(false);
    }
  };

  const handleTransactionRemove = async (id) => {
    try {
      const element = document.getElementById(`trans-${id}`);
      element.classList.add("backOutDown-5seg");
      await new Promise((resolve) => setTimeout(resolve, 251));
      element.classList.add("hidden");
      reduxDispartcher(removeOneTransacction(id));
      const res = await toFetch.post(
        `general-data/transactions/remove-transaction/${id}`
      );
      if (res.ok) {
        runNotify("ok", String(res.message));
        setIsRemoveModal(false);
        setConfirmLoading(false);
      } else {
        runNotify("error", "Something went wrong removing your items, verify your request and try again 🤕");
        setIsRemoveModal(false);
        setConfirmLoading(false);
      }
    } catch (e) {
      console.log(e);
      runNotify("error", String(e));
      setIsRemoveModal(false);
      setConfirmLoading(false);
    }
  };

  const handleRemoveManyTransactions = async (transs) => {
    try {
      if (transs.length === 0) {
        runNotify("error", "No items selected to removed, please select at least two");
        return;
      }
      if (transs.length >= 15) {
        const element = document.getElementById(`trans-${transs[0]}`);
        if (element) element.classList.add("hidden");
      } else {
        for (const tra of transs) {
          const element = document.getElementById(`trans-${tra}`);
          if (element) {
            element.classList.add("backOutDown-5seg");
            await new Promise((resolve) => setTimeout(resolve, 251));
            element.classList.add("hidden");
          }
        }
      }
      reduxDispartcher(removeManyTransactions(transs));
      setSelectedTrans([]);
      const res = await toFetch.post(`general-data/transactions/remove-many`, { manyTrans: transs });
      if (res.ok) {
        runNotify("ok", String(res.message));
        setIsRemoveModalMany(false);
        setConfirmLoading(false);
        if (dupMode) { setDupMode(false); setDupFinderOpen(false); }
      } else {
        runNotify("error", "Something went wrong removing your items, verify your request and try again 🤕");
        setIsRemoveModalMany(false);
        setConfirmLoading(false);
      }
    } catch (e) {
      runNotify("error", String(e));
      setIsRemoveModalMany(false);
      setConfirmLoading(false);
    }
  };

  const handleTransEdit = (tra) => {
    setEditingTrans(tra);
    setEditKey((k) => k + 1);
  };

  const handleMultiTransEdit = (ids) => {
    const editMultiTransMo = (
      <EditMultipleTransModal
        hidden={editMultiModal}
        trans={ids}
        key={`editMultiModal-${ids[0]._id}`}
      />
    );
    setEditMultiModal([...editMultiModal, editMultiTransMo]);
  };

  const handeTransSelection = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        itemSele && itemSele.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
      });
      setSelectedTrans([]);
    }
  };

  const handleSelectedItem = (id) => {
    const itemSele = document.getElementById(`trans-${id}`);
    if (selectedTrans.includes(id)) {
      setSelectedTrans(selectedTrans.filter((transId) => transId !== id));
      itemSele && itemSele.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
    } else {
      setSelectedTrans([...selectedTrans, id]);
      itemSele && itemSele.classList.add("edit-animation", "border-[2px]", "border-purple-400");
    }
  };

  const handleSelectedAll = () => {
    if (selectedTrans.length === allMovements.length) {
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        itemSele && itemSele.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
      });
      setSelectedTrans([]);
    } else {
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        itemSele && itemSele.classList.add("edit-animation", "border-[2px]", "border-purple-400");
      });
      setSelectedTrans(allMovements.map((mov) => mov._id));
    }
  };

  const showRemoveModal = (kind, id) => {
    if (kind === "many") {
      setIsRemoveModalMany(true);
    } else {
      setTransRemovableId(id);
      setIsRemoveModal(true);
    }
  };

  const handleOkRemove = async (kind) => {
    setConfirmLoading(true);
    if (kind === "many") {
      await handleRemoveManyTransactions(selectedTrans);
    } else {
      if (transRemovableId) {
        await handleTransactionRemove(transRemovableId);
      } else {
        runNotify("warning", "No transaction selected to remove");
      }
    }
  };

  const handleCancel = (kind) => {
    if (kind === "many") {
      setIsRemoveModalMany(false);
    } else {
      setIsRemoveModal(false);
    }
  };

  return (
    <div className="w-full h-full pt-5">
      {editingTrans && (
        <EditSingleTransModal
          key={editKey}
          trans={editingTrans}
          onClose={() => setEditingTrans(null)}
        />
      )}
      <div className={`edit-multi-modal-cont`}>{editMultiModal}</div>
      {/* ── Export confirmation modal ── */}
      <Modal
        title={
          <span className="font-semibold flex items-center gap-2">
            <MdOutlineFileDownload size={18} className="text-purple-500" />
            Export {allMovements.length} transaction{allMovements.length !== 1 ? "s" : ""}
          </span>
        }
        open={exportModalOpen}
        onOk={handleExportConfirm}
        onCancel={() => { setExportModalOpen(false); }}
        confirmLoading={exportLoading}
        okText={exportLoading ? "Exporting…" : `Export as ${exportFormat === "excel" ? "Excel" : "JSON"}`}
        cancelText="Cancel"
        okButtonProps={{
          className: "!bg-purple-600 !border-purple-600 !text-white hover:!bg-purple-500 hover:!border-purple-500 transition-colors",
        }}
      >
        <div className="flex flex-col gap-3 py-1">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex flex-col gap-1">
            <p className="text-xs font-semibold text-slate-600 mb-1">Active filters</p>
            {buildFilterSummary().map((line, i) => (
              <p key={i} className="text-xs text-slate-500">• {line}</p>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Format:</span>
            <span className="font-semibold text-purple-600 flex items-center gap-1">
              {exportFormat === "excel"
                ? <><PiMicrosoftExcelLogoFill size={14} className="text-green-600" /> Excel (.xlsx) — re-importable</>
                : <><VscJson size={14} className="text-amber-500" /> JSON — full populated data</>
              }
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {exportFormat === "excel"
              ? "The file will match the Gastify import template and can be re-uploaded to any Gastify account."
              : "The JSON file includes all fields: category, subcategory, account, tags, amounts and dates."}
          </p>
        </div>
      </Modal>

      <div className="remove-modal-container">
        <Modal
          title={<span className="text-red-500 font-semibold">⚠️ Delete transaction</span>}
          open={isRemoveModal}
          onOk={() => handleOkRemove()}
          onCancel={() => handleCancel()}
          confirmLoading={confirmLoading}
          okText="Confirm delete"
          cancelText="Cancel"
          okButtonProps={{
            className: confirmLoading
              ? "!bg-red-300 !border-red-300 !text-white cursor-not-allowed"
              : "!bg-red-500 !border-red-500 !text-white hover:!bg-red-400 hover:!border-red-400 transition-colors",
            danger: false,
          }}
        >
          <p className="text-slate-600 text-sm">Are you sure you want to permanently delete this transaction? This action cannot be undone.</p>
        </Modal>
        <Modal
          title={<span className="text-red-500 font-semibold">⚠️ Delete {selectedTrans.length > 0 ? selectedTrans.length : ""} transactions</span>}
          open={isRemoveModalMany}
          onOk={() => handleOkRemove("many")}
          onCancel={() => handleCancel("many")}
          confirmLoading={confirmLoading}
          okText="Confirm delete"
          cancelText="Cancel"
          okButtonProps={{
            className: confirmLoading
              ? "!bg-red-300 !border-red-300 !text-white cursor-not-allowed"
              : "!bg-red-500 !border-red-500 !text-white hover:!bg-red-400 hover:!border-red-400 transition-colors",
            danger: false,
          }}
        >
          <p className="text-slate-600 text-sm">
            Are you sure you want to permanently delete{" "}
            <b>{selectedTrans.length > 0 ? `${selectedTrans.length} transactions` : "these items"}</b>?{" "}
            This action cannot be undone.
          </p>
        </Modal>
      </div>

      {loadingComponent ? (
        <div className="w-full h-full flex justify-center items-center">
          <Skeleton active />
        </div>
      ) : (
        <div className="table-container w-full h-full overflow-y-scroll relative max-h-[1000px] px-1">
          <div className="bg-slate-50 text-slate-900 sticky z-50 top-0 border-b-2 border-slate-200 px-1 py-2 mb-1 rounded-t-2xl">
            <div className="movement-content">
              <h1 className="movement-title text-2xl text-center font-bold">
                Transactions details
              </h1>
            </div>
            <div className="header-filters">
              <p className="text-center font-xl">Filters</p>
              <span className="text-xs flex justify-center">
                From:{" "}
                <b className="mx-1">{timePeriod[0] ? getDateInYearMonthDay(timePeriod[0]) : "—"}</b>
                to:{" "}
                <b className="mx-1">{timePeriod[1] ? getDateInYearMonthDay(timePeriod[1]) : "—"}</b>
              </span>
              <div className="filters flex items-center justify-center gap-2 flex-wrap">
                <div
                  className={`clear-allbtn text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight relative pulse-animation-short cursor-pointer ${
                    isSelectionMode ? "text-purple-500" : ""
                  }`}
                  onClick={handeTransSelection}
                >
                  <p className="pr-2">Select {isSelectionMode ? "ON" : ""}</p>
                  <HiMiniCursorArrowRipple size={15} />
                </div>
                <Tooltip title="Filter by date using a preset range or a specific range 🤓">
                  <div className="text-black w-[10px]">
                    <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
                  </div>
                </Tooltip>
                <SelecterFilter
                  getValue={getValueFromSelecter}
                  periodFromFather={timePeriodsForSelecter[0]}
                  periodOverride={timePeriodsForSelecter}
                  styles="bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
                />
                <TimeRange rpDate={handleRangeDate} />
                <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
                  <select
                    className="bg-transparent appearance-none w-full pr-4"
                    name="TransTypeSelector"
                    value={trastType}
                    onChange={handleTransType}
                  >
                    <option value={"all"}>All transactions</option>
                    <option value={"incomes"}>All incomes</option>
                    <option value={"bills"}>All bills</option>
                  </select>
                  <div className="filterIconContainer absolute right-[0px] pointer-events-none">
                    <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
                  </div>
                </div>
                <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
                  <select
                    className="bg-transparent appearance-none pr-4 max-w-[30px]"
                    name="ReadableSelector"
                    value={readable}
                    onChange={handleReadable}
                  >
                    <option value={"all"}>All</option>
                    <option value={"true"}>Readable</option>
                    <option value={"false"}>Not readable</option>
                  </select>
                  <div className="filterIconContainer absolute right-[0px] pointer-events-none">
                    <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
                  </div>
                </div>
                <Tooltip title="Find transactions that look like duplicates based on chosen criteria">
                  <div
                    className={`clear-allbtn text-[10px] font-light flex items-center justify-center gap-1 relative pulse-animation-short cursor-pointer ${dupMode ? "text-orange-500 font-medium" : ""}`}
                    onClick={() => setDupFinderOpen(!dupFinderOpen)}
                  >
                    <MdOutlineFindInPage size={15} />
                    <p>Find duplicates{dupMode ? ` (${dupCount})` : ""}</p>
                  </div>
                </Tooltip>
                <Tooltip title="Export the currently filtered transactions as Excel (re-importable) or JSON">
                  <div
                    className={`clear-allbtn text-[10px] font-light flex items-center justify-center gap-1 relative pulse-animation-short cursor-pointer ${exportOpen ? "text-purple-500 font-medium" : ""}`}
                    onClick={() => setExportOpen(!exportOpen)}
                  >
                    <MdOutlineFileDownload size={15} />
                    <p>Export data</p>
                  </div>
                </Tooltip>
                <div
                  className="clear-allbtn text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight relative pulse-animation-short cursor-pointer"
                  onClick={handleCleanFilter}
                >
                  <p className="pr-2">Clear filters</p>
                  <UniversalCategoIcon type={"ai/AiOutlineClear"} siz={13} />
                </div>
              </div>
            </div>

            {/* ── Duplicate finder submenu ── */}
            {dupFinderOpen && (
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 mx-1 mb-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-medium text-slate-600">
                    Match criteria — a duplicate is found when ALL checked fields are identical:
                  </p>
                  <Tooltip title={
                    <div className="text-xs flex flex-col gap-1">
                      <p><b>Find Duplicates</b> scans transactions within the <b>currently selected time range</b> and groups those that match the checked fields.</p>
                      <p><b>Date tolerance</b> — how many days apart two transactions can be and still count as duplicates.</p>
                      <p><b>Amount tolerance</b> — max difference in amount (e.g. $0.99 catches bank rounding).</p>
                      <p><b>Search duplicates</b> — runs the scan with your chosen criteria.</p>
                      <p><b>Refresh defaults</b> — resets to Name + Date + Amount, exact match.</p>
                      <p><b>Select possible duplicates</b> — pre-selects all extras, keeps one original per group.</p>
                      <p><b>Delete X selected</b> — removes selected transactions permanently.</p>
                    </div>
                  }>
                    <div className="cursor-pointer text-slate-400 hover:text-slate-600">
                      <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} />
                    </div>
                  </Tooltip>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "name",        label: "Name" },
                    { key: "date",        label: "Date" },
                    { key: "amount",      label: "Amount" },
                    { key: "category",    label: "Category" },
                    { key: "subcategory", label: "Subcategory" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={dupCriteria[key]}
                        onChange={() => setDupCriteria((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className="accent-purple-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Tolerance controls */}
                <div className="flex flex-wrap gap-4 items-center border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-2">
                    <Tooltip title="Allow this many days of difference between dates to still count as duplicates">
                      <label className="text-[11px] text-slate-500 select-none cursor-help">Date tolerance</label>
                    </Tooltip>
                    <select
                      value={dupDateTolerance}
                      onChange={(e) => setDupDateTolerance(Number(e.target.value))}
                      className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 outline-none focus:border-purple-400"
                    >
                      <option value={0}>Exact (same day)</option>
                      <option value={1}>±1 day</option>
                      <option value={3}>±3 days</option>
                      <option value={7}>±7 days</option>
                      <option value={30}>±30 days</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip title="Allow this amount difference (in your currency) between two transactions to still count as duplicates">
                      <label className="text-[11px] text-slate-500 select-none cursor-help">Amount tolerance</label>
                    </Tooltip>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dupAmountTolerance}
                      onChange={(e) => setDupAmountTolerance(Math.max(0, Number(e.target.value)))}
                      className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 w-20 outline-none focus:border-purple-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Search */}
                  <button
                    onClick={() => {
                      if (!Object.values(dupCriteria).some(Boolean)) return;
                      setDupMode(true);
                    }}
                    className="text-[11px] bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-500 transition-colors"
                  >
                    Search duplicates
                  </button>

                  {/* Refresh with defaults */}
                  <Tooltip title="Reset to default criteria (Name + Date + Amount, exact match) and re-run the search">
                    <button
                      onClick={() => {
                        setDupCriteria({ name: true, date: true, amount: true, category: false, subcategory: false });
                        setDupDateTolerance(0);
                        setDupAmountTolerance(0);
                        setDupMode(true);
                      }}
                      className="text-[11px] text-slate-400 hover:text-purple-500 transition-colors flex items-center gap-1"
                    >
                      <UniversalCategoIcon type={"md/MdRefresh"} siz={14} />
                      Refresh defaults
                    </button>
                  </Tooltip>

                  {/* Toggle: eliminar solo duplicados vs todos los que coinciden */}
                  {dupMode && dupCount > 0 && (
                    <Tooltip title={dupDeleteAll ? "All matching items will be selected (nothing is kept)" : "One original per group is kept — only extras are selected"}>
                      <button
                        onClick={() => setDupDeleteAll((v) => !v)}
                        className={`text-[11px] px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                          dupDeleteAll
                            ? "text-red-600 border-red-400 bg-red-50 hover:bg-red-100"
                            : "text-slate-500 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <UniversalCategoIcon type={dupDeleteAll ? "md/MdSelectAll" : "md/MdFilterAlt"} siz={12} />
                        {dupDeleteAll ? "Delete all matches" : "Delete only duplicates"}
                      </button>
                    </Tooltip>
                  )}

                  {/* Select possible duplicates — todos menos uno por grupo */}
                  {dupMode && dupCount > 0 && (
                    <button
                      onClick={() => {
                        const toDelete = dupDeleteAll
                          ? getAllMatchingIds(allMovements, dupCriteria, dupDateTolerance, dupAmountTolerance)
                          : getDuplicatesToDelete(allMovements, dupCriteria, dupDateTolerance, dupAmountTolerance);
                        setIsSelectionMode(true);
                        allMovements.forEach((m) => {
                          const el = document.getElementById(`trans-${m._id}`);
                          if (!el) return;
                          if (toDelete.map(String).includes(String(m._id))) {
                            el.classList.add("edit-animation", "border-[2px]", "border-purple-400");
                          } else {
                            el.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
                          }
                        });
                        setSelectedTrans(toDelete);
                      }}
                      className="text-[11px] text-purple-600 border border-purple-300 px-3 py-1 rounded-full hover:bg-purple-50 transition-colors flex items-center gap-1"
                    >
                      <HiMiniCursorArrowRipple size={12} />
                      Select possible duplicates
                    </button>
                  )}

                  {/* Exit */}
                  {dupMode && (
                    <button
                      onClick={() => {
                        setDupMode(false);
                        setDupFinderOpen(false);
                        setIsSelectionMode(false);
                        setSelectedTrans([]);
                        allMovements.forEach((m) => {
                          const el = document.getElementById(`trans-${m._id}`);
                          if (el) el.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
                        });
                      }}
                      className="text-[11px] text-orange-500 hover:underline"
                    >
                      Exit duplicate view
                    </button>
                  )}

                  {/* Delete selected — ml-auto a la derecha */}
                  {dupMode && isSelectionMode && selectedTrans.length > 0 && (
                    <button
                      onClick={() => showRemoveModal("many", selectedTrans)}
                      className="text-[11px] text-red-500 border border-red-300 px-3 py-1 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <UniversalCategoIcon type={"md/MdDelete"} siz={13} />
                      Delete {selectedTrans.length} selected
                    </button>
                  )}
                </div>

                {/* Results summary */}
                {dupMode && (
                  <p className={`text-[11px] font-medium ${dupCount > 0 ? "text-orange-500" : "text-green-600"}`}>
                    {dupCount > 0 ? `${dupCount} possible duplicate transaction(s) found` : "No duplicates found with current criteria 🎉"}
                  </p>
                )}
              </div>
            )}

            {/* ── Export submenu ── */}
            {exportOpen && (
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 mx-1 mb-2 flex flex-col gap-3">
                <p className="text-[11px] font-medium text-slate-600">
                  Choose export format — <span className="text-slate-400 font-normal">{allMovements.length} transaction{allMovements.length !== 1 ? "s" : ""} with current filters</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setExportFormat("excel"); setExportModalOpen(true); }}
                    className="flex-1 flex flex-col items-center gap-1 border rounded-xl py-3 text-[11px] text-slate-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <PiMicrosoftExcelLogoFill size={22} className="text-green-600" />
                    <span className="font-medium">Excel</span>
                    <span className="text-slate-400 text-[10px] text-center leading-tight">Re-importable format<br/>(.xlsx)</span>
                  </button>
                  <button
                    onClick={() => { setExportFormat("json"); setExportModalOpen(true); }}
                    className="flex-1 flex flex-col items-center gap-1 border rounded-xl py-3 text-[11px] text-slate-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <VscJson size={22} className="text-amber-500" />
                    <span className="font-medium">JSON</span>
                    <span className="text-slate-400 text-[10px] text-center leading-tight">Full data with all<br/>populated fields</span>
                  </button>
                </div>
              </div>
            )}

            <div className="relative w-full mt-2 mb-3 px-2">
              <IoSearchOutline
                size={15}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name, category, subcategory or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-[11px] bg-white border border-slate-200 rounded-2xl outline-none focus:border-purple-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <UniversalCategoIcon type="md/MdClose" siz={15} />
                </button>
              )}
            </div>
            <div className="flex flex-row justify-between items-center first-line:font-semibold">
              <div className="flex gap-1">
                <div>Category</div>
                <div>Name</div>
              </div>
              <div>Amount</div>
            </div>
            {isSelectionMode && (
              <div className="selectionHeader flex flex-col gap-1 py-1.5 bg-purple-50 text-[13px] rounded-xl px-2">
                {/* Row 1: selection controls */}
                <div className="flex gap-2 justify-between items-center">
                  <div
                    className="flex gap-1 items-center text-purple-500 cursor-pointer"
                    onClick={handeTransSelection}
                  >
                    <HiMiniCursorArrowRipple size={18} />
                    <div className="w-fit flex items-center border-2 border-purple-500 rounded-full px-1">
                      <p className="pr-1 text-[11px]">Off</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="text-purple-500 flex gap-1 items-center cursor-pointer" onClick={handleSelectedAll}>
                      <p className="text-[11px]">Select All</p>
                      <IoCheckmarkDoneCircleOutline size={15} />
                    </div>
                    {selectedTrans.length > 0 && (
                      <div
                        className="text-slate-400 flex gap-1 items-center cursor-pointer hover:text-slate-600 transition-colors"
                        onClick={() => {
                          allMovements.forEach((mov) => {
                            const el = document.getElementById(`trans-${mov._id}`);
                            el && el.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
                          });
                          setSelectedTrans([]);
                        }}
                      >
                        <p className="text-[11px]">Deselect All</p>
                        <PiExcludeSquareDuotone size={15} />
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500">{selectedTrans.length} selected</p>
                    <Tooltip title="Select transactions then use the action buttons below to edit a specific field for all of them at once, or delete them all.">
                      <div className="flex items-center"><UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} /></div>
                    </Tooltip>
                  </div>
                  {/* Delete */}
                  <button onClick={() => showRemoveModal("many", selectedTrans)} className="hover:text-red-600 micro-pulse text-slate-500">
                    <CategoIcon type={"MdDelete"} size={18} />
                  </button>
                </div>

                {/* Row 2: focused edit actions — only when items selected */}
                {selectedTrans.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-purple-100 pt-1.5">
                    {[
                      { field: "name",     icon: <MdOutlineDriveFileRenameOutline size={13} />, label: "Rename" },
                      { field: "date",     icon: <MdOutlineCalendarMonth size={13} />,           label: "Date" },
                      { field: "type",     icon: <MdOutlineSwapVert size={13} />,                label: "Type" },
                      { field: "category", icon: <MdOutlineCategory size={13} />,               label: "Category" },
                      { field: "account",  icon: <MdOutlineAccountBalance size={13} />,          label: "Account" },
                    ].map(({ field, icon, label }) => (
                      <button
                        key={field}
                        onClick={() => setQuickEditField(field)}
                        className="flex items-center gap-1 text-[11px] text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors"
                      >
                        {icon}{label}
                      </button>
                    ))}
                    <Tooltip title="Edit all fields at once — anything you fill in will overwrite all selected transactions">
                      <button
                        onClick={() => handleMultiTransEdit(selectedTrans)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <MdOutlineSettings size={13} />General edit
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            )}

            {/* Quick edit modal */}
            {quickEditField && (
              <QuickEditModal
                field={quickEditField}
                transIds={selectedTrans}
                onClose={() => setQuickEditField(null)}
              />
            )}
          </div>
          <div className="movements-container flex flex-col gap-2">
            {allMovements.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                {dupMode ? <MdOutlineFindInPage size={32} /> : <IoSearchOutline size={32} />}
                <p className="text-sm">
                  {dupMode ? "No duplicates found with the selected criteria 🎉" : "No transactions match your filters"}
                </p>
                {dupMode && (
                  <button onClick={() => { setDupMode(false); setDupFinderOpen(false); }} className="text-xs text-orange-500 hover:underline">
                    Exit duplicate view
                  </button>
                )}
                {!dupMode && searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-xs text-purple-500 hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            )}
            {allMovements.map((movement) => (
              <div
                key={movement._id}
                id={`trans-${movement._id}`}
                className="flex flex-row justify-between items-center bg-slate-50 rounded-2xl py-1 px-2 hover:bg-slate-200 relative"
              >
                <div className="flex gap-2 items-center">
                  <div className={`editor-cont ${isSelectionMode ? "" : "hidden"}`}>
                    <div
                      className="w-full h-full absolute top-0 left-0"
                      onClick={() => handleSelectedItem(movement._id)}
                    ></div>
                  </div>
                  <div className="tra-cat-cont">
                    <div
                      style={{ backgroundColor: movement.category?.color || "#DADADA" }}
                      className="circle-ico w-[50px] h-[50px] rounded-full flex items-center justify-center hover:mix-blend-multiply"
                    >
                      {!movement.category || !movement.category.icon ? (
                        <UniversalCategoIcon type="md/MdFilterNone" size={10} />
                      ) : (
                        <UniversalCategoIcon type={movement.category.icon} size={10} />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="center-cont flex flex-col">
                      <div className="tra-text font-medium">
                        {!movement.name ? (
                          <p className="tra-nameless">No name. Asign one...</p>
                        ) : (
                          <div className="tra-center-cont">
                            <p className="tra-name text-start">{movement?.name}</p>
                          </div>
                        )}
                      </div>
                      <div className="tra-acount-cont text-[10px] font-normal flex items-center gap-2 flex-wrap">
                        <p><span className="text-slate-400 font-light">Categoría: </span><span className="text-slate-600">{movement.category?.name || "—"}</span></p>
                        {movement.subCategory?.name && (
                          <p><span className="text-slate-400 font-light">Subcategoría: </span><span className="text-slate-600">{movement.subCategory.name}</span></p>
                        )}
                        <p><span className="text-slate-400 font-light">Cuenta: </span><span className="text-slate-600">{movement.account?.name || "—"}</span></p>
                      </div>
                      <div className="tra-tag-cont flex flex-wrap gap-1 items-center justify-start text-[10px] font-thin">
                        <p className="font-light">Tags: </p>
                        {!movement.tags ? (
                          <p>No tags...</p>
                        ) : (
                          movement.tags.map((tag) => (
                            <Tag tag={tag} key={tag._id} size={8} />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="tra-amount flex flex-col gap-[1px] w-fit items-end justify-end">
                    {movement.isBill ? (
                      <div className="flex flex-col items-end">
                        <div className="tra-amount-cont text-red-500 flex gap-1 items-center font-medium">
                          <CategoIcon type={"MdKeyboardDoubleArrowDown"} />
                          <p className="tra-amount">
                            {currencyFormatter.format(movement.amount, { locale: "en-US" })}
                          </p>
                        </div>
                        <div className="date-container text-[12px] font-light">
                          {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="tra-amount-cont text-green-500 flex gap-1 items-center font-medium">
                          <CategoIcon type={"MdKeyboardDoubleArrowUp"} />
                          <p className="tra-amount">
                            {currencyFormatter.format(movement.amount, { locale: "en-US" })}
                          </p>
                        </div>
                        <div className="date-container text-[12px] font-light">
                          {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
                        </div>
                      </div>
                    )}
                    <div className="btns flex justify-between gap-2">
                      <button
                        onClick={() => showRemoveModal("", movement._id)}
                        className="hover:text-slate-700 micro-pulse"
                      >
                        <CategoIcon type={"MdDelete"} size={15} />
                      </button>
                      <button
                        onClick={() => handleTransEdit(movement)}
                        className="hover:text-slate-700 micro-pulse"
                      >
                        <CategoIcon type={"MdOutlineCreate"} size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



export default Movements;
