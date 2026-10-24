"use client";

import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";

import { PiExcludeSquareDuotone } from "react-icons/pi";
import { HiMiniCursorArrowRipple } from "react-icons/hi2";
import CategoIcon from "./CategoIcon";
import UniversalCategoIcon from "./UniversalCategoIcon";
import dayjs from "dayjs";
import Tag from "./Tag";
import fetcher from "@/helpers/fetcher";
import EditSingleTransModal from "./EditSingleTransModal";
import { IoCheckmarkDoneCircleOutline, IoSearchOutline } from "react-icons/io5";
import { MdOutlineFindInPage, MdOutlineDriveFileRenameOutline, MdOutlineCalendarMonth, MdOutlineSwapVert, MdOutlineCategory, MdOutlineAccountBalance, MdOutlineCurrencyExchange, MdOutlineSettings, MdOutlineFileDownload } from "react-icons/md";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { VscJson } from "react-icons/vsc";
import { Tooltip, Button, Modal, Skeleton } from "antd";
import EditMultipleTransModal from "./EditMultipleTransModal";
import QuickEditModal from "./QuickEditModal";
import runNotify from "@/helpers/gastifyNotifier";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import type { CategoryData } from "@/lib/features/categoriesSlice";
import type { SubCategoryData } from "@/lib/features/subCategorySlice";
import type { SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";
import type { CategoryItem } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import {
  fetchTrans,
  removeManyTransactions,
  removeOneTransacction,
} from "@/lib/features/transacctionsSlice";
import { fetchCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat } from "@/lib/features/subCategorySlice";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getDateInYearMonthDay,
} from "@gastify/core/time/timeFunctions";
import { getTransactionsFromTimeRange } from "@/helpers/transformers/transactionsChange";
import { formatMoneyMajor, formatMoneyMinor, majorToMinor, SUPPORTED_CURRENCIES } from "@gastify/core/money/currencies";
import {
  getDuplicates as sharedGetDuplicates,
  getDuplicatesToDelete as sharedGetDuplicatesToDelete,
  getAllMatchingIds as sharedGetAllMatchingIds,
  getDuplicatePairs as sharedGetDuplicatePairs,
} from "@/helpers/transformers/transactionDuplicates";
import { fetchWallet } from "@/lib/features/walletSlice";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";

import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import { SelectCategoryContext } from "@/components/categories/SelectCategoryProvider/SelectCategoryProvider";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalCategoryContent from "@/components/modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import DeletePreviewRow from "@/components/multiUsedComp/DeletePreviewRow";
import DuplicateComparisonTable from "./DuplicateComparisonTable";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import MovementsGuideModal from "./MovementsGuideModal";
import { useT, useInfo } from "@/i18n/client";

const TypedEditMultipleTransModal = EditMultipleTransModal as React.ComponentType<{
  hidden?: React.ReactNode[];
  trans: unknown[];
  onClose?: () => void;
  [key: string]: unknown;
}>;

const TypedDuplicateComparisonTable = DuplicateComparisonTable as React.ComponentType<{
  pairs?: unknown[];
  selectedTrans?: unknown[];
  selectedIds?: unknown;
  onToggleSelect?: (id?: string) => void;
  [key: string]: unknown;
}>;

export interface MovementCategory {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
  fatherCategory?: unknown;
  [key: string]: unknown;
}

export interface MovementSubCategory {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
  fatherCategory?: unknown;
  [key: string]: unknown;
}

export interface MovementAccount {
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface MovementTag {
  _id?: string;
  name?: string;
  color?: string;
  [key: string]: unknown;
}

export interface MovementMoneyNative {
  amountMinor: number;
  currency: string;
  [key: string]: unknown;
}

export interface MovementMoneyPrimary {
  amountMinor: number;
  currency: string;
  rate?: number;
  source?: string;
  effectiveDate: Date | string;
  estimated?: boolean;
  stale?: boolean;
  [key: string]: unknown;
}

export interface MovementMoneyMerchant {
  amountMinor: number;
  currency: string;
  [key: string]: unknown;
}

export interface MovementDisplayMoney {
  native?: MovementMoneyNative;
  primary?: MovementMoneyPrimary;
  merchant?: MovementMoneyMerchant;
  [key: string]: unknown;
}

export interface MovementItem {
  _id?: string;
  name?: string;
  amount?: number;
  isIncome?: boolean;
  isBill?: boolean;
  isReadable?: boolean;
  isForSaving?: boolean;
  date?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  category?: MovementCategory | null;
  subCategory?: MovementSubCategory | null;
  account?: MovementAccount | null;
  tags?: MovementTag[];
  kind?: string;
  transferGroupId?: string | null;
  transferDirection?: string | null;
  displayMoney?: MovementDisplayMoney | null;
  [key: string]: unknown;
}

export interface DupCriteria {
  name: boolean;
  date: boolean;
  amount: boolean;
  category: boolean;
  subcategory: boolean;
  [key: string]: boolean;
}

export interface DuplicatePairItem {
  original?: MovementItem | null;
  duplicate?: MovementItem | null;
  [key: string]: unknown;
}

export interface MovementsProps {
  timePeriodFromFather?: [Date, Date] | (Date | string | number)[] | null;
  mail?: string;
  // Inside the dashboard's card: no violet header and no fixed max height; the list scrolls inside the card's box.
  embedded?: boolean;
  [key: string]: unknown;
}

const today = new Date();

function MovementsContent({ timePeriodFromFather, mail, embedded = false }: MovementsProps): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const tr = useT();
  const defaultPeriod: [Date, Date] | (Date | string | number)[] = timePeriodFromFather || [
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
  ];

  const userHasSelectedPeriod = useRef<boolean>(false);
  const [allMovements, setAllMovements] = useState<MovementItem[]>([]);
  const [timePeriod, setTimePeriod] = useState<[Date, Date] | (Date | string | number)[]>(defaultPeriod);
  const [trastType, setTransType] = useState<string>("all");
  const [readable, setReadable] = useState<string>("all");
  const [editingTrans, setEditingTrans] = useState<MovementItem | null>(null);
  const [editKey, setEditKey] = useState<number>(0);
  const [editMultiModal, setEditMultiModal] = useState<React.ReactNode[]>([]);
  const [selectedTrans, setSelectedTrans] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [isRemoveModal, setIsRemoveModal] = useState<boolean>(false);
  const [isRemoveModalMany, setIsRemoveModalMany] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [transRemovableId, setTransRemovableId] = useState<string>("");
  const [loadingComponent, setLoadingComponent] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [exactAmountFilter, setExactAmountFilter] = useState<string>("");
  const [exactAmountMode, setExactAmountMode] = useState<string>("primary"); // "primary" | "native"
  const [exactAmountCurrency, setExactAmountCurrency] = useState<string>("MXN");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("");
  const [dupFinderOpen, setDupFinderOpen] = useState<boolean>(false);
  const [dupCriteria, setDupCriteria] = useState<DupCriteria>({ name: true, date: true, amount: true, category: false, subcategory: false });
  const [dupMode, setDupMode] = useState<boolean>(false);
  const [dupCount, setDupCount] = useState<number>(0);
  const [dupDateTolerance, setDupDateTolerance] = useState<number>(0);
  const [dupAmountTolerance, setDupAmountTolerance] = useState<number>(0);
  const [dupDeleteAll, setDupDeleteAll] = useState<boolean>(false);
  const [dupCompareModalOpen, setDupCompareModalOpen] = useState<boolean>(false);
  const [quickEditField, setQuickEditField] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "json" | null>(null); // 'excel' | 'json'
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);

  const { close, handleClose } = useModal();
  const selectCategoryCtx = useContext(SelectCategoryContext);
  const handleClean = selectCategoryCtx?.handleClean;
  const itemSelected = selectCategoryCtx?.itemSelected as CategoryItem | null;

  const toFetch = fetcher();
  const reduxDispartcher = useDispatch<AppDispatch>();
  const reduxAllTrans = useSelector((state: RootState) => state.transacctionsReducer);
  const rdxTransactions = reduxAllTrans?.data as MovementItem[] | undefined;
  const reduxWallet = useSelector((state: RootState) => state.walletReducer);
  const wallet = reduxWallet?.data as WalletData | undefined;
  const reduxCategories = useSelector((state: RootState) => state.categoriesReducer);
  const reduxSubCategories = useSelector((state: RootState) => state.subCategoryReducer);
  const allCategories: CategoryData[] = [...(reduxCategories.data?.user || []), ...(reduxCategories.data?.default || [])];
  const allSubCategories: SubCategoryData[] = [...(reduxSubCategories.data?.subCat || []), ...(reduxSubCategories.data?.default || [])];

  const getTransById = (id: string): MovementItem | undefined => rdxTransactions?.find((t) => String(t._id) === String(id));

  const handleCategoryFilter = (cat: { _id?: string; fatherCategory?: unknown; [key: string]: unknown } | null | undefined): void => {
    if (!cat) return;
    if (cat?.fatherCategory) {
      setSubCategoryFilter(String(cat._id || ""));
      setCategoryFilter("");
    } else {
      setCategoryFilter(String(cat._id || ""));
      setSubCategoryFilter("");
    }
  };

  const handleClearCategoryFilter = (): void => {
    setCategoryFilter("");
    setSubCategoryFilter("");
    if (handleClean) handleClean();
  };

  const selectedCategoryObj = categoryFilter ? allCategories.find((c) => String(c._id) === String(categoryFilter)) : null;
  const selectedSubCategoryObj = subCategoryFilter ? allSubCategories.find((s) => String(s._id) === String(subCategoryFilter)) : null;

  const displayCatName = itemSelected?.name || selectedSubCategoryObj?.name || selectedCategoryObj?.name || "Category";
  const displayCatIcon = itemSelected?.icon || selectedSubCategoryObj?.icon || selectedCategoryObj?.icon || "md/MdOutlineCategory";
  const displayFatherName = (itemSelected as (CategoryItem & { fatherCategory?: { name?: string } }))?.fatherCategory?.name || (selectedSubCategoryObj ? allCategories.find((c) => String(c._id) === String(selectedSubCategoryObj.fatherCategory))?.name : null);


  const timePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(today.getFullYear());

  useEffect(() => {
    if (reduxAllTrans.status == "idle") {
      reduxDispartcher(fetchTrans(mail));
    }
    if (reduxWallet.status == "idle") {
      reduxDispartcher(fetchWallet(mail));
    }
    if (reduxCategories.status == "idle") {
      reduxDispartcher(fetchCategories(mail));
    }
    if (reduxSubCategories.status == "idle") {
      reduxDispartcher(fetchSubCat(mail));
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
    let filtered = getTransactionsFromTimeRange(rdxTransactions, start as Date, end as Date).sort(
      (a: MovementItem, b: MovementItem) => +new Date((b.date || b.createdAt) as string | number | Date) - +new Date((a.date || a.createdAt) as string | number | Date)
    );

    if (trastType === "incomes") filtered = filtered.filter((t: MovementItem) => t.isIncome && !t.isBill);
    if (trastType === "bills") filtered = filtered.filter((t: MovementItem) => t.isBill && !t.isIncome);
    if (readable === "true") filtered = filtered.filter((t: MovementItem) => t.isReadable);
    if (readable === "false") filtered = filtered.filter((t: MovementItem) => !t.isReadable);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (t: MovementItem) =>
          t.name?.toLowerCase().includes(q) ||
          t.category?.name?.toLowerCase().includes(q) ||
          t.subCategory?.name?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.name?.toLowerCase().includes(q))
      );
    }
    if (exactAmountFilter !== "" && !isNaN(Number(exactAmountFilter))) {
      if (exactAmountMode === "native") {
        const targetMinor = majorToMinor(Number(exactAmountFilter), exactAmountCurrency);
        filtered = filtered.filter((t: MovementItem) => {
          const native = t.displayMoney?.native;
          return native ? native.currency === exactAmountCurrency && native.amountMinor === targetMinor
            : exactAmountCurrency === "MXN" && Math.round(Math.abs(t.amount ?? 0) * 100) === targetMinor;
        });
      } else {
        const primaryCurrency = wallet?.primaryCurrency || "MXN";
        const targetMinor = majorToMinor(Number(exactAmountFilter), primaryCurrency);
        filtered = filtered.filter((t: MovementItem) => {
          const primary = t.displayMoney?.primary;
          return primary && primary.currency === primaryCurrency && primary.amountMinor === targetMinor;
        });
      }
    }
    if (categoryFilter) {
      filtered = filtered.filter((t: MovementItem) => String(t.category?._id) === categoryFilter);
    }
    if (subCategoryFilter) {
      filtered = filtered.filter((t: MovementItem) => String(t.subCategory?._id) === subCategoryFilter);
    }

    if (dupMode) {
      const dups = getDuplicates(filtered, dupCriteria, dupDateTolerance, dupAmountTolerance);
      setDupCount(dups.length);
      setAllMovements(dups);
    } else {
      setDupCount(0);
      setAllMovements(filtered);
    }
  }, [rdxTransactions, timePeriod, trastType, readable, searchQuery, exactAmountFilter, exactAmountMode, exactAmountCurrency, wallet, categoryFilter, subCategoryFilter, dupMode, dupCriteria, dupDateTolerance, dupAmountTolerance]);

  // Bills/Incomes summary broken down by each transaction's own native
  // currency - "100 MXN + 100 USD" is never blended into a single number,
  // since that would silently mix two different currencies together.
  const { billsByCurrency, incomesByCurrency } = useMemo(() => {
    const bills: Record<string, number> = {};
    const incomes: Record<string, number> = {};
    for (const m of allMovements) {
      // Internal transfers/exchanges are not income or spending (plan
      // section 2.6) - both legs stay visible in the list but never count
      // toward these totals.
      if (m.kind === "transfer" || m.kind === "exchange") continue;
      const native = m.displayMoney?.native;
      const currency = native?.currency || "MXN";
      const amountMinor = native ? native.amountMinor : Math.round(Math.abs(Number(m.amount) || 0) * 100);
      const bucket = m.isIncome ? incomes : bills;
      bucket[currency] = (bucket[currency] || 0) + amountMinor;
    }
    return { billsByCurrency: bills, incomesByCurrency: incomes };
  }, [allMovements]);

  // Duplicate-detection logic lives in transactionDuplicates.js, shared with
  // ModalContentTopMonthItem.jsx (see plan section 14.4) - currency-aware,
  // so a native duplicate key never matches "100 MXN" against "100 USD".
  const getDuplicates = sharedGetDuplicates;
  const getDuplicatesToDelete = sharedGetDuplicatesToDelete;
  const getAllMatchingIds = sharedGetAllMatchingIds;
  const getDuplicatePairs = sharedGetDuplicatePairs;

  function getValueFromSelecter(v: string): void {
    userHasSelectedPeriod.current = true;
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart: Date | null, dateEnd: Date | null): void {
    if (dateStart && dateEnd) {
      userHasSelectedPeriod.current = true;
      setTimePeriod([dateStart, dateEnd]);
    }
  }

  const handleTransType = (event: React.ChangeEvent<HTMLSelectElement>): void => setTransType(event.target.value);
  const handleReadable = (event: React.ChangeEvent<HTMLSelectElement>): void => setReadable(event.target.value);

  const handleCleanFilter = (): void => {
    setReadable("all");
    setTransType("all");
    setSearchQuery("");
    setExactAmountFilter("");
    setExactAmountMode("primary");
    setExactAmountCurrency("MXN");
    setCategoryFilter("");
    setSubCategoryFilter("");
    if (handleClean) handleClean();
    setDupMode(false);
    setDupFinderOpen(false);
    setDupCriteria({ name: true, date: true, amount: true, category: false, subcategory: false });
    setDupDateTolerance(0);
    setDupAmountTolerance(0);
    setDupDeleteAll(false);
    setDupCompareModalOpen(false);
    setTimePeriod(timePeriodFromFather || defaultPeriod);
  };

  function buildFilterSummary(): string[] {
    const parts: string[] = [];
    const [start, end] = timePeriod;
    parts.push(`Period: ${getDateInYearMonthDay(start)} → ${getDateInYearMonthDay(end)}`);
    if (trastType !== "all") parts.push(`Type: ${trastType === "incomes" ? "Incomes only" : "Bills only"}`);
    if (readable !== "all") parts.push(`Readable: ${readable === "true" ? "Readable only" : "Not readable"}`);
    if (searchQuery.trim()) parts.push(`Search: "${searchQuery.trim()}"`);
    if (exactAmountFilter !== "") {
      const filterCurrency = exactAmountMode === "native" ? exactAmountCurrency : (wallet?.primaryCurrency || "MXN");
      const modeLabel = exactAmountMode === "native" ? "native" : "primary";
      parts.push(`Amount: ${formatMoneyMinor(majorToMinor(Number(exactAmountFilter), filterCurrency), filterCurrency)} (${modeLabel})`);
    }
    if (categoryFilter) {
      const cat = allCategories.find((c) => String(c._id) === categoryFilter);
      parts.push(`Category: ${cat?.name || categoryFilter}`);
    }
    if (subCategoryFilter) {
      const subCat = allSubCategories.find((c) => String(c._id) === subCategoryFilter);
      parts.push(`SubCategory: ${subCat?.name || subCategoryFilter}`);
    }
    if (dupMode) parts.push(`Mode: Duplicate finder (${dupCount} found)`);
    return parts;
  }

  const handleExportConfirm = async (): Promise<void> => {
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
        runNotify("ok", t("movements.exportedJson", { p1: ids.length }));
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
        runNotify("ok", t("movements.exportedExcel", { p1: ids.length }));
      }
      setExportModalOpen(false);
      setExportOpen(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      runNotify("error", err?.message || "Export failed, please try again 🤕");
    } finally {
      setExportLoading(false);
    }
  };

  // A transfer/exchange leg deleted alone would leave its counterpart
  // Account misrepresenting a real gain/loss - both linked legs are always
  // removed together (plan section 13).
  const handleTransferRemove = async (transferGroupId: string): Promise<void> => {
    try {
      const linkedIds = (rdxTransactions || [])
        .filter((t) => t.transferGroupId === transferGroupId)
        .map((t) => t._id as string);
      for (const linkedId of linkedIds) {
        const element = document.getElementById(`trans-${linkedId}`);
        if (element) element.classList.add("backOutDown-5seg");
      }
      await new Promise((resolve) => setTimeout(resolve, 251));
      linkedIds.forEach((linkedId) => {
        const element = document.getElementById(`trans-${linkedId}`);
        if (element) element.classList.add("hidden");
      });
      reduxDispartcher(removeManyTransactions(linkedIds));
      const res = (await toFetch.post("general-data/transactions/transfer/remove", { transferGroupId })) as { ok?: boolean; message?: string };
      if (res.ok) {
        runNotify("ok", String(res.message));
      } else {
        runNotify("error", res.message || "Something went wrong removing this transfer, please try again 🤕");
      }
    } catch (e: unknown) {
      runNotify("error", String(e));
    } finally {
      setIsRemoveModal(false);
      setConfirmLoading(false);
    }
  };

  const handleTransactionRemove = async (id: string): Promise<void> => {
    const trans = getTransById(id);
    if (trans?.transferGroupId) {
      await handleTransferRemove(trans.transferGroupId);
      return;
    }
    try {
      const element = document.getElementById(`trans-${id}`);
      if (element) element.classList.add("backOutDown-5seg");
      await new Promise((resolve) => setTimeout(resolve, 251));
      if (element) element.classList.add("hidden");
      reduxDispartcher(removeOneTransacction(id));
      const res = (await toFetch.post(
        `general-data/transactions/remove-transaction/${id}`
      )) as { ok?: boolean; message?: string };
      if (res.ok) {
        runNotify("ok", String(res.message));
        setIsRemoveModal(false);
        setConfirmLoading(false);
      } else {
        runNotify("error", tr("movements.removeItems.error"));
        setIsRemoveModal(false);
        setConfirmLoading(false);
      }
    } catch (e: unknown) {
      console.log(e);
      runNotify("error", String(e));
      setIsRemoveModal(false);
      setConfirmLoading(false);
    }
  };

  const handleRemoveManyTransactions = async (transs: string[]): Promise<void> => {
    try {
      if (transs.length === 0) {
        runNotify("error", tr("movements.selection.needTwo"));
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
      const res = (await toFetch.post(`general-data/transactions/remove-many`, { manyTrans: transs })) as { ok?: boolean; message?: string };
      if (res.ok) {
        runNotify("ok", String(res.message));
        setIsRemoveModalMany(false);
        setConfirmLoading(false);
        if (dupMode) { setDupMode(false); setDupFinderOpen(false); }
      } else {
        runNotify("error", tr("movements.removeItems.error"));
        setIsRemoveModalMany(false);
        setConfirmLoading(false);
      }
    } catch (e: unknown) {
      runNotify("error", String(e));
      setIsRemoveModalMany(false);
      setConfirmLoading(false);
    }
  };

  const handleTransEdit = (tra: MovementItem): void => {
    if (tra?.transferGroupId) {
      // Editing a transfer/exchange leg would silently desync it from its
      // counterpart leg - point the user at delete + recreate instead of
      // opening the normal expense/income form (plan section 13).
      runNotify(
        "info",
        tr("movements.transfer.legNote")
      );
      return;
    }
    setEditingTrans(tra);
    setEditKey((k) => k + 1);
  };

  const handleMultiTransEdit = (ids: string[]): void => {
    const editMultiTransMo = (
      <TypedEditMultipleTransModal
        hidden={editMultiModal}
        trans={ids}
        key={`editMultiModal-${(ids[0] as unknown as { _id?: string })?._id}`}
      />
    );
    setEditMultiModal([...editMultiModal, editMultiTransMo]);
  };

  const handeTransSelection = (): void => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        if (itemSele) itemSele.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
      });
      setSelectedTrans([]);
    }
  };

  const handleSelectedItem = (id?: string): void => {
    if (!id) return;
    const itemSele = document.getElementById(`trans-${id}`);
    if (selectedTrans.includes(id)) {
      setSelectedTrans(selectedTrans.filter((transId) => transId !== id));
      if (itemSele) itemSele.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
    } else {
      setSelectedTrans([...selectedTrans, id]);
      if (itemSele) itemSele.classList.add("edit-animation", "border-[2px]", "border-purple-400");
    }
  };

  const handleSelectedAll = (): void => {
    if (selectedTrans.length === allMovements.length) {
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        if (itemSele) itemSele.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
      });
      setSelectedTrans([]);
    } else {
      allMovements.forEach((mov) => {
        const itemSele = document.getElementById(`trans-${mov._id}`);
        if (itemSele) itemSele.classList.add("edit-animation", "border-[2px]", "border-purple-400");
      });
      setSelectedTrans(allMovements.map((mov) => mov._id as string));
    }
  };

  const showRemoveModal = (kind?: string, id?: string): void => {
    if (kind === "many") {
      setIsRemoveModalMany(true);
    } else {
      setTransRemovableId(id || "");
      setIsRemoveModal(true);
    }
  };

  const handleOkRemove = async (kind?: string): Promise<void> => {
    setConfirmLoading(true);
    if (kind === "many") {
      await handleRemoveManyTransactions(selectedTrans);
    } else {
      if (transRemovableId) {
        await handleTransactionRemove(transRemovableId);
      } else {
        runNotify("warning", tr("movements.selection.noneToRemove"));
      }
    }
  };

  const handleCancel = (kind?: string): void => {
    if (kind === "many") {
      setIsRemoveModalMany(false);
    } else {
      setIsRemoveModal(false);
    }
  };

  return (
    <div className="w-full h-full pt-5">
      <MovementsGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
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
            {tr("movements.export.title")} {allMovements.length} {tr("movements.word.transaction")}{allMovements.length !== 1 ? "s" : ""}
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
          <div className="bg-gf-surface-2 rounded-xl px-4 py-3 flex flex-col gap-1">
            <p className="text-xs font-semibold text-gf-text-muted mb-1">{tr("movements.export.activeFilters")}</p>
            {buildFilterSummary().map((line, i) => (
              <p key={i} className="text-xs text-gf-text-muted">• {line}</p>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gf-text-muted">
            <span>{tr("movements.export.format")}</span>
            <span className="font-semibold text-purple-600 flex items-center gap-1">
              {exportFormat === "excel"
                ? <><PiMicrosoftExcelLogoFill size={14} className="text-green-400" /> {tr("movements.export.excel")}</>
                : <><VscJson size={14} className="text-amber-500" /> {tr("movements.export.json")}</>
              }
            </span>
          </div>
          <p className="text-xs text-gf-text-muted">
            {exportFormat === "excel"
              ? "The file will match the Gastify import template and can be re-uploaded to any Gastify account."
              : "The JSON file includes all fields: category, subcategory, account, tags, amounts and dates."}
          </p>
        </div>
      </Modal>

      <div className="remove-modal-container">
        {/* ── Category picker modal ── */}
        {close && (
          <BasicModal
            close={handleClose}
            renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategoryFilter} />}
          />
        )}
        <Modal
          className="gf-antd-modal-glass"
          title={<span className="text-red-500 font-semibold flex items-center gap-1">{tr("movements.delete.titleOne")}</span>}
          open={isRemoveModal}
          onOk={() => handleOkRemove()}
          onCancel={() => handleCancel()}
          confirmLoading={confirmLoading}
          okText="Confirm delete"
          cancelText="Cancel"
          okButtonProps={{
            className: confirmLoading
              ? "!bg-red-300 !border-red-300 !text-white cursor-not-allowed"
              : "gf-glass-button-danger !border-0 !text-white",
            danger: false,
          }}
          cancelButtonProps={{ className: "gf-glass-button-neutral !border-0 !text-gf-text" }}
        >
          <p className="text-gf-text-muted text-sm mb-2">
            {getTransById(transRemovableId)?.transferGroupId
              ? "This is one leg of a transfer/exchange - both linked transactions will be deleted together. This action cannot be undone."
              : "Are you sure you want to permanently delete this transaction? This action cannot be undone."}
          </p>
          <DeletePreviewRow transaction={getTransById(transRemovableId)} />
        </Modal>

        <Modal
          className="gf-antd-modal-glass"
          title={<span className="text-red-500 font-semibold flex items-center gap-1">{tr("movements.delete.titleMany", { p1: selectedTrans.length > 0 ? selectedTrans.length : "" })}</span>}
          open={isRemoveModalMany}
          onOk={() => handleOkRemove("many")}
          onCancel={() => handleCancel("many")}
          confirmLoading={confirmLoading}
          okText="Confirm delete"
          cancelText="Cancel"
          width={dupMode ? 750 : 520}
          okButtonProps={{
            className: confirmLoading
              ? "!bg-red-300 !border-red-300 !text-white cursor-not-allowed"
              : "gf-glass-button-danger !border-0 !text-white",
            danger: false,
          }}
          cancelButtonProps={{ className: "gf-glass-button-neutral !border-0 !text-gf-text" }}
        >
          <p className="text-gf-text-muted text-sm mb-2">
            {tr("movements.delete.sure")}{" "}
            <b>{selectedTrans.length > 0 ? `${selectedTrans.length} transactions` : "these items"}</b>?{" "}
            {tr("movements.delete.irreversible")}
          </p>
          {dupMode ? (
            <TypedDuplicateComparisonTable
              pairs={getDuplicatePairs(allMovements, selectedTrans, dupCriteria, dupDateTolerance, dupAmountTolerance)}
              selectedTrans={selectedTrans}
              onToggleSelect={handleSelectedItem}
            />
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1">
              {selectedTrans.map((id) => (
                <DeletePreviewRow key={id} transaction={getTransById(id)} />
              ))}
            </div>
          )}
        </Modal>

        {/* ── Duplicate comparison modal ── */}
        <Modal
          title={
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-base">
              <UniversalCategoIcon type="md/MdOutlineCompare" siz={18} />
              {tr("movements.dup.compareTitle")}
            </div>
          }
          open={dupCompareModalOpen}
          onCancel={() => setDupCompareModalOpen(false)}
          width={750}
          footer={[
            <Button key="cancel" onClick={() => setDupCompareModalOpen(false)}>
              {tr("movements.cancel")}
            </Button>,
            <Button
              key="delete"
              danger
              type="primary"
              loading={confirmLoading}
              onClick={() => {
                setDupCompareModalOpen(false);
                showRemoveModal("many", selectedTrans as unknown as string);
              }}
              disabled={selectedTrans.length === 0}
            >
              {tr("movements.delete.elements", { p1: selectedTrans.length })}
            </Button>,
          ]}
        >
          <p className="text-xs text-gf-text-muted mb-3">
            {tr("movements.dup.mode")} <b>{dupDeleteAll ? "Delete all matches" : "Delete only duplicates (keep 1 original)"}</b>{tr("movements.dup.reviewNote")}
          </p>
          <TypedDuplicateComparisonTable
            pairs={getDuplicatePairs(allMovements, selectedTrans, dupCriteria, dupDateTolerance, dupAmountTolerance)}
            selectedTrans={selectedTrans}
            onToggleSelect={handleSelectedItem}
          />
        </Modal>
      </div>

      {loadingComponent ? (
        <div className="w-full h-full flex justify-center items-center">
          <Skeleton active />
        </div>
      ) : (
        <div className={`table-container w-full h-full relative px-1 ${embedded ? "overflow-y-auto pb-4" : "overflow-y-scroll max-h-[1000px]"}`}>
          <div className={embedded ? "text-gf-text px-1 py-2 mb-1" : "gf-glass-frost text-gf-text sticky z-50 top-0 px-1 py-2 mb-1 rounded-t-2xl"}>
            <div className="movement-content">
              <div className="flex items-center justify-center gap-2">
                <h1 className="movement-title text-2xl text-center font-bold">
                  {tr("movements.details.title")}
                </h1>
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  aria-label={tr("movements.details.howTo")}
                  className="text-gf-text-muted hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
                </button>
              </div>
            </div>
            <div className="header-filters">
              <span className="text-xs flex justify-center">
                {tr("movements.from")}{" "}
                <b className="mx-1">{timePeriod[0] ? getDateInYearMonthDay(timePeriod[0]) : "—"}</b>
                {tr("movements.to")}{" "}
                <b className="mx-1">{timePeriod[1] ? getDateInYearMonthDay(timePeriod[1]) : "—"}</b>
              </span>
              <div className="filters flex items-center justify-center gap-2 flex-wrap">
                <div
                  className={`clear-allbtn text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight relative pulse-animation-short cursor-pointer ${
                    isSelectionMode ? "text-purple-500" : ""
                  }`}
                  onClick={handeTransSelection}
                >
                  <p className="pr-2">{tr("movements.select.label", { p1: isSelectionMode ? "ON" : "" })}</p>
                  <InfoTip info={APP_INFO.seleccionar_movimientos} />
                  <HiMiniCursorArrowRipple size={15} />
                </div>
                <Tooltip title={tr("movements.filter.dateTip")}>
                  <div className="text-gf-text w-[10px]">
                    <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
                  </div>
                </Tooltip>
                <SelecterFilter
                  getValue={getValueFromSelecter}
                  periodFromFather={timePeriodsForSelecter[0]}
                  periodOverride={timePeriodsForSelecter as unknown as SelecterPeriod[]}
                  styles="gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
                />
                <TimeRange rpDate={handleRangeDate} />
                <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight gf-glass-card rounded-2xl pl-2.5 pr-1 py-0.5 relative pulse-animation-short">
                  <select
                    className="bg-transparent appearance-none w-full pr-4 outline-none"
                    name="TransTypeSelector"
                    value={trastType}
                    onChange={handleTransType}
                  >
                    <option value={"all"}>{tr("movements.type.all")}</option>
                    <option value={"incomes"}>{tr("movements.type.incomes")}</option>
                    <option value={"bills"}>{tr("movements.type.bills")}</option>
                  </select>
                  <div className="filterIconContainer absolute right-[8px] pointer-events-none">
                    <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
                  </div>
                </div>
                <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight gf-glass-card rounded-2xl pl-2.5 pr-1 py-0.5 relative pulse-animation-short">
                  <select
                    className="bg-transparent appearance-none pr-4 max-w-[30px] outline-none"
                    name="ReadableSelector"
                    value={readable}
                    onChange={handleReadable}
                  >
                    <option value={"all"}>{tr("movements.readable.all")}</option>
                    <option value={"true"}>{tr("movements.readable.yes")}</option>
                    <option value={"false"}>{tr("movements.readable.no")}</option>
                  </select>
                  <div className="filterIconContainer absolute right-[8px] pointer-events-none">
                    <UniversalCategoIcon type={"md/MdOutlineArrowDownward"} siz={12} />
                  </div>
                </div>
                <div className="w-fit text-[10px] font-light flex items-center gap-1 justify-center sm:font-base sm:font-extralight relative pulse-animation-short">
                  <Tooltip title={tr("movements.amount.modeTip")}>
                    <select
                      className="gf-glass-card rounded-2xl px-1 py-0.5 outline-none border-0"
                      value={exactAmountMode}
                      onChange={(e) => setExactAmountMode(e.target.value)}
                    >
                      <option value="primary">{tr("movements.amount.primary")}</option>
                      <option value="native">{tr("movements.amount.native")}</option>
                    </select>
                  </Tooltip>
                  {exactAmountMode === "native" && (
                    <select
                      className="gf-glass-card rounded-2xl px-1 py-0.5 outline-none border-0"
                      value={exactAmountCurrency}
                      onChange={(e) => setExactAmountCurrency(e.target.value)}
                    >
                      {SUPPORTED_CURRENCIES.map((code) => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    placeholder={tr("movements.amount.exact")}
                    value={exactAmountFilter}
                    onChange={(e) => setExactAmountFilter(e.target.value)}
                    className="gf-glass-inset rounded-2xl px-2 py-0.5 w-[110px] outline-none border-0 focus:ring-1 focus:ring-purple-400 transition-colors"
                  />
                  {exactAmountFilter !== "" && (
                    <button
                      onClick={() => setExactAmountFilter("")}
                      className="text-gf-text-muted hover:text-gf-text-muted transition-colors"
                    >
                      <UniversalCategoIcon type="md/MdClose" siz={13} />
                    </button>
                  )}
                </div>
                <div className="w-fit text-[10px] font-light flex items-center gap-1 justify-center relative pulse-animation-short">
                  <Tooltip title={tr("movements.filter.categoryTip")}>
                    <div className="text-gf-text-muted hover:text-purple-600 transition-colors cursor-help">
                      <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} />
                    </div>
                  </Tooltip>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="gf-glass-card hover:brightness-110 rounded-2xl px-2.5 py-0.5 text-[10px] font-normal flex items-center gap-1 text-gf-text-muted hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <UniversalCategoIcon type={displayCatIcon} siz={11} />
                    <span>{displayCatName}</span>
                    {displayFatherName && (
                      <span className="text-[9px] text-purple-400">({displayFatherName})</span>
                    )}
                    <UniversalCategoIcon type="md/MdOutlineArrowDownward" siz={10} className="text-gf-text-muted" />
                  </button>
                  {(categoryFilter || subCategoryFilter) && (
                    <button
                      onClick={handleClearCategoryFilter}
                      className="text-gf-text-muted hover:text-gf-text-muted transition-colors ml-1"
                      title={tr("movements.filter.clearCategory")}
                    >
                      <UniversalCategoIcon type="md/MdClose" siz={13} />
                    </button>
                  )}
                </div>
                <Tooltip title={tr("movements.dup.findTip")}>
                  <div
                    className={`clear-allbtn text-[10px] font-light flex items-center justify-center gap-1 relative pulse-animation-short cursor-pointer gf-glass-card rounded-2xl px-2.5 py-1 hover:brightness-110 transition-[filter] ${dupMode ? "text-orange-500 font-medium" : ""}`}
                    onClick={() => setDupFinderOpen(!dupFinderOpen)}
                  >
                    <MdOutlineFindInPage size={15} />
                    <p>{tr("movements.dup.find", { p1: dupMode ? ` (${dupCount})` : "" })}</p>
                  </div>
                </Tooltip>
                <Tooltip title={tr("movements.export.tip")}>
                  <div
                    className={`clear-allbtn text-[10px] font-light flex items-center justify-center gap-1 relative pulse-animation-short cursor-pointer gf-glass-card rounded-2xl px-2.5 py-1 hover:brightness-110 transition-[filter] ${exportOpen ? "text-purple-500 font-medium" : ""}`}
                    onClick={() => setExportOpen(!exportOpen)}
                  >
                    <MdOutlineFileDownload size={15} />
                    <p>{tr("movements.export.button")}</p>
                  </div>
                </Tooltip>
                <div
                  className="clear-allbtn text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight relative pulse-animation-short cursor-pointer gf-glass-card rounded-2xl px-2.5 py-1 hover:brightness-110 transition-[filter]"
                  onClick={handleCleanFilter}
                >
                  <p className="pr-2">{tr("movements.filters.clear")}</p>
                  <UniversalCategoIcon type={"ai/AiOutlineClear"} siz={13} />
                </div>
              </div>
            </div>

            {/* ── Duplicate finder submenu ── */}
            {dupFinderOpen && (
              <div className="bg-gf-surface border border-gf-border rounded-2xl px-4 py-3 mx-1 mb-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-medium text-gf-text-muted">
                    {tr("movements.dup.criteria")}
                  </p>
                  <Tooltip title={
                    <div className="text-xs flex flex-col gap-1">
                      <p><b>{tr("movements.dup.title")}</b> {tr("movements.dup.scans")} <b>{tr("movements.dup.range")}</b> {tr("movements.dup.groups")}</p>
                      <p><b>{tr("movements.dup.dateTolerance")}</b> {tr("movements.dup.dateToleranceHelp")}</p>
                      <p><b>{tr("movements.dup.amountTolerance")}</b> {tr("movements.dup.amountToleranceHelp")}</p>
                      <p><b>{tr("movements.dup.search")}</b> {tr("movements.dup.searchHelp")}</p>
                      <p><b>{tr("movements.dup.refresh")}</b> {tr("movements.dup.refreshHelp")}</p>
                      <p><b>{tr("movements.dup.selectPossible")}</b> {tr("movements.dup.selectPossibleHelp")}</p>
                      <p><b>{tr("movements.dup.deleteSelected")}</b> {tr("movements.dup.deleteSelectedHelp")}</p>
                    </div>
                  }>
                    <div className="cursor-pointer text-gf-text-muted hover:text-gf-text-muted">
                      <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} />
                    </div>
                  </Tooltip>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "name",        label: tr("movements.columns.name") },
                    { key: "date",        label: tr("movements.columns.date") },
                    { key: "amount",      label: tr("movements.columns.amount") },
                    { key: "category",    label: tr("movements.columns.category") },
                    { key: "subcategory", label: tr("movements.columns.subcategory") },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-1 cursor-pointer text-[11px] text-gf-text-muted select-none">
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
                <div className="flex flex-wrap gap-4 items-center border-t border-gf-border pt-2">
                  <div className="flex items-center gap-2">
                    <Tooltip title={tr("movements.dup.dateToleranceTip")}>
                      <label className="text-[11px] text-gf-text-muted select-none cursor-help">{tr("movements.dup.dateTolerance")}</label>
                    </Tooltip>
                    <select
                      value={dupDateTolerance}
                      onChange={(e) => setDupDateTolerance(Number(e.target.value))}
                      className="text-[11px] bg-gf-surface border border-gf-border rounded-lg px-2 py-0.5 outline-none focus:border-purple-400"
                    >
                      <option value={0}>{tr("movements.dup.tolerance.exact")}</option>
                      <option value={1}>{tr("movements.dup.tolerance.d1")}</option>
                      <option value={3}>{tr("movements.dup.tolerance.d3")}</option>
                      <option value={7}>{tr("movements.dup.tolerance.d7")}</option>
                      <option value={30}>{tr("movements.dup.tolerance.d30")}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip title={tr("movements.dup.amountTip")}>
                      <label className="text-[11px] text-gf-text-muted select-none cursor-help">{tr("movements.dup.amountTolerance")}</label>
                    </Tooltip>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dupAmountTolerance}
                      onChange={(e) => setDupAmountTolerance(Math.max(0, Number(e.target.value)))}
                      className="text-[11px] bg-gf-surface border border-gf-border rounded-lg px-2 py-0.5 w-20 outline-none focus:border-purple-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Action buttons — Organized in 2 Justified Rows */}
                <div className="flex flex-col gap-2 border-t border-gf-border pt-2.5 w-full">
                  {/* ROW 1: Search/Refresh on Left, Exit duplicate view on Right */}
                  <div className="flex items-center justify-between w-full flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!Object.values(dupCriteria).some(Boolean)) return;
                          setDupMode(true);
                        }}
                        className="text-[11px] bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-500 shadow-sm transition-colors font-medium"
                      >
                        {tr("movements.dup.search")}
                      </button>
                      <Tooltip title={tr("movements.dup.refreshTip")}>
                        <button
                          onClick={() => {
                            setDupCriteria({ name: true, date: true, amount: true, category: false, subcategory: false });
                            setDupDateTolerance(0);
                            setDupAmountTolerance(0);
                            setDupMode(true);
                          }}
                          className="text-[11px] text-gf-text-muted hover:text-purple-600 border border-gf-border px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                        >
                          <UniversalCategoIcon type={"md/MdRefresh"} siz={14} />
                          {tr("movements.dup.refresh")}
                        </button>
                      </Tooltip>
                    </div>

                    {/* Top Right: Exit duplicate view (with border rounded pill) */}
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
                        className="text-[11px] text-orange-400 border border-orange-300 px-3 py-1 rounded-full hover:bg-orange-500/15 transition-colors font-medium"
                      >
                        {tr("movements.dup.exit")}
                      </button>
                    )}
                  </div>

                  {/* ROW 2: Selection tools on Left, Delete X selected on Right */}
                  {dupMode && dupCount > 0 && (
                    <div className="flex items-start justify-between w-full pt-2 border-t border-gf-border/80 flex-wrap gap-3">
                      {/* Left column: Selection actions + Comparison in detail below */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
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
                            className="text-[11px] text-purple-300 bg-gf-accent-soft-bg border border-purple-300 px-3 py-1 rounded-full hover:bg-gf-accent-soft-bg transition-colors flex items-center gap-1 font-medium"
                          >
                            <HiMiniCursorArrowRipple size={12} />
                            {tr("movements.dup.selectPossible")}
                          </button>

                          {selectedTrans.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedTrans([]);
                                allMovements.forEach((m) => {
                                  const el = document.getElementById(`trans-${m._id}`);
                                  if (el) el.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
                                });
                              }}
                              className="text-[11px] text-gf-text-muted bg-gf-surface-2 border border-gf-border px-2.5 py-1 rounded-full hover:bg-gf-surface-2 transition-colors flex items-center gap-1 font-medium"
                            >
                              <UniversalCategoIcon type="md/MdClear" siz={13} />
                              {tr("movements.selection.clearPrefix")}{selectedTrans.length})
                            </button>
                          )}

                          <Tooltip
                            title={
                              dupDeleteAll
                                ? "All matching items will be selected (nothing is kept)"
                                : "One original per group is kept — only extras are selected"
                            }
                          >
                            <button
                              onClick={() => setDupDeleteAll((v) => !v)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                                dupDeleteAll
                                  ? "text-red-400 border-red-400 bg-red-500/15 hover:bg-red-500/15"
                                  : "text-gf-text-muted border-gf-border hover:bg-gf-surface-2"
                              }`}
                            >
                              <UniversalCategoIcon type={dupDeleteAll ? "md/MdSelectAll" : "md/MdFilterAlt"} siz={12} />
                              {dupDeleteAll ? "Delete all matches" : "Delete only duplicates"}
                            </button>
                          </Tooltip>
                        </div>

                        {/* Comparison in detail right below Select possible duplicates */}
                        {selectedTrans.length > 0 && (
                          <div className="flex items-center">
                            <button
                              onClick={() => setDupCompareModalOpen(true)}
                              className="text-[11px] text-amber-400 bg-amber-500/15 border border-amber-300 px-3 py-1 rounded-full hover:bg-amber-500/15 transition-colors flex items-center gap-1 font-semibold shadow-sm"
                            >
                              <UniversalCategoIcon type="md/MdOutlineCompare" siz={13} />
                              {tr("movements.dup.compareDetail")}{selectedTrans.length})
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right column: Delete X selected aligned right below Exit duplicate view */}
                      {isSelectionMode && selectedTrans.length > 0 && (
                        <div className="flex items-center ml-auto">
                          <button
                            onClick={() => showRemoveModal("many", selectedTrans as unknown as string)}
                            className="text-[11px] text-white bg-red-600 border border-red-600 px-3.5 py-1 rounded-full hover:bg-red-500 transition-colors flex items-center gap-1.5 font-semibold shadow-sm"
                          >
                            <UniversalCategoIcon type={"md/MdDelete"} siz={13} />
                            {tr("movements.delete.button")} {selectedTrans.length} {tr("movements.selected")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Results summary */}
                {dupMode && (
                  <p className={`text-[11px] font-medium ${dupCount > 0 ? "text-orange-500" : "text-green-400"}`}>
                    {dupCount > 0 ? `${dupCount} possible duplicate transaction(s) found` : "No duplicates found with current criteria 🎉"}
                  </p>
                )}
              </div>
            )}

            {/* ── Export submenu ── */}
            {exportOpen && (
              <div className="bg-gf-surface border border-gf-border rounded-2xl px-4 py-3 mx-1 mb-2 flex flex-col gap-3">
                <p className="text-[11px] font-medium text-gf-text-muted">
                  {tr("movements.export.chooseFormat")} <span className="text-gf-text-muted font-normal">{tr("movements.export.countFilters", { p1: allMovements.length, p2: allMovements.length !== 1 ? "s" : "" })}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setExportFormat("excel"); setExportModalOpen(true); }}
                    className="flex-1 flex flex-col items-center gap-1 border rounded-xl py-3 text-[11px] text-gf-text-muted hover:border-purple-400 hover:text-purple-600 hover:bg-gf-accent-soft-bg transition-colors"
                  >
                    <PiMicrosoftExcelLogoFill size={22} className="text-green-400" />
                    <span className="font-medium">{tr("movements.export.excelLabel")}</span>
                    <span className="text-gf-text-muted text-[10px] text-center leading-tight">{tr("movements.export.reimport")}<br/>{tr("movements.export.xlsx")}</span>
                  </button>
                  <button
                    onClick={() => { setExportFormat("json"); setExportModalOpen(true); }}
                    className="flex-1 flex flex-col items-center gap-1 border rounded-xl py-3 text-[11px] text-gf-text-muted hover:border-purple-400 hover:text-purple-600 hover:bg-gf-accent-soft-bg transition-colors"
                  >
                    <VscJson size={22} className="text-amber-500" />
                    <span className="font-medium">{tr("movements.export.jsonLabel")}</span>
                    <span className="text-gf-text-muted text-[10px] text-center leading-tight">{tr("movements.export.fullData")}<br/>{tr("movements.export.populated")}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="relative w-full mt-2 mb-3 px-2">
              <IoSearchOutline
                size={15}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gf-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder={tr("movements.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-[11px] gf-glass-inset rounded-2xl outline-none border-0 focus:ring-1 focus:ring-purple-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gf-text-muted hover:text-gf-text-muted transition-colors"
                >
                  <UniversalCategoIcon type="md/MdClose" siz={15} />
                </button>
              )}
            </div>
            <div className="flex flex-row justify-between items-center first-line:font-semibold">
              <div className="flex gap-1">
                <div>{tr("movements.columns.category")}</div>
                <div>{tr("movements.columns.name")}</div>
              </div>
              <div>{tr("movements.columns.amount")}</div>
            </div>

            {/* Computed Bills (Red) & Incomes (Green) Summary Bar according to applied filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 bg-gf-surface-2/90 border border-gf-border rounded-xl text-xs my-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-gf-text-muted font-medium">
                <span>{tr("movements.count", { p1: allMovements.length, p2: allMovements.length !== 1 ? "s" : "" })}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-red-400 font-semibold bg-red-500/15 px-2.5 py-0.5 rounded-full border border-red-200">
                  <span className="text-[10px] font-bold tracking-wide">{tr("movements.totals.bills")}</span>
                  {Object.keys(billsByCurrency).length === 0 ? (
                    <span>-{formatMoneyMinor(0, "MXN")}</span>
                  ) : (
                    Object.entries(billsByCurrency).map(([currency, amountMinor], i) => (
                      <span key={currency}>
                        {i > 0 && <span className="text-red-300 mx-0.5">·</span>}
                        -{formatMoneyMinor(amountMinor, currency)}
                      </span>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="text-[10px] font-bold tracking-wide">{tr("movements.totals.incomes")}</span>
                  {Object.keys(incomesByCurrency).length === 0 ? (
                    <span>+{formatMoneyMinor(0, "MXN")}</span>
                  ) : (
                    Object.entries(incomesByCurrency).map(([currency, amountMinor], i) => (
                      <span key={currency}>
                        {i > 0 && <span className="text-emerald-300 mx-0.5">·</span>}
                        +{formatMoneyMinor(amountMinor, currency)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            {isSelectionMode && (
              <div className="selectionHeader flex flex-col gap-1 py-1.5 bg-gf-accent-soft-bg text-[13px] rounded-xl px-2">
                {/* Row 1: selection controls */}
                <div className="flex gap-2 justify-between items-center">
                  <div
                    className="flex gap-1 items-center text-white cursor-pointer"
                    onClick={handeTransSelection}
                  >
                    <HiMiniCursorArrowRipple size={18} />
                    <div className="w-fit flex items-center border-2 border-white rounded-full px-1">
                      <p className="pr-1 text-[11px]">{tr("movements.select.off")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="text-white flex gap-1 items-center cursor-pointer" onClick={handleSelectedAll}>
                      <p className="text-[11px]">{tr("movements.select.all")}</p>
                      <IoCheckmarkDoneCircleOutline size={15} />
                    </div>
                    {selectedTrans.length > 0 && (
                      <div
                        className="text-gf-text-muted flex gap-1 items-center cursor-pointer hover:text-gf-text-muted transition-colors"
                        onClick={() => {
                          allMovements.forEach((mov) => {
                            const el = document.getElementById(`trans-${mov._id}`);
                            if (el) el.classList.remove("edit-animation", "border-[2px]", "border-purple-400");
                          });
                          setSelectedTrans([]);
                        }}
                      >
                        <p className="text-[11px]">{tr("movements.select.none")}</p>
                        <PiExcludeSquareDuotone size={15} />
                      </div>
                    )}
                    <p className="text-[11px] text-gf-text-muted">{tr("movements.select.selectedCount", { p1: selectedTrans.length })}</p>
                    <Tooltip title={tr("movements.select.help")}>
                      <div className="flex items-center"><UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} /></div>
                    </Tooltip>
                  </div>
                  {/* Delete */}
                  <button onClick={() => showRemoveModal("many", selectedTrans as unknown as string)} className="hover:text-red-400 micro-pulse text-gf-text-muted">
                    <CategoIcon type={"MdDelete"} />
                  </button>
                </div>

                {/* Row 2: focused edit actions — only when items selected */}
                {selectedTrans.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-gf-border pt-1.5">
                    {[
                      { field: "name",     icon: <MdOutlineDriveFileRenameOutline size={13} />, label: tr("movements.bulk.rename") },
                      { field: "date",     icon: <MdOutlineCalendarMonth size={13} />,           label: tr("movements.columns.date") },
                      { field: "type",     icon: <MdOutlineSwapVert size={13} />,                label: tr("movements.bulk.type") },
                      { field: "category", icon: <MdOutlineCategory size={13} />,               label: tr("movements.columns.category") },
                      { field: "account",  icon: <MdOutlineAccountBalance size={13} />,          label: tr("movements.bulk.account") },
                      { field: "currency", icon: <MdOutlineCurrencyExchange size={13} />,       label: tr("movements.bulk.currency") },
                    ].map(({ field, icon, label }) => (
                      <button
                        key={field}
                        onClick={() => setQuickEditField(field)}
                        className="flex items-center gap-1 text-[11px] text-white border border-white/60 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        {icon}{label}
                      </button>
                    ))}
                    <Tooltip title={tr("movements.bulk.general")}>
                      <button
                        onClick={() => handleMultiTransEdit(selectedTrans)}
                        className="flex items-center gap-1 text-[11px] text-gf-text-muted border border-gf-border px-2 py-0.5 rounded-full hover:bg-gf-surface-2 transition-colors"
                      >
                        <MdOutlineSettings size={13} />{tr("movements.bulk.generalEdit")}
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
              <div className="w-full flex flex-col items-center justify-center py-10 text-gf-text-muted gap-2">
                {dupMode ? <MdOutlineFindInPage size={32} /> : <IoSearchOutline size={32} />}
                <p className="text-sm">
                  {dupMode ? "No duplicates found with the selected criteria 🎉" : "No transactions match your filters"}
                </p>
                {dupMode && (
                  <button onClick={() => { setDupMode(false); setDupFinderOpen(false); }} className="text-xs text-orange-500 hover:underline">
                    {tr("movements.dup.exit")}
                  </button>
                )}
                {!dupMode && searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-xs text-purple-500 hover:underline">
                    {tr("movements.search.clear")}
                  </button>
                )}
              </div>
            )}
            {allMovements.map((movement) => {
              const isTransferLeg = movement.kind === "transfer" || movement.kind === "exchange";
              const native = movement.displayMoney?.native;
              const primary = movement.displayMoney?.primary;
              const merchant = movement.displayMoney?.merchant;
              const showEquivalent = Boolean(native && primary && native.currency !== primary.currency);
              const hasFxDetail = Boolean(merchant) || showEquivalent;
              const amountLabel = native
                ? formatMoneyMinor(native.amountMinor, native.currency)
                : formatMoneyMajor(movement.amount, wallet?.primaryCurrency || "MXN");
              const fxTooltipTitle = hasFxDetail ? (
                <div className="flex flex-col gap-0.5 text-[11px]">
                  {merchant && <div>{tr("movements.row.merchant", { p1: formatMoneyMinor(merchant.amountMinor, merchant.currency) })}</div>}
                  {native && <div>{tr("movements.row.account", { p1: formatMoneyMinor(native.amountMinor, native.currency) })}</div>}
                  {primary ? (
                    <>
                      <div>{tr("movements.row.reported", { p1: primary.currency, p2: formatMoneyMinor(primary.amountMinor, primary.currency) })}</div>
                      <div>{tr("movements.row.rate", { p1: primary.rate, p2: primary.source })}</div>
                      <div>{new Date(primary.effectiveDate).toLocaleDateString()} — {primary.estimated ? "estimated" : "exact"}{primary.stale ? ", stale" : ""}</div>
                    </>
                  ) : (
                    <div>{tr("movements.row.rateUnavailable")}</div>
                  )}
                </div>
              ) : null;
              return (
              <div
                key={movement._id}
                id={`trans-${movement._id}`}
                className="flex flex-row justify-between items-center gf-glass-row rounded-2xl py-1 px-2 relative"
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
                      className="circle-ico w-[50px] h-[50px] rounded-full flex items-center justify-center hover:brightness-90 transition-[filter]"
                    >
                      {!movement.category || !movement.category.icon ? (
                        <UniversalCategoIcon type="md/MdFilterNone" siz={26} />
                      ) : (
                        <UniversalCategoIcon type={movement.category.icon} siz={26} />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="center-cont flex flex-col">
                      <div className="tra-text font-medium">
                        {!movement.name ? (
                          <p className="tra-nameless">{tr("movements.row.noName")}</p>
                        ) : (
                          <div className="tra-center-cont">
                            <p className="tra-name text-start">{movement?.name}</p>
                          </div>
                        )}
                      </div>
                      <div className="tra-acount-cont text-[10px] font-normal flex items-center gap-2 flex-wrap">
                        <p><span className="text-gf-text-muted font-light">{tr("movements.row.categoryLabel")} </span><span className="text-gf-text-muted">{movement.category?.name || "—"}</span></p>
                        {movement.subCategory?.name && (
                          <p><span className="text-gf-text-muted font-light">{tr("movements.row.subcategoryLabel")} </span><span className="text-gf-text-muted">{movement.subCategory.name}</span></p>
                        )}
                        <p><span className="text-gf-text-muted font-light">{tr("movements.row.accountLabel")} </span><span className="text-gf-text-muted">{movement.account?.name || "—"}</span></p>
                      </div>
                      <div className="tra-tag-cont flex flex-wrap gap-1 items-center justify-start text-[10px] font-thin">
                        <p className="font-light">{tr("movements.row.tagsLabel")} </p>
                        {!movement.tags ? (
                          <p>{tr("movements.row.noTags")}</p>
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
                      <div className="flex flex-col items-end">
                        <div className={`tra-amount-cont ${isTransferLeg ? "text-blue-500" : movement.isBill ? "text-red-500" : "text-green-500"} flex gap-1 items-center font-medium`}>
                          <Tooltip title={isTransferLeg ? `${movement.kind === "exchange" ? "Currency exchange" : "Transfer"} — not counted as income or spending` : ""}>
                            <span className="flex items-center">
                              <CategoIcon type={isTransferLeg ? "MdSwapHoriz" : movement.isBill ? "MdKeyboardDoubleArrowDown" : "MdKeyboardDoubleArrowUp"} />
                            </span>
                          </Tooltip>
                          <p className="tra-amount">{amountLabel}</p>
                          {hasFxDetail && (
                            <Tooltip title={fxTooltipTitle}>
                              <span className="ml-1 text-[9px] font-bold text-purple-500 border border-purple-300 rounded px-1 cursor-default">
                                {tr("movements.row.fx")}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                        {showEquivalent && primary && (
                          <p className="text-[11px] text-gf-text-muted cursor-default">
                            ≈ {formatMoneyMinor(primary.amountMinor, primary.currency)}
                          </p>
                        )}
                        <div className="date-container text-[12px] font-light">
                          {dayjs(movement.date || movement.createdAt).format("DD/MM/YYYY")}
                        </div>
                      </div>
                    <div className="btns flex justify-between gap-2">
                      <button
                        onClick={() => showRemoveModal("", movement._id)}
                        className="hover:text-gf-text-muted micro-pulse"
                      >
                        <CategoIcon type={"MdDelete"} />
                      </button>
                      <button
                        onClick={() => handleTransEdit(movement)}
                        className="hover:text-gf-text-muted micro-pulse"
                      >
                        <CategoIcon type={"MdOutlineCreate"} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Movements(props: MovementsProps): React.JSX.Element {
  return (
    <SelectCategories>
      <MovementsContent {...props} />
    </SelectCategories>
  );
}

export default Movements;
