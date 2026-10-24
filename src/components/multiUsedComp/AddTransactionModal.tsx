"use client";
import type { TranslateFn } from "@gastify/core/i18n/translate";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  IoAirplaneOutline,
  IoArrowDownCircleOutline,
  IoCashOutline,
  IoDocumentAttachOutline,
  IoPieChartOutline,
  IoPricetagOutline,
  IoSwapHorizontalOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { CREATE_KIND_INFO, CREATE_KIND_SUMMARY, CREATE_SCREEN_INFO, type CreateKind, type InfoText } from "@gastify/core/info/createInfo";
import { BUDGET_TYPES } from "@/helpers/transformers/budgetTypes";
import { lockBodyScroll, unlockBodyScroll } from "@/helpers/scrollLock";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import AddTransactionComp from "./AddTransactionComp";
import CategoIcon from "./CategoIcon";
import ReadFileComp from "./ReadFileComp";
import SelectCategories from "../categories/SelectCategoryProvider/SelectCategories";
import EditCategoryModal from "./EditCategoryModal";
import EditAccountModal from "./EditAccountModal";
import TransferExchangeModal from "./TransferExchangeModal";
import BudgetEditModal from "./Budgets/BudgetEditModal";
import { InfoTip } from "./InfoTip";
import { useT } from "@/i18n/client";

export interface AddTransactionModalProps {
  close?: React.MouseEventHandler<HTMLElement> | (() => void);
}

type Option = { id: "excel" | CreateKind; label: string; icon: React.ReactNode; info: InfoText; summary: string };

// A transaction is an income or an expense: the same explanation, under one name.
const transactionInfo = (t: TranslateFn): InfoText => ({
  ...CREATE_KIND_INFO.expense,
  title: t("movements.help.transaction"),
  text: t("movements.help.transactionText"),
});

// The Excel import has its own explanation: the same template the app downloads, filled and uploaded.
const excelInfo = (t: TranslateFn): InfoText => ({
  title: t("movements.help.importTitle"),
  text: t("movements.help.importText"),
  sections: [
    {
      label: t("movements.help.how"),
      blocks: [
        { kind: "bullets", items: [t("movements.help.step1"), t("movements.help.step2"), t("movements.help.step3")] },
        { kind: "example", text: t("movements.help.example") },
      ],
    },
  ],
});

// The options of the "+", in the order of the app's hub. Each one opens its own form on the right.
const optionsFor = (t: TranslateFn): Option[] => [
  // One form for both: a switch in it chooses whether it is an income or an expense.
  { id: "expense", label: t("movements.option.transaction"), icon: <IoArrowDownCircleOutline size={20} />, info: transactionInfo(t), summary: t("movements.option.transactionSummary") },
  { id: "transfer", label: t("movements.help.transfer"), icon: <IoSwapHorizontalOutline size={20} />, info: CREATE_KIND_INFO.transfer, summary: CREATE_KIND_SUMMARY.transfer },
  { id: "account", label: t("movements.new.account"), icon: <IoWalletOutline size={20} />, info: CREATE_KIND_INFO.account, summary: CREATE_KIND_SUMMARY.account },
  { id: "category", label: t("movements.new.category"), icon: <IoPricetagOutline size={20} />, info: CREATE_KIND_INFO.category, summary: CREATE_KIND_SUMMARY.category },
  { id: "budget", label: t("movements.help.budget"), icon: <IoPieChartOutline size={20} />, info: CREATE_KIND_INFO.budget, summary: CREATE_KIND_SUMMARY.budget },
  { id: "saving", label: t("movements.help.saving"), icon: <IoCashOutline size={20} />, info: CREATE_KIND_INFO.saving, summary: CREATE_KIND_SUMMARY.saving },
  { id: "project", label: t("movements.help.project"), icon: <IoAirplaneOutline size={20} />, info: CREATE_KIND_INFO.project, summary: CREATE_KIND_SUMMARY.project },
  { id: "excel", label: t("movements.help.importTitle"), icon: <IoDocumentAttachOutline size={20} />, info: excelInfo(t), summary: t("movements.option.excelSummary") },
];

// The "+" of the web: one window to create anything, as the app's "+" does. On a wide screen the options are a column at
// the left and the form is at the right; on a narrow one the options are a row that scrolls sideways above the form.
function AddTransactionModal({ close }: AddTransactionModalProps): React.JSX.Element | null {
  const t = useT();
  const [active, setActive] = useState<Option["id"]>("expense");
  // Bumped after a save: the form starts again, empty, for the next thing.
  const [round, setRound] = useState<number>(0);
  const walletData = useSelector((state: RootState) => state.walletReducer.data) as WalletData;
  // Rendered in a portal, so the window is fixed to the viewport and not to the navbar's box (see BasicModal).
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);
  if (!mounted) return null;

  const options = optionsFor(t);
  const option = options.find((item) => item.id === active) ?? options[0];
  const again = () => setRound((value) => value + 1);

  const form = () => {
    const key = `${active}-${round}`;
    switch (active) {
      case "expense":
        return <AddTransactionComp key={key} onCreated={again} inline />;
      case "transfer":
        return <TransferExchangeModal key={key} />;
      case "account":
        return <EditAccountModal key={key} eamMode="creation" eamWallet={walletData} eamClose={again} eamInline />;
      case "category":
        return <EditCategoryModal key={key} ecmMode="creation" isInline ecmClose={again} ecmData={{}} />;
      case "budget":
        return <BudgetEditModal key={key} mode="creation" inline initialType={BUDGET_TYPES.SPENDING} onClose={again} onBack={null} />;
      case "saving":
        return <BudgetEditModal key={key} mode="creation" inline initialType={BUDGET_TYPES.SAVING} onClose={again} onBack={null} />;
      case "project":
        return <BudgetEditModal key={key} mode="creation" inline initialType={BUDGET_TYPES.PROJECT} onClose={again} onBack={null} />;
      case "excel":
        return <div key={key}><ReadFileComp /></div>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 backdrop-blur-md p-3" onClick={(event) => { if (event.target === event.currentTarget && close) (close as () => void)(); }}>
      <div className="content gf-glass-violet relative z-[10002] flex h-[92vh] w-[96vw] flex-col overflow-hidden rounded-3xl md:h-[min(860px,90vh)] md:w-[min(1180px,94vw)]">
        <div className="flex items-center gap-3 px-6 pb-2 pt-5 pr-16">
          <h1 className="text-2xl font-bold text-white">{t("movements.help.create")}</h1>
          <InfoTip info={CREATE_SCREEN_INFO} />
        </div>
        <button type="button" aria-label={t("movements.close")} onClick={close as () => void} className="absolute right-4 top-4 z-[100] rounded-full gf-glass-card p-1.5 text-purple-100 transition-colors hover:text-white">
          <CategoIcon type={"MdClose"} siz={20} />
        </button>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 p-3 md:w-64 md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-b-0 md:border-r">
            {options.map((item) => {
              const selected = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(item.id)}
                  className={`flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${selected ? "gf-glass-button font-semibold text-white" : "text-purple-200/85 hover:bg-white/10"}`}
                >
                  {item.icon}
                  <span className="flex flex-col">
                    <span className="text-sm">{item.label}</span>
                    <span className="hidden text-xs font-normal text-purple-200/70 md:block">{item.summary}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-3 px-5 pb-2 pt-4 md:px-6">
              <h2 className="text-xl font-bold text-white">{option.label}</h2>
              <InfoTip info={option.info} />
            </div>
            <p className="px-5 pb-3 text-sm text-purple-100/80 md:px-6">{option.summary}</p>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 md:px-6">
              <SelectCategories>{form()}</SelectCategories>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddTransactionModal;
